import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { AP214SceneBuilder } from './ap214_scene_builder'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'

/* eslint-disable no-magic-numbers -- the fixture's radius, the reified vertex
   layout (6 floats) and 4x4 matrix element indices all read more clearly as
   literals here than as named constants. */

/**
 * A whole sphere as OCCT writes one: a single `ADVANCED_FACE` on a
 * `SPHERICAL_SURFACE`, bounded by a single `VERTEX_LOOP` at the north
 * pole. ISO 10303-42 reads a lone degenerate loop as covering the entire
 * surface — the vertex marks a pole, it does not trim anything.
 *
 * This shape used to load as ZERO meshes, silently: one point constrains
 * no CDT, so the dual-hemisphere unwrap produced no triangles and nothing
 * downstream could tell "trimmed away to nothing" from "never
 * triangulated". See https://github.com/bldrs-ai/conway/issues/461.
 */
const FIXTURE = 'data/sphere-vertex-loop.step'

/** The fixture's radius, in its own (millimetre) file coordinates. */
const RADIUS_MM = 15

/**
 * Fractional slack. The fallback emits a 48x24 parametric grid, which
 * inscribes the true sphere, so every measured quantity sits slightly
 * under the analytic value — hence a tolerance wide enough for chord
 * error rather than one that only covers floating point.
 */
const TOLERANCE = 0.02

let scene: AP214SceneBuilder
let conwayGeometry: ConwayGeometry

beforeAll(async () => {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer(fs.readFileSync(FIXTURE))

  expect(parser.parseHeader(buffer)[1]).toBe(ParseResult.COMPLETE)

  const [, parsed] = parser.parseDataToModel(buffer)

  expect(parsed).not.toBe(void 0)

  conwayGeometry = new ConwayGeometry()

  expect(await conwayGeometry.initialize()).toBe(true)

  const [result, sceneBuilder] =
    new AP214GeometryExtraction(conwayGeometry, parsed!).extractAP214GeometryData()

  expect(result).toBe(ExtractResult.COMPLETE)
  scene = sceneBuilder
})


/**
 * Every vertex in the scene, in file coordinates (no transform applied —
 * this fixture has a single mesh at the origin, and the unit scale is the
 * subject of a different test).
 *
 * @return Flat [x, y, z] triples, in vertex-buffer order.
 */
function vertices(): number[][] {

  const wasm =
    (conwayGeometry as unknown as { wasmModule: { HEAPF32: Float32Array } }).wasmModule

  const points: number[][] = []

  for (const [, , mesh] of scene.walk()) {

    const geometry = (mesh as unknown as {
      geometry: { GetVertexData(): number, GetVertexDataSize(): number }
    }).geometry

    const floatCount = geometry.GetVertexDataSize()

    // Reified layout: 6 floats per vertex, position xyz then normal xyz.
    // Read into a copy immediately — HEAPF32 views detach on wasm growth.
    const data = wasm.HEAPF32.slice(
        geometry.GetVertexData() / 4,
        (geometry.GetVertexData() / 4) + floatCount)

    for (let where = 0; where < floatCount; where += 6) {
      points.push([data[where], data[where + 1], data[where + 2]])
    }
  }

  return points
}


/**
 * Every triangle in the scene, as three positions.
 *
 * The reified vertex buffer is NOT triangle soup — it is indexed, and its
 * vertex count is not even a multiple of three — so triangles have to be
 * assembled through the index buffer rather than by walking vertices in
 * threes.
 *
 * @return Triples of [x, y, z] triples.
 */
function triangles(): number[][][] {

  const wasm = (conwayGeometry as unknown as {
    wasmModule: { HEAPF32: Float32Array, HEAPU32: Uint32Array }
  }).wasmModule

  const result: number[][][] = []

  for (const [, , mesh] of scene.walk()) {

    const geometry = (mesh as unknown as {
      geometry: {
        GetVertexData(): number, GetVertexDataSize(): number,
        GetIndexData(): number, GetIndexDataSize(): number
      }
    }).geometry

    const floatCount = geometry.GetVertexDataSize()

    const data = wasm.HEAPF32.slice(
        geometry.GetVertexData() / 4,
        (geometry.GetVertexData() / 4) + floatCount)

    const indexCount = geometry.GetIndexDataSize()

    const indices = wasm.HEAPU32.slice(
        geometry.GetIndexData() / 4,
        (geometry.GetIndexData() / 4) + indexCount)

    /**
     * @param index Vertex index into the reified buffer.
     * @return The vertex position.
     */
    const at = (index: number): number[] =>
      [data[index * 6], data[(index * 6) + 1], data[(index * 6) + 2]]

    for (let where = 0; where + 2 < indexCount; where += 3) {
      result.push([at(indices[where]), at(indices[where + 1]), at(indices[where + 2])])
    }
  }

  return result
}


describe('AP214 spherical surface bounded by a vertex loop', () => {

  test('a whole sphere produces geometry at all (issue #461)', () => {

    // The regression this pins is silence, not wrongness: before the
    // full-surface fallback this walked zero meshes and reported no error.
    const points = vertices()

    expect(points.length).toBeGreaterThan(0)
  })

  test('every vertex lies on the sphere of the declared radius', () => {

    const points = vertices()

    // Not decoration: without it this whole test passes vacuously when the
    // sphere produces no geometry — which is the exact defect the suite
    // exists to catch. Confirmed by disabling the fallback and watching
    // this case stay green while its two siblings went red.
    expect(points.length).toBeGreaterThan(0)

    // Cheap and total, rather than sampling: if the fallback ever emits a
    // grid on the wrong radius, centre, or axis, at least one point moves
    // off the surface. A grid inscribes the sphere, so points may sit
    // slightly inside, never outside.
    for (const [x, y, z] of points) {

      const radius = Math.hypot(x, y, z)

      expect(radius).toBeGreaterThan(RADIUS_MM * (1 - TOLERANCE))
      expect(radius).toBeLessThan(RADIUS_MM * (1 + 1e-6))
    }
  })

  test('the sphere is closed, so the area-weighted normal sum vanishes', () => {

    // Orientation check, and the reason it is worth having: a closed
    // oriented surface has its triangle area-vectors cancel exactly. If
    // the grid's winding were inconsistent — the defect class of #459 and
    // #463 — this residual would be a large fraction of the total area
    // while the per-vertex radius test above stayed perfectly green.
    const faces = triangles()

    expect(faces.length).toBeGreaterThan(0)

    const sum = [0, 0, 0]
    let area = 0

    for (const [[ax, ay, az], [bx, by, bz], [cx, cy, cz]] of faces) {

      const ux = bx - ax, uy = by - ay, uz = bz - az
      const vx = cx - ax, vy = cy - ay, vz = cz - az

      const nx = (uy * vz) - (uz * vy)
      const ny = (uz * vx) - (ux * vz)
      const nz = (ux * vy) - (uy * vx)

      sum[0] += nx
      sum[1] += ny
      sum[2] += nz
      area += Math.hypot(nx, ny, nz)
    }

    expect(area).toBeGreaterThan(0)
    expect(Math.hypot(sum[0], sum[1], sum[2]) / area).toBeLessThan(1e-3)
  })
})
