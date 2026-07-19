/* eslint-disable no-magic-numbers */
// M2b: a type index built incrementally from the streaming parse's record
// events must, once parsing finishes, hold the same membership as the
// resident model's type index — for every queried type (and its subtypes).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../../parsing/parsing_buffer'
import IfcStepParser from '../../ifc/ifc_step_parser'
import { BufferByteSource } from './byte_source'
import { buildIndexStreaming } from './streaming_index_builder'
import { IncrementalTypeIndex } from './incremental_type_index'
import { StreamingRecordDispatcher } from './streaming_record_dispatcher'
import { ParseResult } from './step_parser'
import { IfcRoot, IfcProduct, IfcWall, IfcPropertySet } from '../../ifc/ifc4_gen'

let bytes: Uint8Array
let model: any

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
  const input = new ParsingBuffer( bytes )
  IfcStepParser.Instance.parseHeader( input )
  model = IfcStepParser.Instance.parseDataToModel( input )[1]
} )

describe( 'IncrementalTypeIndex', () => {

  /**
   * Stream index.ifc, feeding an IncrementalTypeIndex, and return it.
   *
   * @return {IncrementalTypeIndex} The populated index.
   */
  function streamed(): IncrementalTypeIndex<number> {
    const index = new IncrementalTypeIndex<number>()
    const dispatcher = new StreamingRecordDispatcher<number>()
    dispatcher.onAnyRecord( index.handler )

    const r = buildIndexStreaming(
        new BufferByteSource( bytes ), IfcStepParser.Instance, 4 * 1024,
        dispatcher.onRecordIndexed )
    expect( r.result ).toBe( ParseResult.COMPLETE )
    return index
  }

  test.each( [
    [ 'IfcRoot', IfcRoot ],
    [ 'IfcProduct', IfcProduct ],
    [ 'IfcWall', IfcWall ],
    [ 'IfcPropertySet', IfcPropertySet ],
  ] )( 'membership matches the resident type index for %s', ( _name, ctor ) => {
    const index = streamed()

    const incremental = new Set( index.expressIDsOfTypes( ctor as any ) )
    const resident = new Set( model.expressIDsOfTypes( ctor ) )

    expect( incremental ).toEqual( resident )
    expect( index.count( ctor as any ) ).toBe( resident.size )
  } )

  test( 'a multi-type query unions the subtype closures', () => {
    const index = streamed()

    const incremental = new Set( index.expressIDsOfTypes( IfcWall as any, IfcPropertySet as any ) )
    const resident = new Set( model.expressIDsOfTypes( IfcWall, IfcPropertySet ) )

    expect( incremental ).toEqual( resident )
  } )
} )
