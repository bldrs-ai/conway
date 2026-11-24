/* eslint-disable no-magic-numbers */
// The IFC4-compatible IFC4X3 route (ifc4x3_ifc4_compat.ts), on the native
// side: which files are eligible, that translated records are masked on
// every typed read (the storey `Elevation` hazard in particular), and that
// an eligible file renders through ConwayModelLoader. The web-ifc compat
// surface has its own suite (compat/web-ifc/ifc4x3_compat_route.test.ts).
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import { WalkableScene } from '../core/scene'
import { ConwayModelLoader } from '../loaders/conway_model_loader'
import ParsingBuffer from '../parsing/parsing_buffer'
import { BufferByteSource } from '../step/parsing/byte_source'
import { ParseResult } from '../step/parsing/step_parser'
import StepEntityBase from '../step/step_entity_base'
import { flatLayout, parseExpressSchema } from './ifc4x3_decode_compat_derive'
import {
  buildIfc4x3CompatIndex,
  buildIfc4x3CompatIndexAsync,
  Ifc4x3CompatIndex,
  Ifc4x3IneligibleError,
} from './ifc4x3_ifc4_compat'
import { IFC4X3_TO_IFC4_TRANSLATIONS } from './ifc4x3_ifc4_translation'
import {
  IfcBuilding,
  IfcBuildingElementProxy,
  IfcBuildingStorey,
  IfcElementCompositionEnum,
} from './ifc4_gen'
import IfcStepModel from './ifc_step_model'
import IfcStepParser from './ifc_step_parser'


const ROAD_ENTITIES = 'data/ifc4x3_road_entities.ifc'
const ROAD_GEOMETRY = 'data/ifc4x3_road_geometry.ifc'
const INELIGIBLE = 'data/ifc4x3_road_entities_ineligible.ifc'

// The builder's floor (MIN_WINDOW in streaming_index_builder.ts); small
// enough that a record over half of it forces a grow-and-restart.
const SMALL_POOL = 4096

const IFC4_SCHEMA = parseExpressSchema( fs.readFileSync( 'scripts/schemas/IFC4.exp', 'utf8' ) )


/**
 * A minimal IFC4X3_RC2 file around some DATA records.
 *
 * @param data DATA-section records, one per line.
 * @return {Uint8Array} The file's bytes.
 */
function ifc4x3( data: string ): Uint8Array {

  return new TextEncoder().encode(
      'ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION((\'\'),\'2;1\');\n' +
      'FILE_NAME(\'t.ifc\',\'\',(\'\'),(\'\'),\'\',\'\',\'\');\n' +
      'FILE_SCHEMA((\'IFC4X3_RC2\'));\nENDSEC;\nDATA;\n' + data +
      'ENDSEC;\nEND-ISO-10303-21;\n' )
}

/**
 * Run the private compat build.
 *
 * @param bytes The file.
 * @param pool Parse window.
 * @return {Ifc4x3CompatIndex} The index.
 */
function compat( bytes: Uint8Array, pool: number = 1024 * 1024 ): Ifc4x3CompatIndex {
  return buildIfc4x3CompatIndex( new BufferByteSource( bytes ), pool )
}

/**
 * The reasons a file is refused, or [] if it is eligible.
 *
 * @param bytes The file.
 * @param pool Parse window.
 * @return {string[]} Reasons.
 */
function refusal( bytes: Uint8Array, pool?: number ): readonly string[] {

  try {
    compat( bytes, pool )
    return []
  } catch ( error ) {
    if ( error instanceof Ifc4x3IneligibleError ) {
      return error.reasons
    }
    throw error
  }
}

/**
 * Open a resident model through the routed entry point every resident
 * caller uses.
 *
 * @param bytes The file.
 * @return {IfcStepModel} The model.
 */
