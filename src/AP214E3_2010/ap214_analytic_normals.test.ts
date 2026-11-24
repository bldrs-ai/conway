import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { AP214SceneBuilder } from './ap214_scene_builder'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'

/* eslint-disable no-magic-numbers -- the reified vertex layout (6 floats) and
   the axis component indices read more clearly as literals than as names. */

/**
 * A tube: two coaxial CYLINDRICAL_SURFACE advanced faces (bore and outside)
 * capped by annular planes. The cylinders take the analytic-normal path added
 * for https://github.com/bldrs-ai/conway/issues/667, so every emitted normal on
 * them must be the exact radial direction rather than an average of the
 * surrounding facets' normals.
 *
 * That distinction is the whole point of the change. Reify()'s fallback derives
 * a shading normal by averaging FACE normals inside a 40-degree smoothing
 * group; on a curved face those averages are close to the surface but never
 * equal to it, and near a trimmed boundary — where the triangulator leaves
 * slivers whose face normals point almost anywhere — they are not even close.
 * The tolerance below is tight enough that only a genuinely analytic normal
 * passes: reverting the cylinder call sites to the three-argument
 * appendMeshToGeometry overload turns this test red.
 */
const FIXTURE = 'data/create-a-tube.step'

/**
 * Angular slack, in radians, between the emitted normal and the analytic one.
 *
 * Sized for float32 storage plus the renormalization Reify() does, NOT for
 * chord error — an averaged face normal on this fixture misses by degrees,
 * which is four orders of magnitude outside this.
 */
const TOLERANCE_RADIANS = 1e-3

let scene: AP214SceneBuilder
let conwayGeometry: ConwayGeometry


beforeAll(async () => {
  conwayGeometry = new ConwayGeometry()

  await conwayGeometry.initialize()

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer(fs.readFileSync(FIXTURE))

  // The header has to be consumed before the data section; skipping it leaves
  // parseDataToModel reading from the wrong offset and returning INCOMPLETE.
  expect(parser.parseHeader(buffer)[1]).toBe(ParseResult.COMPLETE)

  const [, model] = parser.parseDataToModel(buffer)

  expect(model).not.toBe(void 0)

  const extraction = new AP214GeometryExtraction(conwayGeometry, model!)
  const [extractResult, sceneBuilder] = extraction.extractAP214GeometryData()

  expect(extractResult).toBe(ExtractResult.COMPLETE)

  scene = sceneBuilder
})


/**
 * Every emitted vertex of the model as {position, normal}, straight out of the
 * reified stream the viewer and the GLB writer both consume.
 *
 * @return One entry per emitted vertex, in vertex-buffer order.
 */
function reifiedVertices(): {position: number[], normal: number[]}[] {

  const wasm =
    (conwayGeometry as unknown as { wasmModule: { HEAPF32: Float32Array } }).wasmModule

  const out: {position: number[], normal: number[]}[] = []

  for (const [, , mesh] of scene.walk()) {

    const geometry = (mesh as unknown as {
      geometry: { GetVertexData(): number, GetVertexDataSize(): number }
    }).geometry

    const floatCount = geometry.GetVertexDataSize()

    // Reified layout: 6 floats per vertex, position xyz then normal xyz. Copied
    // out immediately — HEAPF32 views detach when the wasm heap grows.
    const data = wasm.HEAPF32.slice(
        geometry.GetVertexData() / 4,
        (geometry.GetVertexData() / 4) + floatCount)

    for (let where = 0; where < floatCount; where += 6) {
      out.push({
        position: [data[where], data[where + 1], data[where + 2]],
        normal: [data[where + 3], data[where + 4], data[where + 5]],
      })
    }
  }

  return out
}


/**
 * The tube's axis, found from the emitted geometry rather than assumed: the
 * axis is the coordinate whose spread is largest while the other two describe
 * a circle of near-constant radius.
 *
 * @param vertices Emitted vertices.
 * @return Index of the axis component (0, 1 or 2).
 */
function axisComponent(vertices: {position: number[]}[]): number {

  let best = 0
  let bestSpread = -Infinity

  for (let component = 0; component < 3; ++component) {

    const values = vertices.map((each) => each.position[component])
    const spread = Math.max(...values) - Math.min(...values)

    if (spread > bestSpread) {
      bestSpread = spread
      best = component
    }
  }

  return best
}


describe('AP214 analytic shading normals', () => {

  test('emits unit normals for every vertex', () => {

    const vertices = reifiedVertices()

    expect(vertices.length).toBeGreaterThan(0)

    for (const {normal} of vertices) {

      const length = Math.hypot(normal[0], normal[1], normal[2])

      expect(length).toBeCloseTo(1, 5)
    }
  })

  test('cylindrical faces carry the exact radial normal, not an average', () => {

    const vertices = reifiedVertices()
    const axis = axisComponent(vertices)
    const radial = [0, 1, 2].filter((component) => component !== axis)

    // The circle centre in the two non-axis components, from the extent rather
    // than from the file, so the test does not depend on the fixture's
    // placement.
    const centre = radial.map((component) => {
      const values = vertices.map((each) => each.position[component])
      return (Math.max(...values) + Math.min(...values)) / 2
    })

    const radii = vertices.map(({position}) =>
      Math.hypot(position[radial[0]] - centre[0], position[radial[1]] - centre[1]))

    const maxRadius = Math.max(...radii)

    let checked = 0

    for (let where = 0; where < vertices.length; ++where) {

      const {normal} = vertices[where]
      const radius = radii[where]

      // Only the outer cylinder: the bore's normal points inward and the end
      // caps are planar, and neither is what this test is about. A vertex on
      // the outer wall sits at the model's maximum radius.
      if (radius < maxRadius * 0.999) {
        continue
      }

      // A vertex shared with an end cap gets its own split copy whose normal is
      // the cap's, which is axial. Skip those by requiring the normal to be
      // predominantly radial before comparing it to the analytic direction.
      if (Math.abs(normal[axis]) > 0.5) {
        continue
      }

      const {position} = vertices[where]
      const analytic = [
        (position[radial[0]] - centre[0]) / radius,
        (position[radial[1]] - centre[1]) / radius,
      ]

      const dot =
        (analytic[0] * normal[radial[0]]) + (analytic[1] * normal[radial[1]])

      // Clamped: float32 storage can push a genuinely parallel pair a hair
      // past 1, where acos() would return NaN.
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)))

      expect(angle).toBeLessThan(TOLERANCE_RADIANS)

      ++checked
    }

    // Guard against the filters above quietly excluding everything, which would
    // leave the assertion loop vacuous.
    expect(checked).toBeGreaterThan(16)
  })
})
