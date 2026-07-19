/* eslint-disable no-magic-numbers */
// M4: the index sidecar must serialise a model's parse index and deserialise
// it back byte-identically, so an index-first open reconstructs the entity
// index without re-scanning the source — and it must refuse to be trusted when
// the source it was built from no longer matches (hash / length handshake).
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../../parsing/parsing_buffer'
import IfcStepParser from '../../ifc/ifc_step_parser'
import { StepIndexEntry } from './step_parser'
import {
  deserializeIndexSidecar,
  deserializeIndexSidecarToColumns,
  hashSource,
  serializeIndexSidecar,
  serializeIndexSidecarFromColumns,
  sidecarMatchesSource,
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

describe( 'index sidecar', () => {

  test( 'round-trips the top-level index byte-identically', () => {
    const { bytes, elements } = residentIndex()
    const hash = hashSource( bytes )

    const blob = serializeIndexSidecar( elements, bytes.byteLength, hash )
    const decoded = deserializeIndexSidecar<number>( blob )

    expect( decoded.sourceByteLength ).toBe( bytes.byteLength )
    expect( decoded.sourceHash ).toBe( hash )
    expect( decoded.elements.length ).toBe( elements.length )

    for ( let where = 0; where < elements.length; ++where ) {
      const original = elements[ where ]
      const restored = decoded.elements[ where ]

      expect( restored.address ).toBe( original.address )
      expect( restored.length ).toBe( original.length )
      expect( restored.expressID ).toBe( original.expressID )
      // typeID round-trips including the undefined case (stored as -1).
      expect( restored.typeID ).toBe( original.typeID )
    }
  } )

  test( 'accepts a sidecar whose hash and length match the source', () => {
    const { bytes, elements } = residentIndex()
    const hash = hashSource( bytes )

    const decoded =
      deserializeIndexSidecar<number>(
          serializeIndexSidecar( elements, bytes.byteLength, hash ) )

    expect( sidecarMatchesSource( decoded, bytes.byteLength, hash ) ).toBe( true )
  } )

  test( 'rejects a sidecar when the source bytes changed (hash mismatch)', () => {
    const { bytes, elements } = residentIndex()
    const hash = hashSource( bytes )

    const decoded =
      deserializeIndexSidecar<number>(
          serializeIndexSidecar( elements, bytes.byteLength, hash ) )

    // Same length, one byte flipped → different hash → must not be trusted.
    const mutated = bytes.slice()
    mutated[ Math.floor( mutated.length / 2 ) ] ^= 0xFF

    expect(
        sidecarMatchesSource( decoded, mutated.byteLength, hashSource( mutated ) ) )
        .toBe( false )
  } )

  test( 'rejects a sidecar when the source length changed', () => {
    const { bytes, elements } = residentIndex()
    const hash = hashSource( bytes )

    const decoded =
      deserializeIndexSidecar<number>(
          serializeIndexSidecar( elements, bytes.byteLength, hash ) )

    expect( sidecarMatchesSource( decoded, bytes.byteLength + 1, hash ) )
        .toBe( false )
  } )

  test( 'hashSource is deterministic and sensitive to content', () => {
    const a = new Uint8Array( [ 1, 2, 3, 4, 5 ] )
    const b = new Uint8Array( [ 1, 2, 3, 4, 5 ] )
    const c = new Uint8Array( [ 1, 2, 3, 4, 6 ] )

    expect( hashSource( a ) ).toBe( hashSource( b ) )
    expect( hashSource( a ) ).not.toBe( hashSource( c ) )
  } )

  test( 'preserves undefined typeID through the -1 sentinel', () => {
    const elements: StepIndexEntry<number>[] = [
      { address: 0, length: 10, typeID: 7, expressID: 1 },
      { address: 10, length: 20, typeID: void 0, expressID: 2 },
      { address: 30, length: 5, typeID: 0, expressID: 3 },
    ]

    const decoded =
      deserializeIndexSidecar<number>(
          serializeIndexSidecar( elements, 35, 0 ) )

    expect( decoded.elements[ 0 ].typeID ).toBe( 7 )
    expect( decoded.elements[ 1 ].typeID ).toBe( void 0 )
    expect( decoded.elements[ 2 ].typeID ).toBe( 0 )
  } )

  test( 'throws on a blob with bad magic', () => {
    const garbage = new Uint8Array( 32 )

    expect( () => deserializeIndexSidecar<number>( garbage ) ).toThrow( /magic/ )
  } )

  test( 'round-trips an empty index', () => {
    const decoded =
      deserializeIndexSidecar<number>( serializeIndexSidecar( [], 0, 0 ) )

    expect( decoded.elements.length ).toBe( 0 )
  } )

  test( 'columns-form serialize is byte-identical to the object-form blob (M7)', () => {
    const { bytes, elements } = residentIndex()
    const hash = hashSource( bytes )

    const { columns } = buildColumnarIndexStreaming(
        new BufferByteSource( bytes ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ( IfcStepParser as any ).Instance, 4096 )

    const fromObjects = serializeIndexSidecar( elements, bytes.byteLength, hash )
    const fromColumns =
      serializeIndexSidecarFromColumns( columns, bytes.byteLength, hash )

    expect( fromColumns ).toEqual( fromObjects )
  } )

  test( 'deserializes straight to columns for the index-first open (M7)', () => {
    const { bytes, elements } = residentIndex()
    const hash = hashSource( bytes )

    const blob = serializeIndexSidecar( elements, bytes.byteLength, hash )
    const restored = deserializeIndexSidecarToColumns<number>( blob )

    expect( restored.sourceByteLength ).toBe( bytes.byteLength )
    expect( restored.sourceHash ).toBe( hash )
    expect( restored.columns.count ).toBe( elements.length )
    expect( restored.columns.firstInlineElement ).toBe( elements.length )
    expect( restored.columns.expressIdsSorted ).toBe( true )

    for ( let where = 0; where < elements.length; ++where ) {
      expect( restored.columns.address[ where ] ).toBe( elements[ where ].address )
      expect( restored.columns.length[ where ] ).toBe( elements[ where ].length )
      expect( restored.columns.expressID[ where ] ).toBe( elements[ where ].expressID )
      expect( restored.columns.typeID[ where ] )
          .toBe( elements[ where ].typeID ?? -1 )
    }
  } )
} )
