import fs from 'fs'
import { describe, expect, test } from '@jest/globals'
import AP214StepParser from '../../AP214E3_2010/ap214_step_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { ParseResult } from '../../step/parsing/step_parser'
import { AP214Properties } from './ap214_properties'
import { IfcApiProxyAP214 } from './ifc_api_proxy_ap214'


const parser = AP214StepParser.Instance

/** web-ifc tape type code for an entity reference (a `HasProperties` handle). */
const WEB_IFC_REF_TYPE = 5

/** Express id of the single CTC part (`product_definition`) in the fixture. */
const CTC_PRODUCT_DEFINITION_EXPRESS_ID = 4368


/**
 * Parse a hermetic STEP fixture and wrap it in an {@link AP214Properties} over a
 * minimal proxy stub exposing only `StepModel` (all the spatial/property methods
 * read just that).
 *
 * @param {string} path Fixture path.
 * @return {AP214Properties} The compat surface over the parsed model.
 */
function compatSurfaceFor( path: string ): AP214Properties {

  const buffer = fs.readFileSync( path )
  const bufferInput = new ParsingBuffer( buffer )

  expect( parser.parseHeader( bufferInput )[1] ).toBe( ParseResult.COMPLETE )

  const [ result, model ] = parser.parseDataToModel( bufferInput )

  expect( model ).not.toBe( void 0 )
  expect(
      result === ParseResult.COMPLETE || result === ParseResult.INCOMPLETE ).toBe( true )

  return new AP214Properties( { StepModel: model! } as unknown as IfcApiProxyAP214 )
}


describe( 'compat/web-ifc/AP214Properties', () => {

  test( 'getSpatialStructure emits Name as a web-ifc {value} handle', async () => {

    const root = await compatSurfaceFor( 'data/as1-assembly.step' ).getSpatialStructure() as any

    // Name must be { value: 'as1' } — a plain string would make Share's
    // reifyName fall back to the type label, dropping the name.
    expect( typeof root.Name ).toBe( 'object' )
    expect( root.Name.value ).toBe( 'as1' )
    expect( root.children.length ).toBeGreaterThan( 0 )

    for ( const child of root.children ) {
      expect( child.Name.value.length ).toBeGreaterThan( 0 )
      expect( Array.isArray( child.occurrencePath ) ).toBe( true )
    }
  } )

  test( 'getSpatialStructure surfaces the ephemeral solid layer on opt-in only', async () => {

    const surface = compatSurfaceFor( 'data/ap214-multibody-part.step' )

    const plainRoot = await surface.getSpatialStructure() as any
    const collectTypes = ( node: any, into: Set<string> ): Set<string> => {
      into.add( node.type )
      node.children.forEach( ( child: any ) => collectTypes( child, into ) )
      return into
    }

    expect( collectTypes( plainRoot, new Set() ).has( 'solid' ) ).toBe( false )

    const root = await surface.getSpatialStructure( void 0, { includeSolids: true } ) as any
    const widget = root.children.find( ( node: any ) => node.Name.value === 'widget' )
    const solids = widget.children.filter( ( node: any ) => node.type === 'solid' )

    expect( solids.length ).toBeGreaterThan( 0 )

    for ( const solid of solids ) {
      expect( solid.ephemeral ).toBe( true )
      expect( solid.Name.type ).toBe( 1 )
      expect( solid.occurrencePath ).toEqual( widget.occurrencePath )
    }

    // A solid id resolves to its own identity row, like any tree node.
    const item = await surface.getItemProperties( solids[0].expressID ) as any

    expect( item.Name.value ).toBe( solids[0].Name.value )
  } )

  test( 'getItemProperties returns a {value}-wrapped identity for a node', async () => {

    const surface = compatSurfaceFor( 'data/as1-assembly.step' )
    const root = await surface.getSpatialStructure() as any

    const item = await surface.getItemProperties( root.expressID ) as any

    expect( item.expressID ).toBe( root.expressID )
    expect( item.Name.value ).toBe( 'as1' )
  } )

  test( 'value handles carry a deref-compatible web-ifc type (string => 1)', async () => {

    // Regression: the Properties panel runs a node's identity row through
    // @bldrs-ai/ifclib `deref`, which only unwraps a handle whose `type` passes
    // its `isTypeValue` guard (type AND value both present) and switches on type
    // (1 => decodeIFCString). A bare `{ value }` (no type) fell through, so deref
    // returned the wrapping object and React threw "Objects are not valid as a
    // React child (found: object with keys {value})" on every STEP element.
    const surface = compatSurfaceFor( 'data/as1-assembly.step' )
    const root = await surface.getSpatialStructure() as any
    const item = await surface.getItemProperties( root.expressID ) as any

    // Both the spatial-node label and the identity row must be typed handles.
    expect( root.Name.type ).toBe( 1 )
    expect( item.Name.type ).toBe( 1 )
  } )

  test( 'resolved property single carries typed Name and NominalValue handles', async () => {

    const surface = compatSurfaceFor( 'data/nist-ctc-properties.step' )
    const psets = await surface.getPropertySets( CTC_PRODUCT_DEFINITION_EXPRESS_ID )
    const ref = psets[0].HasProperties[0]
    const prop = await surface.getItemProperties( ref.value ) as any

    // The property name is always a string => type 1. The value's type depends
    // on whether it is descriptive or numeric, but it must be a deref code (1 or
    // 4) and non-null so deref's isTypeValue guard passes and unwraps it rather
    // than rendering the raw object.
    expect( prop.Name.type ).toBe( 1 )
    expect( [ 1, 4 ] ).toContain( prop.NominalValue.type )
    expect( prop.NominalValue.value ).not.toBe( null )
  } )

  test( 'getPropertySets emits IfcPropertySet-shaped sets with reference HasProperties', async () => {

    const surface = compatSurfaceFor( 'data/nist-ctc-properties.step' )
    const psets = await surface.getPropertySets( CTC_PRODUCT_DEFINITION_EXPRESS_ID )

    expect( psets.length ).toBeGreaterThan( 0 )

    for ( const pset of psets ) {
      // Set name is a {value} handle; HasProperties are reference handles
      // ({type: 5, value: id}) so Share's unpackHelper can dereference them.
      expect( pset.Name.value.length ).toBeGreaterThan( 0 )
      expect( pset.HasProperties.length ).toBeGreaterThan( 0 )
      for ( const ref of pset.HasProperties ) {
        expect( ref.type ).toBe( WEB_IFC_REF_TYPE )
        expect( typeof ref.value ).toBe( 'number' )
      }
    }
  } )

  test( 'a HasProperties reference resolves through getItemProperties to key/value', async () => {

    const surface = compatSurfaceFor( 'data/nist-ctc-properties.step' )
    const psets = await surface.getPropertySets( CTC_PRODUCT_DEFINITION_EXPRESS_ID )

    const resolved = new Map<string, string | number>()

    for ( const pset of psets ) {
      for ( const ref of pset.HasProperties ) {
        const prop = await surface.getItemProperties( ref.value ) as any
        expect( prop.expressID ).toBe( ref.value )
        resolved.set( prop.Name.value, prop.NominalValue.value )
      }
    }

    // The NIST attribute key/values, surfaced through the reference round-trip.
    expect( resolved.get( 'Modeled By' ) ).toBe( 'Engineer' )
    expect( resolved.get( 'CAGE Code' ) ).toBe( '64JW1' )
    expect( resolved.get( 'Company' ) ).toBe( 'ACME' )
  } )

  test( 'getPropertySets is empty for an element with no properties', async () => {

    const surface = compatSurfaceFor( 'data/as1-assembly.step' )
    const root = await surface.getSpatialStructure() as any

    expect( await surface.getPropertySets( root.expressID ) ).toEqual( [] )
  } )
} )


