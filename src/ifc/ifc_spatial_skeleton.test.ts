/* eslint-disable no-magic-numbers */
// M2 (#393): the spatial names skeleton built from the streaming parse's
// record events.
//
// The parity bar is the tree Share builds today from the finished model
// (IfcProperties' spatial structure in 'names' mode): same containment edges,
// same Name/LongName/GlobalId — but available while the parse runs, and
// without paging every relationship back in afterwards.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../parsing/parsing_buffer'
import { BufferByteSource } from '../step/parsing/byte_source'
import { ParseResult } from '../step/parsing/step_parser'
import { buildIndexStreaming } from '../step/parsing/streaming_index_builder'
import { StreamingRecordDispatcher } from '../step/parsing/streaming_record_dispatcher'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import { IfcSpatialSkeleton, SkeletonNode } from './ifc_spatial_skeleton'
import IfcStepParser from './ifc_step_parser'

let bytes: Uint8Array
let model: any

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

  const input = new ParsingBuffer( bytes )

  IfcStepParser.Instance.parseHeader( input )
  model = IfcStepParser.Instance.parseDataToModel( input )[ 1 ]
} )

/**
 * Stream the fixture through a skeleton.
 *
 * @param onRecord Optional per-record hook, for querying mid-parse.
 * @return {IfcSpatialSkeleton} The populated skeleton.
 */
function streamed( onRecord?: ( localID: number ) => void ): IfcSpatialSkeleton {
  const skeleton = new IfcSpatialSkeleton()
  const dispatcher = new StreamingRecordDispatcher<EntityTypesIfc>()

  skeleton.subscribe( dispatcher )

  if ( onRecord !== void 0 ) {
    dispatcher.onAnyRecord( ( localID ) => onRecord( localID ) )
  }

  const result = buildIndexStreaming(
      new BufferByteSource( bytes ),
      IfcStepParser.Instance,
      4 * 1024,
      dispatcher.onRecordIndexed )

  expect( result.result ).toBe( ParseResult.COMPLETE )

  return skeleton
}

/**
 * Find a node anywhere in a forest.
 *
 * @param roots The forest.
 * @param expressID The express ID to find.
 * @return {SkeletonNode | undefined} The node, if present.
 */
function find( roots: SkeletonNode[], expressID: number ): SkeletonNode | undefined {
  for ( const root of roots ) {
    if ( root.expressID === expressID ) {
      return root
    }

    const found = find( root.children, expressID )

    if ( found !== void 0 ) {
      return found
    }
  }

  return void 0
}

describe( 'IfcSpatialSkeleton', () => {

  test( 'names come out matching the entities the model decodes', () => {
    const skeleton = streamed()

    for ( const node of skeleton.tree() ) {
      expectNamesMatchModel( node )
    }
  } )

  /**
   * Assert a node's strings against the model's own decode of that record,
   * recursively.
   *
   * @param node The skeleton node.
   */
  function expectNamesMatchModel( node: SkeletonNode ): void {
    const entity = model.getElementByExpressID( node.expressID ) as any

    expect( entity ).toBeDefined()
    expect( node.globalId ).toBe( entity.GlobalId )
    expect( node.name ?? null ).toBe( entity.Name ?? null )

    if ( node.longName !== void 0 ) {
      expect( node.longName ).toBe( entity.LongName )
    }

    for ( const child of node.children ) {
      expectNamesMatchModel( child )
    }
  }

  test( 'containment edges match the relationships in the model', () => {
    const skeleton = streamed()
    const roots = skeleton.tree()

    // The project is the spatial root, and its site/storey chain is what the
    // NavTree draws.
    const projectID = [ ...model.expressIDsOfTypes(
        { query: [ EntityTypesIfc.IFCPROJECT ] } as any ) ][ 0 ]
    const project = find( roots, projectID )

    expect( project ).toBeDefined()
    expect( project!.name ).toBe( 'Bldrs' )

    const site = project!.children.find(
        ( child ) => child.type === EntityTypesIfc.IFCSITE )

    expect( site ).toBeDefined()
    expect( site!.name ).toBe( 'Build' )

    const storey = find( [ site! ], 154 )

    expect( storey ).toBeDefined()
    expect( storey!.type ).toBe( EntityTypesIfc.IFCBUILDINGSTOREY )
    expect( storey!.name ).toBe( 'Thing' )
  } )

  test( 'the tree is answerable mid-parse and only grows', () => {
    const skeleton = new IfcSpatialSkeleton()
    const dispatcher = new StreamingRecordDispatcher<EntityTypesIfc>()

    skeleton.subscribe( dispatcher )

    const counts: number[] = []

    dispatcher.onAnyRecord( ( localID ) => {
      if ( localID === 64 || localID === 128 ) {
        counts.push( skeleton.nodeCount )
      }
    } )

    buildIndexStreaming(
        new BufferByteSource( bytes ),
        IfcStepParser.Instance,
        4 * 1024,
        dispatcher.onRecordIndexed )

    expect( counts ).toHaveLength( 2 )
    expect( counts[ 0 ] ).toBeLessThanOrEqual( counts[ 1 ] )
    expect( counts[ 1 ] ).toBeLessThanOrEqual( skeleton.nodeCount )
    expect( skeleton.nodeCount ).toBeGreaterThan( 0 )
    expect( skeleton.edgeCount ).toBeGreaterThan( 0 )
  } )

  test( 'a forward-referenced parent links as soon as both ends exist', () => {
    // Hostile ordering: the relationship names entities that appear later in
    // the file. Nothing is remembered as pending — the edge simply links on
    // the next tree() once both ends have been parsed.
    const source = [
      'ISO-10303-21;',
      'HEADER;',
      'FILE_DESCRIPTION((\'\'),\'\');',
      'FILE_NAME(\'\',\'\',(\'\'),(\'\'),\'\',\'\',\'\');',
      'FILE_SCHEMA((\'IFC4\'));',
      'ENDSEC;',
      'DATA;',
      '#1= IFCRELAGGREGATES(\'r\',$,$,$,#2,(#3));',
      '#2= IFCPROJECT(\'p\',$,\'Late Project\',$,$,$,$,$,$);',
      '#3= IFCSITE(\'s\',$,\'Late Site\',$,$,$,$,\'Long Site\',$,$,$,$,$,$);',
      'ENDSEC;',
      'END-ISO-10303-21;',
      '',
    ].join( '\n' )

    const skeleton = new IfcSpatialSkeleton()
    const dispatcher = new StreamingRecordDispatcher<EntityTypesIfc>()

    skeleton.subscribe( dispatcher )

    const midParse: number[] = []

    dispatcher.onAnyRecord( () => {
      midParse.push( skeleton.tree().length )
    } )

    const result = buildIndexStreaming(
        new BufferByteSource( new TextEncoder().encode( source ) ),
        IfcStepParser.Instance,
        4 * 1024,
        dispatcher.onRecordIndexed )

    expect( result.result ).toBe( ParseResult.COMPLETE )

    // After the relationship alone, there is nothing to link; by the end the
    // project owns the site.
    expect( midParse[ 0 ] ).toBe( 0 )

    const roots = skeleton.tree()

    expect( roots ).toHaveLength( 1 )
    expect( roots[ 0 ].name ).toBe( 'Late Project' )
    expect( roots[ 0 ].children ).toHaveLength( 1 )
    expect( roots[ 0 ].children[ 0 ].name ).toBe( 'Late Site' )
    expect( roots[ 0 ].children[ 0 ].longName ).toBe( 'Long Site' )
  } )
} )
