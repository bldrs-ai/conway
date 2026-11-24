/* eslint-disable no-magic-numbers */
// The IFC4-compatible IFC4X3 route (src/ifc/ifc4x3_ifc4_compat.ts) on the
// web-ifc compat surface Share uses (USE_WEBIFC_SHIM). Every IFC open path
// must render an eligible 4X3 file: the classic and cooperative opens, the
// streamed columnar open, and the store-backed open, deferred and not.
// And the properties panel's reads (GetLine / properties.getItemProperties,
// i.e. web-ifc's positional FromTape) must never put a translated record's
// masked tail into an IFC4 attribute. The refusal of INELIGIBLE files is
// ifc4x3_schema_gate.test.ts.
import fs from 'fs'
import { beforeAll, describe, expect, test } from '@jest/globals'
import { IfcAPI, Loadersettings } from './ifc_api'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import type { PreviewMeshPayload } from './streamed_preview_channel'
import * as ifc2x4 from './ifc2x4'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// 1 IFCROAD (#30) aggregating 1 IFCFACILITYPART (#37), which contains two
// IFCPAVEMENTs (#100, #200) and one IFCKERB (#300), each with a faceted-brep
// body. The shape of KIT-Simple-Road-Test-Web-IFC4x3_RC2.ifc in miniature:
// the same IFC4X3-only keywords and IFC4-shaped geometry, styling through
// IFCPRESENTATIONSTYLEASSIGNMENT, and properties through
// IFCPROPERTYSINGLEVALUE.
const FIXTURE = 'data/ifc4x3_road_geometry.ifc'
const PRODUCTS = [ 100, 200, 300 ]

let api: IfcAPI
let bytes: Uint8Array

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
  bytes = new Uint8Array( fs.readFileSync( FIXTURE ) )
}, 120000 )

/**
 * The express IDs of every product StreamAllMeshes yields.
 *
 * @param modelID The model.
 * @return {number[]} Sorted, distinct.
 */
function meshedProducts( modelID: number ): number[] {

  const products = new Set< number >()

  api.StreamAllMeshes( modelID, ( mesh ) => {
    products.add( mesh.expressID )
  } )

  return [ ...products ].sort( ( a, b ) => a - b )
}

/**
 * Drain a deferred model's demand pump.
 *
 * @param modelID The model.
 * @return {Promise<number[]>} Sorted, distinct product express IDs.
 */
async function pumpedProducts( modelID: number ): Promise< number[] > {

  const products = new Set< number >()

  for ( ; ; ) {

    const { extracted, remaining } = await api.ExtractGeometryBatchAsync(
        modelID, 8, ( mesh ) => {
          products.add( mesh.expressID )
        } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  return [ ...products ].sort( ( a, b ) => a - b )
}


describe( 'IfcAPI renders an eligible IFC4X3 file through every IFC open path', () => {

  test( 'OpenModel', () => {
    const modelID = api.OpenModel( bytes, SETTINGS )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )
    expect( meshedProducts( modelID ) ).toEqual( PRODUCTS )
    api.CloseModel( modelID )
  } )

  test( 'OpenModelAsync', async () => {
    const modelID = await api.OpenModelAsync( bytes, SETTINGS )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )
    expect( meshedProducts( modelID ) ).toEqual( PRODUCTS )
    api.CloseModel( modelID )
  } )

  test( 'OpenModelStreamed', async () => {
    const modelID = await api.OpenModelStreamed( bytes, SETTINGS )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )
    expect( meshedProducts( modelID ) ).toEqual( PRODUCTS )
    api.CloseModel( modelID )
  } )

  test( 'OpenModelStream (store-backed)', async () => {
    const modelID = await api.OpenModelStream( new InMemoryStepByteStore( bytes ), SETTINGS )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )
    expect( meshedProducts( modelID ) ).toEqual( PRODUCTS )
    api.CloseModel( modelID )
  } )

  // Deferred opens with ON_PREVIEW_MESH run the spatial-structure imposter
  // walk after the parse, which reads each IfcBuildingStorey's Elevation
  // with a direct `extractNumber( 9, … )`. For the translated facility part
  // that field is masked, and must read as absent rather than throw out of
  // the open. The imposters are the only preview IFC4X3 files get: they are
  // emitted after eligibility is decided.
  for ( const [ label, open ] of [
    [ 'OpenModelStreamed + DEFER_GEOMETRY', ( settings: Loadersettings ) =>
      api.OpenModelStreamed( bytes, settings ) ],
    [ 'OpenModelStream + DEFER_GEOMETRY', ( settings: Loadersettings ) =>
      api.OpenModelStream( new InMemoryStepByteStore( bytes ), settings ) ],
  ] as const ) {

    test( `${label}: pumps all products and plates the facility part`, async () => {

      const payloads: PreviewMeshPayload[] = []
      const modelID = await open( {
        ...SETTINGS,
        DEFER_GEOMETRY: true,
        ON_PREVIEW_MESH: ( mesh: PreviewMeshPayload ) => {
          payloads.push( mesh )
        },
      } )

      expect( modelID ).toBeGreaterThanOrEqual( 0 )
      expect( await pumpedProducts( modelID ) ).toEqual( PRODUCTS )
      expect( payloads.filter( ( p ) => p.aabb !== void 0 ).map( ( p ) => p.expressID ) )
          .toContain( 37 )
      api.CloseModel( modelID )
    } )
  }
} )


