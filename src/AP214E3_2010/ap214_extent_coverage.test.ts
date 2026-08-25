import fs from 'fs'
import path from 'path'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { advanced_face } from './AP214E3_2010_gen'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'


/** Where the in-repo geometry fixtures live. */
const FIXTURE_DIRECTORY = 'data'

/**
 * Three representations, each reaching its geometry by a different path: a
 * `shape_representation` SUBTYPE, a BREP reachable only through a
 * `styled_item`, and a `face_based_surface_model`. The collector mirrors the
 * first and third and deliberately does not follow the second.
 */
const ARMS_FIXTURE = 'ap214-reachability-arms.step'

/** Advanced faces that fixture tessellates — one per arm. */
const ARMS_FACE_COUNT = 3

/**
 * Of those, the one the collector deliberately does not reach: the BREP whose
 * only path is a `styled_item`. Asserted as an exact count rather than
 * tolerated, so that a change which started reaching it again fails here too
 * — the decision is pinned in both directions.
 */
const ARMS_UNREACHED_FACE_COUNT = 1

/**
 * A whole sphere: one advanced face bounded by a single `vertex_loop`, so
 * its representation's topological vertices are one point and its extent is
 * legitimately zero.
 */
const DEGENERATE_FIXTURE = 'sphere-vertex-loop.step'

let conwayGeometry: ConwayGeometry


/**
 * Parse one fixture and build an extraction over it, without extracting.
 *
 * `representationExtentForFace` builds its table on first use, so a case
 * that only asks about extents does not need geometry.
 *
 * @param fixture File name within `data/`.
 * @return {[AP214StepModel, AP214GeometryExtraction]} The model and an
 * extraction over it.
 */
