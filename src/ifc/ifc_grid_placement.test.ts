import fs from 'fs'
import { beforeAll, describe, expect, test } from '@jest/globals'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import { IfcSceneTransform } from './ifc_scene_builder'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import Logger, { LogEntry, LogLevel } from '../logging/logger'


/* Express IDs in data/grid_placement.ifc — see that file for the geometry
 * each of them describes and where the expectations below come from. */
const PLACEMENT_A = 201
const PLACEMENT_B = 301
const PLACEMENT_C = 501
const PLACEMENT_D = 601
const CIRCULAR_AXIS = 410

/* Where the two supported placements land in world space, derived in the
 * comments beside each product in the fixture. */
const A_WORLD_X = 8
const A_WORLD_Y = 17
const A_WORLD_Z = 9
const B_WORLD_X = 4
const B_WORLD_Y = 25
const B_WORLD_Z = 5
const D_WORLD_X = 8
const D_WORLD_Y = 17
const D_WORLD_Z = 10

/* Column-major offsets into a 4x4 transform's values. */
const X_AXIS = 0
const TRANSLATION = 12

let extraction: IfcGeometryExtraction
let extractResult: ExtractResult


/**
 * Parse data/grid_placement.ifc and extract its geometry.
 *
 * @return {Promise<ExtractResult>} The result of the extraction.
 */
async function extractGridModel(): Promise<ExtractResult> {

  const parser = IfcStepParser.Instance
  const input = new ParsingBuffer(fs.readFileSync('data/grid_placement.ifc'))

  if (parser.parseHeader(input)[1] !== ParseResult.COMPLETE) {
    return ExtractResult.INCOMPLETE
  }

  const conwayGeometry = new ConwayGeometry()

  if (!await conwayGeometry.initialize()) {
    return ExtractResult.INCOMPLETE
  }

  const [, model] = parser.parseDataToModel(input)

  if (model === void 0) {
    return ExtractResult.INCOMPLETE
  }

  extraction = new IfcGeometryExtraction(conwayGeometry, model)

  return extraction.extractIFCGeometryData()[0]
}

/**
 * The scene transform registered for an object placement.
 *
 * @param expressID The express ID of the placement.
 * @return {IfcSceneTransform | undefined} Its transform, or undefined when
 * the extraction registered none for it.
 */
function placementTransform(expressID: number): IfcSceneTransform | undefined {

  const placement = extraction.model.getElementByExpressID(expressID)

  expect(placement).toBeDefined()

  return extraction.scene.getTransform(placement!.localID)
}

/**
 * Find a buffered warning by the start of its message.
 *
 * @param prefix The leading text of the message to look for.
 * @return {LogEntry | undefined} The matching entry.
 */
function warningStartingWith(prefix: string): LogEntry | undefined {

  return Logger.getLogs().find(
      (entry) => entry.level === 'warning' && entry.message.startsWith(prefix))
}

beforeAll(async () => {

  Logger.clearLogs()

  // The unsupported-axis product warns by design here, and the echo would be
  // noise in the test console. The buffer these tests read is filled
  // regardless of the console threshold.
  const threshold = Logger.getLogLevel()

  Logger.setLogLevel(LogLevel.OFF)

  try {

    extractResult = await extractGridModel()

  } finally {

    Logger.setLogLevel(threshold)
  }
})

describe('IfcGridPlacement extraction', () => {

  test('the model extracts', () => {

    expect(extractResult).toBe(ExtractResult.COMPLETE)
  })

  test('a grid placement composes onto the grid\'s own placement', () => {

    const transform = placementTransform(PLACEMENT_A)

    expect(transform).toBeDefined()

    const values = transform!.absoluteTransform

    // Grid intersection (-3,2,4) carried through the grid's placement — a
    // quarter turn about +Z, then (10,20,5). Landing at the origin is the
    // defect this covers, and landing at (7,22,9) would mean the grid's
    // rotation had been added rather than composed.
    expect(values[TRANSLATION]).toBeCloseTo(A_WORLD_X)
    expect(values[TRANSLATION + 1]).toBeCloseTo(A_WORLD_Y)
    expect(values[TRANSLATION + 2]).toBeCloseTo(A_WORLD_Z)

    // No PlacementRefDirection, so the x axis is the first axis' tangent
    // (+X in the grid), which the grid's quarter turn takes to world +Y.
    expect(values[X_AXIS]).toBeCloseTo(0)
    expect(values[X_AXIS + 1]).toBeCloseTo(1)
    expect(values[X_AXIS + 2]).toBeCloseTo(0)
  })

  test('two offsets and an explicit reference direction', () => {

    const transform = placementTransform(PLACEMENT_B)

    expect(transform).toBeDefined()

    const values = transform!.absoluteTransform

    // Grid intersection (5,6), with no third offset, so z stays on the grid.
    expect(values[TRANSLATION]).toBeCloseTo(B_WORLD_X)
    expect(values[TRANSLATION + 1]).toBeCloseTo(B_WORLD_Y)
    expect(values[TRANSLATION + 2]).toBeCloseTo(B_WORLD_Z)

    // PlacementRefDirection is +Y in the grid, which the quarter turn takes
    // to world -X.
    expect(values[X_AXIS]).toBeCloseTo(-1)
    expect(values[X_AXIS + 1]).toBeCloseTo(0)
    expect(values[X_AXIS + 2]).toBeCloseTo(0)
  })

  test('a local placement measured from a grid placement composes onto it', () => {

    const transform = placementTransform(PLACEMENT_D)

    expect(transform).toBeDefined()

    const values = transform!.absoluteTransform

    // 1m up from product A's grid placement, which is where an
    // IfcLocalPlacement whose PlacementRelTo is an IfcGridPlacement lands
    // once that placement registers a transform to be relative to.
    expect(values[TRANSLATION]).toBeCloseTo(D_WORLD_X)
    expect(values[TRANSLATION + 1]).toBeCloseTo(D_WORLD_Y)
    expect(values[TRANSLATION + 2]).toBeCloseTo(D_WORLD_Z)
  })

  test('an axis curve that is not a line warns rather than dropping silently', () => {

    expect(placementTransform(PLACEMENT_C)).toBeUndefined()

    const warning = warningStartingWith('IfcGridPlacement: unsupported grid axis curve')

    expect(warning).toBeDefined()
    expect(warning!.message).toContain('IFCCIRCLE')
    expect(warning!.expressIDs.has(String(CIRCULAR_AXIS))).toBe(true)
  })

  test('nothing in this model is left unimplemented', () => {

    // The arm this covers used to be a no-op; a supported placement that
    // still warns would mean the implementation had not been reached.
    expect(warningStartingWith('IfcGridPlacement: unimplemented')).toBeUndefined()
  })
})