describe( 'getItemProperties arbitrary-entity fallback (anonymous geometry)', () => {

  test( 'resolves a non-tree solid id to its STEP type and body name', async () => {

    // Body1 (#431) is a solid inside the widget product's representation —
    // never a tree node unless the ephemeral solid layer is requested, so it
    // exercises the express-id-index fallback a picked anonymous piece takes.
    const surface = compatSurfaceFor( 'data/ap214-multibody-part.step' )
    const solidExpressId = 431

    const item: any = await surface.getItemProperties( solidExpressId )

    expect( item.expressID ).toBe( solidExpressId )
    expect( item.type ).toBe( 'MANIFOLD_SOLID_BREP' )
    expect( item.Name.value ).toBe( 'Body1' )
  } )

  test( 'resolves an anonymous face id to its STEP type (label seed for #387)', async () => {

    // NEMA face #29 has the placeholder name 'NONE' in-file; the type name is
    // what lets a consumer synthesize "Face #29" for a picked face with no
    // tree identity.
    const surface = compatSurfaceFor( 'data/nema-23-76mm.step' )
    const faceExpressId = 29

    const item: any = await surface.getItemProperties( faceExpressId )

    expect( item.expressID ).toBe( faceExpressId )
    expect( item.type ).toBe( 'ADVANCED_FACE' )
  } )

  test( 'an unknown id still returns the bare identity shape', async () => {

    const surface = compatSurfaceFor( 'data/ap214-multibody-part.step' )

    const item: any = await surface.getItemProperties( 999999 )

    expect( item.expressID ).toBe( 999999 )
    expect( item.type ).toBe( void 0 )
    expect( item.Name.value ).toBe( '' )
  } )
} )
