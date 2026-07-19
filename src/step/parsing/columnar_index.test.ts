/* eslint-disable no-magic-numbers, @typescript-eslint/no-explicit-any */
// M7: the columnar (no-object-phase) index build must produce a model
// indistinguishable from the object-path build — identical SoA columns,
// identical lookup behaviour, identical type index — including on AP214
// fixtures with inline entities and multi-mappings, the paths the object
// walk handles specially.
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../../parsing/parsing_buffer'
import IfcStepParser from '../../ifc/ifc_step_parser'
import IfcStepModel from '../../ifc/ifc_step_model'
import AP214StepParser from '../../AP214E3_2010/ap214_step_parser'
import AP214StepModel from '../../AP214E3_2010/ap214_step_model'
import { BufferByteSource } from './byte_source'
import { buildColumnarIndexStreaming } from './streaming_index_builder'
import { ColumnarIndexSink } from './columnar_index'
import { ParseResult, StepIndexEntry } from './step_parser'
import { IfcProduct, IfcRoot } from '../../ifc/ifc4_gen'

/**
 * Parse a file resident via the object path and return buffer + elements.
 *
 * @param path The file to parse.
 * @param parser The parser instance for its schema.
 * @return {object} `{ bytes, elements }`.
 */
function objectParse( path: string, parser: any ):
    { bytes: Uint8Array, elements: StepIndexEntry<number>[] } {
  const bytes = new Uint8Array( fs.readFileSync( path ) )
  const input = new ParsingBuffer( bytes )
  parser.parseHeader( input )
  const [ index, result ] = parser.parseDataBlock( input )
  expect( result ).toBe( ParseResult.COMPLETE )
  return { bytes, elements: index.elements }
}

/**
 * Assert two models have byte-identical internal columns and equal type
 * indexes across every type either contains.
 *
 * @param a First model.
 * @param b Second model.
 */
function expectModelParity( a: any, b: any ): void {

  expect( a.count_ ).toBe( b.count_ )
  expect( a.firstInlineElement_ ).toBe( b.firstInlineElement_ )

  expect( Array.from( a.address_ ) ).toEqual( Array.from( b.address_ ) )
  expect( Array.from( a.length_ ) ).toEqual( Array.from( b.length_ ) )
  expect( Array.from( a.typeID_ ) ).toEqual( Array.from( b.typeID_ ) )
  expect( Array.from( a.expressID_ ) ).toEqual( Array.from( b.expressID_ ) )

  const typesA = new Set( a.typeIndex.types() )
  const typesB = new Set( b.typeIndex.types() )

  expect( typesA ).toEqual( typesB )

  for ( const type of typesA ) {
    expect( b.typeIndex.count( type ) ).toBe( a.typeIndex.count( type ) )
  }
}

