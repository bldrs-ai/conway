// test-models#62: the AP242 tessellated part has to arrive through the same
// web-ifc compat surface Share drives — OpenModel -> StreamAllMeshes ->
// getSpatialStructure — not just through the extraction API. The NIST file this
// supports (nist_ftc_08_asme1_ap242-e1-tg.stp) streamed zero meshes here before
// the shadow schema landed.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { FlatMesh, IfcAPI } from './ifc_api'


const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

const FIXTURE = 'data/ap242-tessellated-solid.step'

/** Express id of the fixture's product_definition_shape. */
const PART_SHAPE_EXPRESS_ID = 213

/** Express id of the fixture's TESSELLATED_SOLID. */
const TESSELLATED_SOLID_EXPRESS_ID = 530

let api: IfcAPI

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000 )


describe( 'AP242 tessellated solid through the web-ifc compat shim', () => {

  test( 'streams one placed mesh, owned by the part shape', async () => {

    const modelID = api.OpenModel( new Uint8Array( fs.readFileSync( FIXTURE ) ), SETTINGS )

    const streamed: { expressID: number, geometryExpressID: number }[] = []

    api.StreamAllMeshes( modelID, ( mesh: FlatMesh ) => {
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {
        streamed.push( {
          expressID: mesh.expressID,
          geometryExpressID: mesh.geometries.get( where ).geometryExpressID,
        } )
      }
    } )

    // Exactly one: the 'shape for associated data' decoy holds the same solid
    // and would place it a second time if the TSR gate were missing.
    expect( streamed ).toEqual( [ {
      expressID: PART_SHAPE_EXPRESS_ID,
      geometryExpressID: TESSELLATED_SOLID_EXPRESS_ID,
    } ] )

    // The spatial structure still builds, and names the part — the property
    // walk has to survive the coordinates lists and faces now being typeable.
    const root = await api.properties.getSpatialStructure( modelID, true ) as
      { type: string, Name: { value: string } }

    expect( root.type ).toBe( 'product' )
    expect( root.Name.value ).toBe( 'tessellated part' )

    api.CloseModel( modelID )
  }, 120000 )
} )
