/* eslint-disable no-magic-numbers */
// A sharded model that recentres — the second of M3's two shard blockers.
//
// COORDINATE_TO_ORIGIN derives its anchor from the FIRST geometry an instance
// captures, so N workers starting on different products derive N frames and
// reassemble a model shifted between shards. SetCoordinationFrame makes the
// frame an input instead, so every worker applies the same one.
//
// The fixture is georeferenced (~1.6e6, ~8.2e6 m) AND spans several recentre
// cells, both on purpose, because a weaker one makes these tests unable to
// fail. Every other IFC fixture in `data/` sits at the origin, where a
// derived frame and a wrong one both compose to roughly zero. And a
// georeferenced model inside ONE cell is barely better: recentring snaps to a
// 1 km grid (COORDINATION_SNAP_M), so shards whose first products sit 80 m
// apart quantize to the same frame and agree by accident. Spreading the
// products across cells is what makes a per-shard anchor observable — which
// is exactly the condition the original refusal named.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { COORDINATION_SNAP_M } from './coordination_f64'
import { IfcAPI } from './ifc_api'


const DEFERRED_RECENTRED = {
  COORDINATE_TO_ORIGIN: true,
  USE_FAST_BOOLS: true,
  DEFER_GEOMETRY: true,
}

/* A frame no derivation would produce for this model: the Z-up -> Y-up
 * normalize with a kilometre bolted on where the georeference belongs. Used
 * only to show that a supplied frame is not quietly ignored. */
const ARBITRARY_FRAME = [
  1, 0, 0, 0,
  0, 0, -1, 0,
  0, 1, 0, 0,
  1000, 2000, 3000, 1,
]

let fixture: Uint8Array

beforeAll( () => {

  fixture = new Uint8Array(
      fs.readFileSync( 'data/index_georeferenced_multicell.ifc' ) )
} )


/**
 * One model, on its own engine instance, opened the way Share opens —
 * store-backed, windowed, deferred, recentred.
 *
 * A fresh IfcAPI per model rather than one shared across the file: reusing an
 * instance for a second deferred model returns garbage native transforms
 * today, which flush to zero and collapse every placement onto the origin
 * (conway#537 — reproduces on main, unrelated to this change). These tests
 * compare placement sets between models, so a shared instance would compare
 * two sets of zeros and pass no matter what this code did.
 *
 * @return {Promise<object>} An initialised API and its open model.
 */
async function openIsolated(): Promise< { api: IfcAPI, modelID: number } > {

  const api = new IfcAPI()

  await api.Init()

  const modelID = await api.OpenModelStream(
      new InMemoryStepByteStore( fixture ), DEFERRED_RECENTRED )

  return { api, modelID }
}


/**
 * Drain a model's pump, keyed by express ID.
 *
 * @param api The model's engine.
 * @param modelID An open deferred model.
 * @return {Promise<Map>} expressID -> each placement's flat transform.
 */
