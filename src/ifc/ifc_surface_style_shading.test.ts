// bldrs-ai/test-models-private#61 — a model whose surface styles are all plain
// IFCSURFACESTYLESHADING (no IfcSurfaceStyleRendering) rendered colourless in
// Share while its GLB export came out correctly coloured, and the parts it
// instanced through IfcMappedItem got no material at all.
//
// Three defects, all covered here against
// data/surface_style_shading_mapped.ifc (see that file for the wiring and why
// each product is shaped the way it is):
//
//   A. extractSurfaceStyle's shading branch wrote only CanonicalMaterial
//      .baseColor. The GLB/native path reads baseColor, but the web-ifc compat
//      layer builds PlacedGeometry.color from .legacyColor — which stayed at
//      its 0.8-grey default, so Share auto-coloured the whole model.
//
//   B. extractMappedItem called extractStyledItem with no representation item
//      for styles arriving via IfcRelAssociatesMaterial ->
//      IfcMaterialDefinitionRepresentation, whose IfcStyledItem has `Item = $`.
//      Neither binding branch fired, so mapped geometry stayed material-less.
//      The repair has to be per-product: a representation map is shared, so
//      binding the style to the mapped body would trade "no colour" for "the
//      wrong product's colour".
//
//   C. The first cut of B consulted the material association before looking
//      for a styled item on the IfcMappedItem or its ancestors, so for a
//      product carrying both, the material-derived style won and the explicit
//      item style was dropped — backwards from IFC's precedence, and a
//      behaviour change for such models (codex finding on
//      bldrs-ai/conway#684).
//
// Colour components and the wasm-init timeout are literals throughout, the
// same trade the other fixture-driven suites here make.
/* eslint-disable no-magic-numbers */
import fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { ConwayGeometry } from '../../dependencies/conway-geom'
import { CanonicalMaterial, ColorRGBA } from '../core/canonical_material'
import { ExtractResult } from '../core/shared_constants'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'


const FIXTURE = 'data/surface_style_shading_mapped.ifc'

/* The authored colours, as exact binary fractions so no epsilon is needed.
 * Shading carries no diffuse factor and no transparency here, so the
 * premultiplied surface colour is the raw IfcColourRgb with alpha 1. */
const RED: ColorRGBA = [0.75, 0.25, 0.125, 1]
const BLUE: ColorRGBA = [0.125, 0.375, 0.875, 1]
const GREEN: ColorRGBA = [0.625, 0.5, 0.25, 1]

/* #4000's two competing colours: TEAL is on its IfcMappedItem, PURPLE comes
 * from its material association. IFC says TEAL wins. */
const TEAL: ColorRGBA = [0.375, 0.75, 0.625, 1]
const PURPLE: ColorRGBA = [0.875, 0.125, 0.5, 1]

/* What an unwritten CanonicalMaterial field holds — the value every placement
 * of this model's shape used to report to the compat layer. */
const UNWRITTEN_DEFAULT: ColorRGBA = [0.8, 0.8, 0.8, 1]

/** Express IDs of the four products, and of the body #1000/#2000/#4000 share. */
const MAPPED_RED_EXPRESS_ID = 1000
const MAPPED_BLUE_EXPRESS_ID = 2000
const DIRECT_GREEN_EXPRESS_ID = 3000
const MAPPED_ITEM_STYLED_EXPRESS_ID = 4000
const SHARED_SOLID_EXPRESS_ID = 311

let extraction: IfcGeometryExtraction
let extractResult: ExtractResult

/** Owning product express ID -> the material and geometry its placement resolved. */
const placements =
  new Map<number, { material: CanonicalMaterial | undefined, geometryLocalID: number }>()


beforeAll( async () => {

  const parser = IfcStepParser.Instance
  const input = new ParsingBuffer( fs.readFileSync( FIXTURE ) )

  expect( parser.parseHeader( input )[ 1 ] ).toBe( ParseResult.COMPLETE )

  const conwayGeometry = new ConwayGeometry()

  expect( await conwayGeometry.initialize() ).toBe( true )

  const [ , model ] = parser.parseDataToModel( input )

  expect( model ).toBeDefined()

  extraction = new IfcGeometryExtraction( conwayGeometry, model! )
  extractResult = extraction.extractIFCGeometryData()[ 0 ]

  for ( const [ , , geometry, material, entity ] of extraction.scene.walk() ) {

    if ( entity?.expressID === void 0 ) {
      continue
    }

    placements.set(
        entity.expressID,
        { material, geometryLocalID: geometry.localID } )
  }
}, 120000 )


