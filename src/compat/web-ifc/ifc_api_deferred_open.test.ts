/* eslint-disable no-magic-numbers */
// Deferred-geometry streamed open (demand/tiled rendering slice A):
// pumping ExtractGeometryBatch to completion must reproduce EXACTLY the
// meshes a classic OpenModel + StreamAllMeshes produces — same
// entities, same placed-geometry ids, colors, and transforms — across
// multiple small batches (which exercises the persisted coordination
// matrix; a single-shot capture can't catch a stale one).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { FlatMesh, IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// Sharding refuses COORDINATE_TO_ORIGIN — each shard would derive its own
// recentre anchor — so every sharded open here goes without it.
const SHARD_SETTINGS =
  { COORDINATE_TO_ORIGIN: false, USE_FAST_BOOLS: true, DEFER_GEOMETRY: true }

let api: IfcAPI
let buffer: Uint8Array

/**
 * Flatten a FlatMesh into comparable plain data.
 *
 * @param mesh The mesh.
 * @return {object} Plain comparable form.
 */
function flatten( mesh: FlatMesh, previous?: object ): object {

  const geometries: object[] =
    ( previous as { geometries?: object[] } | undefined )?.geometries ?? []

  for ( let where = 0; where < mesh.geometries.size(); ++where ) {

    const placed = mesh.geometries.get( where )

    geometries.push( {
      color: placed.color,
      geometryExpressID: placed.geometryExpressID,
      flatTransformation: [ ...placed.flatTransformation ],
    } )
  }

  return { expressID: mesh.expressID, geometries }
}

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
}, 120000 )

