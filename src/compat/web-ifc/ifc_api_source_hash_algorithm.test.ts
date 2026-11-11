/* eslint-disable no-magic-numbers */
// bldrs-ai/Share#2092: `SOURCE_HASH_ALGORITHM: 'sha256Blocks'` swaps the
// per-byte FNV-1a loop the parse folds into its reads for a native SHA-256
// of 4 MiB blocks, and labels the sidecar with it (`hashAlgorithm` = 2).
// Through the compat surface Share calls, for IFC and for STEP (AP214),
// buffered and windowed, this file proves:
//
//  1. a sidecar exported under the block digest is byte-identical to the
//     FNV one apart from the two identity slots (sourceHash, hashAlgorithm),
//     and its digest is the block digest of the bytes that were parsed;
//  2. it reopens with the full verify over the same bytes, and is refused
//     as INDEX_STALE over a same-length rewrite — a sidecar written for one
//     source identity is never accepted for another;
//  3. the sidecars already in users' OPFS (FNV, id 1) still verify, whatever
//     the reopen asks for, and a re-export of an index-first model keeps
//     the sidecar's own algorithm;
//  4. a block-digest sidecar that cannot be verified here (no WebCrypto, or
//     an id this reader does not know) is refused, never trusted, and a
//     reader that predates id 2 (its verify computes FNV) would refuse it;
//  5. asked for the block digest with no WebCrypto, an open records FNV and
//     says so, rather than failing.
import * as fs from 'fs'
import { createHash } from 'crypto'

import { afterEach, beforeAll, describe, expect, jest, test } from '@jest/globals'

import { IfcAPI, Loadersettings } from './ifc_api'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import {
  hashSource,
  readSidecarSourceIdentity,
  SIDECAR_HASH_FNV1A_32,
  SIDECAR_HASH_SHA256_BLOCKS,
  sidecarMatchesSource,
} from '../../step/parsing/index_sidecar'
import { SOURCE_HASH_BLOCK_BYTES } from '../../step/parsing/source_hash'


// Header offsets (index_sidecar.ts §"v3 layout"): magic, version,
// sourceByteLength (f64), then sourceHash; hashAlgorithm is the 12th u32
// after the f64.
const SOURCE_HASH_OFFSET = 16
const HASH_ALGORITHM_OFFSET = 48

const BASE = {
  COORDINATE_TO_ORIGIN: false,
  USE_FAST_BOOLS: true,
  DEFER_GEOMETRY: true,
  STREAMING_CONSUMER: true,
  RECORD_SOURCE_HASH: true,
}
const FNV: Loadersettings = { ...BASE }
const BLOCKS: Loadersettings = { ...BASE, SOURCE_HASH_ALGORITHM: 'sha256Blocks' }

// One IFC fixture, one STEP fixture with real geometry.
const FIXTURES = [ 'index.ifc', 'a-gear-with-3-inch-diameter-and-20-curved-teeth.step' ]

let api: IfcAPI

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000 )

afterEach( () => {
  jest.restoreAllMocks()
} )


/**
 * @param name A file under `data/`.
 * @return {Uint8Array} Its bytes.
 */
function fixture( name: string ): Uint8Array {
  return new Uint8Array( fs.readFileSync( `data/${name}` ) )
}


/**
 * The `'sha256Blocks'` digest by its definition (`Sha256BlockFold`),
 * computed with node:crypto rather than the code under test.
 *
 * @param bytes The source.
 * @return {number} The digest.
 */
function blockDigest( bytes: Uint8Array ): number {

  const chain = createHash( 'sha256' )
  const length = Buffer.alloc( 8 )

  length.writeDoubleLE( bytes.byteLength, 0 )
  chain.update( length )

  for ( let at = 0; at < bytes.byteLength; at += SOURCE_HASH_BLOCK_BYTES ) {
    chain.update( createHash( 'sha256' )
        .update( bytes.subarray( at, Math.min( at + SOURCE_HASH_BLOCK_BYTES, bytes.byteLength ) ) )
        .digest() )
  }

  return chain.digest().readUInt32LE( 0 )
}


/**
 * One byte of a quoted string changed: same length, same record bounds.
 *
 * @param bytes The original.
 * @return {Uint8Array} The rewrite.
 */
