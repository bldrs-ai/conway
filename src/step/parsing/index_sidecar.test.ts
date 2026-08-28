/* eslint-disable no-magic-numbers */
// conway#541: the index sidecar must serialise a model's WHOLE parse index —
// top-level rows, the inline-entity range and the multi-mapping holders — and
// deserialise it back to the same columns, so an index-first open reconstructs
// the index without re-scanning the source. It must refuse to be trusted when
// the source no longer matches (hash / length handshake), and it must refuse
// a v1 blob outright rather than reading it under v2 offsets.
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../../parsing/parsing_buffer'
import IfcStepParser from '../../ifc/ifc_step_parser'
import { StepIndexColumns } from './columnar_index'
import { StepIndexEntry } from './step_parser'
import {
  SIDECAR_VERSION,
  deserializeIndexSidecarToColumns,
  hashSource,
  serializeIndexSidecar,
  serializeIndexSidecarFromColumns,
  sidecarMatchesSource,
  sidecarMatchesSourceLength,
} from './index_sidecar'
import { BufferByteSource } from './byte_source'
import { buildColumnarIndexStreaming } from './streaming_index_builder'


/**
 * Parse index.ifc resident and return its top-level element index plus the
 * source bytes it was built from.
 *
 * @return {object} `{ bytes, elements }`.
 */
function residentIndex(): { bytes: Uint8Array, elements: StepIndexEntry<number>[] } {
  const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
  const input = new ParsingBuffer( bytes )
  IfcStepParser.Instance.parseHeader( input )
  const [ index, ] = IfcStepParser.Instance.parseDataBlock( input )
  return { bytes, elements: index.elements }
}


/**
 * Build index.ifc's columnar index the way a streamed open does.
 *
 * @return {object} `{ bytes, columns }`.
 */
