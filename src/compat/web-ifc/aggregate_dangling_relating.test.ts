/* eslint-disable no-magic-numbers */
// conway#708 / bldrs-ai/ops#28: conway never THROWS on a dangling or
// mistyped STEP reference — it skips the entity, counts it and reports it.
//
// The path here is the one that still did throw. On a windowed source the
// demand pump prefetches each IfcRelAggregates before stepping it
// (ExtractGeometryBatchAsync -> beginAggregateExtract ->
// AggregateExtractPager.begin -> ensureResidentForAggregateBase), and that
// prefetch reads `relAggregate.RelatingObject` to page the relating
// product's closure. A relationship whose relating object cannot be typed
// threw out of the getter, out of the pager, out of the batch call, and
// took the load with it — Sentry SHARE-1PA, a SketchUp Pro 2015 IFC4X3_RC2
// export.
//
// Both tests drive the real load path (OpenModelStream + DEFER_GEOMETRY +
// ExtractGeometryBatchAsync, which is what Share runs) over
// data/aggregate_dangling_relating.ifc, whose three relationships are one
// control plus one per flavour of unresolved reference. See that file's
// header for the express ids.
import * as fs from 'fs'

import { afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals'

import Logger, { DATA_DEFECT } from '../../logging/logger'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { FlatMesh, IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

/** The two relationships whose RelatingObject cannot be resolved. */
const DEFECTIVE_RELATIONSHIPS = [ '500', '600' ]

/** The part under the control relationship — the geometry a skip must not cost. */
const CONTROL_PART_EXPRESS_ID = 1000

/** Parts under the two defective relationships. */
const SKIPPED_PART_EXPRESS_IDS = [ 1020, 1040 ]

const TEST_TIMEOUT_MS = 240000

let api: IfcAPI
let buffer: Uint8Array

/**
 * Pump a windowed deferred open to completion, one call at a time — the
 * shape Share's load takes, and the only one that reaches the aggregate
 * prefetch (`ensureResidentForAggregateBase` returns immediately on a
 * fully resident model, so a classic open never calls the throwing getter
 * from there).
 *
 * @return {Promise<number[]>} Express IDs of every mesh delivered.
 */
async function pumpWindowed(): Promise< number[] > {

  const store = new InMemoryStepByteStore( buffer )
  const modelID = await api.OpenModelStream(
      store, { ...SETTINGS, DEFER_GEOMETRY: true } )

  expect( modelID ).toBeGreaterThanOrEqual( 0 )
  expect( api.getPassthrough( modelID )!.sourceIsExternal ).toBe( true )

  const captured: number[] = []

  for ( ; ; ) {

    // eslint-disable-next-line new-cap
    const { extracted, remaining } = await api.ExtractGeometryBatchAsync(
        modelID, 4, ( mesh: FlatMesh ) => {
          captured.push( mesh.expressID )
        } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  api.CloseModel( modelID )

  return captured
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array(
      fs.readFileSync( 'data/aggregate_dangling_relating.ifc' ) )
}, TEST_TIMEOUT_MS )

beforeEach( () => {
  // The diagnostics are the assertion subject here, and Logger's buffer is
  // static — a leftover entry from another suite would be counted as this
  // load's.
  Logger.clearLogs()

  // Diverted, not silenced: the assertions read the buffer, which the sink
  // does not feed, so the expected diagnostics stay checkable while the test
  // console stays clean.
  Logger.setSink( () => { /* diverted — the buffer is what is asserted */ } )
} )

afterEach( () => {
  Logger.setSink()
  Logger.clearLogs()
} )

describe( 'unresolved IfcRelAggregates.RelatingObject (conway#708)', () => {

  test( 'the windowed pump completes and still delivers the intact ' +
    'relationship\'s geometry', async () => {

    const meshes = await pumpWindowed()

    // Reaching here at all is the fix: pre-fix this rejected out of
    // ExtractGeometryBatchAsync with "Value in STEP was incorrectly typed"
    // on the FIRST relationship, so nothing below ran.
    expect( meshes ).toContain( CONTROL_PART_EXPRESS_ID )

    // And the skip is a skip, not a silent half-build: a relationship whose
    // relating object cannot be read is abandoned by the aggregates pass, so
    // its related parts — which the product pass deferred precisely because
    // they are aggregate targets — carry no geometry. Asserted rather than
    // left implicit because "the load finished" would read the same if the
    // pass had extracted them uncut.
    for ( const skipped of SKIPPED_PART_EXPRESS_IDS ) {
      expect( meshes ).not.toContain( skipped )
    }
  }, TEST_TIMEOUT_MS )

  test( 'both skips land in one counted, data-defect-marked diagnostic', async () => {

    await pumpWindowed()

    const defects = Logger.getDataDefects()

    expect( defects.length ).toBe( 1 )

    const [ defect ] = defects

    expect( defect.category ).toBe( DATA_DEFECT )

    // One entry, count 2 — the mistyped relationship and the dangling one.
    // This is the part that a message carrying the error text cannot do:
    // DanglingReferenceError spells "#9999" into its own message, and
    // Logger dedups on the message, so interpolating it would give two
    // entries of count 1 and no number worth reporting.
    expect( defect.count ).toBe( DEFECTIVE_RELATIONSHIPS.length )
    expect( [ ...defect.expressIDs ].sort() ).toEqual( DEFECTIVE_RELATIONSHIPS )

    // Named, so a reader can go look the relationship up in the file rather
    // than being told only that something was dropped.
    expect( defect.message ).toContain( 'Skipping IfcRelAggregates' )
  }, TEST_TIMEOUT_MS )

  test( 'a classic fully resident open reports the same two skips', () => {

    // The prefetch is windowed-only, but the pass that abandons the
    // relationship is not — this pins that the reporting site is shared, so
    // the two entry paths cannot drift into describing one defect two ways.
    const modelID = api.OpenModel( buffer, SETTINGS )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )

    // Read BEFORE StreamAllMeshes: a classic open extracts at open time,
    // and StreamAllMeshes ends by calling Logger.clearLogs() (ifc_api.ts),
    // so the diagnostics are gone by the time the meshes arrive.
    const defects = Logger.getDataDefects()

    expect( defects.length ).toBe( 1 )
    expect( defects[ 0 ].count ).toBe( DEFECTIVE_RELATIONSHIPS.length )
    expect( [ ...defects[ 0 ].expressIDs ].sort() ).toEqual( DEFECTIVE_RELATIONSHIPS )

    const captured: number[] = []

    api.StreamAllMeshes( modelID, ( mesh: FlatMesh ) => {
      captured.push( mesh.expressID )
    } )

    api.CloseModel( modelID )

    expect( captured ).toContain( CONTROL_PART_EXPRESS_ID )
  }, TEST_TIMEOUT_MS )
} )
