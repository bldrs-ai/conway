/* eslint-disable no-magic-numbers */
// M2 (#393): the type index over the records parsed so far.
//
// Two things are pinned here, and they are the two the event-fed
// IncrementalTypeIndex this replaces got wrong:
//   1. final membership equals the resident model's type index — the exit
//      criterion "consumers produce output identical to today's end-of-parse
//      construction";
//   2. complex (multi-mapped) records are attributed to their mapped classes,
//      which is invisible to a consumer reading the record event's typeID
//      (complex records arrive there as 0).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../../parsing/parsing_buffer'
import IfcStepParser from '../../ifc/ifc_step_parser'
import EntityTypesIfc, { EntityTypesIfcCount } from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { IfcRoot, IfcProduct, IfcWall, IfcPropertySet } from '../../ifc/ifc4_gen'
import { StepTypeIndexer } from '../indexing/step_type_indexer'
import { BufferByteSource } from './byte_source'
import { ColumnarIndexSink } from './columnar_index'
import { PrefixTypeIndex } from './prefix_type_index'
import { buildIndexStreaming } from './streaming_index_builder'
import { ParseResult } from './step_parser'

let bytes: Uint8Array
let model: any

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

  const input = new ParsingBuffer( bytes )

  IfcStepParser.Instance.parseHeader( input )
  model = IfcStepParser.Instance.parseDataToModel( input )[ 1 ]
} )

/**
 * Stream index.ifc into a sink, optionally pausing at `stopAfter` records to
 * hand the caller a mid-parse view, and return the index over that sink.
 *
 * @param onRecord Optional per-record hook, so a test can query the index
 * while the parse is still filling the sink behind it.
 * @return {PrefixTypeIndex} The index over the (fully parsed) sink.
 */
function streamed(
    onRecord?: ( index: PrefixTypeIndex<EntityTypesIfc>, localID: number ) => void ):
    PrefixTypeIndex<EntityTypesIfc> {

  const sink = new ColumnarIndexSink<EntityTypesIfc>()
  const index = new PrefixTypeIndex<EntityTypesIfc>(
      sink, new StepTypeIndexer<EntityTypesIfc>( EntityTypesIfcCount ) )

  const result = buildIndexStreaming(
      new BufferByteSource( bytes ),
      IfcStepParser.Instance,
      4 * 1024,
      onRecord === void 0 ? void 0 : ( localID ) => onRecord( index, localID ),
      sink )

  expect( result.result ).toBe( ParseResult.COMPLETE )

  return index
}

describe( 'PrefixTypeIndex', () => {

  test.each( [
    [ 'IfcRoot', IfcRoot ],
    [ 'IfcProduct', IfcProduct ],
    [ 'IfcWall', IfcWall ],
    [ 'IfcPropertySet', IfcPropertySet ],
  ] )( 'final membership matches the resident type index for %s', ( _name, ctor ) => {
    const index = streamed()

    const prefix = new Set( index.expressIDsOfTypes( ctor as any ) )
    const resident = new Set( model.expressIDsOfTypes( ctor ) )

    expect( prefix ).toEqual( resident )
  } )

  test( 'a multi-type query unions the subtype closures', () => {
    const index = streamed()

    const prefix =
      new Set( index.expressIDsOfTypes( IfcWall as any, IfcPropertySet as any ) )
    const resident = new Set( model.expressIDsOfTypes( IfcWall, IfcPropertySet ) )

    expect( prefix ).toEqual( resident )
  } )

  test( 'nothing is built until something is queried', () => {
    const sink = new ColumnarIndexSink<EntityTypesIfc>()
    const index = new PrefixTypeIndex<EntityTypesIfc>(
        sink, new StepTypeIndexer<EntityTypesIfc>( EntityTypesIfcCount ) )

    expect( index.generation ).toBe( 0 )
    expect( index.recordCount ).toBe( 0 )

    // The whole point of deriving rather than pushing: a consumer that never
    // asks pays nothing, however long the parse ran.
    buildIndexStreaming(
        new BufferByteSource( bytes ), IfcStepParser.Instance, 4 * 1024, void 0, sink )

    expect( index.generation ).toBe( 0 )
  } )

  test( 'a mid-parse query answers over the prefix, and grows with it', () => {
    // Rebuild on every record so the view tracks the parse exactly; the
    // default growth pacing is about cost, not correctness.
    const sink = new ColumnarIndexSink<EntityTypesIfc>()
    const index = new PrefixTypeIndex<EntityTypesIfc>(
        sink,
        new StepTypeIndexer<EntityTypesIfc>( EntityTypesIfcCount ),
        { growthFactor: 1.0, minimumRecords: 0 } )

    const counts: number[] = []

    buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        4 * 1024,
        ( localID ) => {
          if ( localID === 64 || localID === 128 ) {
            counts.push( [ ...index.expressIDsOfTypes( IfcRoot as any ) ].length )
          }
        },
        sink )

    const final = [ ...index.expressIDsOfTypes( IfcRoot as any ) ].length
    const resident = [ ...model.expressIDsOfTypes( IfcRoot ) ].length

    expect( counts ).toHaveLength( 2 )
    expect( counts[ 0 ] ).toBeLessThanOrEqual( counts[ 1 ] )
    expect( counts[ 1 ] ).toBeLessThanOrEqual( final )
    expect( final ).toBe( resident )
  } )

  test( 'a sink reset invalidates the view instead of pacing past it', () => {
    // The streaming builder's grow-and-restart resets the sink. Growth pacing
    // alone would never notice: the count drops, and a restarted parse can
    // finish below the threshold the abandoned pass already built at.
    const sink = new ColumnarIndexSink<number>()
    const index = new PrefixTypeIndex<number>(
        sink, new StepTypeIndexer<number>( 16 ) )

    for ( let record = 0; record < 8; ++record ) {
      sink.pushTopLevel( { address: record, length: 1, typeID: 5, expressID: record + 1 } )
    }

    expect( [ ...index.expressIDsOfTypeIDs( 5 ) ] ).toHaveLength( 8 )
    expect( index.generation ).toBe( 1 )

    sink.reset()
    sink.pushTopLevel( { address: 0, length: 1, typeID: 5, expressID: 99 } )

    expect( [ ...index.expressIDsOfTypeIDs( 5 ) ] ).toEqual( [ 99 ] )
    expect( index.generation ).toBe( 2 )
  } )

  test( 'complex records are attributed to their mapped classes', () => {
    // Built by hand rather than parsed: the point is precisely the shape the
    // record event cannot express — one address, typeID 0, several mapped
    // classes hanging off it.
    const sink = new ColumnarIndexSink<number>()

    sink.pushTopLevel( { address: 0, length: 10, typeID: 5, expressID: 1 } )
    sink.pushTopLevel( {
      address: 10,
      length: 20,
      typeID: 0,
      expressID: 2,
      multiMapping: [ { address: 12, length: 5, typeID: 7 } ],
    } )

    const index = new PrefixTypeIndex<number>(
        sink, new StepTypeIndexer<number>( 16 ) )

    expect( [ ...index.expressIDsOfTypeIDs( 5 ) ] ).toEqual( [ 1 ] )
    expect( [ ...index.expressIDsOfTypeIDs( 7 ) ] ).toEqual( [ 2 ] )
    expect( [ ...index.types() ] ).toEqual( expect.arrayContaining( [ 5, 7 ] ) )
  } )
} )