describe( 'IfcAPI property reads of translated IFC4X3 records', () => {

  let modelID: number

  beforeAll( () => {
    modelID = api.OpenModel( bytes, SETTINGS )
  } )

  // web-ifc's FromTape reads raw arguments by position. The facility
  // part's raw argument 9 is `IFCROADPARTTYPEENUM(.ROADSEGMENT.)`; unmasked,
  // it would be handed to IfcBuildingStorey as `Elevation`.
  test( 'raw arguments are the decoded prefix, padded with null to the IFC4 layout', () => {

    const part = api.GetRawLineData( modelID, 37 )

    expect( part.type ).toBe( ifc2x4.IFCBUILDINGSTOREY )
    expect( part.arguments ).toHaveLength( 10 )
    expect( part.arguments[ 9 ] ).toBeNull()
    expect( part.arguments.slice( 0, 9 ).map( ( a: any ) => a?.value ?? a ) )
        .toEqual( [ 'R000000000000000000037', null, 'Segment', null, null, 38, null, null,
          'ELEMENT' ] )

    const road = api.GetRawLineData( modelID, 30 )

    expect( road.type ).toBe( ifc2x4.IFCBUILDING )
    expect( road.arguments ).toHaveLength( 12 )
    expect( road.arguments.slice( 9 ) ).toEqual( [ null, null, null ] )

    for ( const expressID of PRODUCTS ) {
      const element = api.GetRawLineData( modelID, expressID )

      expect( element.type ).toBe( ifc2x4.IFCBUILDINGELEMENTPROXY )
      expect( element.arguments ).toHaveLength( 9 )
      expect( element.arguments[ 8 ] ).toBeNull()
    }
  } )

  test( 'GetLine and getItemProperties read every attribute, with the ' +
      'masked ones null', async () => {

    for ( const read of [
      ( id: number ) => Promise.resolve( api.GetLine( modelID, id ) ),
      ( id: number ) => api.properties.getItemProperties( modelID, id ),
    ] ) {

      const part: any = await read( 37 )

      expect( part.constructor.name ).toBe( 'IfcBuildingStorey' )
      expect( part.Name.value ).toBe( 'Segment' )
      expect( part.CompositionType.value ).toBe( 'ELEMENT' )
      expect( part.Elevation ).toBeNull()

      const road: any = await read( 30 )

      expect( road.Name.value ).toBe( 'Road' )
      expect( [ road.ElevationOfRefHeight, road.ElevationOfTerrain, road.BuildingAddress ] )
          .toEqual( [ null, null, null ] )

      for ( const expressID of PRODUCTS ) {
        const element: any = await read( expressID )

        expect( element.constructor.name ).toBe( 'IfcBuildingElementProxy' )
        expect( element.Representation.value ).toBe( expressID + 4 )
        expect( element.PredefinedType ).toBeNull()
      }
    }
  } )

  test( 'property sets resolve through IFCPROPERTYSINGLEVALUE', async () => {

    const psets: any = await api.properties.getPropertySets( modelID, 100, true )

    expect( psets.map( ( pset: any ) => pset.Name.value ) ).toEqual( [ 'Pset_RoadFixture' ] )
    expect( psets[ 0 ].HasProperties[ 0 ].NominalValue.value ).toBe( 'Asphalt' )
  } )

  test( 'the spatial tree nests the translated road, part and elements', async () => {

    const tree: any = await api.properties.getSpatialStructure( modelID )
    const site = tree.children[ 0 ]
    const road = site.children[ 0 ]
    const part = road.children[ 0 ]

    expect( [ site.expressID, road.expressID, part.expressID ] ).toEqual( [ 24, 30, 37 ] )
    expect( part.children.map( ( child: any ) => child.expressID ).sort() )
        .toEqual( PRODUCTS )
  } )
} )
