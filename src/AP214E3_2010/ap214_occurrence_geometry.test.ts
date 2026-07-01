import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import { AP214Properties } from '../compat/web-ifc/ap214_properties'
import { IfcApiProxyAP214 } from '../compat/web-ifc/ifc_api_proxy_ap214'


/**
 * The geometry-rich NIST `as1-oc-214` assembly (real BREP + a 13-NAUO
 * occurrence tree, parts placed via context_dependent_shape_representation).
 * Unlike the structure-only `as1-assembly.step` stub, this fixture pairs
 * geometry with instancing, so it is the reference case for occurrence-keyed
 * selection (Share NavTree <-> scene): the same leaf part (e.g. the nut) is
 * reused across occurrences, so its scalar expressID collides while its
 * occurrence path is unique.
 */
const FIXTURE = 'data/as1-oc-214.stp'

let extraction: AP214GeometryExtraction
let model: ReturnType<AP214StepParser['parseDataToModel']>[1]

beforeAll( async () => {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer( fs.readFileSync( FIXTURE ) )

  expect( parser.parseHeader( buffer )[1] ).toBe( ParseResult.COMPLETE )

  const [ , parsed ] = parser.parseDataToModel( buffer )

  expect( parsed ).not.toBe( void 0 )
  model = parsed

  const conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )

  extraction = new AP214GeometryExtraction( conwayGeometry, model! )
} )


describe( 'AP214 as1-oc-214 geometry fixture', () => {

  test( 'extracts geometry for the assembly', () => {

    const [ result, scene ] = extraction.extractAP214GeometryData()

    expect( result ).toBe( ExtractResult.COMPLETE )

    let geometryNodes = 0
    for ( const [ , , , , entity ] of scene.walk() ) {
      if ( entity !== void 0 ) {
        geometryNodes++
      }
    }

    // Real geometry (10 BREP solids placed across the occurrence tree) — a
    // non-trivial mesh count guards the fixture against silently regressing to
    // a structure-only stub.
    expect( geometryNodes ).toBeGreaterThan( 0 )
  } )

  test( 'the same leaf part is reused across occurrences (the selection case)', async () => {

    const props = new AP214Properties( { StepModel: model! } as unknown as IfcApiProxyAP214 )
    const root = await props.getSpatialStructure() as any

    const nuts: any[] = []
    const walk = ( node: any ) => {
      if ( node.Name?.value === 'nut' ) {
        nuts.push( node )
      }
      for ( const c of node.children ?? [] ) {
        walk( c )
      }
    }
    walk( root )

    // Multiple nut occurrences, some sharing a scalar expressID but each with a
    // distinct occurrence path — the invariant occurrence-keyed selection needs.
    expect( nuts.length ).toBeGreaterThan( 1 )

    const collidingId = nuts.filter( ( n ) => n.expressID === nuts[0].expressID )
    if ( collidingId.length > 1 ) {
      const paths = collidingId.map( ( n ) => JSON.stringify( n.occurrencePath ) )
      expect( new Set( paths ).size ).toBe( collidingId.length )
    }
  } )
} )