describe( 'shading-only surface styles', () => {

  test( 'the fixture extracts and places all four products', () => {

    expect( extractResult ).toBe( ExtractResult.COMPLETE )
    expect( [ ...placements.keys() ].sort( ( a, b ) => a - b ) ).toEqual( [
      MAPPED_RED_EXPRESS_ID,
      MAPPED_BLUE_EXPRESS_ID,
      DIRECT_GREEN_EXPRESS_ID,
      MAPPED_ITEM_STYLED_EXPRESS_ID,
    ] )
  } )

  test( 'a directly styled shading-only item carries its colour in BOTH slots', () => {

    const material = placements.get( DIRECT_GREEN_EXPRESS_ID )?.material

    expect( material ).toBeDefined()

    // baseColor was already correct before the fix; legacyColor is the half the
    // compat layer reads, and the half that was left at the default.
    expect( material!.baseColor ).toEqual( GREEN )
    expect( material!.legacyColor ).toEqual( GREEN )
  } )

  test( 'no extracted material is left holding the unwritten default', () => {

    const defaulted = [ ...extraction.materials.materials() ].filter( ( material ) =>
      material.legacyColor.every( ( value, index ) => value === UNWRITTEN_DEFAULT[ index ] ) )

    // Guard the guard: this only means anything if styles were extracted at all.
    expect( extraction.materials.size ).toBe( 4 )
    expect( defaulted ).toEqual( [] )
  } )
} )


describe( 'mapped geometry styled only through IfcRelAssociatesMaterial', () => {

  test( 'both instances of the shared body resolve a material', () => {

    expect( placements.get( MAPPED_RED_EXPRESS_ID )?.material ).toBeDefined()
    expect( placements.get( MAPPED_BLUE_EXPRESS_ID )?.material ).toBeDefined()
  } )

  test( 'each instance resolves its OWN product material, not the other\'s', () => {

    const red = placements.get( MAPPED_RED_EXPRESS_ID )!
    const blue = placements.get( MAPPED_BLUE_EXPRESS_ID )!

    // The distinctness below is only evidence of per-product resolution if the
    // two placements really do share one body; if extraction ever stopped
    // instancing the map, they would differ for an uninteresting reason.
    expect( red.geometryLocalID ).toBe( blue.geometryLocalID )
    expect( extraction.model.getElementByLocalID( red.geometryLocalID )?.expressID )
        .toBe( SHARED_SOLID_EXPRESS_ID )

    expect( red.material!.baseColor ).toEqual( RED )
    expect( red.material!.legacyColor ).toEqual( RED )
    expect( blue.material!.baseColor ).toEqual( BLUE )
    expect( blue.material!.legacyColor ).toEqual( BLUE )
  } )

  test( 'the per-product style is keyed on the product, never on the shared body', () => {

    const sharedBodyLocalID = placements.get( MAPPED_RED_EXPRESS_ID )!.geometryLocalID
    const redLocalID = extraction.model.getElementByExpressID( MAPPED_RED_EXPRESS_ID )!.localID
    const blueLocalID = extraction.model.getElementByExpressID( MAPPED_BLUE_EXPRESS_ID )!.localID

    // The override key the scene node carries. Both products must have one, and
    // they must resolve to different styles.
    const redStyle = extraction.materials.getMaterialByGeometryID( redLocalID )
    const blueStyle = extraction.materials.getMaterialByGeometryID( blueLocalID )

    expect( redStyle?.[ 0 ].legacyColor ).toEqual( RED )
    expect( blueStyle?.[ 0 ].legacyColor ).toEqual( BLUE )

    // And the body itself stays unbound: binding a per-product material there
    // is the tempting shortcut that would silently paint every other instance
    // of the same mapped geometry with whichever product was extracted last.
    expect( extraction.materials.getMaterialByGeometryID( sharedBodyLocalID ) )
        .toBeUndefined()
  } )
} )


describe( 'style precedence on a mapped item', () => {

  test( 'an IfcStyledItem on the mapped item beats the product material', () => {

    const styled = placements.get( MAPPED_ITEM_STYLED_EXPRESS_ID )

    expect( styled?.material ).toBeDefined()

    // Both colours are reachable for #4000 — the teal is hung on its
    // IfcMappedItem, the purple on the IfcMaterial associated to the product —
    // so this only passes if precedence is actually being applied, not because
    // the purple was never found. Checking the negative too, since a bug that
    // drops BOTH styles would leave a defined-but-default material.
    expect( styled!.material!.legacyColor ).toEqual( TEAL )
    expect( styled!.material!.legacyColor ).not.toEqual( PURPLE )
    expect( styled!.material!.baseColor ).toEqual( TEAL )

    // It instances the same shared body as the other two mapped products, so
    // this is per-instance precedence, not a private copy of the geometry.
    expect( styled!.geometryLocalID )
        .toBe( placements.get( MAPPED_RED_EXPRESS_ID )!.geometryLocalID )
  } )

  test( 'the losing product material is never extracted for that instance', () => {

    // The material association is only consulted when no item style was found,
    // so #4000's purple never becomes a CanonicalMaterial. That is the
    // observable difference between "material style lost the tie-break" and
    // "material style was applied and then overwritten".
    const extracted = [ ...extraction.materials.materials() ].map(
        ( material ) => material.legacyColor.join( ',' ) )

    expect( extracted ).toContain( TEAL.join( ',' ) )
    expect( extracted ).not.toContain( PURPLE.join( ',' ) )
  } )
} )
