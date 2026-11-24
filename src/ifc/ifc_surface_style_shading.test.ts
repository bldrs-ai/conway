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
//   D. A material associated to the TYPE object (IfcDoorType, and here
//      IfcBuildingElementProxyType) instead of the occurrence never reached
//      the occurrence at all: relMaterialsMap is filtered to IfcProduct, and
//      a type object is an IfcTypeObject. 272 of the Renga model's 5,351
//      placements — every window, door, light fixture and railing — resolved
//      no material because of it. The occurrence must inherit its type's
//      material, and its OWN association must still override it.
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

/* ORANGE reaches #5000 only through its type object. #6000's two competing
 * colours: CYAN is its own association, MAGENTA its type's. CYAN wins. */
const ORANGE: ColorRGBA = [0.875, 0.5, 0.125, 1]
const CYAN: ColorRGBA = [0.125, 0.75, 0.875, 1]
const MAGENTA: ColorRGBA = [0.75, 0.125, 0.625, 1]

/* What an unwritten CanonicalMaterial field holds — the value every placement
 * of this model's shape used to report to the compat layer. */
const UNWRITTEN_DEFAULT: ColorRGBA = [0.8, 0.8, 0.8, 1]

/** Express IDs of the six products, and of the body all but #3000 share. */
const MAPPED_RED_EXPRESS_ID = 1000
const MAPPED_BLUE_EXPRESS_ID = 2000
const DIRECT_GREEN_EXPRESS_ID = 3000
const MAPPED_ITEM_STYLED_EXPRESS_ID = 4000
const TYPE_INHERITED_EXPRESS_ID = 5000
const TYPE_OVERRIDDEN_EXPRESS_ID = 6000
const SHARED_SOLID_EXPRESS_ID = 311

/** #5000's type object and the IfcMaterial that type is associated with. */
const PROXY_TYPE_ORANGE_EXPRESS_ID = 5100
const MATERIAL_ORANGE_EXPRESS_ID = 700

/** Distinct colours the fixture expects to reach a placement. */
const EXTRACTED_MATERIAL_COUNT = 6

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

  test( 'the fixture extracts and places all six products', () => {

    expect( extractResult ).toBe( ExtractResult.COMPLETE )
    expect( [ ...placements.keys() ].sort( ( a, b ) => a - b ) ).toEqual( [
      MAPPED_RED_EXPRESS_ID,
      MAPPED_BLUE_EXPRESS_ID,
      DIRECT_GREEN_EXPRESS_ID,
      MAPPED_ITEM_STYLED_EXPRESS_ID,
      TYPE_INHERITED_EXPRESS_ID,
      TYPE_OVERRIDDEN_EXPRESS_ID,
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
    expect( extraction.materials.size ).toBe( EXTRACTED_MATERIAL_COUNT )
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


describe( 'material inherited from the type object', () => {

  test( 'a product whose material is only on its type still resolves one', () => {

    const inherited = placements.get( TYPE_INHERITED_EXPRESS_ID )

    // #5000 has no styled item and no association of its own: the ONLY route
    // to a colour is IfcRelDefinesByType -> IfcBuildingElementProxyType ->
    // IfcRelAssociatesMaterial. Before the fix this was undefined.
    expect( inherited?.material ).toBeDefined()
    expect( inherited!.material!.legacyColor ).toEqual( ORANGE )
    expect( inherited!.material!.baseColor ).toEqual( ORANGE )
  } )

  test( 'inheritance goes through the type, not "any unclaimed material"', () => {

    // The type's material has to land on the product's own local ID in
    // relMaterialsMap, the same slot a direct association fills — that is what
    // the mapped-item path reads per product. Asserting the map entry as well
    // as the colour rules out a placement that came out orange because some
    // fallback painted every unresolved product with the last material seen.
    const inheritedLocalID =
      extraction.model.getElementByExpressID( TYPE_INHERITED_EXPRESS_ID )!.localID
    const typeLocalID =
      extraction.model.getElementByExpressID( PROXY_TYPE_ORANGE_EXPRESS_ID )!.localID
    const orangeMaterialLocalID =
      extraction.model.getElementByExpressID( MATERIAL_ORANGE_EXPRESS_ID )!.localID

    expect( extraction.materials.relMaterialsMap.get( inheritedLocalID ) )
        .toBe( orangeMaterialLocalID )

    // And the type object itself is never given an entry: it has no geometry,
    // so an entry there would only be dead weight (and would make the
    // occurrence's "already claimed" check ambiguous if local IDs collided
    // with a product's).
    expect( extraction.materials.relMaterialsMap.has( typeLocalID ) ).toBe( false )
  } )

  test( 'an occurrence association overrides the type\'s', () => {

    const overridden = placements.get( TYPE_OVERRIDDEN_EXPRESS_ID )

    // #6000 can reach both colours — cyan off its own IfcRelAssociatesMaterial,
    // magenta off its type's — so this only passes if precedence is applied,
    // not because the magenta was unreachable. The fixture orders the two
    // associations occurrence-first/type-last precisely so an implementation
    // that let the type overwrite as it swept fails here.
    expect( overridden?.material ).toBeDefined()
    expect( overridden!.material!.legacyColor ).toEqual( CYAN )
    expect( overridden!.material!.legacyColor ).not.toEqual( MAGENTA )
    expect( overridden!.material!.baseColor ).toEqual( CYAN )
  } )

  test( 'the overridden type material is never extracted', () => {

    // Same reasoning as the mapped-item precedence case: the type's material
    // is never consulted for #6000, so magenta never becomes a
    // CanonicalMaterial. Distinguishes "type material lost the tie-break" from
    // "type material was applied and then overwritten".
    const extracted = [ ...extraction.materials.materials() ].map(
        ( material ) => material.legacyColor.join( ',' ) )

    expect( extracted ).toContain( CYAN.join( ',' ) )
    expect( extracted ).toContain( ORANGE.join( ',' ) )
    expect( extracted ).not.toContain( MAGENTA.join( ',' ) )
  } )

  test( 'both type-material products instance the shared body', () => {

    // Neither product has geometry of its own, so a colour here is a colour on
    // one instance of the map — the same per-instance override the red/blue
    // pair exercises, reached through a type rather than a direct association.
    const sharedBodyLocalID = placements.get( MAPPED_RED_EXPRESS_ID )!.geometryLocalID

    expect( placements.get( TYPE_INHERITED_EXPRESS_ID )!.geometryLocalID )
        .toBe( sharedBodyLocalID )
    expect( placements.get( TYPE_OVERRIDDEN_EXPRESS_ID )!.geometryLocalID )
        .toBe( sharedBodyLocalID )
  } )
} )
