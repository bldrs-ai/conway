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
 * Two shape representations whose unit contexts declare different length
 * units — millimetres spanning 1000 units and metres spanning 1, i.e. the
 * same physical size written two ways.
 */
const MIXED_UNIT_FIXTURE = 'data/ap214-mixed-units.step'

/**
 * The control: identical to MIXED_UNIT_FIXTURE, including both bodies'
 * coordinates, except that the second context also declares millimetres.
 * Pairing them is what makes the unit declaration the only variable.
 */
const SINGLE_UNIT_TWIN_FIXTURE = 'data/ap214-single-unit-twin.step'

/**
 * Extent stood in for the fixture in the floored case. Far larger than the
 * ~100-unit tube, so 1e-5 of it clears every face's own 0.1%-of-itself
 * target — the Arty_Z7 silkscreen's situation, where each face is a tile of
 * a far larger object.
 */
const MOSAIC_MODEL_EXTENT = 1e6

/** The millimetre body's span in the mixed-unit fixtures, in file units. */
const MM_BODY_SPAN = 1000

let conwayGeometry: ConwayGeometry


/**
 * Parse the fixture into a fresh model and extraction.
 *
 * A fresh pair per case on purpose: `extractFaces` writes into the model's
 * geometry store, so two tessellations of the same face cannot share one.
 *
 * @param fixture Path to the STEP fixture to parse.
 * @return {[AP214StepModel, AP214GeometryExtraction]} The parsed model and
 * an extraction over it.
 */
function load( fixture: string = FIXTURE ): [AP214StepModel, AP214GeometryExtraction] {
  const parser = AP214StepParser.Instance
  const buffer: Buffer = fs.readFileSync(fixture)
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


/**
 * The localID of the uniquely-named advanced face in a fixture.
 *
 * @param model The parsed model.
 * @param name The face's STEP name.
 * @return {number} That face's localID.
 */
function faceNamed( model: AP214StepModel, name: string ): number {

  const matches = Array.from( model.types( advanced_face ) ).filter( ( f ) => f.name === name )

  expect(matches.length).toBe(1)

  return matches[ 0 ].localID
}


/**
 * Any face's localID, for the single-unit cases where every face shares one.
 *
 * @param model The parsed model.
 * @return {number} The first advanced face's localID.
 */
function anyFace( model: AP214StepModel ): number {

  const first = Array.from( model.types( advanced_face ) )[ 0 ]

  expect(first).toBeDefined()

  return first.localID
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

    const extent = extraction.modelExtentForFace( anyFace( model ) )

    expect(extent).toBeCloseTo(Math.hypot(maxX - minX, maxY - minY, maxZ - minZ), 9)
    expect(extent).toBeGreaterThan(0)
  })

  test('modelExtent is pinned: extracting geometry does not move it', () => {

    const [model, extraction] = load()

    // Read it FIRST, so the memo is populated before any geometry exists,
    // then again after the whole model has been tessellated. Under the
    // demand pump and the preview channel's prefix snapshots a value that
    // tracked geometry as it accumulated would make the deflection target
    // depend on scheduling, which surfaces as nondeterministic digests.
    const face = anyFace( model )
    const before = extraction.modelExtentForFace( face )

    expect(before).toBeGreaterThan(0)
    expect(tessellateAll( model, extraction )).toBeGreaterThan(0)

    expect(extraction.modelExtentForFace( face )).toBe(before)
  })

  test('modelExtent does not depend on when it is first read', () => {

    const [modelEager, extractionEager] = load()
    const eager = extractionEager.modelExtentForFace( anyFace( modelEager ) )

    expect(eager).toBeGreaterThan(0)
    expect(tessellateAll( modelEager, extractionEager )).toBeGreaterThan(0)

    const [modelLate, extractionLate] = load()

    expect(tessellateAll( modelLate, extractionLate )).toBeGreaterThan(0)

    expect(extractionLate.modelExtentForFace( anyFace( modelLate ) )).toBe(eager)
  })

  // A single scalar extent only means anything if every coordinate it spans
  // is in one unit, and AP214 takes the length unit from each
  // shape_representation's own context — which is why rootUnitScaleTransform
  // is applied per root. These two fixtures differ ONLY in the second
  // context's length unit, so they isolate that.
  test('a single-unit model gives every face the same raw vertex box', () => {

    const [model, extraction] = load( SINGLE_UNIT_TWIN_FIXTURE )

    // Both bodies are millimetre-declared and span (0,0,0)..(1000,1000,1000)
    // and (0,0,0)..(1,1,1), so the box is sqrt(3) * 1000 for both faces.
    const expected = Math.sqrt(3) * MM_BODY_SPAN

    expect(extraction.modelExtentForFace( faceNamed( model, 'mm face' ) ))
        .toBeCloseTo(expected, 6)
    expect(extraction.modelExtentForFace( faceNamed( model, 'second face' ) ))
        .toBeCloseTo(expected, 6)
  })

  test('a mixed-unit model gives each face the extent in its own unit', () => {

    const [model, extraction] = load( MIXED_UNIT_FIXTURE )

    // Identical to the twin except that the second representation's context
    // declares metres rather than millimetres. The model is sqrt(3) metres
    // across either way — the two bodies are the same physical size written
    // two ways — so the millimetre face must see sqrt(3) * 1000 and the
    // metre face sqrt(3). Handing both the same number would put one of
    // them's floor three decades out.
    expect(extraction.modelExtentForFace( faceNamed( model, 'mm face' ) ))
        .toBeCloseTo(Math.sqrt(3) * MM_BODY_SPAN, 6)
    expect(extraction.modelExtentForFace( faceNamed( model, 'm face' ) ))
        .toBeCloseTo(Math.sqrt(3), 9)
  })

  test('an unmapped face falls back to the coarsest declared unit', () => {

    const [model, extraction] = load( MIXED_UNIT_FIXTURE )

    // A localID no face owns stands in for a face the representation walk
    // does not reach. The fallback has to be the LARGEST unit — metres here
    // — because that is the smallest extent number and so the finest floor.
    const unmapped = -1

    expect(extraction.modelExtentForFace( unmapped ))
        .toBeCloseTo(extraction.modelExtentForFace( faceNamed( model, 'm face' ) ), 9)
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
    const original = AP214GeometryExtraction.prototype.modelExtentForFace

    AP214GeometryExtraction.prototype.modelExtentForFace = () => MOSAIC_MODEL_EXTENT

    let floored: number

    try {
      floored = tessellateAll( flooredModel, flooredExtraction )
    } finally {
      AP214GeometryExtraction.prototype.modelExtentForFace = original
    }

    expect(floored).toBeGreaterThan(0)
    expect(floored).toBeLessThan(unfloored)
  })
})