function routedModel( bytes: Uint8Array ): IfcStepModel {

  const input = new ParsingBuffer( bytes )
  const [ header ] = IfcStepParser.Instance.parseHeader( input )
  const [ result, model ] = IfcStepParser.Instance.parseDataToModelForHeader( header, input )

  expect( result ).toBe( ParseResult.COMPLETE )

  return model!
}

const PAVEMENT = ( id: number, tail: string ) =>
  `#${id}=IFCPAVEMENT('0fixt00000000000000${id}x',$,'P',${tail});\n`


describe( 'IFC4X3 eligibility for the IFC4-compatible route', () => {

  test( 'the #713 road fixture is eligible: every translated record masked ' +
      'at its decoded prefix', () => {

    const index = compat( new Uint8Array( fs.readFileSync( ROAD_ENTITIES ) ) )

    expect( [ ...index.fieldMasks ].sort( ( a, b ) => a[ 0 ] - b[ 0 ] ) ).toEqual( [
      [ 1, 9 ], [ 2, 9 ], [ 3, 9 ],
      [ 4, 8 ], [ 5, 8 ], [ 6, 8 ],
      [ 7, 8 ], [ 8, 8 ], [ 9, 8 ], [ 10, 8 ],
    ] )
  } )

  test( 'the geometry fixture is eligible', () => {

    const index = compat( new Uint8Array( fs.readFileSync( ROAD_GEOMETRY ) ) )

    expect( new Map( index.fieldMasks ) ).toEqual(
        new Map( [ [ 30, 9 ], [ 37, 9 ], [ 100, 8 ], [ 200, 8 ], [ 300, 8 ] ] ) )
  } )

  test( 'an IFC4X3-only keyword with no translation refuses the file', () => {

    expect( refusal( new Uint8Array( fs.readFileSync( INELIGIBLE ) ) ) ).toEqual( [
      '#16: keyword IFCALIGNMENT is unknown to IFC4 and has no IFC4X3 translation',
    ] )
  } )

  test( 'a shared keyword whose ADD2 layout IFC4 cannot decode refuses the file', () => {

    expect( refusal( ifc4x3( "#1=IFCWALL('0fixt0000000000000001x',$,$,$,$,$,$,$,$);\n" ) ) )
        .toEqual( [ expect.stringMatching( /^IFCWALL does not decode identically under IFC4/ ) ] )
  } )

  test( 'an IFC4-only keyword not on the allowlist refuses the file', () => {

    expect( refusal( ifc4x3( "#1=IFCPROXY('0fixt0000000000000001x',$,$,$,$,$,$,.PRODUCT.,$);\n" ) ) )
        .toEqual( [ expect.stringMatching( /^IFCPROXY .*IFC4-only and not in/ ) ] )
  } )

  test( 'an unknown inline keyword outside any translated record refuses the file', () => {

    expect( refusal( ifc4x3(
        "#1=IFCPROPERTYSINGLEVALUE('p',$,IFCROADPARTTYPEENUM(.ROADSEGMENT.),$);\n" ) ) )
        .toEqual( [ expect.stringMatching( /^#1: inline keyword IFCROADPARTTYPEENUM/ ) ] )
  } )

  test( 'an unknown inline keyword inside a translated record but in its ' +
      'DECODED prefix refuses the file', () => {

    // Description (index 3) is decoded as IfcBuildingElementProxy's.
    expect( refusal( ifc4x3( PAVEMENT( 1, 'IFCPAVEMENTTYPEENUM(.RIGID.),$,$,$,$,$' ) ) ) )
        .toEqual( [ expect.stringMatching( /^#1: inline keyword IFCPAVEMENTTYPEENUM/ ) ] )
  } )

  test( 'attribute positions ignore commas in strings, nesting and comments', () => {

    // Index 8, masked: eligible, though each earlier attribute carries
    // commas that a naive count would add.
    expect( refusal( ifc4x3(
        "#1=IFCPAVEMENT('0fixt0000000000000001x',$,'a, (b',/* c, d */ $," +
        "$,$,$,('e','f'),IFCPAVEMENTTYPEENUM(.RIGID.));\n" ) ) ).toEqual( [] )

    // Index 3, decoded: refused, although the comment's commas would push
    // a count that does not skip comments past the prefix.
    expect( refusal( ifc4x3( PAVEMENT( 1,
        '/* ,,,,,,,,,,, */ IFCPAVEMENTTYPEENUM(.RIGID.),$,$,$,$,$' ) ) ) )
        .toEqual( [ expect.stringMatching( /^#1: inline keyword IFCPAVEMENTTYPEENUM/ ) ] )
  } )

  test( 'a translated keyword inside a complex instance refuses the file', () => {

    expect( refusal( ifc4x3(
        "#1=(IFCKERB('0fixt0000000000000001x',$,$,$,$,$,$,$,$)IFCOBJECT($,$,$,$,$));\n" ) ) )
        .toEqual( expect.arrayContaining( [ expect.stringMatching( /^#1: inline keyword IFCKERB/ ) ] ) )
  } )

  // Eligibility is a claim about the whole file. A parse that stops short
  // leaves records unexamined and the stopped record's keyword unattributed,
  // so without a complete-parse requirement this file came back eligible:
  // a one-row index, SYNTAX_ERROR, and no reason recorded (codex review of
  // bldrs-ai/conway#718, P1). Both twins share `decide`, and both are
  // asserted, since each passes its own build's result into it.
  test( 'a truncated file refuses, even when every complete record is eligible', async () => {

    const truncated = new TextEncoder().encode(
        new TextDecoder().decode( ifc4x3( PAVEMENT( 1, '$,$,$,$,$' ) ) )
            .replace( /ENDSEC;\nEND-ISO-10303-21;\n$/, '#2=IFCALIGNMENT(' ) )

    const reasons = refusal( truncated )

    expect( reasons ).toEqual( expect.arrayContaining( [
      expect.stringMatching( /^the parse ended (SYNTAX_ERROR|INCOMPLETE) before the whole file/ ),
    ] ) )

    await expect( buildIfc4x3CompatIndexAsync( new BufferByteSource( truncated ), 1024 * 1024 ) )
        .rejects.toBeInstanceOf( Ifc4x3IneligibleError )

    // The same records, complete, are eligible: what refuses is the
    // truncation, not the pavement.
    expect( refusal( ifc4x3( PAVEMENT( 1, '$,$,$,$,$' ) ) ) ).toEqual( [] )
  } )

  test( 'attribution survives a grow-and-restart of the parse window', () => {

    // A record larger than half the window forces the builder to restart
    // from byte 0 with a fresh window. Lookups made against the discarded
    // window must not be attributed to the restarted parse's records.
    const long = 'x'.repeat( SMALL_POOL )
    const bytes = ifc4x3(
        "#1=IFCFACILITYPART('0fixt0000000000000001x',$,'Part',$,$,$,$,$,.ELEMENT.," +
        'IFCROADPARTTYPEENUM(.ROADSEGMENT.),.LONGITUDINAL.);\n' +
        `#2=IFCFACILITYPART('0fixt0000000000000002x',$,'${long}',$,$,$,$,$,.ELEMENT.,` +
        'IFCROADPARTTYPEENUM(.CARRIAGEWAY.),.LATERAL.);\n' )

    const index = compat( bytes, SMALL_POOL )

    expect( index.stats.windowBytes ).toBeGreaterThan( SMALL_POOL )
    expect( new Map( index.fieldMasks ) ).toEqual( new Map( [ [ 1, 9 ], [ 2, 9 ] ] ) )
  } )

  // The window boundary cuts a record's keyword, the builder restarts with a
  // bigger window, and the attempt it abandoned must leave nothing behind.
  // At one cut the abandoned attempt resolves the truncated
  // `IFCPROPERTYSINGLEVALUE` as `IFCPROPERTY` — known to IFC4, and abstract
  // there — so a collector that kept the first attempt's state refused a
  // valid file (codex review of bldrs-ai/conway#718, P2). The comment pads
  // the DATA section without adding a record boundary, so nothing slides
  // before the cut. Swept over every cut rather than pinned to one, so the
  // test does not depend on where the parser happens to resolve a keyword.
  test( 'a keyword cut by the window edge before a restart does not refuse the file', async () => {

    const keyword = 'IFCPROPERTYSINGLEVALUE'
    const prefix = new TextDecoder().decode( ifc4x3( '' ) ).replace( /ENDSEC;\nEND-ISO-10303-21;\n$/, '' )
    const cutsThatRestarted: number[] = []

    for ( let cut = 1; cut < keyword.length; ++cut ) {

      const padding = SMALL_POOL - ( prefix.length + '/*  */\n#1='.length ) - cut
      const bytes = new TextEncoder().encode(
          `${prefix}/* ${'x'.repeat( padding )} */\n#1=${keyword}('p',$,$,$);\n` +
          'ENDSEC;\nEND-ISO-10303-21;\n' )

      const index = compat( bytes, SMALL_POOL )

      if ( index.stats.windowBytes > SMALL_POOL ) {
        cutsThatRestarted.push( cut )
      }

      await expect( buildIfc4x3CompatIndexAsync( new BufferByteSource( bytes ), SMALL_POOL ) )
          .resolves.toBeDefined()
    }

    // Guards the sweep itself: if the padding arithmetic drifted so no cut
    // forced a restart, every case above would pass without exercising it.
    expect( cutsThatRestarted.length ).toBe( keyword.length - 1 )
  } )
} )


/**
 * Every explicit IFC4 attribute name of an entity, in positional order,
 * from the vendored EXPRESS (not the reflection, which mixes in inverses).
 *
 * @param entity IFC4 entity name, upper case.
 * @return {string[]} Attribute names.
 */
function explicitAttributes( entity: string ): string[] {
  return flatLayout( IFC4_SCHEMA, entity ).map( ( attribute ) => attribute.name )
}


describe( 'translated records are masked on every typed read', () => {

  const bytes = new Uint8Array( fs.readFileSync( ROAD_GEOMETRY ) )

  // Strict mode: a field that fails to decode throws instead of reading as
  // null, so "null" below can only mean the field read as `$`.
  const strict = ( model: IfcStepModel ) => {
    model.nullOnErrors = false
    return model
  }

  test( 'every explicit attribute of every translated record reads without ' +
      'throwing, and every masked one reads as null', () => {

    const model = strict( routedModel( bytes ) )
    let masked = 0

    // Distinct targets: IFCPAVEMENT and IFCKERB share one (with one prefix).
    const byTarget = new Map( Object.entries( IFC4X3_TO_IFC4_TRANSLATIONS )
        .map( ( [ source, translation ] ) => [ translation.target, [ source, translation ] as const ] ) )

    for ( const [ source, translation ] of byTarget.values() ) {

      const names = explicitAttributes( translation.target )

      expect( names ).toHaveLength( translation.targetExplicitCount )

      for ( const expressID of [ 30, 37, 100, 200, 300 ] ) {

        const entity = model.getElementByExpressID( expressID ) as unknown as
          Record< string, unknown >

        if ( entity.constructor.name.toUpperCase() !== translation.target ) {
          continue
        }

        names.forEach( ( name, index ) => {

          const value = entity[ name ]

          if ( index >= translation.decodedPrefix ) {
            expect( [ source, expressID, name, value ] ).toEqual( [ source, expressID, name, null ] )
            ++masked
          }
        } )
      }
    }

    // IfcBuilding 3 + IfcBuildingStorey 1 + IfcBuildingElementProxy 1 x 3.
    expect( masked ).toBe( 7 )
  } )

  test( 'the decoded prefix still reads the file\'s values', () => {

    const model = strict( routedModel( bytes ) )
    const part = model.getElementByExpressID( 37 ) as IfcBuildingStorey
    const road = model.getElementByExpressID( 30 ) as IfcBuilding
    const kerb = model.getElementByExpressID( 300 ) as IfcBuildingElementProxy

    expect( part ).toBeInstanceOf( IfcBuildingStorey )
    expect( [ part.GlobalId, part.Name, part.CompositionType ] )
        .toEqual( [ 'R000000000000000000037', 'Segment', IfcElementCompositionEnum.ELEMENT ] )
    expect( part.ObjectPlacement?.expressID ).toBe( 38 )
    expect( [ road.Name, kerb.Name, kerb.Description ] ).toEqual( [ 'Road', 'Kerb', 'kerb' ] )
    expect( kerb.Representation?.expressID ).toBe( 304 )
  } )

  // The central hazard: IFC4X3 RC2 IfcFacilityPart's index 9 is a typed
  // select (`IFCROADPARTTYPEENUM(.ROADSEGMENT.)`), and index 9 of IFC4
  // IfcBuildingStorey is `Elevation`, an IfcLengthMeasure REAL.
  // spatial_imposter.ts reads it directly as `extractNumber( 9, 9, 6, true )`,
  // so the getter and the direct read are both checked. Also checked: an
  // unmasked model over the SAME index, which decodes the typed select as
  // Elevation, in strict mode, and throws. That shows the mask is what
  // makes the read safe.
  test( 'facility-part attribute 9 is never decoded as Elevation', () => {

    const model = strict( routedModel( bytes ) )
    const part = model.getElementByExpressID( 37 ) as IfcBuildingStorey

    expect( part.Elevation ).toBeNull()
    expect( part.extractNumber( 9, 9, 6, true ) ).toBeNull()

    const index = compat( bytes )
    const unmasked = strict( new IfcStepModel( bytes, index.columns ) )
    const unmaskedPart = unmasked.getElementByExpressID( 37 ) as IfcBuildingStorey

    expect( () => unmaskedPart.Elevation ).toThrow( /incorrectly typed/ )

    // And IfcRoad -> IfcBuilding, whose record ends before the target's tail.
    const unmaskedRoad = unmasked.getElementByExpressID( 30 ) as IfcBuilding

    expect( () => unmaskedRoad.ElevationOfRefHeight ).toThrow( /too few fields/ )
  } )

  test( 'a non-null IFC4X3 PredefinedType reads as absent, never as a proxy enum', () => {

    const model = strict( routedModel( bytes ) )

    // `.FLEXIBLE.` has no IfcBuildingElementProxyTypeEnum counterpart;
    // `IFCPAVEMENTTYPEENUM(.RIGID.)` is a typed value IFC4 cannot decode.
    for ( const expressID of [ 100, 200, 300 ] ) {
      expect( ( model.getElementByExpressID( expressID ) as IfcBuildingElementProxy )
          .PredefinedType ).toBeNull()
    }
  } )
} )


describe( 'an eligible IFC4X3 file renders through ConwayModelLoader', () => {

  test( 'extracts geometry for exactly the 2 pavements and 1 kerb', async () => {

    const [ , scene ] = await ConwayModelLoader.loadModelWithScene(
        new Uint8Array( fs.readFileSync( ROAD_GEOMETRY ) ) )

    const products = new Set< number >()

    for ( const [ , , , , entity ] of ( scene as WalkableScene< StepEntityBase< number > > ).walk() ) {
      products.add( entity!.expressID! )
    }

    expect( [ ...products ].sort( ( a, b ) => a - b ) ).toEqual( [ 100, 200, 300 ] )
  }, 120000 )

  test( 'an ineligible IFC4X3 file is refused', async () => {

    await expect( ConwayModelLoader.loadModelWithScene(
        new Uint8Array( fs.readFileSync( INELIGIBLE ) ) ) )
        .rejects.toThrow( /IFC4X3.*IFCALIGNMENT/ )
  }, 120000 )
} )
