/* eslint-disable no-magic-numbers */
// IFCTRIMMEDCURVE with MasterRepresentation = .UNSPECIFIED. over an IFCLINE.
//
// IFC defines UNSPECIFIED as "either representation may be used", so the
// reader chooses. conway-geom#170/#179 put that choice in getIfcLine: it takes
// the Cartesian endpoint pair when the two are distinct, and falls back to the
// parameters otherwise. The extractor therefore has to fill BOTH sides for
// UNSPECIFIED, and until conway#578 it filled only the Cartesian one — so a
// parameter-only UNSPECIFIED trim reached the wasm with every field zeroed,
// getIfcLine evaluated placement + vector * 0 twice, and IfcCurve::Add3d's
// duplicate test reduced the whole curve to a single point.
//
// No model in either regression corpus contains this construct — that is
// precisely why it went unnoticed, and why it needs a test of its own rather
// than digest coverage. The fixture is inline rather than a data/*.ifc file
// because the Tier-A quick-check in build.yml globs data/*.ifc and would
// demand a committed golden for it.
import { describe, expect, test, beforeAll } from '@jest/globals'

import { ConwayGeometry, CurveObject } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { IfcTrimmedCurve } from './ifc4_gen/index'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import IfcStepParser from './ifc_step_parser'


// One basis line — placement (1,2,3), direction (1,0,0), magnitude 10 — under
// four trimmed curves that differ only in master representation and in which
// representation their trims actually carry.
//
//   #100  UNSPECIFIED, parameters only   <- the regressing case
//   #101  UNSPECIFIED, Cartesian only
//   #102  CARTESIAN,   Cartesian only    <- control, must never move
//   #103  PARAMETER,   parameters only   <- control, must never move
const FIXTURE = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((''),'2;1');
FILE_NAME('trimmed-line-unspecified.ifc','2026-08-24T00:00:00',(''),(''),'','','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1= IFCCARTESIANPOINT((1.,2.,3.));
#2= IFCDIRECTION((1.,0.,0.));
#3= IFCVECTOR(#2,10.);
#4= IFCLINE(#1,#3);
#5= IFCCARTESIANPOINT((2.,2.,2.));
#6= IFCCARTESIANPOINT((7.,7.,7.));
#100= IFCTRIMMEDCURVE(#4,(IFCPARAMETERVALUE(0.25)),(IFCPARAMETERVALUE(0.75)),.T.,.UNSPECIFIED.);
#101= IFCTRIMMEDCURVE(#4,(#5),(#6),.T.,.UNSPECIFIED.);
#102= IFCTRIMMEDCURVE(#4,(#5),(#6),.T.,.CARTESIAN.);
#103= IFCTRIMMEDCURVE(#4,(IFCPARAMETERVALUE(0.25)),(IFCPARAMETERVALUE(0.75)),.T.,.PARAMETER.);
ENDSEC;
END-ISO-10303-21;
`

let extraction: IfcGeometryExtraction

/**
 * Parse the inline fixture and stand up a geometry extractor over it.
 *
 * @return {Promise<ExtractResult | boolean>} True when the extractor is ready.
 */
async function initialize(): Promise<ExtractResult | boolean> {

  const parser = IfcStepParser.Instance
  const input = new ParsingBuffer(Buffer.from(FIXTURE, 'utf8'))

  if (parser.parseHeader(input)[1] !== ParseResult.COMPLETE) {
    return ExtractResult.INCOMPLETE
  }

  const conwayGeometry: ConwayGeometry = new ConwayGeometry()

  if (!await conwayGeometry.initialize()) {
    return ExtractResult.INCOMPLETE
  }

  const [, model] = parser.parseDataToModel(input)

  if (model === void 0) {
    return ExtractResult.INCOMPLETE
  }

  extraction = new IfcGeometryExtraction(conwayGeometry, model)

  return extraction.isInitialized()
}

/**
 * Extract one trimmed curve by express ID and read its points back.
 *
 * @param expressID The IFCTRIMMEDCURVE to extract.
 * @return {number[][]} The curve's 3D points, in order.
 */
function trimmedCurvePoints(expressID: number): number[][] {

  const entity = extraction.model.getElementByExpressID(expressID)

  expect(entity).toBeInstanceOf(IfcTrimmedCurve)

  const curve: CurveObject | undefined =
    extraction.extractIfcTrimmedCurve(entity as IfcTrimmedCurve)

  expect(curve).toBeDefined()

  const points: number[][] = []

  for (let index = 0; index < curve!.getPointsSize(); ++index) {

    const point = curve!.get3d(index)

    points.push([point.x, point.y, point.z])
  }

  return points
}

beforeAll(async () => {
  expect(await initialize()).toBe(true)
})

describe('IFCTRIMMEDCURVE over IFCLINE, master representation UNSPECIFIED', () => {

  test('parameter-only UNSPECIFIED yields the parameter trim, not a single point', () => {

    // The regression conway#578 fixes. Before it, the extractor left
    // trim1Double/trim2Double at zero, both endpoints evaluated to the line's
    // own placement, and Add3d's duplicate test left exactly [[1,2,3]].
    expect(trimmedCurvePoints(100)).toEqual([[3.5, 2, 3], [8.5, 2, 3]])
  })

  test('Cartesian-only UNSPECIFIED still yields the Cartesian trim', () => {

    // Cartesian stays the preferred representation when both endpoints are
    // present and distinct — conway-geom#170's "use the Cartesian trim points
    // when both are present, else the parameter values".
    expect(trimmedCurvePoints(101)).toEqual([[2, 2, 2], [7, 7, 7]])
  })

  test('CARTESIAN is unaffected', () => {
    expect(trimmedCurvePoints(102)).toEqual([[2, 2, 2], [7, 7, 7]])
  })

  test('PARAMETER is unaffected', () => {
    expect(trimmedCurvePoints(103)).toEqual([[3.5, 2, 3], [8.5, 2, 3]])
  })
})
