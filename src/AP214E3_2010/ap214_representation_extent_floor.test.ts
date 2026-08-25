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
 * Two advanced-brep representations of very different size — one spanning
 * 1000 units, one spanning 1 — whose unit contexts also differ (millimetre
 * and metre). A model-wide extent has no single value that is right for
 * both; the defining representation's extent does.
 */
const TWO_REPRESENTATION_FIXTURE = 'data/ap214-two-representations.step'

/**
 * The control: identical in every respect except that both contexts declare
 * millimetres. Pairing them is what makes the unit declaration the only
 * variable.
 */
const TWO_REPRESENTATION_ONE_UNIT_FIXTURE =
  'data/ap214-two-representations-one-unit.step'

/** The large body's span in the two-representation fixtures, in file units. */
const LARGE_BODY_SPAN = 1000

/**
 * Extent stood in for the fixture in the floored case. Far larger than the
 * ~100-unit tube, so 1e-5 of it clears every face's own 0.1%-of-itself
 * target — the Arty_Z7 silkscreen's situation, where each face is a tile of
 * a far larger object.
 */
const MOSAIC_EXTENT = 1e6

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
 * Any face's localID, for the single-representation cases.
 *
 * @param model The parsed model.
 * @return {number} The first advanced face's localID.
 */
function anyFace( model: AP214StepModel ): number {

  const first = Array.from( model.types( advanced_face ) )[ 0 ]

  expect(first).toBeDefined()

  return first.localID
}


describe('AP214 representation-extent deflection floor (bldrs-ai/conway#564 §5)', () => {

  beforeAll(async () => {
    conwayGeometry = new ConwayGeometry()

    expect(await conwayGeometry.initialize()).toBe(true)
  })

  test('the extent is the bounding diagonal of the representation\'s vertices', () => {

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
    // method that always returned 0 — the "probe that never fired" failure.
    expect(vertices).toBeGreaterThan(0)

    // The fixture is a single representation, so its extent and the model's
    // vertex box are the same thing.
    const extent = extraction.representationExtentForFace( anyFace( model ) )

    expect(extent).toBeCloseTo(Math.hypot(maxX - minX, maxY - minY, maxZ - minZ), 9)
    expect(extent).toBeGreaterThan(0)
  })

  test('the extent is pinned: extracting geometry does not move it', () => {

    const [model, extraction] = load()

    // Read it FIRST, so the table is populated before any geometry exists,
    // then again after the whole model has been tessellated. Under the
    // demand pump and the preview channel's prefix snapshots a value that
    // tracked geometry as it accumulated would make the deflection target
    // depend on scheduling, which surfaces as nondeterministic digests.
    const face = anyFace( model )
    const before = extraction.representationExtentForFace( face )

    expect(before).toBeGreaterThan(0)
    expect(tessellateAll( model, extraction )).toBeGreaterThan(0)

    expect(extraction.representationExtentForFace( face )).toBe(before)
  })

  test('the extent does not depend on when it is first read', () => {

    const [modelEager, extractionEager] = load()
    const eager = extractionEager.representationExtentForFace( anyFace( modelEager ) )

    expect(eager).toBeGreaterThan(0)
    expect(tessellateAll( modelEager, extractionEager )).toBeGreaterThan(0)

    const [modelLate, extractionLate] = load()

    expect(tessellateAll( modelLate, extractionLate )).toBeGreaterThan(0)

    expect(extractionLate.representationExtentForFace( anyFace( modelLate ) )).toBe(eager)
  })

  // The scope test. A model-wide extent would hand both of these faces the
  // same number; the defining representation's extent hands each its own.
  test('each face gets its own defining representation\'s extent', () => {

    const [model, extraction] = load( TWO_REPRESENTATION_FIXTURE )

    expect(extraction.representationExtentForFace( faceNamed( model, 'large face' ) ))
        .toBeCloseTo(Math.sqrt(3) * LARGE_BODY_SPAN, 6)
    expect(extraction.representationExtentForFace( faceNamed( model, 'small face' ) ))
        .toBeCloseTo(Math.sqrt(3), 9)
  })

  // The unit context reaches the scene transform, not the tessellation: both
  // sides of the comparison the native floor makes are raw coordinates from
  // one representation. So declaring the small body in metres rather than
  // millimetres must change nothing here. If it ever does, a unit conversion
  // has crept back into this path.
  test('the extents do not depend on the declared length units', () => {

    const [mixed, mixedExtraction] = load( TWO_REPRESENTATION_FIXTURE )
    const [oneUnit, oneUnitExtraction] = load( TWO_REPRESENTATION_ONE_UNIT_FIXTURE )

    for ( const name of ['large face', 'small face'] ) {

      expect(oneUnitExtraction.representationExtentForFace( faceNamed( oneUnit, name ) ))
          .toBe(mixedExtraction.representationExtentForFace( faceNamed( mixed, name ) ))
    }
  })

  test('a face no representation reaches gets no floor', () => {

    const [, extraction] = load( TWO_REPRESENTATION_FIXTURE )

    // A localID no face owns stands in for a face the representation walk
    // does not reach. Zero is what the native side reads as "no floor",
    // i.e. the pre-#564 per-face target.
    const unreached = -1

    expect(extraction.representationExtentForFace( unreached )).toBe(0)
  })

  test('a larger representation extent floors the target and costs fewer triangles', () => {

    const [model, extraction] = load()
    const unfloored = tessellateAll( model, extraction )

    expect(unfloored).toBeGreaterThan(0)

    // Stand the fixture's faces in for a mosaic tile: at this extent the
    // floor (1e-5 of it) sits well above every face's own 0.1%-of-itself
    // target, which is exactly the Arty_Z7 silkscreen's situation. Reverting
    // the native change makes this equal `unfloored` instead.
    const [flooredModel, flooredExtraction] = load()
    const original = AP214GeometryExtraction.prototype.representationExtentForFace

    AP214GeometryExtraction.prototype.representationExtentForFace = () => MOSAIC_EXTENT

    let floored: number

    try {
      floored = tessellateAll( flooredModel, flooredExtraction )
    } finally {
      AP214GeometryExtraction.prototype.representationExtentForFace = original
    }

    expect(floored).toBeGreaterThan(0)
    expect(floored).toBeLessThan(unfloored)
  })
})