function columnarIndex():
  { bytes: Uint8Array, columns: StepIndexColumns<number> } {

  const bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

  const { columns } = buildColumnarIndexStreaming(
      new BufferByteSource( bytes ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ( IfcStepParser as any ).Instance, 4096 )

  return { bytes, columns }
}


/**
 * Assert two columnar indexes are the same index, row for row.
 *
 * @param restored The index that came back out of a sidecar.
 * @param original The index a cold parse produced.
 */
function expectSameColumns(
    restored: StepIndexColumns<number>,
    original: StepIndexColumns<number> ): void {

  expect( restored.count ).toBe( original.count )
  expect( restored.firstInlineElement ).toBe( original.firstInlineElement )
  expect( restored.expressIdsSorted ).toBe( original.expressIdsSorted )

  // Not `toEqual` on the arrays themselves: the columns are typed arrays of
  // different concrete lengths only if something went wrong, and a
  // row-by-row compare names the row when it does.
  expect( restored.address.length ).toBe( original.count )
  expect( restored.expressID.length ).toBe( original.firstInlineElement )

  for ( let where = 0; where < original.count; ++where ) {
    expect( [ where, restored.address[ where ] ] )
        .toEqual( [ where, original.address[ where ] ] )
    expect( [ where, restored.length[ where ] ] )
        .toEqual( [ where, original.length[ where ] ] )
    expect( [ where, restored.typeID[ where ] ] )
        .toEqual( [ where, original.typeID[ where ] ] )
  }

  for ( let where = 0; where < original.firstInlineElement; ++where ) {
    expect( [ where, restored.expressID[ where ] ] )
        .toEqual( [ where, original.expressID[ where ] ] )
  }

  expect( restored.complexEntries?.size ?? 0 )
      .toBe( original.complexEntries?.size ?? 0 )

  for ( const [ localID, entry ] of original.complexEntries ?? [] ) {
    expect( restored.complexEntries?.get( localID ) ).toEqual( entry )
  }
}


/**
 * Write a v1 sidecar — the format this module no longer produces — so the
 * rejection path has something real to reject. Deliberately a frozen copy of
 * the old writer rather than a call into the current one: the point of the
 * test is that a blob written by an older engine is refused, and it stops
 * being that test if it tracks whatever the current writer does.
 *
 * @param columns The columnar index (top-level range only, as v1 carried).
 * @param sourceByteLength The length of the source it was built from.
 * @param sourceHash The source hash.
 * @return {Uint8Array} A v1 sidecar blob.
 */
function serializeV1Sidecar(
    columns: StepIndexColumns<number>,
    sourceByteLength: number,
    sourceHash: number ): Uint8Array {

  const recordCount = columns.firstInlineElement
  const bytes = new Uint8Array( 24 + recordCount * 20 )
  const view = new DataView( bytes.buffer )

  let offset = 0

  view.setUint32( offset, 0x58444943, true ); offset += 4
  view.setUint32( offset, 1, true ); offset += 4
  view.setFloat64( offset, sourceByteLength, true ); offset += 8
  view.setUint32( offset, sourceHash >>> 0, true ); offset += 4
  view.setUint32( offset, recordCount, true ); offset += 4

  for ( let where = 0; where < recordCount; ++where ) {
    view.setFloat64( offset, columns.address[ where ], true ); offset += 8
  }
  for ( let where = 0; where < recordCount; ++where ) {
    view.setUint32( offset, columns.length[ where ], true ); offset += 4
  }
  for ( let where = 0; where < recordCount; ++where ) {
    view.setInt32( offset, columns.typeID[ where ], true ); offset += 4
  }
  for ( let where = 0; where < recordCount; ++where ) {
    view.setUint32( offset, columns.expressID[ where ], true ); offset += 4
  }

  return bytes
}


describe( 'index sidecar', () => {

  test( 'round-trips the WHOLE index, inline range included', () => {
    const { bytes, columns } = columnarIndex()

    // The fixture has to actually exercise the inline range, or this test
    // passes for the wrong reason: index.ifc carries IFCNORMALISEDRATIOMEASURE
    // values inline in two IFCSURFACESTYLERENDERINGs (data/index.ifc:94,105).
    expect( columns.count ).toBeGreaterThan( columns.firstInlineElement )

    const restored = deserializeIndexSidecarToColumns<number>(
        serializeIndexSidecarFromColumns(
            columns, bytes.byteLength, hashSource( bytes ) ) )

    expect( restored.version ).toBe( SIDECAR_VERSION )
    expect( restored.sourceByteLength ).toBe( bytes.byteLength )
    expect( restored.sourceHash ).toBe( hashSource( bytes ) )

    expectSameColumns( restored.columns, columns )
  } )

  test( 'a v1 blob is rejected by version, never read under v2 offsets', () => {
    const { bytes, columns } = columnarIndex()

    const v1 = serializeV1Sidecar( columns, bytes.byteLength, hashSource( bytes ) )

    expect( () => deserializeIndexSidecarToColumns<number>( v1 ) )
        .toThrow( /Unsupported sidecar version 1/ )

    // And the reason is in the message, because a caller reading only the
    // message has to know rebuilding is the fix, not a retry.
    expect( () => deserializeIndexSidecarToColumns<number>( v1 ) )
        .toThrow( /inline entity/ )
  } )

  test( 'a v1 blob and a v2 blob of the same index are not the same bytes', () => {
    // The guard behind the guard: if v1 and v2 ever agreed byte-for-byte on
    // some index, the version check would be the only thing standing between
    // a consumer and a silently truncated one.
    const { bytes, columns } = columnarIndex()
    const hash = hashSource( bytes )

    expect( serializeV1Sidecar( columns, bytes.byteLength, hash ) )
        .not.toEqual( serializeIndexSidecarFromColumns( columns, bytes.byteLength, hash ) )
  } )

  test( 'the object-form writer produces the same bytes as the columns one', () => {
    // Pins the inline UNFOLD ORDER across the two producers. A sidecar
    // written in any other order restores a model whose inline addresses no
    // longer line up with its rows, and nothing downstream would say so.
    const { bytes, elements } = residentIndex()
    const { columns } = columnarIndex()
    const hash = hashSource( bytes )

    expect( serializeIndexSidecar( elements, bytes.byteLength, hash ) )
        .toEqual( serializeIndexSidecarFromColumns( columns, bytes.byteLength, hash ) )
  } )

  test( 'carries complexEntries, multiMapping subtree and all', () => {
    // `complexEntries` is 0 on every model in the corpus — measured across
    // index.ifc, MB-Khaya, D3D, DOWA and PSB (conway#541) — so a synthetic
    // index is the only way to exercise it at all. Nested one level deep on
    // purpose: a flat encoding would pass a single-level fixture.
    const columns: StepIndexColumns<number> = {
      address: new Uint32Array( [ 0, 40, 100 ] ),
      length: new Uint32Array( [ 40, 60, 10 ] ),
      typeID: new Int32Array( [ 7, -1, 11 ] ),
      expressID: new Uint32Array( [ 1, 2 ] ),
      count: 3,
      firstInlineElement: 2,
      expressIdsSorted: true,
      complexEntries: new Map( [
        [ 1, {
          address: 40,
          length: 60,
          expressID: 2,
          multiMapping: [
            { address: 44, length: 8, typeID: 3 },
            {
              address: 52,
              length: 8,
              multiMapping: [ { address: 55, length: 2, typeID: 9 } ],
            },
          ],
        } ],
      ] ),
    }

    const restored = deserializeIndexSidecarToColumns<number>(
        serializeIndexSidecarFromColumns( columns, 110, 1234 ) )

    expectSameColumns( restored.columns, columns )
  } )

  test( 'preserves undefined typeID through the -1 sentinel', () => {
    const elements: StepIndexEntry<number>[] = [
      { address: 0, length: 10, typeID: 7, expressID: 1 },
      { address: 10, length: 20, typeID: void 0, expressID: 2 },
      { address: 30, length: 5, typeID: 0, expressID: 3 },
    ]

    const restored = deserializeIndexSidecarToColumns<number>(
        serializeIndexSidecar( elements, 35, 0 ) )

    expect( Array.from( restored.columns.typeID ) ).toEqual( [ 7, -1, 0 ] )
  } )

  test( 'decodes identically from a misaligned view', () => {
    // The column reads take a typed-array (memcpy) fast path when the blob
    // is 4-aligned and fall back to DataView when it is not — a sidecar that
    // arrived as a slice of a larger transfer buffer takes the slow one.
    // Both must answer the same, or the format depends on how it was framed.
    const { bytes, columns } = columnarIndex()
    const blob =
      serializeIndexSidecarFromColumns( columns, bytes.byteLength, hashSource( bytes ) )

    const shifted = new Uint8Array( blob.byteLength + 1 )
    shifted.set( blob, 1 )

    expectSameColumns(
        deserializeIndexSidecarToColumns<number>(
            shifted.subarray( 1 ) ).columns,
        columns )
  } )

  test( 'refuses a source too large for the 32-bit address column', () => {
    // v1 wrote address as f64 and read it back into a Uint32Array, so a
    // >4 GiB source truncated in silence. The column is the real constraint;
    // widening it is its own change, so this says no rather than lying.
    const columns: StepIndexColumns<number> = {
      address: new Uint32Array( [ 0 ] ),
      length: new Uint32Array( [ 10 ] ),
      typeID: new Int32Array( [ 1 ] ),
      expressID: new Uint32Array( [ 1 ] ),
      count: 1,
      firstInlineElement: 1,
      expressIdsSorted: true,
    }

    expect( () => serializeIndexSidecarFromColumns( columns, 2 ** 32, 0 ) )
        .toThrow( /4 GiB/ )

    // And on the way back in, for a blob some other writer produced.
    const blob = serializeIndexSidecarFromColumns( columns, 100, 0 )
    new DataView( blob.buffer ).setFloat64( 8, 2 ** 32, true )

    expect( () => deserializeIndexSidecarToColumns<number>( blob ) )
        .toThrow( /4 GiB/ )
  } )

  test( 'refuses columns that do not describe themselves', () => {
    // The column writes take a memcpy off the backing buffer, so a short
    // column would be silently padded with whatever sits after it.
    expect( () => serializeIndexSidecarFromColumns( {
      address: new Uint32Array( [ 0, 40 ] ),
      length: new Uint32Array( [ 40, 60 ] ),
      typeID: new Int32Array( [ 7, 8 ] ),
      expressID: new Uint32Array( [ 1, 2 ] ),
      count: 5,
      firstInlineElement: 2,
      expressIdsSorted: true,
    }, 100, 0 ) ).toThrow( /Inconsistent columns/ )
  } )

  test( 'accepts a sidecar whose hash and length match the source', () => {
    const { bytes, columns } = columnarIndex()
    const hash = hashSource( bytes )

    const restored = deserializeIndexSidecarToColumns<number>(
        serializeIndexSidecarFromColumns( columns, bytes.byteLength, hash ) )

    // No cast: the columns decode satisfies SidecarSourceIdentity directly.
    expect( sidecarMatchesSource( restored, bytes.byteLength, hash ) ).toBe( true )
    expect( sidecarMatchesSourceLength( restored, bytes.byteLength ) ).toBe( true )
  } )

  test( 'rejects a sidecar when the source bytes changed (hash mismatch)', () => {
    const { bytes, columns } = columnarIndex()
    const hash = hashSource( bytes )

    const restored = deserializeIndexSidecarToColumns<number>(
        serializeIndexSidecarFromColumns( columns, bytes.byteLength, hash ) )

    // Same length, one byte flipped → different hash → must not be trusted.
    const mutated = bytes.slice()
    mutated[ Math.floor( mutated.length / 2 ) ] ^= 0xFF

    expect( sidecarMatchesSource(
        restored, mutated.byteLength, hashSource( mutated ) ) ).toBe( false )

    // ...and this is exactly what the length-only gate cannot see, which is
    // why the two are named separately rather than one defaulting to the
    // other.
    expect( sidecarMatchesSourceLength( restored, mutated.byteLength ) ).toBe( true )
  } )

  test( 'rejects a sidecar when the source length changed', () => {
    const { bytes, columns } = columnarIndex()
    const hash = hashSource( bytes )

    const restored = deserializeIndexSidecarToColumns<number>(
        serializeIndexSidecarFromColumns( columns, bytes.byteLength, hash ) )

    expect( sidecarMatchesSource( restored, bytes.byteLength + 1, hash ) )
        .toBe( false )
    expect( sidecarMatchesSourceLength( restored, bytes.byteLength + 1 ) )
        .toBe( false )
  } )

  test( 'hashSource is deterministic and sensitive to content', () => {
    const a = new Uint8Array( [ 1, 2, 3, 4, 5 ] )
    const b = new Uint8Array( [ 1, 2, 3, 4, 5 ] )
    const c = new Uint8Array( [ 1, 2, 3, 4, 6 ] )

    expect( hashSource( a ) ).toBe( hashSource( b ) )
    expect( hashSource( a ) ).not.toBe( hashSource( c ) )
  } )

  test( 'throws on a blob with bad magic', () => {
    const garbage = new Uint8Array( 64 )

    expect( () => deserializeIndexSidecarToColumns<number>( garbage ) )
        .toThrow( /magic/ )
  } )

  test( 'round-trips an empty index', () => {
    const restored = deserializeIndexSidecarToColumns<number>(
        serializeIndexSidecar( [], 0, 0 ) )

    expect( restored.columns.count ).toBe( 0 )
    expect( restored.columns.firstInlineElement ).toBe( 0 )
    expect( restored.columns.complexEntries ).toBe( void 0 )
  } )
} )
