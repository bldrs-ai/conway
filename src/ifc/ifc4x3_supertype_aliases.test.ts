import { describe, expect, test } from '@jest/globals'

import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { IfcBuildingElementProxy, IfcBuildingStorey } from './ifc4_gen'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import IfcStepParser from './ifc_step_parser'
import { Ifc4X3AliasedTypeIndex, IFC4X3_SUPERTYPE_ALIASES } from './ifc4x3_supertype_aliases'


/**
 * A minimal `IFC4X3_RC2` file (issue #280 / #495) carrying one of each 4X3
 * entity this alias table covers, with realistic KIT-Simple-Road-Test
 * attribute lists — `IfcRoad`/`IfcFacilityPart` as `IfcSpatialStructureElement`
 * (9 attrs: GlobalId..CompositionType), `IfcPavement`/`IfcKerb` as
 * `IfcElement` (8 attrs: GlobalId..Tag) — followed by their real IFC4X3-only
 * trailing attributes, to prove the parser reads past them without needing
 * to know their count.
 */
const IFC4X3_SNIPPET = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((''),'2;1');
FILE_NAME('test.ifc','2026-08-31',(''),(''),'','','');
FILE_SCHEMA(('IFC4X3_RC2'));
ENDSEC;

DATA;
#1=IFCROAD('0road000000000000000001',$,'Road Network','desc',$,$,$,$,.ELEMENT.);
#2=IFCFACILITYPART('0part000000000000000002',$,'Road-ROADSEGMENT-01','desc',$,$,$,$,.ELEMENT.,IFCROADPARTTYPEENUM(.ROADSEGMENT.),.LONGITUDINAL.);
#3=IFCPAVEMENT('0pave000000000000000003',$,'Carriageway','desc',$,$,$,$,IFCPAVEMENTTYPEENUM(.NOTDEFINED.));
#4=IFCKERB('0kerb000000000000000004',$,'Kerb','desc',$,$,$,$,.T.,IFCKERBTYPEENUM(.NOTDEFINED.));
ENDSEC;
END-ISO-10303-21;
`

/**
 * Parse {@link IFC4X3_SNIPPET} through the real `IfcStepParser.Instance` —
 * the parser every real IFC load path uses (conway_model_loader.ts,
 * ifc_spatial_skeleton.ts) — so this exercises the actual wiring in
 * ifc_step_parser.ts, not just {@link Ifc4X3AliasedTypeIndex} in isolation.
 *
 * @return {ReturnType<typeof IfcStepParser.prototype.parseDataToModel>[1]} The parsed model.
 */
function parseSnippet() {
  const parser = IfcStepParser.Instance
  const input = new ParsingBuffer( new TextEncoder().encode( IFC4X3_SNIPPET ) )

  expect( parser.parseHeader( input )[ 1 ] ).toBe( ParseResult.COMPLETE )

  const [ result, model ] = parser.parseDataToModel( input )

  expect( result ).toBe( ParseResult.COMPLETE )
  expect( model ).toBeDefined()

  return model!
}

describe( 'IFC4X3 supertype aliasing (issue #280, #495)', () => {

  describe( 'Ifc4X3AliasedTypeIndex', () => {

    test( 'falls through to the primary index on a hit', () => {

      const primary = { get: () => EntityTypesIfc.IFCWALL }
      const index = new Ifc4X3AliasedTypeIndex( primary, IFC4X3_SUPERTYPE_ALIASES )

      expect( index.get( new Uint8Array(), 0, 0 ) ).toBe( EntityTypesIfc.IFCWALL )
    } )

    test( 'resolves an IFC4X3-only keyword the primary index misses', () => {

      const primary = { get: () => void 0 }
      const index = new Ifc4X3AliasedTypeIndex( primary, IFC4X3_SUPERTYPE_ALIASES )
      const keyword = new TextEncoder().encode( 'IFCROAD' )

      expect( index.get( keyword, 0, keyword.length ) ).toBe( EntityTypesIfc.IFCBUILDINGSTOREY )
    } )

    test( 'stays undefined for a keyword neither index knows', () => {

      const primary = { get: () => void 0 }
      const index = new Ifc4X3AliasedTypeIndex( primary, IFC4X3_SUPERTYPE_ALIASES )
      const keyword = new TextEncoder().encode( 'IFCNOTAREALTYPE' )

      expect( index.get( keyword, 0, keyword.length ) ).toBeUndefined()
    } )
  } )

  describe( 'parsed against IfcStepParser.Instance', () => {

    test( 'IFCROAD and IFCFACILITYPART resolve as concrete IfcBuildingStorey', () => {

      const model = parseSnippet()

      const road = model.getTypedElementByExpressID( 1, IfcBuildingStorey )
      const facilityPart = model.getTypedElementByExpressID( 2, IfcBuildingStorey )

      expect( road ).toBeInstanceOf( IfcBuildingStorey )
      expect( facilityPart ).toBeInstanceOf( IfcBuildingStorey )

      // The IfcSpatialStructureElement-prefix attributes read correctly —
      // this is what the aliased type sharing that prefix buys.
      expect( road!.Name ).toBe( 'Road Network' )
      expect( facilityPart!.Name ).toBe( 'Road-ROADSEGMENT-01' )
    } )

    test( 'IFCPAVEMENT and IFCKERB resolve as concrete IfcBuildingElementProxy', () => {

      const model = parseSnippet()

      const pavement = model.getTypedElementByExpressID( 3, IfcBuildingElementProxy )
      const kerb = model.getTypedElementByExpressID( 4, IfcBuildingElementProxy )

      expect( pavement ).toBeInstanceOf( IfcBuildingElementProxy )
      expect( kerb ).toBeInstanceOf( IfcBuildingElementProxy )

      expect( pavement!.Name ).toBe( 'Carriageway' )
      expect( kerb!.Name ).toBe( 'Kerb' )
    } )
  } )
} )