function load( fixture: string ): [AP214StepModel, AP214GeometryExtraction] {

  const parser = AP214StepParser.Instance
  const bufferInput =
    new ParsingBuffer( fs.readFileSync( path.join( FIXTURE_DIRECTORY, fixture ) ) )

  expect(parser.parseHeader( bufferInput )[ 1 ]).toBe(ParseResult.COMPLETE)

  const [, model] = parser.parseDataToModel( bufferInput )

  expect(model).toBeDefined()

  model!.nullOnErrors = true

  const extraction = new AP214GeometryExtraction( conwayGeometry, model! )

  expect(extraction.isInitialized()).toBe(true)

  return [model!, extraction]
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
 * Extract one fixture through the normal path and report its coverage.
 *
 * @param fixture File name within `data/`.
 * @return {{measured: number, missing: number, degenerate: number} |
 * undefined} The counters, or undefined if the file is not an AP214 model
 * this parser can read (the header-only schema stubs).
 */
function coverageOf( fixture: string ):
  { measured: number, missing: number, degenerate: number } | undefined {

  const parser = AP214StepParser.Instance
  const buffer: Buffer = fs.readFileSync( path.join( FIXTURE_DIRECTORY, fixture ) )
  const bufferInput = new ParsingBuffer( buffer )

  if ( parser.parseHeader( bufferInput )[ 1 ] !== ParseResult.COMPLETE ) {
    return void 0
  }

  const [, model] = parser.parseDataToModel( bufferInput )

  if ( model === void 0 ) {
    return void 0
  }

  model.nullOnErrors = true

  const extraction = new AP214GeometryExtraction( conwayGeometry, model )

  if ( !extraction.isInitialized() ) {
    return void 0
  }

  extraction.extractAP214GeometryData()

  return {
    measured: extraction.extentMeasuredFaceCount,
    missing: extraction.extentMissingFaceCount,
    degenerate: extraction.extentDegenerateFaceCount,
  }
}


// The deflection-floor table is a MIRROR of extraction's own reachability:
// it walks representations to faces independently, and a face extraction
// reaches by a path the walk does not know about silently loses its floor —
// no error, no warning, just slower geometry. Three review findings on
// conway#564 were that same defect in different arms, and two of the three
// bit no model in the public corpus.
//
// Rather than keep the two traversals in sync by inspection, this asserts
// only that they AGREE, which is checkable and does not rot: if extraction
// later grows an arm nobody mirrors, a face turns up with no extent and this
// fails without anyone having remembered to update a list.
describe('AP214 deflection-floor coverage (bldrs-ai/conway#564 §5)', () => {

  beforeAll(async () => {
    conwayGeometry = new ConwayGeometry()

    expect(await conwayGeometry.initialize()).toBe(true)
  })

  test('the reachability fixture reaches every arm but the styled one', () => {

    const coverage = coverageOf( ARMS_FIXTURE )

    expect(coverage).toBeDefined()

    // The denominator FIRST, and exactly — one face per arm. Asserting the
    // unreached count on its own passes just as happily when nothing was
    // tessellated at all, which is how a guard ends up asserting nothing
    // (see the peakWasmHeapMb note in scripts/benchmark.cjs).
    expect(coverage!.measured).toBe(ARMS_FACE_COUNT)

    // Exactly one, not "at most one": the subtype and face-based arms must
    // still be reached, and the styled arm must still NOT be. Following
    // styled items is the one unsafe direction in this walk, so it is pinned
    // rather than merely permitted — see collectItemFaces.
    expect(coverage!.missing).toBe(ARMS_UNREACHED_FACE_COUNT)
  })

  // The distinction this test exists to keep honest. The whole-sphere
  // fixture is ONE advanced face whose only bound is a `vertex_loop` at the
  // pole, so its representation's entire topological-vertex set is a single
  // point and the box has zero diagonal — reached, but carrying no extent.
  // That face correctly gets no floor. Folding it in with the unreached
  // faces would make the invariant below permanently false and the counter
  // meaningless, which is exactly what this test caught on its first run.
  test('a body whose topology carries no extent is degenerate, not unreached', () => {

    const coverage = coverageOf( DEGENERATE_FIXTURE )

    expect(coverage).toBeDefined()
    expect(coverage!.measured).toBe(1)
    expect(coverage!.missing).toBe(0)
    expect(coverage!.degenerate).toBe(1)
  })

  // Following styled items is the one direction in which being too generous
  // is the DANGEROUS error: a target extraction will not tessellate would
  // fold its vertices into the representation's extent and make the floor
  // COARSER for every face that does render. Every other gap in this
  // collector merely loses savings. So the arm is not followed at all, and
  // the consequence — no floor for a face reachable only that way — is
  // asserted here rather than left implicit.
  test('a face reachable only through a styled_item gets no floor', () => {

    const [model, extraction] = load( ARMS_FIXTURE )

    expect(extraction.representationExtentForFace(
        faceNamed( model, 'unfloored styled face' ) )).toBe(0)
  })

  test('no fixture in data/ tessellates an unexpectedly unreached face', () => {

    const fixtures =
      fs.readdirSync( FIXTURE_DIRECTORY )
          .filter( ( name ) => /\.(step|stp)$/i.test( name ) )
          .sort()

    expect(fixtures.length).toBeGreaterThan(0)

    // Read from the directory rather than a list, so a fixture added later
    // is covered without anyone opting it in.
    const offenders: string[] = []
    let totalMeasured = 0

    for ( const fixture of fixtures ) {

      const coverage = coverageOf( fixture )

      if ( coverage === void 0 ) {
        continue
      }

      totalMeasured += coverage.measured

      // Only `missing` — a face the walk never reached. A degenerate extent
      // is a property of the model, not a disagreement between the two
      // traversals, and this test is about the disagreement.
      //
      // The arms fixture is the one place unreached faces are EXPECTED, and
      // its exact count is pinned by the case above; every other fixture must
      // be clean.
      const allowed = fixture === ARMS_FIXTURE ? ARMS_UNREACHED_FACE_COUNT : 0

      if ( coverage.missing !== allowed ) {
        offenders.push(
            `${fixture}: ${coverage.missing} of ${coverage.measured}, expected ${allowed}` )
      }
    }

    expect(totalMeasured).toBeGreaterThan(ARMS_FACE_COUNT)
    expect(offenders).toEqual([])
  })
})