async function pumpPlacements(
    api: IfcAPI,
    modelID: number ): Promise< Map< number, number[][] > > {

  const placements = new Map< number, number[][] >()

  for ( ; ; ) {

    const { extracted, remaining } = await api.ExtractGeometryBatchAsync(
        modelID, 8, ( mesh ) => {

          const transforms = placements.get( mesh.expressID ) ?? []

          for ( let where = 0; where < mesh.geometries.size(); ++where ) {

            transforms.push(
                Array.from( mesh.geometries.get( where ).flatTransformation ) )
          }

          placements.set( mesh.expressID, transforms )
        } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  return placements
}


/**
 * The frame a single unsharded instance derives for the fixture, plus the
 * placements it produces — the reference every case below is measured
 * against, and what a real coordinator would hand its pool.
 *
 * @return {Promise<object>} The derived frame and its placements.
 */
async function deriveReference():
    Promise< { frame: number[], placements: Map< number, number[][] > } > {

  const { api, modelID } = await openIsolated()

  const placements = await pumpPlacements( api, modelID )
  const frame = api.GetAppliedCoordinationMatrix( modelID )

  // Both fixture properties the tests below depend on, checked rather than
  // trusted — an edit to the fixture that quietly lost either would otherwise
  // leave these tests passing while measuring nothing.
  //
  // It recentres at all:
  expect( Math.abs( frame[ 12 ] ) + Math.abs( frame[ 14 ] ) )
      .toBeGreaterThan( COORDINATION_SNAP_M )

  // ...and it spans more than one recentre cell, so shards that derived their
  // own anchors would land on DIFFERENT frames rather than agreeing by
  // quantization.
  const spans = [ ...placements.values() ].flat().map( ( each ) => each[ 12 ] )

  expect( Math.max( ...spans ) - Math.min( ...spans ) )
      .toBeGreaterThan( COORDINATION_SNAP_M )
  expect( placements.size ).toBeGreaterThan( 1 )

  api.CloseModel( modelID )

  return { frame, placements }
}


describe( 'SetCoordinationFrame', () => {

  test( 'is what lets a recentred model be sharded at all', async () => {

    // The refusal that blocked Share specifically: its opens set
    // COORDINATE_TO_ORIGIN, so before this seam existed no Share-shaped open
    // could claim a shard, on any source.
    const { api, modelID } = await openIsolated()

    expect( () => api.SetGeometryShard( modelID, { index: 0, count: 4 } ) )
        .toThrow( /SetCoordinationFrame/ )

    expect( api.SetCoordinationFrame( modelID, ARBITRARY_FRAME ) ).toBe( true )

    expect( () => api.SetGeometryShard( modelID, { index: 0, count: 4 } ) )
        .not.toThrow()

    // The pump re-checks the same preconditions from scratch (the settings
    // object belongs to the caller and can change under it), so lifting the
    // claim-time refusal alone would still refuse at the first batch.
    await expect( api.ExtractGeometryBatchAsync( modelID, 4 ) )
        .resolves.toBeDefined()

    api.CloseModel( modelID )
  }, 240000 )

  test( 'applies the frame it is given, exactly', async () => {

    // The coordinator's real workflow: derive once, hand the frame out.
    // Supplying an instance the frame another instance derived must place
    // identically to that instance — that is what makes N workers agree.
    const reference = await deriveReference()

    const supplied = await openIsolated()

    supplied.api.SetCoordinationFrame( supplied.modelID, reference.frame )

    const placements = await pumpPlacements( supplied.api, supplied.modelID )

    expect( supplied.api.GetAppliedCoordinationMatrix( supplied.modelID ) )
        .toEqual( reference.frame )
    expect( placements.size ).toBe( reference.placements.size )

    for ( const [ expressID, transforms ] of reference.placements ) {
      expect( placements.get( expressID ) ).toEqual( transforms )
    }

    supplied.api.CloseModel( supplied.modelID )

    // And a DIFFERENT frame must move the model, or the equality above would
    // hold just as well for an implementation that dropped the frame on the
    // floor and derived its own.
    const arbitrary = await openIsolated()

    arbitrary.api.SetCoordinationFrame( arbitrary.modelID, ARBITRARY_FRAME )

    const moved = await pumpPlacements( arbitrary.api, arbitrary.modelID )

    for ( const [ expressID, transforms ] of reference.placements ) {
      expect( moved.get( expressID ) ).not.toEqual( transforms )
    }

    arbitrary.api.CloseModel( arbitrary.modelID )
  }, 240000 )

  test( 'shards under one frame union to exactly the single instance',
      async () => {

        // M3's exit condition for this half: recentring ON, sharded, windowed
        // — Share's own open settings — and the union is the whole model with
        // nothing duplicated, dropped, or shifted between shards.
        const reference = await deriveReference()

        const shardCount = 3
        const union = new Map< number, number[][] >()

        for ( let index = 0; index < shardCount; ++index ) {

          const shard = await openIsolated()

          shard.api.SetCoordinationFrame( shard.modelID, reference.frame )
          shard.api.SetGeometryShard( shard.modelID, { index, count: shardCount } )

          for ( const [ expressID, transforms ] of
            await pumpPlacements( shard.api, shard.modelID ) ) {

            // A key already present means two shards claimed one product —
            // the duplication half of a bad partition, which comparing
            // merged sets at the end would hide.
            expect( union.has( expressID ) ).toBe( false )
            union.set( expressID, transforms )
          }

          shard.api.CloseModel( shard.modelID )
        }

        expect( union.size ).toBe( reference.placements.size )

        for ( const [ expressID, transforms ] of reference.placements ) {
          expect( union.get( expressID ) ).toEqual( transforms )
        }
      }, 240000 )

  test( 'can be cleared, handing the model back to deriving', async () => {

    // The undefined-matrix arm, which is the coordinator's way out: a pool
    // that decides not to shard after all should not be stuck in a frame it
    // supplied for shards that will never exist.
    const { api, modelID } = await openIsolated()

    api.SetCoordinationFrame( modelID, ARBITRARY_FRAME )
    api.SetCoordinationFrame( modelID, void 0 )

    // The claim refusal is back, so the supplied-frame flag really cleared
    // rather than merely the matrix.
    expect( () => api.SetGeometryShard( modelID, { index: 0, count: 2 } ) )
        .toThrow( /SetCoordinationFrame/ )

    await pumpPlacements( api, modelID )

    // ...and the model derived its own frame, so the adopted one cleared too.
    const derived = api.GetAppliedCoordinationMatrix( modelID )

    expect( derived ).not.toEqual( ARBITRARY_FRAME )
    expect( Math.abs( derived[ 12 ] ) + Math.abs( derived[ 14 ] ) )
        .toBeGreaterThan( COORDINATION_SNAP_M )

    api.CloseModel( modelID )
  }, 240000 )

  test( 'refuses a frame it cannot honour', async () => {

    const { api, modelID } = await openIsolated()

    expect( () => api.SetCoordinationFrame( modelID, [ 1, 2, 3 ] ) )
        .toThrow( /column-major mat4/ )
    expect( () => api.SetCoordinationFrame(
        modelID, [ ...ARBITRARY_FRAME.slice( 0, 15 ), NaN ] ) )
        .toThrow( /column-major mat4/ )

    api.SetCoordinationFrame( modelID, ARBITRARY_FRAME )

    await api.ExtractGeometryBatchAsync( modelID, 4 )

    // Too late: placements already emitted carry the frame in force when they
    // were captured and are never re-placed, so a second frame would leave
    // one model in two coordinate systems.
    expect( () => api.SetCoordinationFrame( modelID, ARBITRARY_FRAME ) )
        .toThrow( /before the first ExtractGeometryBatch/ )

    api.CloseModel( modelID )
  }, 240000 )

  test( 'refuses on a classic open, which has already placed everything',
      async () => {

        const api = new IfcAPI()

        await api.Init()

        const modelID = await api.OpenModelStream(
            new InMemoryStepByteStore( fixture ),
            { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true } )

        // Same shape as SetGeometryShard's DEFER_GEOMETRY refusal: a frame
        // supplied now would be accepted and then ignored.
        expect( () => api.SetCoordinationFrame( modelID, ARBITRARY_FRAME ) )
            .toThrow( /DEFER_GEOMETRY/ )

        api.CloseModel( modelID )
      }, 240000 )
} )
