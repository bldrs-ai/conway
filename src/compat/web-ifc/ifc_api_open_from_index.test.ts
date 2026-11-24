/* eslint-disable no-magic-numbers */
// conway#541: the compat entry is what the PR advertises, so it is what has
// to be tested. Review round 2 found the long-header case passing through
// `openIfcModelFromIndex` (the engine function, which grows its header
// prefix) while `IfcAPI.OpenModelFromIndex` returned -1 on the same file —
// the factory sniffs the format from its own 64 KiB prefix and gives up
// before the engine open is ever called. A test that exercised only the
// native function kept reporting green over that.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IfcAPI } from './ifc_api'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { openStreamedIfcModelFromStore } from '../../ifc/ifc_stream_open'
import {
  hashSource,
  serializeIndexSidecarFromColumns,
} from '../../step/parsing/index_sidecar'
import { ParseResult } from '../../step/parsing/step_parser'

const SETTINGS = { COORDINATE_TO_ORIGIN: false, USE_FAST_BOOLS: true }

let api: IfcAPI
let bytes: Uint8Array

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
} )


/**
 * Build a v2 sidecar for a source by parsing it cold.
 *
 * @param source The model bytes.
 * @return {Promise<Uint8Array>} The sidecar.
 */
async function sidecarFor( source: Uint8Array ): Promise<Uint8Array> {

  const cold = await openStreamedIfcModelFromStore(
      new InMemoryStepByteStore( source ), { pool: 1024 * 1024 } )

  expect( cold.result ).toBe( ParseResult.COMPLETE )

  return serializeIndexSidecarFromColumns(
      cold.columns, source.byteLength, hashSource( source ) )
}


/**
 * `data/index.ifc` with a long STEP comment injected into its header, so
 * `FILE_SCHEMA` — which the format sniff needs, and which sits after
 * `FILE_DESCRIPTION` — lands past the first prefix read.
 *
 * @param padBytes Roughly how many bytes of comment to inject.
 * @return {Uint8Array} The padded source.
 */
function paddedHeaderSource( padBytes: number ): Uint8Array {

  const text = new TextDecoder().decode( bytes )
  const at = text.indexOf( 'FILE_DESCRIPTION' )

  expect( at ).toBeGreaterThan( 0 )

  return new TextEncoder().encode(
      `${text.slice( 0, at )}/* ${'x'.repeat( padBytes )} */\n${text.slice( at )}` )
}


/**
 * A store whose reads reject after the first `failAfter` calls — an OPFS
 * handle going away, a file truncated under us, a range read failing.
 */
class RejectingStore {

  private reads_ = 0

  /**
   * @param bytes_ The bytes to serve while still healthy.
   * @param failAfter_ How many reads succeed before the rest reject.
   */
  constructor(
    private readonly bytes_: Uint8Array,
    private readonly failAfter_: number ) {}

  /**
   * @return {number} The stored length.
   */
  public get byteLength(): number {
    return this.bytes_.byteLength
  }

  /**
   * @return {number} Reads served so far, healthy or not.
   */
  public get reads(): number {
    return this.reads_
  }

  /**
   * @param offset Absolute offset.
   * @param length Bytes to read.
   * @return {Promise<Uint8Array>} The bytes, or a rejection.
   */
  public async read( offset: number, length: number ): Promise<Uint8Array> {

    if ( this.reads_++ >= this.failAfter_ ) {
      throw new Error( 'store read failed' )
    }

    return this.bytes_.slice( offset, offset + length )
  }
}


describe( 'IfcAPI.OpenModelFromIndex (conway#541)', () => {

  test( 'opens a model from a sidecar', async () => {
    const modelID = await api.OpenModelFromIndex(
        new InMemoryStepByteStore( bytes ),
        await sidecarFor( bytes ),
        SETTINGS )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )

    api.CloseModel( modelID )
  } )

  test( 'opens a model whose header is longer than the first prefix read', async () => {
    // 80 KiB of comment, against a 64 KiB detection prefix. Before round 2
    // this returned -1: the sniff could not reach FILE_SCHEMA and the
    // factory bailed before `openIfcModelFromIndex` (and its own header
    // retry) ever ran.
    const padded = paddedHeaderSource( 80 * 1024 )

    expect( padded.byteLength ).toBeGreaterThan( 64 * 1024 )

    const modelID = await api.OpenModelFromIndex(
        new InMemoryStepByteStore( padded ),
        await sidecarFor( padded ),
        SETTINGS )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )

    api.CloseModel( modelID )
  } )

  test( 'returns -1 rather than throwing when the sidecar does not match', async () => {
    // The documented contract: a caller feature-detects, gets -1, and falls
    // back to OpenModelStream itself. No internal cold parse.
    const modelID = await api.OpenModelFromIndex(
        new InMemoryStepByteStore( bytes.subarray( 0, bytes.byteLength - 1 ) ),
        await sidecarFor( bytes ),
        SETTINGS )

    expect( modelID ).toBe( -1 )
  } )

  test( 'returns -1 rather than rejecting when the store read fails', async () => {
    // The contract this entry documents is "-1, and the caller falls back to
    // OpenModelStream explicitly". A rejected promise is not that, and it
    // breaks the contract at exactly the moment a caller most needs the
    // fallback — when store access is what failed. Detection used to run
    // outside the guard, so the rejection escaped (conway#541 round 3).
    const sidecar = await sidecarFor( bytes )
    const store = new RejectingStore( bytes, 0 )

    const modelID = await api.OpenModelFromIndex(
        store as unknown as InMemoryStepByteStore, sidecar, SETTINGS )

    expect( modelID ).toBe( -1 )
    expect( store.reads ).toBeGreaterThan( 0 )
  } )

  test( 'returns -1 when the second, grow-the-prefix read fails', async () => {
    // The sniff retry added in round 2 made the failure path do TWO store
    // reads, so it doubled the surface a rejection can escape from. This is
    // the read the first version of that retry did not cover: the first read
    // succeeds, detection comes back undefined, and the retry rejects.
    const padded = paddedHeaderSource( 80 * 1024 )
    const sidecar = await sidecarFor( padded )
    const store = new RejectingStore( padded, 1 )

    const modelID = await api.OpenModelFromIndex(
        store as unknown as InMemoryStepByteStore, sidecar, SETTINGS )

    expect( modelID ).toBe( -1 )

    // Two reads attempted, so the retry really is the one that rejected.
    expect( store.reads ).toBe( 2 )
  } )

  test( 'returns -1 on a v1 sidecar rather than reinterpreting it', async () => {
    // v1 blobs carry top-level rows only. Reaching the model with one would
    // be the silent 21%-of-D3D-missing failure the format bump exists to
    // stop, so the compat entry has to refuse it too.
    const v1 = new Uint8Array( 24 + 3 * 20 )
    const view = new DataView( v1.buffer )

    view.setUint32( 0, 0x58444943, true )
    view.setUint32( 4, 1, true )
    view.setFloat64( 8, bytes.byteLength, true )
    view.setUint32( 16, hashSource( bytes ), true )
    view.setUint32( 20, 3, true )

    const modelID = await api.OpenModelFromIndex(
        new InMemoryStepByteStore( bytes ), v1, SETTINGS )

    expect( modelID ).toBe( -1 )
  } )
} )