function rewrite( bytes: Uint8Array ): Uint8Array {

  // A quoted string's first letter, so the rewrite is a valid file with
  // the same record bounds (an empty string's closing quote is not).
  const at = new TextDecoder().decode( bytes ).slice( 200 ).search( /'[A-Za-z]/ ) + 201
  const rewritten = bytes.slice()

  rewritten[ at ] = rewritten[ at ] === 0x41 ? 0x42 : 0x41

  return rewritten
}


/**
 * Open, export, close.
 *
 * @param bytes The source.
 * @param mode Buffered (`OpenModelStreamed`) or windowed (`OpenModelStream`).
 * @param settings Open settings.
 * @return {Promise<Uint8Array>} The exported sidecar.
 */
async function exportedSidecar(
    bytes: Uint8Array, mode: 'buffered' | 'windowed', settings: Loadersettings ):
    Promise< Uint8Array > {

  const modelID = mode === 'buffered' ?
    await api.OpenModelStreamed( bytes.slice(), settings ) :
    await api.OpenModelStream( new InMemoryStepByteStore( bytes, true ), settings )

  expect( modelID ).toBeGreaterThanOrEqual( 0 )

  const sidecar = ( await api.ExportIndexSidecar( modelID ) )!

  api.CloseModel( modelID )

  return sidecar
}


/**
 * Reopen from a sidecar with the full verify.
 *
 * @param bytes What the store holds.
 * @param sidecar The sidecar.
 * @param settings Open settings (the verify is added).
 * @param verify `VERIFY_INDEX_SOURCE_HASH` (default the full check).
 * @return {Promise<object>} The id, status, and the reopened model's export.
 */
async function reopen(
    bytes: Uint8Array,
    sidecar: Uint8Array,
    settings: Loadersettings = FNV,
    verify: boolean | 'sampled' = true ) {

  jest.spyOn( console, 'warn' ).mockImplementation( () => {} )
  jest.spyOn( console, 'error' ).mockImplementation( () => {} )

  const attemptedID = api.globalModelIDCounter
  const modelID = await api.OpenModelFromIndex(
      new InMemoryStepByteStore( bytes, true ), sidecar,
      { ...settings, VERIFY_INDEX_SOURCE_HASH: verify } )
  const status = api.getStatistics( attemptedID )?.getLoadStatus()
  const reason = api.getStatistics( attemptedID )?.getLoadFailureReason() as string | undefined
  const reexported = modelID >= 0 ? await api.ExportIndexSidecar( modelID ) : void 0

  if ( modelID >= 0 ) {
    api.CloseModel( modelID )
  }

  return { modelID, status, reason, reexported }
}


/**
 * The header's identity slots.
 *
 * @param sidecar A sidecar.
 * @return {object} Its recorded hash and algorithm id.
 */
function identitySlots( sidecar: Uint8Array ) {

  const view = new DataView( sidecar.buffer, sidecar.byteOffset, sidecar.byteLength )

  return {
    sourceHash: view.getUint32( SOURCE_HASH_OFFSET, true ),
    hashAlgorithm: view.getUint32( HASH_ALGORITHM_OFFSET, true ),
  }
}


/**
 * Run `body` with no WebCrypto (`globalThis.crypto` is a data property in
 * Node/Jest, so it is redefined and put back rather than spied on).
 *
 * @param body What to run.
 * @return {Promise<T>} What it returned.
 */
async function withoutWebCrypto< T >( body: () => Promise< T > ): Promise< T > {

  const descriptor = Object.getOwnPropertyDescriptor( globalThis, 'crypto' )

  Object.defineProperty( globalThis, 'crypto', { value: void 0, configurable: true, writable: true } )

  try {
    return await body()
  } finally {
    if ( descriptor !== void 0 ) {
      Object.defineProperty( globalThis, 'crypto', descriptor )
    } else {
      delete ( globalThis as { crypto?: unknown } ).crypto
    }
  }
}


describe.each( FIXTURES )( 'SOURCE_HASH_ALGORITHM sha256Blocks on %s (bldrs-ai/Share#2092)', ( name ) => {

  test.each( [ 'buffered', 'windowed' ] as const )(
      'a %s open exports the FNV sidecar but for its identity slots', async ( mode ) => {

        const bytes = fixture( name )
        const fnv = await exportedSidecar( bytes, mode, FNV )
        const blocks = await exportedSidecar( bytes, mode, BLOCKS )

        expect( identitySlots( fnv ) ).toEqual(
            { sourceHash: hashSource( bytes ), hashAlgorithm: SIDECAR_HASH_FNV1A_32 } )
        expect( identitySlots( blocks ) ).toEqual( {
          sourceHash: blockDigest( bytes ),
          hashAlgorithm: SIDECAR_HASH_SHA256_BLOCKS,
        } )
        expect( blocks.byteLength ).toBe( fnv.byteLength )

        // Everything else — length, counts, schema stamp, sampled digest,
        // every column — byte for byte.
        const masked = ( sidecar: Uint8Array ) => {
          const copy = sidecar.slice()
          copy.fill( 0, SOURCE_HASH_OFFSET, SOURCE_HASH_OFFSET + 4 )
          copy.fill( 0, HASH_ALGORITHM_OFFSET, HASH_ALGORITHM_OFFSET + 4 )
          return copy
        }

        expect( Buffer.from( masked( blocks ) ).equals( Buffer.from( masked( fnv ) ) ) ).toBe( true )
      } )

  test( 'it reopens over its own bytes and is stale over a same-length rewrite', async () => {

    const bytes = fixture( name )
    const sidecar = await exportedSidecar( bytes, 'windowed', BLOCKS )

    const good = await reopen( bytes, sidecar )

    expect( good.modelID ).toBeGreaterThanOrEqual( 0 )

    // The index-first model keeps the sidecar's algorithm: re-exporting it
    // returns the same bytes.
    expect( Buffer.from( good.reexported! ).equals( Buffer.from( sidecar ) ) ).toBe( true )

    const other = rewrite( bytes )

    expect( other.byteLength ).toBe( bytes.byteLength )

    const stale = await reopen( other, sidecar )

    expect( stale.modelID ).toBe( -1 )
    expect( stale.status ).toBe( 'INDEX_STALE' )
    expect( stale.reason ).toMatch( /hash does not match/ )
  } )

  test( 'an FNV sidecar already persisted still verifies, whatever the reopen asks for', async () => {

    const bytes = fixture( name )
    const fnv = await exportedSidecar( bytes, 'buffered', FNV )

    for ( const settings of [ FNV, BLOCKS ] ) {

      const reopened = await reopen( bytes, fnv, settings )

      expect( reopened.modelID ).toBeGreaterThanOrEqual( 0 )
      expect( Buffer.from( reopened.reexported! ).equals( Buffer.from( fnv ) ) ).toBe( true )
      expect( ( await reopen( rewrite( bytes ), fnv, settings ) ).status ).toBe( 'INDEX_STALE' )
    }
  } )
} )


describe( 'the classic resident IFC opens (bldrs-ai/Share#2092)', () => {

  test( 'OpenModelAsync records the block digest; the synchronous OpenModel records FNV', async () => {

    const bytes = fixture( 'index.ifc' )
    const resident = { ...BLOCKS, DEFER_GEOMETRY: false, STREAMING_CONSUMER: false }

    const asyncID = await api.OpenModelAsync( bytes.slice(), resident )
    const asyncSidecar = ( await api.ExportIndexSidecar( asyncID ) )!

    api.CloseModel( asyncID )

    expect( identitySlots( asyncSidecar ) ).toEqual( {
      sourceHash: blockDigest( bytes ),
      hashAlgorithm: SIDECAR_HASH_SHA256_BLOCKS,
    } )
    expect( ( await reopen( bytes, asyncSidecar ) ).modelID ).toBeGreaterThanOrEqual( 0 )

    // A synchronous open cannot await a native digest, so it takes FNV and
    // the sidecar says so.
    const syncID = api.OpenModel( bytes.slice(), resident )
    const syncSidecar = ( await api.ExportIndexSidecar( syncID ) )!

    api.CloseModel( syncID )

    expect( identitySlots( syncSidecar ) ).toEqual(
        { sourceHash: hashSource( bytes ), hashAlgorithm: SIDECAR_HASH_FNV1A_32 } )
  } )
} )


describe( 'a block-digest sidecar that cannot be verified is refused (bldrs-ai/Share#2092)', () => {

  test( 'with no WebCrypto here, it is stale rather than trusted', async () => {

    const bytes = fixture( 'index.ifc' )
    const sidecar = await exportedSidecar( bytes, 'windowed', BLOCKS )
    const refused = await withoutWebCrypto( () => reopen( bytes, sidecar ) )

    expect( refused.modelID ).toBe( -1 )
    expect( refused.status ).toBe( 'INDEX_STALE' )
    expect( refused.reason ).toMatch( /cannot be verified here/ )
  } )

  test( 'an algorithm id this reader does not know is stale too', async () => {

    const bytes = fixture( 'index.ifc' )
    const sidecar = ( await exportedSidecar( bytes, 'windowed', BLOCKS ) ).slice()

    new DataView( sidecar.buffer ).setUint32( HASH_ALGORITHM_OFFSET, 3, true )

    const refused = await reopen( bytes, sidecar )

    expect( refused.modelID ).toBe( -1 )
    expect( refused.status ).toBe( 'INDEX_STALE' )
  } )

  test( 'a reader that predates id 2 would refuse it: its FNV verify does not match', async () => {

    // What conway before this change does with the sidecar under
    // VERIFY_INDEX_SOURCE_HASH: true — sidecarMatchesSource against the
    // FNV-1a of the store (step_index_open.ts before bldrs-ai/Share#2092).
    const bytes = fixture( 'index.ifc' )
    const sidecar = await exportedSidecar( bytes, 'windowed', BLOCKS )
    const identity = readSidecarSourceIdentity( sidecar )

    expect( sidecarMatchesSource( identity, bytes.byteLength, hashSource( bytes ) ) ).toBe( false )
  } )
} )


describe( 'asked for the block digest with no WebCrypto, an open records FNV', () => {

  test.each( FIXTURES )( '%s', async ( name ) => {

    const bytes = fixture( name )
    const sidecar = await withoutWebCrypto( () => exportedSidecar( bytes, 'windowed', BLOCKS ) )

    expect( identitySlots( sidecar ) ).toEqual(
        { sourceHash: hashSource( bytes ), hashAlgorithm: SIDECAR_HASH_FNV1A_32 } )
    expect( ( await reopen( bytes, sidecar ) ).modelID ).toBeGreaterThanOrEqual( 0 )
  } )
} )


describe( 'each verify mode × each hashAlgorithm (codex review of conway#783)', () => {

  // What step_index_open.ts#assertSidecarDescribesStore documents. The
  // sampled digest is FNV under every known id, so 'sampled' verifies an
  // id-2 sidecar with no WebCrypto, and `false` checks the length alone; an
  // unknown id is stale in every mode, before the decode would fail it as a
  // plain error. Every 'opens' row also reopens over a same-length rewrite,
  // which the hash-checking modes must refuse and `false` must not — so a
  // mode that silently skipped its check fails here too. (index.ifc is
  // shorter than the sampled spans, so 'sampled' covers the rewritten byte.)
  type Case = 'id 1' | 'id 2, WebCrypto' | 'id 2, no WebCrypto' | 'unknown id'
  type Mode = true | 'sampled' | false

  const EXPECTED: Record< string, Record< Case, 'opens' | 'stale' > > = {
    true: {
      'id 1': 'opens', 'id 2, WebCrypto': 'opens',
      'id 2, no WebCrypto': 'stale', 'unknown id': 'stale',
    },
    sampled: {
      'id 1': 'opens', 'id 2, WebCrypto': 'opens',
      'id 2, no WebCrypto': 'opens', 'unknown id': 'stale',
    },
    false: {
      'id 1': 'opens', 'id 2, WebCrypto': 'opens',
      'id 2, no WebCrypto': 'opens', 'unknown id': 'stale',
    },
  }

  const MODES: Mode[] = [ true, 'sampled', false ]
  const CASES: Case[] = [ 'id 1', 'id 2, WebCrypto', 'id 2, no WebCrypto', 'unknown id' ]
  const ROWS = MODES.flatMap( ( mode ) => CASES.map( ( which ) => [ mode, which ] as const ) )

  test.each( ROWS )( 'verify %s, %s', async ( mode, which ) => {

    const bytes = fixture( 'index.ifc' )
    let sidecar = await exportedSidecar( bytes, 'windowed', which === 'id 1' ? FNV : BLOCKS )

    expect( identitySlots( sidecar ).hashAlgorithm )
        .toBe( which === 'id 1' ? SIDECAR_HASH_FNV1A_32 : SIDECAR_HASH_SHA256_BLOCKS )

    if ( which === 'unknown id' ) {
      sidecar = sidecar.slice()
      new DataView( sidecar.buffer ).setUint32( HASH_ALGORITHM_OFFSET, 7, true )
    }

    const attempt = ( over: Uint8Array ) => which === 'id 2, no WebCrypto' ?
      withoutWebCrypto( () => reopen( over, sidecar, FNV, mode ) ) :
      reopen( over, sidecar, FNV, mode )

    const outcome = await attempt( bytes )
    const expected = EXPECTED[ String( mode ) ][ which ]

    if ( expected === 'stale' ) {
      expect( outcome.modelID ).toBe( -1 )
      expect( outcome.status ).toBe( 'INDEX_STALE' )
      expect( outcome.reason ).toMatch( /cannot be verified here/ )
      return
    }

    expect( outcome.modelID ).toBeGreaterThanOrEqual( 0 )

    const rewritten = await attempt( rewrite( bytes ) )

    if ( mode === false ) {
      expect( rewritten.modelID ).toBeGreaterThanOrEqual( 0 )
    } else {
      expect( rewritten.modelID ).toBe( -1 )
      expect( rewritten.status ).toBe( 'INDEX_STALE' )
      expect( rewritten.reason ).toMatch( /hash does not match/ )
    }
  } )
} )
