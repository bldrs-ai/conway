import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import Logger, { LogLevelName } from '../logging/logger'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { CanonicalMeshType } from '../core/canonical_mesh'
import { advanced_face } from './AP214E3_2010_gen'

/* eslint-disable no-magic-numbers -- express IDs and the known-good sphere
   grid's triangle count are quantities of this fixture, not of the code
   under test; naming them would move the evidence away from the assertions
   that rest on it. */

/**
 * A single ADVANCED_FACE whose one boundary EDGE_CURVE is a closed CIRCLE
 * (edge_start === edge_end, a vertex-to-itself closed edge) placed by a
 * degenerate AXIS2_PLACEMENT_3D (#54599, a zero-length ref_direction).
 *
 * This drives BOTH diagnostics end to end through their real production
 * call sites, in the sequence conway#641's epic actually hit:
 *
 * - GetAxis2Placement3D normalises the zero-length ref_direction to a NaN
 *   basis (conway#592) - caught by getAxis2Placement3D's wrapper, which
 *   Logger.errors the placement's own express id (#54599) without refusing
 *   or repairing it (the transform still propagates, corrupt, as before).
 * - The closed-vertex edge's trimmed circle extraction collapses to 1
 *   point (< the 3-point bound minimum), so the conway#492 whole-curve-trim
 *   recovery re-samples the SAME bad placement untrimmed - which comes back
 *   as a full complement of NaN points. isCurveFinite (conway#591) rejects
 *   that recovery rather than accepting it, staying on the original
 *   (loud, 1-point) collapsed-trim path instead.
 *
 * Same 20-entity shape as ap214_sphere_seam_face.test.ts's bare-face
 * fixtures (no product/shape-representation wrapper), adapted from
 * data/issue-595-sphere-seam-loop.step.
 */
const FIXTURE = 'data/ap214-degenerate-placement-whole-curve.step'

const DEGENERATE_PLACEMENT_EXPRESS_ID = 54599
const DEGENERATE_EDGE_EXPRESS_ID = 28750

// The full 48 x 24 parametric sphere grid ap214_sphere_seam_face.test.ts
// pins for a well-formed boundary - reached here too, because the rejected
// edge's bound degenerates to nothing rather than corrupting the surface.
const SPHERE_GRID_TRIANGLES = 2208

let extraction: AP214GeometryExtraction
let model: AP214StepModel
let lines: { level: LogLevelName, message: string }[]

/** What a user would have seen on the console for this extraction. */
beforeAll(async () => {

  const conwayGeometry = new ConwayGeometry()

  expect(await conwayGeometry.initialize()).toBe(true)

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer(fs.readFileSync(FIXTURE))

  expect(parser.parseHeader(buffer)[1]).toBe(ParseResult.COMPLETE)

  const [result, parsed] = parser.parseDataToModel(buffer)

  expect(result).toBe(ParseResult.COMPLETE)

  model = parsed as AP214StepModel
  model.nullOnErrors = true

  extraction = new AP214GeometryExtraction(conwayGeometry, model)

  const faces = Array.from(model.types(advanced_face))

  // A zero here would mean the fixture stopped exercising the path, which
  // reads identically to a pass.
  expect(faces.length).toBe(1)

  lines = []
  Logger.clearLogs()
  Logger.setSink((level, message) => {
    lines.push({ level, message })
  })

  try {
    for (const face of faces) {
      extraction.extractFaces([face], face.localID)
    }
  } finally {
    Logger.setSink()
    Logger.clearLogs()
  }
})


