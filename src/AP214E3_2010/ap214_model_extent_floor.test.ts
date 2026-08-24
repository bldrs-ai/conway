import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { advanced_face, cartesian_point, vertex_point } from './AP214E3_2010_gen'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'


const FIXTURE = 'data/create-a-tube.step'

/**
 * Extent stood in for the fixture in the floored case. Far larger than the
 * ~100-unit tube, so 1e-5 of it clears every face's own 0.1%-of-itself
 * target — the Arty_Z7 silkscreen's situation, where each face is a tile of
 * a far larger object.
 */
const MOSAIC_MODEL_EXTENT = 1e6

let conwayGeometry: ConwayGeometry


/**
 * Parse the fixture into a fresh model and extraction.
 *
 * A fresh pair per case on purpose: `extractFaces` writes into the model's
 * geometry store, so two tessellations of the same face cannot share one.
 *
 * @return {[AP214StepModel, AP214GeometryExtraction]} The parsed model and
 * an extraction over it.
 */
function load(): [AP214StepModel, AP214GeometryExtraction] {
  const parser = AP214StepParser.Instance
  const buffer: Buffer = fs.readFileSync(FIXTURE)
  const bufferInput = new ParsingBuffer(buffer)

  expect(parser.parseHeader(bufferInput)[1]).toBe(ParseResult.COMPLETE)

  const [, parsedModel] = parser.parseDataToModel(bufferInput)

  expect(parsedModel).toBeDefined()

  const extraction = new AP214GeometryExtraction(conwayGeometry, parsedModel!)

  expect(extraction.isInitialized()).toBe(true)

  return [parsedModel!, extraction]
}


/**
 * Tessellate every advanced face in the model and total the triangles.
 *
 * @param model The parsed model.
 * @param extraction The extraction to tessellate through.
 * @return {number} Total triangles across all of the model's faces.
 */
function tessellateAll(
    model: AP214StepModel,
    extraction: AP214GeometryExtraction ): number {

  let triangles = 0

  for ( const face of model.types( advanced_face ) ) {

    extraction.extractFaces( [face], face.localID )

    triangles += model.geometry.getByLocalID( face.localID )?.geometry.getTriangleCount() ?? 0
  }

  return triangles
}


describe('AP214 model-extent deflection floor (bldrs-ai/conway#564 §5)', () => {

  beforeAll(async () => {
    conwayGeometry = new ConwayGeometry()

    expect(await conwayGeometry.initialize()).toBe(true)
  })

  test('modelExtent is the bounding diagonal of the topological vertices', () => {

    const [model, extraction] = load()

    let minX = Infinity
    let minY = Infinity
    let minZ = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    let maxZ = -Infinity
    let vertices = 0

    for ( const vertex of model.types( vertex_point ) ) {

      const geometry = vertex.vertex_geometry

      if ( !( geometry instanceof cartesian_point ) ) {
        continue
      }

      const [x, y, z] = geometry.coordinates

      minX = Math.min( minX, x )
      minY = Math.min( minY, y )
      minZ = Math.min( minZ, z )
      maxX = Math.max( maxX, x )
      maxY = Math.max( maxY, y )
      maxZ = Math.max( maxZ, z )
      ++vertices
    }

    // A zero here would make the assertion below vacuously true against a
    // getter that always returned 0 — the "probe that never fired" failure.
    expect(vertices).toBeGreaterThan(0)

    expect(extraction.modelExtent)
        .toBeCloseTo(Math.hypot(maxX - minX, maxY - minY, maxZ - minZ), 9)
    expect(extraction.modelExtent).toBeGreaterThan(0)
  })

  test('modelExtent is pinned: extracting geometry does not move it', () => {

    const [model, extraction] = load()

    // Read it FIRST, so the memo is populated before any geometry exists,
    // then again after the whole model has been tessellated. Under the
    // demand pump and the preview channel's prefix snapshots a value that
    // tracked geometry as it accumulated would make the deflection target
    // depend on scheduling, which surfaces as nondeterministic digests.
    const before = extraction.modelExtent

    expect(tessellateAll( model, extraction )).toBeGreaterThan(0)

    expect(extraction.modelExtent).toBe(before)
  })

  test('modelExtent does not depend on when it is first read', () => {

    const [modelEager, extractionEager] = load()
    const eager = extractionEager.modelExtent

    expect(tessellateAll( modelEager, extractionEager )).toBeGreaterThan(0)

    const [modelLate, extractionLate] = load()

    expect(tessellateAll( modelLate, extractionLate )).toBeGreaterThan(0)

    expect(extractionLate.modelExtent).toBe(eager)
  })

  test('a larger model extent floors the target and costs fewer triangles', () => {

    const [model, extraction] = load()
    const unfloored = tessellateAll( model, extraction )

    expect(unfloored).toBeGreaterThan(0)

    // Stand the fixture's faces in for a mosaic tile: at this extent the
    // floor (1e-5 of it) sits well above every face's own 0.1%-of-itself
    // target, which is exactly the Arty_Z7 silkscreen's situation. Reverting
    // the native change makes this equal `unfloored` instead.
    const [flooredModel, flooredExtraction] = load()
    const descriptor =
      Object.getOwnPropertyDescriptor(
          AP214GeometryExtraction.prototype, 'modelExtent' )!

    Object.defineProperty(
        AP214GeometryExtraction.prototype,
        'modelExtent',
        { get: () => MOSAIC_MODEL_EXTENT, configurable: true } )

    let floored: number

    try {
      floored = tessellateAll( flooredModel, flooredExtraction )
    } finally {
      Object.defineProperty(
          AP214GeometryExtraction.prototype, 'modelExtent', descriptor )
    }

    expect(floored).toBeGreaterThan(0)
    expect(floored).toBeLessThan(unfloored)
  })
})