describe( 'columnar index build (M7)', () => {

  test( 'IFC: columnar streamed model matches the object-path model', () => {
    const path = 'data/index.ifc'
    const { bytes, elements } = objectParse( path, IfcStepParser.Instance )
    const objectModel = new IfcStepModel( bytes, elements ) as any

    const { columns, result } = buildColumnarIndexStreaming(
        new BufferByteSource( bytes ), IfcStepParser.Instance as any, 4 * 1024 )

    expect( result ).toBe( ParseResult.COMPLETE )

    const columnarModel = new IfcStepModel( bytes, columns as any ) as any

    expectModelParity( objectModel, columnarModel )

    // Behavioural spot checks through the public surface.
    const roots = new Set( objectModel.expressIDsOfTypes( IfcRoot ) )
    expect( new Set( columnarModel.expressIDsOfTypes( IfcRoot ) ) ).toEqual( roots )
    expect( new Set( columnarModel.expressIDsOfTypes( IfcProduct ) ) )
        .toEqual( new Set( objectModel.expressIDsOfTypes( IfcProduct ) ) )

    for ( const expressID of roots ) {
      expect( columnarModel.getElementByExpressID( expressID )?.expressID )
          .toBe( objectModel.getElementByExpressID( expressID )?.expressID )
    }
  } )

  test.each( [
    [ 'as1-oc-214.stp' ],
    [ 'ap214-mapped-item-test.step' ],
    [ 'ap214-multibody-part.step' ],
  ] )( 'AP214 (inline/multi-mapping): parity on %s', ( name ) => {
    const path = `data/${name}`
    const { bytes, elements } = objectParse( path, AP214StepParser.Instance )
    const objectModel = new AP214StepModel( bytes, elements ) as any

    const { columns, result } = buildColumnarIndexStreaming(
        new BufferByteSource( bytes ), AP214StepParser.Instance as any, 4 * 1024 )

    expect( result ).toBe( ParseResult.COMPLETE )

    const columnarModel = new AP214StepModel( bytes, columns as any ) as any

    // Inline entities must actually be present for these fixtures to prove
    // the unfold path (guard against a silently trivial test).
    if ( name !== 'as1-oc-214.stp' ) {
      expect( columnarModel.count_ ).toBeGreaterThan( columnarModel.firstInlineElement_ )
    }

    expectModelParity( objectModel, columnarModel )
  } )

  test( 'the sink drops simple records but retains complex ones', () => {
    const sink = new ColumnarIndexSink<number>()

    sink.pushTopLevel( { address: 0, length: 10, typeID: 5, expressID: 1 } )
    sink.pushTopLevel( {
      address: 10, length: 20, typeID: 0, expressID: 2,
      multiMapping: [ { address: 12, length: 5, typeID: 7 } ],
    } )

    const columns = sink.finalize()

    expect( columns.firstInlineElement ).toBe( 2 )
    expect( columns.count ).toBe( 2 )
    expect( columns.complexEntries?.size ).toBe( 1 )
    expect( columns.complexEntries?.get( 1 )?.multiMapping?.[ 0 ].typeID ).toBe( 7 )
    expect( Array.from( columns.typeID ) ).toEqual( [ 5, 0 ] )
  } )

  test( 'inline entities unfold in the model object-walk order', () => {
    const sink = new ColumnarIndexSink<number>()

    // Two parents with children; first parent's child itself has a child.
    // Object-path order: parents (0,1), then first-level children in parent
    // order (2 = p0c, 3 = p1c), then second-level (4 = p0c's child).
    sink.pushTopLevel( {
      address: 0, length: 10, typeID: 1, expressID: 1,
      inlineEntities: [ {
        address: 2, length: 3, typeID: 10,
        inlineEntities: [ { address: 3, length: 1, typeID: 20 } ],
      } ],
    } )
    sink.pushTopLevel( {
      address: 10, length: 10, typeID: 2, expressID: 2,
      inlineEntities: [ { address: 12, length: 3, typeID: 11 } ],
    } )

    const columns = sink.finalize()

    expect( columns.firstInlineElement ).toBe( 2 )
    expect( columns.count ).toBe( 5 )
    expect( Array.from( columns.typeID ) ).toEqual( [ 1, 2, 10, 11, 20 ] )
    expect( Array.from( columns.address ) ).toEqual( [ 0, 10, 2, 12, 3 ] )
  } )

  test( 'reset rewinds for the grow-and-restart', () => {
    const sink = new ColumnarIndexSink<number>()

    sink.pushTopLevel( { address: 0, length: 1, typeID: 1, expressID: 9 } )
    sink.reset()
    sink.pushTopLevel( { address: 5, length: 2, typeID: 3, expressID: 1 } )

    const columns = sink.finalize()

    expect( columns.count ).toBe( 1 )
    expect( Array.from( columns.address ) ).toEqual( [ 5 ] )
    expect( columns.expressIdsSorted ).toBe( true )
  } )

  test( 'detects unsorted express IDs', () => {
    const sink = new ColumnarIndexSink<number>()

    sink.pushTopLevel( { address: 0, length: 1, typeID: 1, expressID: 10 } )
    sink.pushTopLevel( { address: 1, length: 1, typeID: 1, expressID: 5 } )

    expect( sink.finalize().expressIdsSorted ).toBe( false )
  } )
} )