describe('a degenerate AXIS2_PLACEMENT_3D through extraction (conway#592/#591)', () => {

  test('the placement wrapper reports the non-finite transform (conway#592)', () => {

    // Drives AP214GeometryExtraction's real getAxis2Placement3D wrapper via
    // the circle's own extraction - not isTransformFinite in isolation. A
    // regression that keeps isTransformFinite exported but stops the
    // wrapper from calling it (or from logging on its result) leaves this
    // red: the wrapper's own diagnostic line, at its own express id, has to
    // actually appear.
    const placementError = lines.find((line) =>
      line.level === 'error' &&
      line.message.includes('AXIS2_PLACEMENT_3D produced a non-finite transform') &&
      line.message.includes(`expressID: ${DEGENERATE_PLACEMENT_EXPRESS_ID}`))

    expect(placementError).toBeDefined()
  })

  test('the whole-curve-trim recovery is rejected, not accepted (conway#591)', () => {

    // Drives the real extractAdvancedFace recovery path, not isCurveFinite
    // in isolation. A regression that keeps isCurveFinite exported but
    // stops the recovery from calling it leaves this red: the collapsed
    // trim's edge would silently report as "recovered" instead of
    // "discarding it".
    const discardWarning = lines.find((line) =>
      line.level === 'warning' &&
      line.message.includes(`Whole-curve trim on edge #${DEGENERATE_EDGE_EXPRESS_ID}`) &&
      line.message.includes('discarding it'))

    expect(discardWarning).toBeDefined()

    const recoveredWarning = lines.find((line) =>
      line.level === 'warning' &&
      line.message.includes(`Whole-curve trim on edge #${DEGENERATE_EDGE_EXPRESS_ID}`) &&
      line.message.includes('recovered'))

    expect(recoveredWarning).toBeUndefined()
  })

  test('no NaN vertex reaches the emitted mesh', () => {

    // The rejected recovery's whole point: the 25 non-finite points it
    // produced must never reach the buffer, not just get logged about.
    // Reified layout: 6 floats per vertex (position xyz + normal xyz).
    const FLOATS_PER_VERTEX = 6

    let sawGeometry = false

    for (const mesh of model.geometry) {

      if (mesh.type !== CanonicalMeshType.BUFFER_GEOMETRY) {
        continue
      }

      sawGeometry = true

      const vertexFloatCount = mesh.geometry.GetVertexDataSize()
      const wasm = (extraction as unknown as { wasmModule: {
        HEAPF32: Float32Array } }).wasmModule
      const vertexData = wasm.HEAPF32.subarray(
          mesh.geometry.GetVertexData() / Float32Array.BYTES_PER_ELEMENT,
          mesh.geometry.GetVertexData() / Float32Array.BYTES_PER_ELEMENT +
            vertexFloatCount)

      expect(vertexFloatCount % FLOATS_PER_VERTEX).toBe(0)

      for (let i = 0; i < vertexData.length; ++i) {
        expect(Number.isFinite(vertexData[i])).toBe(true)
      }
    }

    expect(sawGeometry).toBe(true)
  })

  test('the surface still meshes as a full sphere despite the rejected edge', () => {

    // The degenerate edge's own bound collapses to nothing rather than
    // corrupting the surface - the same "loud failure, sane fallback"
    // shape ap214_sphere_seam_face.test.ts pins for a well-formed seam.
    let totalTriangles = 0

    for (const mesh of model.geometry) {
      if (mesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {
        totalTriangles += mesh.geometry.getTriangleCount()
      }
    }

    expect(totalTriangles).toBe(SPHERE_GRID_TRIANGLES)
  })

  test( 'the rejected recovery leaves no dangling entry in the curve cache (review finding)', () => {

    // extractCurve's own untrimmed call (inside the whole-curve-trim
    // recovery) memoises the untrimmed CurveObject into model.curves under
    // the BASIS curve's localID BEFORE the recovery logic ever sees it -
    // whether or not the recovery goes on to accept it. Deleting the
    // rejected native object without also removing that cache entry would
    // leave a dangling reference: this is the exact traversal
    // (AP214ModelCurves.objs(), the regression digest's own curve dump)
    // that would hit a deleted Embind object and throw instead of just
    // skipping the rejected curve.
    expect( () => Array.from( model.curves.objs() ) ).not.toThrow()

    // Positive check, not just "didn't throw": the basis curve (#18104)
    // must not still be sitting in the cache pointing at the deleted
    // object. The circle's own express id is on the CIRCLE entity itself
    // (localID), obtained from model.curves' own key set.
    const cachedCurveExpressIDs = Array.from( model.curves )
        .map( ( [ localID ] ) => model.getExpressIDByLocalID( localID ) )

    const DEGENERATE_CIRCLE_EXPRESS_ID = 18104

    expect( cachedCurveExpressIDs ).not.toContain( DEGENERATE_CIRCLE_EXPRESS_ID )
  } )
})
