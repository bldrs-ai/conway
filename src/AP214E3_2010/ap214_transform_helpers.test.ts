import fs from 'fs'
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { AP214SceneTransform } from './ap214_scene_builder'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import {
  cartesian_transformation_operator_3d,
  mapped_item,
} from './AP214E3_2010_gen'


let extraction: AP214GeometryExtraction
let conwayGeometry: ConwayGeometry


/**
 * Parse data/ap214-mapped-item-test.step and create an AP214GeometryExtraction
 * for testing transform helpers (extractMappedItem origin-inversion semantics
 * from PR #309 and extractCartesianTransformOperator3D parameter packaging).
 *
 * @return {Promise<boolean>} True iff parse + WASM init succeeded.
 */
async function initialize(): Promise<boolean> {
  const parser = IfcStepParser.Instance
  const buffer: Buffer = fs.readFileSync('data/ap214-mapped-item-test.step')
  const input = new ParsingBuffer(buffer)

  if (parser.parseHeader(input)[1] !== ParseResult.COMPLETE) {
    return false
  }

  conwayGeometry = new ConwayGeometry()
  if (!(await conwayGeometry.initialize())) {
    return false
  }

  const [, model] = parser.parseDataToModel(input)
  if (model === void 0) {
    return false
  }

  extraction = new AP214GeometryExtraction(conwayGeometry, model)
  return extraction.isInitialized()
}


describe('AP214 transform helpers', () => {

  beforeAll(async () => {
    await initialize()
  })

  afterAll(() => {
    extraction?.destroy()
  })

  test('parses fixture and finds the mapped_item + CTO3D entities', () => {

    const mappedItems = Array.from(extraction.model.types(mapped_item))
    const ctos = Array.from(extraction.model.types(cartesian_transformation_operator_3d))
    expect(mappedItems.length).toBe(1)
    expect(ctos.length).toBe(1)
  })

  test('extractCartesianTransformOperator3D produces a non-trivial matrix with the entity origin', () => {

    // Fixture has CARTESIAN_TRANSFORMATION_OPERATOR_3D('',$,$,#13,2.,$)
    // with #13 = CARTESIAN_POINT('',(50.,0.,0.)). Verifies the helper
    // packages local_origin into the returned matrix's translation
    // column (column-major v[12..14]).
    const CTO_ORIGIN_X = 50
    const MAT_4X4_ENTRIES = 16
    const ctos = Array.from(extraction.model.types(cartesian_transformation_operator_3d))
    const cto = ctos[0] as cartesian_transformation_operator_3d

    const result = extraction.extractCartesianTransformOperator3D(cto)
    const v = result.getValues()
    expect(v.length).toBe(MAT_4X4_ENTRIES)

    // Translation reflects the entity's local_origin.
    expect(v[12]).toBeCloseTo(CTO_ORIGIN_X)
    expect(v[13]).toBeCloseTo(0)
    expect(v[14]).toBeCloseTo(0)

    // Bottom row sane for an affine 4x4.
    expect(v[3]).toBeCloseTo(0)
    expect(v[7]).toBeCloseTo(0)
    expect(v[11]).toBeCloseTo(0)
  })

  test('extractMappedItem composes target * origin^-1 for a placement target', () => {

    // Fixture has:
    //   origin placement #30 at  (10, 0, 0)
    //   target placement #31 at (100, 0, 0)
    //   mapped_item   #60 mapping #30 -> #31
    //
    // Per PR #309 (line 2298-2308 of ap214_geometry_extraction.ts): the
    // pushed transform is `target * origin^-1`. With identity rotations
    // and translations as above, the result's translation column should
    // be (100 - 10, 0, 0) = (90, 0, 0).
    //
    // Regression guard: if origin^-1 were dropped, the result would be
    // the bare target translation (100, 0, 0).
    const EXPECTED_TX = 90
    const TARGET_ONLY_TX = 100

    const mappedItems = Array.from(extraction.model.types(mapped_item))
    const mi = mappedItems[0] as mapped_item

    const sceneInternal = extraction.scene as unknown as {
      scene_: { localID: number }[]
    }
    const indexBefore = sceneInternal.scene_.length

    extraction.extractMappedItem(mi)

    // The first scene node added by extractMappedItem is the combined
    // transform itself (pushed with mapped_item's localID); subsequent
    // nodes come from the recursive extraction of mapped_representation.
    let pushed: AP214SceneTransform | undefined
    for (let i = indexBefore; i < sceneInternal.scene_.length; ++i) {
      const node = sceneInternal.scene_[i] as unknown
      if (node instanceof AP214SceneTransform && (node as AP214SceneTransform).localID === mi.localID) {
        pushed = node as AP214SceneTransform
        break
      }
    }

    expect(pushed).toBeDefined()
    const v = pushed!.transform

    // Combined translation = target - origin = 100 - 10 = 90 along X.
    expect(v[12]).toBeCloseTo(EXPECTED_TX)
    expect(v[13]).toBeCloseTo(0)
    expect(v[14]).toBeCloseTo(0)

    // If the origin inversion were ever removed, v[12] would land at
    // TARGET_ONLY_TX. Spell that out so a regressed value reads clearly.
    expect(v[12]).not.toBeCloseTo(TARGET_ONLY_TX)
  })

})