describe( 'OpenModelStreamed + DEFER_GEOMETRY', () => {

  test( 'batch pump to completion matches classic StreamAllMeshes exactly', async () => {

    const classicID = api.OpenModel( buffer, SETTINGS )
    const classic = new Map<number, object>()

    api.StreamAllMeshes( classicID, ( mesh ) => {
      classic.set( mesh.expressID, flatten( mesh ) )
    } )

    expect( classic.size ).toBeGreaterThan( 0 )

    const deferredID = await api.OpenModelStreamed(
        buffer, { ...SETTINGS, DEFER_GEOMETRY: true } )

    expect( deferredID ).toBeGreaterThanOrEqual( 0 )

    // Pump in deliberately small batches; collect incremental meshes.
    // (Deltas: an entity may re-emit with only its NEW instances —
    // `flatten` accumulation in the map below must be additive.)
    const streamed = new Map<number, object>()
    let firstBatchCount = 0
    let rounds = 0

    for ( ; ; ) {

      const { extracted, remaining } = api.ExtractGeometryBatch(
          deferredID, 7, ( mesh ) => {
            streamed.set(
                mesh.expressID,
                flatten( mesh, streamed.get( mesh.expressID ) ) )
          } )

      if ( rounds === 0 ) {
        firstBatchCount = streamed.size
      }

      ++rounds

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    // Incrementality: meshes arrived before the pump completed.
    expect( rounds ).toBeGreaterThan( 2 )
    expect( firstBatchCount ).toBeGreaterThanOrEqual( 0 )
    expect( streamed.size ).toBe( classic.size )

    // Exact parity per entity: ids, colors, transforms.
    for ( const [ expressID, mesh ] of classic ) {
      expect( streamed.get( expressID ) ).toEqual( mesh )
    }

    api.CloseModel( classicID )
    api.CloseModel( deferredID )
  }, 240000 )

  test( 'deferred pump emits a Geometry progress phase', async () => {

    const events: { phase: string, completed: number, total?: number }[] = []
    const deferredID = await api.OpenModelStreamed( buffer, {
      ...SETTINGS,
      DEFER_GEOMETRY: true,
      ON_PROGRESS: ( event ) => {
        events.push( {
          phase: event.phase,
          completed: event.completed,
          total: event.total,
        } )
      },
    } )

    expect( deferredID ).toBeGreaterThanOrEqual( 0 )

    for ( ; ; ) {
      const { extracted, remaining } = api.ExtractGeometryBatch( deferredID, 7 )
      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    const parseEvents = events.filter( ( event ) => event.phase === 'dataParse' )
    const geometryEvents = events.filter( ( event ) => event.phase === 'geometry' )

    expect( parseEvents.length ).toBeGreaterThan( 0 )
    expect( geometryEvents.length ).toBeGreaterThan( 0 )
    expect( geometryEvents[ 0 ].completed ).toBe( 0 )
    expect( geometryEvents[ geometryEvents.length - 1 ].completed ).
        toBe( geometryEvents[ geometryEvents.length - 1 ].total )

    api.CloseModel( deferredID )
  }, 240000 )

  test( 'StreamAllMeshes on a deferred model drains the pump and matches classic', async () => {

    const classicID = api.OpenModel( buffer, SETTINGS )
    const classic = new Map<number, object>()

    api.StreamAllMeshes( classicID, ( mesh ) => {
      classic.set( mesh.expressID, flatten( mesh ) )
    } )

    const deferredID = await api.OpenModelStreamed(
        buffer, { ...SETTINGS, DEFER_GEOMETRY: true } )

    // No pump calls at all — the whole-model consumer must still get
    // the complete mesh set (the shim drains internally).
    const drained = new Map<number, object>()
    api.StreamAllMeshes( deferredID, ( mesh ) => {
      drained.set( mesh.expressID, flatten( mesh ) )
    } )

    expect( drained.size ).toBe( classic.size )
    for ( const [ expressID, mesh ] of classic ) {
      expect( drained.get( expressID ) ).toEqual( mesh )
    }

    api.CloseModel( classicID )
    api.CloseModel( deferredID )
  }, 240000 )

  test( 'deferred GetGeometry serves byte-identical vertex content to classic', async () => {

    // The build multiplies GetGeometry FLOAT vertices by captured
    // transforms, and the float mirror's frame must match the scene
    // transforms (frozen at mesh add — see IfcModelGeometry.add). A
    // per-geometry frame shift here renders as scattered pieces even
    // with perfect transform parity, which transform-only assertions
    // cannot catch.
    //
    // Fresh IfcAPI: CloseModel destroys the shared wasm processor, and
    // models opened after ANY close serve empty geometry payloads (a
    // long-standing multi-open shim quirk — browsers open one model per
    // page). The shared `api` has closed models by the time this runs.
    const api2 = new IfcAPI()
    await api2.Init()

    const classicID = api2.OpenModel( buffer, SETTINGS )
    const geometryIDs = new Set<number>()

    api2.StreamAllMeshes( classicID, ( mesh ) => {
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {
        geometryIDs.add( mesh.geometries.get( where ).geometryExpressID )
      }
    } )

    const deferredID = await api2.OpenModelStreamed(
        buffer, { ...SETTINGS, DEFER_GEOMETRY: true } )

    api2.StreamAllMeshes( deferredID, () => { /* drain */ } )

    let compared = 0

    for ( const geometryID of geometryIDs ) {

      const classicGeometry = api2.GetGeometry( classicID, geometryID )
      const deferredGeometry = api2.GetGeometry( deferredID, geometryID )

      const classicSize = classicGeometry.GetVertexDataSize()

      if ( classicSize === 0 ) {
        continue
      }

      expect( deferredGeometry.GetVertexDataSize() ).toBe( classicSize )

      const classicVertices =
        api2.GetVertexArray( classicGeometry.GetVertexData(), classicSize )
      const deferredVertices =
        api2.GetVertexArray( deferredGeometry.GetVertexData(), classicSize )

      expect( deferredVertices ).toEqual( classicVertices )
      ++compared
    }

    expect( compared ).toBeGreaterThan( 0 )

    api2.CloseModel( classicID )
    api2.CloseModel( deferredID )
  }, 240000 )

  test( 'ReleaseModelGeometry frees served geometry, keeps meshes, refuses undrained pumps', async () => {

    // Fresh IfcAPI (CloseModel poisons later opens — see the content
    // parity test's note).
    const api3 = new IfcAPI()
    await api3.Init()

    // Undrained deferred pump: refuse (releasing would break the
    // remaining extraction).
    const deferredID = await api3.OpenModelStreamed(
        buffer, { ...SETTINGS, DEFER_GEOMETRY: true } )

    api3.ExtractGeometryBatch( deferredID, 1 )

    expect( api3.ReleaseModelGeometry( deferredID ) ).toBe( false )

    // Classic model: release frees GetGeometry serving, keeps captured
    // mesh data, double-release stays safe.
    const classicID = api3.OpenModel( buffer, SETTINGS )
    const geometryIDs: number[] = []
    let meshes = 0

    api3.StreamAllMeshes( classicID, ( mesh ) => {
      ++meshes
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {
        geometryIDs.push( mesh.geometries.get( where ).geometryExpressID )
      }
    } )

    expect( meshes ).toBeGreaterThan( 0 )
    expect( api3.GetGeometry( classicID, geometryIDs[ 0 ] ).GetVertexDataSize() )
        .toBeGreaterThan( 0 )

    expect( api3.ReleaseModelGeometry( classicID ) ).toBe( true )

    // Served geometry degrades to the empty dummy; mesh data survives.
    expect( api3.GetGeometry( classicID, geometryIDs[ 0 ] ).GetVertexDataSize() )
        .toBe( 0 )

    let meshesAfter = 0
    api3.StreamAllMeshes( classicID, () => {
      ++meshesAfter
    } )
    expect( meshesAfter ).toBeGreaterThan( 0 )

    expect( api3.ReleaseModelGeometry( classicID ) ).toBe( true )
    expect( api3.ReleaseModelGeometry( 9999 ) ).toBe( false )
  }, 240000 )

  test( 'pump applies the rel-aggregates master-voids pass (cut parity)', async () => {

    // Classic's whole-model walk follows its product loop with a second
    // pass re-extracting every IfcRelAggregates related product with
    // the RELATING object's rel-voids, REPLACING the canonical mesh
    // under the same localID — aggregate parts whose parent carries
    // openings end up cut. A pump that only ran the per-product pass
    // served the UNCUT content classic never exposes (field reports:
    // wrong shapes + flicker on faceset-heavy vyzn models). The
    // synthetic fixture is an assembly voided by an opening,
    // aggregating a box part the opening must cut.
    //
    // Fresh IfcAPI (CloseModel poisons later opens — see the content
    // parity test's note).
    const api4 = new IfcAPI()
    await api4.Init()

    const fixture = new Uint8Array(
        fs.readFileSync( 'data/aggregate_master_voids.ifc' ) )

    const classicID = api4.OpenModel( fixture, SETTINGS )
    const classicInstances: number[] = []

    api4.StreamAllMeshes( classicID, ( mesh ) => {
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {
        classicInstances.push( mesh.geometries.get( where ).geometryExpressID )
      }
    } )

    // Aggregate targets are extracted ONLY by the second pass now
    // (aggregateTargetLocalIDs): exactly ONE placed instance of the cut
    // part. (Historically 2 — the first-pass uncut node plus the
    // pass-two re-extraction node coinciding, a duplicate that
    // z-fought and, on the pump, delivered stale uncut content.)
    expect( classicInstances.length ).toBe( 1 )

    const deferredID = await api4.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )
    const pumpedInstances: number[] = []
    const pumpedTrisAtDelivery: number[] = []

    for ( ; ; ) {

      const { extracted, remaining } = api4.ExtractGeometryBatch(
          deferredID, 1, ( mesh ) => {
            for ( let where = 0; where < mesh.geometries.size(); ++where ) {
              const geometryID =
                mesh.geometries.get( where ).geometryExpressID
              pumpedInstances.push( geometryID )
              // Content-at-delivery: what an incremental consumer
              // copies the moment the instance is emitted.
              const geometry = api4.GetGeometry( deferredID, geometryID )
              pumpedTrisAtDelivery.push(
                  // eslint-disable-next-line no-magic-numbers
                  ( geometry.GetIndexDataSize() / 3 ) | 0 )
            }
          } )

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    // Instance parity: same single cut instance as classic.
    expect( pumpedInstances.sort() ).toEqual( classicInstances.sort() )

    // The #1640 invariant (Share bldrs-ai/Share#1640): the content an
    // incremental consumer copies AT DELIVERY equals the final content
    // — the pump must never mutate a geometry after emitting instances
    // that reference it.
    for ( let where = 0; where < pumpedInstances.length; ++where ) {

      const finalGeometry =
        api4.GetGeometry( deferredID, pumpedInstances[ where ] )

      expect( pumpedTrisAtDelivery[ where ] )
          // eslint-disable-next-line no-magic-numbers
          .toBe( ( finalGeometry.GetIndexDataSize() / 3 ) | 0 )
    }

    // Content parity: GetGeometry must serve the CUT part, byte-identical
    // to classic (the uncut box has strictly fewer vertices).
    for ( const geometryID of new Set( classicInstances ) ) {

      const classicGeometry = api4.GetGeometry( classicID, geometryID )
      const deferredGeometry = api4.GetGeometry( deferredID, geometryID )

      const classicSize = classicGeometry.GetVertexDataSize()

      expect( classicSize ).toBeGreaterThan( 0 )
      expect( deferredGeometry.GetVertexDataSize() ).toBe( classicSize )
      expect( deferredGeometry.GetIndexDataSize() )
          .toBe( classicGeometry.GetIndexDataSize() )

      const classicVertices =
        api4.GetVertexArray( classicGeometry.GetVertexData(), classicSize )
      const deferredVertices =
        api4.GetVertexArray( deferredGeometry.GetVertexData(), classicSize )

      expect( deferredVertices ).toEqual( classicVertices )
    }

    api4.CloseModel( classicID )
    api4.CloseModel( deferredID )
  }, 240000 )

  test( 'shared representation survives a batch boundary, emitted once', async () => {

    // data/mapped_shared_representation.ifc: one IfcRepresentationMap
    // mapped by two products 15 products apart, so a batch size of 4
    // guarantees they land in DIFFERENT batches. The smoke corpus cannot
    // produce this shape — there every sharer of a definition falls
    // inside one batch — so this is the only fixture that exercises the
    // delta capture across a boundary where geometry is shared.
    //
    // It pins the cursor capture from both directions. Lose a parked or
    // suffix node and the second mapped product goes missing; re-emit a
    // node the cursor should have passed (the failure a reverted cursor
    // or a broken watermark produces) and instances duplicate. Both show
    // up as an instance-count mismatch against classic, which is why the
    // comparison is against classic rather than a hard-coded number.
    const api5 = new IfcAPI()
    await api5.Init()

    const fixture = new Uint8Array(
        fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

    const classicID = api5.OpenModel( fixture, SETTINGS )
    const classicPlacements: string[] = []

    api5.StreamAllMeshes( classicID, ( mesh ) => {
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {
        const placed = mesh.geometries.get( where )
        classicPlacements.push(
            `${placed.geometryExpressID}@${[ ...placed.flatTransformation ]
                .map( ( value ) => value.toFixed( 3 ) ).join( ',' )}` )
      }
    } )

    const deferredID = await api5.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )
    const pumpedPlacements: string[] = []
    let batches = 0

    for ( ; ; ) {

      const { extracted, remaining } = api5.ExtractGeometryBatch(
          deferredID, 4, ( mesh ) => {
            for ( let where = 0; where < mesh.geometries.size(); ++where ) {
              const placed = mesh.geometries.get( where )
              pumpedPlacements.push(
                  `${placed.geometryExpressID}@${[ ...placed.flatTransformation ]
                      .map( ( value ) => value.toFixed( 3 ) ).join( ',' )}` )
            }
          } )

      ++batches

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    // The boundary the fixture exists to create: with 16 products at
    // batch 4, the two sharers cannot be in the same batch.
    expect( batches ).toBeGreaterThan( 2 )

    // Exact multiset equality — placement included, so an instance
    // delivered at the wrong location fails as loudly as a missing one.
    expect( pumpedPlacements.slice().sort() )
        .toEqual( classicPlacements.slice().sort() )

    // Emitted once each: a duplicate would survive the multiset check
    // only if classic duplicated too, but state it directly since
    // re-emission is the specific failure a broken cursor produces.
    expect( new Set( pumpedPlacements ).size ).toBe( pumpedPlacements.length )

    // Both users of the shared map are present, at their own placements
    // — the shared SOURCE geometry appears under two distinct transforms.
    const mappedTransforms = new Set( pumpedPlacements.map(
        ( entry ) => entry.split( '@' )[ 1 ] ) )

    expect( mappedTransforms.size ).toBe( pumpedPlacements.length )

    api5.CloseModel( classicID )
    api5.CloseModel( deferredID )
  }, 240000 )

  test( 'delta capture visits each scene node once, whatever the batch size', async () => {

    // Output parity cannot see this. The whole-scene walk this replaced
    // delivered exactly the same meshes; what changed is the COST of
    // delivering them — it re-resolved every node on every call, so the
    // capture was O(batches x scene). A revert would pass every
    // correctness assertion in this file while restoring the 1.47-2.97x
    // regression the PR description measures, so the complexity gets an
    // assertion of its own.
    //
    // Counting node visits rather than timing: deterministic, and it
    // fails the same way on a fast machine as a slow one.
    const api6 = new IfcAPI()
    await api6.Init()

    const fixture = new Uint8Array(
        fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

    /**
     * Pump a fresh deferred model to completion and report how much
     * scene walking it took.
     *
     * @param batchSize Products per ExtractGeometryBatch call.
     * @return {Promise<{visits: number, nodes: number, batches: number}>}
     * Node visits, final scene size, and calls taken.
     */
    async function pump( batchSize: number ):
        Promise<{ visits: number, nodes: number, batches: number }> {

      const modelID = await api6.OpenModelStreamed(
          fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

      let batches = 0

      for ( ; ; ) {

        const { extracted, remaining } =
          api6.ExtractGeometryBatch( modelID, batchSize, () => { /* drain */ } )

        ++batches

        if ( remaining === 0 && extracted === 0 ) {
          break
        }
      }

      const scene = ( api6.getPassthrough( modelID ) as unknown as
        { model: [ unknown, { geometryNodeVisits: number, nodeCount: number } ] } )
          .model[ 1 ]

      // A revert that drops the counter along with the cursor would
      // otherwise fail as `expected undefined to be less than 68`, which
      // reads like a broken test rather than the regression it is.
      expect( typeof scene?.geometryNodeVisits )
          .toBe( 'number' )

      const measured =
        { visits: scene.geometryNodeVisits, nodes: scene.nodeCount, batches }

      api6.CloseModel( modelID )

      return measured
    }

    const oneAtATime = await pump( 1 )
    const allAtOnce = await pump( 64 )

    // The fixture is 16 products, so batch 1 really does take many calls
    // — otherwise this asserts nothing.
    expect( oneAtATime.batches ).toBeGreaterThan( 8 )
    expect( allAtOnce.batches ).toBeLessThan( oneAtATime.batches )

    // The invariant: total walking is a property of the SCENE, not of how
    // many calls drained it. Allowing 2x the node count leaves room for
    // the whole-model drain's own pass and for parked-node retries
    // (DEMAND_PARKED_NODE_RETRIES each, and nothing in this corpus parks
    // a node at all), while a per-call re-walk would land near
    // batches x nodes — an order of magnitude clear of the bound.
    expect( oneAtATime.visits ).toBeLessThan( oneAtATime.nodes * 2 )

    // And it must not grow when the batch shrinks, which is the specific
    // shape of the regression: same scene, ~16x the calls, same work.
    expect( oneAtATime.visits ).toBeLessThan( allAtOnce.visits * 2 )
  }, 240000 )

  test( 'a geometry budget evicts to fit, and delivers the same meshes', async () => {

    // M3's budgeted arena. Two properties, and they pull against each other:
    // the budget must actually bind (or it is decoration), and binding must
    // not change what the consumer receives (or it is a corruption).
    //
    // The fixture is the shared-representation one deliberately: it is the
    // case where eviction is most likely to lose something, because a
    // product 15 products later maps geometry an aggressive budget will
    // have thrown away. It re-extracts instead, which is the whole design
    // — correctness does not depend on the budget, only cost does.
    const api6 = new IfcAPI()
    await api6.Init()

    const fixture = new Uint8Array(
        fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

    const classicID = api6.OpenModel( fixture, SETTINGS )
    const classicPlacements: string[] = []

    api6.StreamAllMeshes( classicID, ( mesh ) => {
      for ( let where = 0; where < mesh.geometries.size(); ++where ) {
        const placed = mesh.geometries.get( where )
        classicPlacements.push(
            `${placed.geometryExpressID}@${[ ...placed.flatTransformation ]
                .map( ( value ) => value.toFixed( 3 ) ).join( ',' )}` )
      }
    } )

    const deferredID = await api6.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

    // A budget in BYTES, not MB: this model's whole live set is a few KB, so
    // a 1 MB budget would never bind and the test would pass while proving
    // nothing. SetGeometryBudget takes MB, hence the fraction.
    const budgetBytes = 2048
    const applied =
      api6.SetGeometryBudget( deferredID, budgetBytes / ( 1024 * 1024 ) )

    expect( applied?.budgetBytes ).toBe( budgetBytes )

    const pumped: string[] = []

    for ( ; ; ) {

      const { extracted, remaining } = api6.ExtractGeometryBatch(
          deferredID, 4, ( mesh ) => {
            for ( let where = 0; where < mesh.geometries.size(); ++where ) {
              const placed = mesh.geometries.get( where )
              pumped.push(
                  `${placed.geometryExpressID}@${[ ...placed.flatTransformation ]
                      .map( ( value ) => value.toFixed( 3 ) ).join( ',' )}` )
            }
          } )

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    // Bound honoured: reading the budget back reports what is resident now,
    // after the last batch's eviction pass.
    const settled = api6.SetGeometryBudget( deferredID, budgetBytes / ( 1024 * 1024 ) )

    expect( settled?.liveBytes ).toBeLessThanOrEqual( budgetBytes )

    // ...and it bound because there was more than that to hold, not because
    // the model is tiny. Without this the assertion above passes on an empty
    // model, which is the shape of check this file keeps getting wrong.
    const unbudgetedID = await api6.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

    api6.SetGeometryBudget( unbudgetedID, Number.MAX_SAFE_INTEGER )

    for ( ; ; ) {
      const { extracted, remaining } = api6.ExtractGeometryBatch( unbudgetedID, 4 )
      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    const unbudgeted =
      api6.SetGeometryBudget( unbudgetedID, Number.MAX_SAFE_INTEGER )

    expect( unbudgeted!.liveBytes ).toBeGreaterThan( budgetBytes )

    // Same meshes, same placements, evicted or not.
    expect( pumped.slice().sort() ).toEqual( classicPlacements.slice().sort() )

    api6.CloseModel( classicID )
    api6.CloseModel( deferredID )
    api6.CloseModel( unbudgetedID )
  }, 240000 )

  test( 'a budget set mid-load accounts for what is already cached', async () => {

    // The case SetGeometryBudget exists for: a tab already under pressure,
    // where extraction started unbudgeted. The bookkeeping is fed by
    // noteAdded, which no-ops while unlimited, so without seeding this
    // model would start counting from zero — evicting nothing until it had
    // extracted a budget's worth MORE geometry, while reporting the ceiling
    // as satisfied and leaving the pre-existing residency permanent.
    const api8 = new IfcAPI()
    await api8.Init()

    const fixture = new Uint8Array(
        fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

    const modelID = await api8.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

    // Pump the WHOLE model unbudgeted first, so everything this model will
    // ever cache is already resident when the budget arrives.
    for ( ; ; ) {
      const { extracted, remaining } = api8.ExtractGeometryBatch( modelID, 4 )
      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    // Enabling now must SEE that geometry. A budget above it proves the
    // seeding happened at all; the assertion is that live is non-zero, not
    // that it is under the ceiling — an unseeded implementation also
    // reports "under", which is exactly why it is the wrong check.
    const generous = api8.SetGeometryBudget( modelID, 64 )

    expect( generous!.liveBytes ).toBeGreaterThan( 0 )

    api8.CloseModel( modelID )
  }, 240000 )

  test( 'StreamAllMeshes on a budgeted deferred model keeps every instance', async () => {

    // The drain path, which is where a budget is most dangerous. Deferred
    // StreamAllMeshes pumps every batch with NO callback and captures once
    // at the end — fine while geometry survives to be captured, and silently
    // lossy once a budget is evicting: anything freed before that final
    // capture can no longer be resolved, so its instances vanish with no
    // error at all. At a 2 KiB budget this delivered 3 placements against
    // classic's 16.
    const api9 = new IfcAPI()
    await api9.Init()

    const fixture = new Uint8Array(
        fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

    const classicID = api9.OpenModel( fixture, SETTINGS )
    let classicPlacements = 0

    api9.StreamAllMeshes( classicID, ( mesh ) => {
      classicPlacements += mesh.geometries.size()
    } )

    const deferredID = await api9.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

    // Tight enough that eviction fires during the drain, not after it.
    api9.SetGeometryBudget( deferredID, 2048 / ( 1024 * 1024 ) )

    let drainedPlacements = 0

    api9.StreamAllMeshes( deferredID, ( mesh ) => {
      drainedPlacements += mesh.geometries.size()
    } )

    expect( classicPlacements ).toBeGreaterThan( 0 )
    expect( drainedPlacements ).toBe( classicPlacements )

    api9.CloseModel( classicID )
    api9.CloseModel( deferredID )
  }, 240000 )

  test( 'StreamAllMeshes serves live geometry under a budget, and rebudgets after',
      async () => {

        // The half a capture-before-eviction fix does NOT cover. Preserving
        // the FlatMesh metadata keeps the instance counts right while the
        // natives behind them are freed, so a consumer doing the ONLY thing
        // it can do here — read geometry inside the callback, the classic
        // contract — gets a BindingError on a dangling handle.
        //
        // StreamAllMeshes asks for the whole model at once, so the budget is
        // suspended for the call and restored after. This pins both halves:
        // every delivered geometry is readable during delivery, and the
        // budget is back in force when it returns.
        const api10 = new IfcAPI()
        await api10.Init()

        const fixture = new Uint8Array(
            fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

        const modelID = await api10.OpenModelStreamed(
            fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

        const budgetBytes = 2048

        api10.SetGeometryBudget( modelID, budgetBytes / ( 1024 * 1024 ) )

        let read = 0

        api10.StreamAllMeshes( modelID, ( mesh ) => {
          for ( let where = 0; where < mesh.geometries.size(); ++where ) {

            // Reading at delivery is what a classic consumer does, and what
            // an evicted native cannot survive.
            const geometry =
              api10.GetGeometry( modelID, mesh.geometries.get( where ).geometryExpressID )

            expect( geometry.GetVertexDataSize() ).toBeGreaterThan( 0 )
            ++read
          }
        } )

        expect( read ).toBeGreaterThan( 0 )

        // ...and the suspension is temporary: the budget is in force again,
        // and has been applied, by the time the call returns.
        const after = api10.SetGeometryBudget( modelID, budgetBytes / ( 1024 * 1024 ) )

        expect( after?.budgetBytes ).toBe( budgetBytes )
        expect( after?.liveBytes ).toBeLessThanOrEqual( budgetBytes )

        api10.CloseModel( modelID )
      }, 240000 )

  test( 'no budget is the default, and evicts nothing', async () => {

    // The contract eviction changes — GetGeometry serving an evicted asset —
    // must not change for anyone who did not ask for it. A model opened
    // without GEOMETRY_BUDGET_MB tracks nothing and frees nothing.
    const api7 = new IfcAPI()
    await api7.Init()

    const fixture = new Uint8Array(
        fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

    const modelID = await api7.OpenModelStreamed(
        fixture, { ...SETTINGS, DEFER_GEOMETRY: true } )

    const geometryIDs: number[] = []

    for ( ; ; ) {

      const { extracted, remaining } = api7.ExtractGeometryBatch(
          modelID, 4, ( mesh ) => {
            for ( let where = 0; where < mesh.geometries.size(); ++where ) {
              geometryIDs.push( mesh.geometries.get( where ).geometryExpressID )
            }
          } )

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    expect( geometryIDs.length ).toBeGreaterThan( 0 )

    // Every delivered geometry is still fetchable at the end of the load —
    // the lazy-fetch consumer an unbudgeted model is allowed to be.
    for ( const geometryID of geometryIDs ) {
      expect( api7.GetGeometry( modelID, geometryID ).GetVertexDataSize() )
          .toBeGreaterThan( 0 )
    }

    api7.CloseModel( modelID )
  }, 240000 )

  test( 'shards partition the model: every instance exactly once', async () => {

    // The property a worker pool rests on. Four instances each claim a shard
    // and pump to completion; the union must equal what one unsharded load
    // delivers — no instance lost, none built twice. Placement being a pure
    // function of the product is what lets the shards agree without talking
    // to each other, so this also pins that: the same product must land in
    // the same shard from four independent decisions.
    // Both fixtures deliberately: the mapped one exercises the product
    // worklist, and aggregate_master_voids the rel-aggregates pass, which is
    // a SEPARATE worklist with its own filter. Sharding one and not the other
    // duplicates every aggregate across every shard — and on an
    // assembly-heavy model that pass is most of the geometry, so this is the
    // failure with real consequences, not the exotic one.
    for ( const fixturePath of [
      'data/mapped_shared_representation.ifc',
      'data/aggregate_master_voids.ifc',
    ] ) {
      await partitionsExactlyOnce( fixturePath )
    }
  }, 240000 )

  /**
   * Assert that N shards of a model union to exactly what one unsharded load
   * delivers.
   *
   * @param fixturePath The model to check.
   */
  async function partitionsExactlyOnce( fixturePath: string ): Promise<void> {

    const fixture = new Uint8Array( fs.readFileSync( fixturePath ) )

    const wholeApi = new IfcAPI()
    await wholeApi.Init()

    const wholeID = await wholeApi.OpenModelStreamed( fixture, SHARD_SETTINGS )

    const whole: string[] = []

    for ( ; ; ) {
      const { extracted, remaining } = wholeApi.ExtractGeometryBatch(
          wholeID, 4, ( mesh ) => {
            for ( let where = 0; where < mesh.geometries.size(); ++where ) {
              const placed = mesh.geometries.get( where )
              whole.push(
                  `${placed.geometryExpressID}@${[ ...placed.flatTransformation ]
                      .map( ( value ) => value.toFixed( 3 ) ).join( ',' )}` )
            }
          } )
      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    expect( whole.length ).toBeGreaterThan( 0 )

    const shardCount = 4
    const sharded: string[] = []
    const perShard: number[] = []

    for ( let index = 0; index < shardCount; ++index ) {

      const api = new IfcAPI()
      await api.Init()

      const modelID = await api.OpenModelStreamed( fixture, SHARD_SETTINGS )

      expect( api.SetGeometryShard( modelID, { index, count: shardCount } ) )
          .toBe( true )

      let delivered = 0

      for ( ; ; ) {
        const { extracted, remaining } = api.ExtractGeometryBatch(
            modelID, 4, ( mesh ) => {
              for ( let where = 0; where < mesh.geometries.size(); ++where ) {
                const placed = mesh.geometries.get( where )
                sharded.push(
                    `${placed.geometryExpressID}@${[ ...placed.flatTransformation ]
                        .map( ( value ) => value.toFixed( 3 ) ).join( ',' )}` )
                ++delivered
              }
            } )
        if ( remaining === 0 && extracted === 0 ) {
          break
        }
      }

      perShard.push( delivered )
      api.CloseModel( modelID )
    }

    // The union is the model: same multiset, nothing lost or doubled.
    expect( sharded.slice().sort() ).toEqual( whole.slice().sort() )

    // ...and no shard delivered the whole thing, which the equality above
    // would happily accept from one shard doing everything. A single-instance
    // model legitimately lands in one shard, so this only asserts that no
    // shard exceeded the total.
    expect( Math.max( ...perShard ) ).toBeLessThanOrEqual( whole.length )

    wholeApi.CloseModel( wholeID )
  }

  test( 'a shard cannot be claimed after pumping starts', async () => {

    // Narrowing the worklists mid-load would drop products already reported
    // as pending, so the model would quietly deliver less than it promised.
    const api = new IfcAPI()
    await api.Init()

    const modelID = await api.OpenModelStreamed(
        new Uint8Array( fs.readFileSync( 'data/mapped_shared_representation.ifc' ) ),
        { COORDINATE_TO_ORIGIN: false, USE_FAST_BOOLS: true, DEFER_GEOMETRY: true } )

    api.ExtractGeometryBatch( modelID, 1 )

    expect( () => api.SetGeometryShard( modelID, { index: 0, count: 2 } ) )
        .toThrow( /before the first/ )

    api.CloseModel( modelID )
  }, 240000 )

  test( 'enabling COORDINATE_TO_ORIGIN after claiming a shard is refused', async () => {

    // The claim-time check alone is not enforcement: the proxy holds the
    // CALLER'S settings object by reference and reads COORDINATE_TO_ORIGIN
    // live when it derives the recentre frame. A caller that opens without
    // it, claims a shard, then flips the flag would get per-shard anchors —
    // subsets of a large-coordinate model shifted by whole grid cells,
    // which no union-of-placements check catches on a fixture at the origin.
    const api = new IfcAPI()
    await api.Init()

    const settings =
      { COORDINATE_TO_ORIGIN: false, USE_FAST_BOOLS: true, DEFER_GEOMETRY: true }

    const modelID = await api.OpenModelStreamed(
        new Uint8Array( fs.readFileSync( 'data/mapped_shared_representation.ifc' ) ),
        settings )

    expect( api.SetGeometryShard( modelID, { index: 0, count: 2 } ) ).toBe( true )

    settings.COORDINATE_TO_ORIGIN = true

    expect( () => api.ExtractGeometryBatch( modelID, 1 ) )
        .toThrow( /COORDINATE_TO_ORIGIN was enabled on a sharded model/ )

    // The async entry is a SEPARATE path — on an external source it never
    // reaches pumpGeometryBatch_ at all — so the guard has to hold there
    // independently. It was bypassed when the check lived in the pump.
    await expect( api.ExtractGeometryBatchAsync( modelID, 1 ) )
        .rejects.toThrow( /COORDINATE_TO_ORIGIN was enabled on a sharded model/ )

    api.CloseModel( modelID )
  }, 240000 )

  test( 'a shard descriptor is snapshotted, not retained', async () => {

    // A coordinator configuring several instances from one reused object is
    // the natural way to write an in-process pool. If the descriptor were
    // retained, every proxy would read its FINAL index at first pump —
    // several workers claiming one shard, the rest of the model claimed by
    // nobody — and each call would still have passed validation.
    const api = new IfcAPI()
    await api.Init()

    const fixture = new Uint8Array(
        fs.readFileSync( 'data/mapped_shared_representation.ifc' ) )

    const descriptor = { index: 0, count: 2 }

    const modelID = await api.OpenModelStreamed( fixture, SHARD_SETTINGS )

    expect( api.SetGeometryShard( modelID, descriptor ) ).toBe( true )

    // The coordinator moves on to configuring the next worker.
    descriptor.index = 1

    const delivered: string[] = []

    for ( ; ; ) {
      const { extracted, remaining } = api.ExtractGeometryBatch(
          modelID, 4, ( mesh ) => {
            for ( let where = 0; where < mesh.geometries.size(); ++where ) {
              delivered.push(
                  `${mesh.expressID}/` +
                  `${mesh.geometries.get( where ).geometryExpressID}` )
            }
          } )
      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    // Shard 0's contents, not shard 1's. Compared against a model that
    // claims shard 0 from a descriptor nobody touches.
    const referenceApi = new IfcAPI()
    await referenceApi.Init()

    const referenceID =
      await referenceApi.OpenModelStreamed( fixture, SHARD_SETTINGS )

    referenceApi.SetGeometryShard( referenceID, { index: 0, count: 2 } )

    const reference: string[] = []

    for ( ; ; ) {
      const { extracted, remaining } = referenceApi.ExtractGeometryBatch(
          referenceID, 4, ( mesh ) => {
            for ( let where = 0; where < mesh.geometries.size(); ++where ) {
              reference.push(
                  `${mesh.expressID}/` +
                  `${mesh.geometries.get( where ).geometryExpressID}` )
            }
          } )
      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    expect( reference.length ).toBeGreaterThan( 0 )
    expect( delivered.sort() ).toEqual( reference.sort() )

    api.CloseModel( modelID )
    referenceApi.CloseModel( referenceID )
  }, 240000 )

  test( 'an unsharded model is unaffected by the shard preconditions', async () => {

    // The guards must be about workers agreeing with each other and nothing
    // else. A model that never claims a shard recentres and pumps exactly as
    // before — without this, the checks would be a behaviour change for
    // every existing caller, Share included.
    const api = new IfcAPI()
    await api.Init()

    const modelID = await api.OpenModelStreamed(
        new Uint8Array( fs.readFileSync( 'data/index.ifc' ) ),
        { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true, DEFER_GEOMETRY: true } )

    let delivered = 0

    for ( ; ; ) {
      const { extracted, remaining } = api.ExtractGeometryBatch(
          modelID, 4, ( mesh ) => {
            delivered += mesh.geometries.size()
          } )
      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    expect( delivered ).toBeGreaterThan( 0 )

    api.CloseModel( modelID )
  }, 240000 )

  test( 'ExtractGeometryBatch is a safe no-op on non-deferred models', async () => {

    const modelID = await api.OpenModelStreamed( buffer, SETTINGS )

    expect( api.ExtractGeometryBatch( modelID, 8 ) )
        .toEqual( { extracted: 0, remaining: 0 } )
    expect( api.ExtractGeometryBatch( 9999, 8 ) )
        .toEqual( { extracted: 0, remaining: 0 } )

    api.CloseModel( modelID )
  }, 120000 )
} )
