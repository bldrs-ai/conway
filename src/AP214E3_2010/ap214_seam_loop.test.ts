import { describe, expect, test } from '@jest/globals'
import { hasSeamEdgePair, isRetracingSeamLoop } from './ap214_geometry_extraction'

/* eslint-disable no-magic-numbers -- the localIDs below are fixture labels,
   not quantities of the code under test; naming them would move the evidence
   away from the assertions that rest on it. */

/**
 * Build an ORIENTED_EDGE stand-in: the only two fields the predicate reads.
 *
 * @param localID The underlying EDGE_CURVE's local ID.
 * @param orientation The oriented edge's sense.
 * @return {object} A minimal oriented-edge shape.
 */
function edge(localID: number, orientation: boolean) {
  return { orientation, edge_element: { localID } }
}


describe('isRetracingSeamLoop', () => {

  test('the two-edge seam: one curve walked forward and back', () => {

    // The spelling on Orbiter's `#50626`: EDGE_LOOP #9128 walks EDGE_CURVE
    // #28750 with .T. and then .F. (bldrs-ai/conway#595).
    expect(isRetracingSeamLoop([edge(28750, true), edge(28750, false)])).toBe(true)
  })

  test('order within the loop does not matter', () => {

    expect(isRetracingSeamLoop([edge(28750, false), edge(28750, true)])).toBe(true)
  })

  test('a multi-edge seam: out along A then B, back along B then A', () => {

    expect(isRetracingSeamLoop([
      edge(1, true), edge(2, true), edge(2, false), edge(1, false),
    ])).toBe(true)
  })

  test('a narrow lune is rejected however thin it is', () => {

    // THE case codex raised on bldrs-ai/conway-geom#187, and the reason this
    // predicate is topological rather than geometric. A lune is bounded by
    // two DIFFERENT meridians, so its enclosed area falls continuously toward
    // zero as its angular width shrinks — which the area-based predicate this
    // replaced would eventually have read as full coverage, silently swapping
    // a genuine narrow trim for the entire sphere.
    //
    // Width is not an input here, so no width can change the answer. The two
    // cases below are the same lune at two widths as far as this predicate is
    // concerned: two distinct edge curves, once each.
    expect(isRetracingSeamLoop([edge(101, true), edge(102, false)])).toBe(false)
    expect(isRetracingSeamLoop([edge(101, true), edge(102, true)])).toBe(false)
  })

  test('asymmetric sampling of the two legs does not matter', () => {

    // The other finding on #187: the replaced area predicate summed cross
    // products, which cancel term-for-term only when the two legs carry the
    // same number of points — two halves of a great circle at 23 and 24
    // segments landed near 1e-5 and would have been missed. This predicate
    // never reads the point lists, so sampling cannot reach it.
    expect(isRetracingSeamLoop([edge(7, true), edge(7, false)])).toBe(true)
  })

  test('the same curve twice in the SAME direction is not a retrace', () => {

    // Traversed twice the same way, the loop covers the curve twice rather
    // than returning along it, so it is not a seam.
    expect(isRetracingSeamLoop([edge(5, true), edge(5, true)])).toBe(false)
    expect(isRetracingSeamLoop([edge(5, false), edge(5, false)])).toBe(false)
  })

  test('an ordinary trim loop of distinct edges is rejected', () => {

    expect(isRetracingSeamLoop([
      edge(1, true), edge(2, true), edge(3, true), edge(4, true),
    ])).toBe(false)
  })

  test('an edge appearing four times is rejected', () => {

    // Each edge must appear EXACTLY twice; a balanced net of zero is not
    // enough on its own.
    expect(isRetracingSeamLoop([
      edge(9, true), edge(9, false), edge(9, true), edge(9, false),
    ])).toBe(false)
  })

  test('odd edge counts and empty loops are rejected', () => {

    expect(isRetracingSeamLoop([])).toBe(false)
    expect(isRetracingSeamLoop([edge(1, true)])).toBe(false)
    expect(isRetracingSeamLoop([edge(1, true), edge(1, false), edge(2, true)])).toBe(false)
  })

  test('a missing edge element is rejected rather than throwing', () => {

    expect(isRetracingSeamLoop([
      { orientation: true, edge_element: undefined },
      edge(1, false),
    ] as unknown as Parameters<typeof isRetracingSeamLoop>[0])).toBe(false)
  })
})


describe('hasSeamEdgePair', () => {

  test("the spring's loop: two circles plus one seam curve walked both ways", () => {

    // Orbiter's `#50977`, EDGE_LOOP #9507 — the coil spring of solid 970
    // (bldrs-ai/conway#611). Edges 2 and 4 are the same EDGE_CURVE #29690
    // with opposite senses; the two CIRCLEs are unpaired.
    const springLoop = [
      edge(29689, true),
      edge(29690, true),
      edge(29691, false),
      edge(29690, false),
    ]

    expect(hasSeamEdgePair(springLoop)).toBe(true)

    // And it is NOT a retracing loop: it encloses the whole chart rather than
    // nothing, so the two predicates must disagree on it. This is the case
    // that distinguishes them, so asserting both here is the point.
    expect(isRetracingSeamLoop(springLoop)).toBe(false)
  })

  test('a fully retracing loop contains a pair by definition', () => {

    expect(hasSeamEdgePair([edge(28750, true), edge(28750, false)])).toBe(true)
  })

  test('an ordinary trim loop of distinct edges has no pair', () => {

    // Four different curves, each once: a plain rectangular trim. Nothing here
    // wraps a seam, so a full-coverage grid must not be reached.
    expect(hasSeamEdgePair([
      edge(1, true), edge(2, true), edge(3, false), edge(4, false),
    ])).toBe(false)
  })

  test('a narrow lune is rejected however thin it is', () => {

    // The same false positive codex raised on conway-geom#187, which this
    // predicate must also be immune to: a lune is two DIFFERENT curves, so no
    // width makes it pair. Width is not an input.
    expect(hasSeamEdgePair([edge(101, true), edge(102, false)])).toBe(false)
  })

  test('the same curve twice in the SAME direction is not a seam', () => {

    // A seam is walked once each way. Two identical senses is a malformed or
    // doubled loop, not a face that wraps the surface, and reading it as full
    // coverage would pave over whatever it really bounds.
    expect(hasSeamEdgePair([edge(7, true), edge(7, true), edge(8, false)])).toBe(false)
  })

  test('an edge appearing three times is not a clean pair', () => {

    expect(hasSeamEdgePair([
      edge(7, true), edge(7, false), edge(7, true), edge(8, false),
    ])).toBe(false)
  })

  test('a seam pair is found among unrelated edges, in any position', () => {

    expect(hasSeamEdgePair([
      edge(1, true), edge(9, true), edge(2, true), edge(9, false), edge(3, true),
    ])).toBe(true)
  })

  test('loops too short to pair, and edges with no identity', () => {

    expect(hasSeamEdgePair([])).toBe(false)
    expect(hasSeamEdgePair([edge(1, true)])).toBe(false)
    expect(hasSeamEdgePair(
        [{ orientation: true, edge_element: {} },
          { orientation: false, edge_element: {} }] as
        unknown as Parameters<typeof hasSeamEdgePair>[0])).toBe(false)
  })
})
