/* eslint-disable no-magic-numbers */
// M2 core: record events emitted live from the streaming parse, routed by a
// type-set subscription, let a consumer build a semantic structure
// incrementally — and it must match what the finished model's type index
// yields. Here: a roots registry collected from the event stream equals
// `expressIDsOfTypes(IfcRoot)` on the resident model.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../../parsing/parsing_buffer'
import IfcStepParser from '../../ifc/ifc_step_parser'
import { BufferByteSource } from './byte_source'
import { buildIndexStreaming } from './streaming_index_builder'
import { StreamingRecordDispatcher } from './streaming_record_dispatcher'
import { ParseResult } from './step_parser'
import { IfcRoot, IfcProduct } from '../../ifc/ifc4_gen'

let bytes: Uint8Array
let residentRoots: Set<number>
let residentProducts: Set<number>

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

  const input = new ParsingBuffer( bytes )
  IfcStepParser.Instance.parseHeader( input )
  const [ , model ] = IfcStepParser.Instance.parseDataToModel( input )

  residentRoots = new Set( model!.expressIDsOfTypes( IfcRoot ) )
  residentProducts = new Set( model!.expressIDsOfTypes( IfcProduct ) )
} )

describe( 'StreamingRecordDispatcher', () => {

  test( 'a roots registry built live from the event stream matches the type index', () => {
    const roots: number[] = []
    const products = new Set<number>()

    const dispatcher = new StreamingRecordDispatcher<number>()
    dispatcher.on( [ IfcRoot ], ( _localID, expressID ) => roots.push( expressID ) )
    dispatcher.on( [ IfcProduct ], ( _localID, expressID ) => products.add( expressID ) )

    const result = buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        4 * 1024, // tiny pool → the parse slides; events still fire per record
        dispatcher.onRecordIndexed )

    expect( result.result ).toBe( ParseResult.COMPLETE )
    // index.ifc has no external-mapping records, so raw-typeID delivery is
    // exact vs. the type index.
    expect( new Set( roots ) ).toEqual( residentRoots )
    expect( products ).toEqual( residentProducts )
    // Products are a strict subset of roots (IfcProduct ⊂ IfcRoot).
    expect( residentProducts.size ).toBeLessThan( residentRoots.size )
    for ( const p of products ) {
      expect( residentRoots.has( p ) ).toBe( true )
    }
  } )

  test( 'localIDs arrive dense and in ascending parse order', () => {
    const localIDs: number[] = []

    const dispatcher = new StreamingRecordDispatcher<number>()
    dispatcher.onAnyRecord( ( localID ) => localIDs.push( localID ) )

    buildIndexStreaming(
        new BufferByteSource( bytes ), IfcStepParser.Instance, 128 * 1024,
        dispatcher.onRecordIndexed )

    expect( localIDs.length ).toBeGreaterThan( 10 )
    // 0,1,2,…,n-1 in order.
    expect( localIDs ).toEqual( localIDs.map( ( _v, i ) => i ) )
  } )

  test( 'onAnyRecord sees every record; a type filter sees a subset', () => {
    let all = 0
    let rootsCount = 0

    const dispatcher = new StreamingRecordDispatcher<number>()
    dispatcher.onAnyRecord( () => ++all )
    dispatcher.on( [ IfcRoot ], () => ++rootsCount )

    buildIndexStreaming(
        new BufferByteSource( bytes ), IfcStepParser.Instance, 128 * 1024,
        dispatcher.onRecordIndexed )

    expect( all ).toBeGreaterThan( rootsCount )
    expect( rootsCount ).toBe( residentRoots.size )
  } )
} )
