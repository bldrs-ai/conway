/* eslint-disable no-magic-numbers */
// conway#740: the per-load numbers Share's load-outcome instrumentation
// (Share#1954) reads off Statistics — engine error/warning counts, products
// with geometry against the product count, and geometry time on the demand
// path, where it used to be 0.
import * as fs from 'fs'

import { beforeAll, describe, expect, jest, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import Logger, { LogEntry } from '../../logging/logger'
import { FlatMesh, IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }
const DEFER = { ...SETTINGS, DEFER_GEOMETRY: true, STREAMING_CONSUMER: true }

let api: IfcAPI

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000 )

/**
 * @param path A fixture path.
 * @return {Uint8Array} Its bytes.
 */
function read( path: string ): Uint8Array {
  return new Uint8Array( fs.readFileSync( path ) )
}

/**
 * Count the warning/error occurrences Logger sees while `body` runs —
 * through a proxy, which fires on every occurrence, independently of the
 * Statistics counters under test.
 *
 * @param body The work to observe.
 * @return {Promise<{errors: number, warnings: number}>} Occurrences seen.
 */
async function observeDiagnostics( body: () => Promise< void > ):
  Promise< { errors: number, warnings: number } > {

  const seen = { errors: 0, warnings: 0 }
  const proxy = {
    log: ( entry: LogEntry ) => {
      if ( entry.level === 'error' ) {
        ++seen.errors
      } else if ( entry.level === 'warning' ) {
        ++seen.warnings
      }
    },
  }

  jest.spyOn( console, 'error' ).mockImplementation( () => {} )
  jest.spyOn( console, 'warn' ).mockImplementation( () => {} )
  jest.spyOn( console, 'log' ).mockImplementation( () => {} )
  Logger.addProxy( proxy )

  try {
    await body()
  } finally {
    Logger.removeProxy( proxy )
    jest.restoreAllMocks()
  }

  return seen
}

/**
 * Drain a deferred model's async pump, collecting the owning element of
 * every mesh it delivers that carries geometry.
 *
 * @param modelID A deferred model.
 * @return {Promise<Set<number>>} Express IDs of delivered owners.
 */
async function drain( modelID: number ): Promise< Set< number > > {
  const owners = new Set< number >()

  for ( ;; ) {
    const { extracted, remaining } =
      await api.ExtractGeometryBatchAsync( modelID, 8, ( mesh: FlatMesh ) => {
        if ( mesh.geometries.size() > 0 ) {
          owners.add( mesh.expressID )
        }
      } )

    if ( extracted === 0 && remaining === 0 ) {
      break
    }
  }

  return owners
}

describe( 'error and warning counts', () => {

  test( 'count every occurrence the load logged, and survive StreamAllMeshes', async () => {

    let modelID = -1
    const seen = await observeDiagnostics( async () => {
      modelID = api.OpenModel( read( 'data/nema-23-76mm.step' ), SETTINGS )
      // StreamAllMeshes clears Logger's buffer — the counts must not care.
      api.StreamAllMeshes( modelID, () => {} )
    } )

    const statistics = api.getStatistics( modelID )

    // nema-23 logs one styled-item data defect twice (two bad references).
    expect( seen.errors ).toBe( 2 )
    expect( statistics.getErrorCount() ).toBe( seen.errors )
    expect( statistics.getDistinctErrorCount() ).toBe( 1 )
    expect( statistics.getDataDefectCount() ).toBe( 2 )
    expect( statistics.getWarningCount() ).toBe( seen.warnings )

    api.CloseModel( modelID )
  } )

  test( 'include what the demand pump logs after the open returns', async () => {

    // grid_placement_tail_axes.ifc: one product's mistyped grid axis throws
    // during extraction, which on a store-backed deferred open happens in
    // the pump, not the open.
    let modelID = -1
    let atOpen = -1

    const seen = await observeDiagnostics( async () => {
      modelID = await api.OpenModelStream(
          new InMemoryStepByteStore( read( 'data/grid_placement_tail_axes.ifc' ) ), DEFER )
      atOpen = api.getStatistics( modelID ).getErrorCount()
      await drain( modelID )
    } )

    const statistics = api.getStatistics( modelID )

    expect( statistics.getErrorCount() ).toBeGreaterThan( atOpen )
    expect( statistics.getErrorCount() ).toBe( seen.errors )

    api.CloseModel( modelID )
  } )

  test( 'a later load does not add to an earlier one, and a reused id starts at zero', async () => {

    let first = -1
    let second = -1

    await observeDiagnostics( async () => {
      first = api.OpenModel( read( 'data/nema-23-76mm.step' ), SETTINGS )
    } )

    const firstCounts = api.getStatistics( first ).getErrorCount()

    await observeDiagnostics( async () => {
      second = api.OpenModel( read( 'data/nema-23-76mm.step' ), SETTINGS )
    } )

    expect( api.getStatistics( first ).getErrorCount() ).toBe( firstCounts )
    expect( api.getStatistics( second ).getErrorCount() ).toBe( firstCounts )

    // A fresh IfcAPI restarts ids at 0 while Logger's statistics map lives
    // on: the clean model opened under a reused id must read zero.
    const other = new IfcAPI()

    await other.Init()

    let reused = -1

    await observeDiagnostics( async () => {
      reused = other.OpenModel( read( 'data/index.ifc' ), SETTINGS )
    } )

    expect( other.getStatistics( reused ).getErrorCount() ).toBe( 0 )
    expect( other.getStatistics( reused ).getWarningCount() ).toBe( 0 )

    api.CloseModel( first )
    api.CloseModel( second )
    other.CloseModel( reused )
  } )

  test( 'pumping an earlier deferred model counts against it, not the later one', async () => {

    let bad = -1
    let clean = -1

    await observeDiagnostics( async () => {
      bad = await api.OpenModelStream(
          new InMemoryStepByteStore( read( 'data/grid_placement_tail_axes.ifc' ) ), DEFER )
      // A second load begins before the first is pumped.
      clean = await api.OpenModelStreamed( read( 'data/index.ifc' ), DEFER )

      const badAtOpen = api.getStatistics( bad ).getErrorCount()

      await drain( bad )

      expect( api.getStatistics( bad ).getErrorCount() ).toBeGreaterThan( badAtOpen )

      await drain( clean )

      // Diagnostics outside any load's own calls belong to no load.
      api.CloseModel( 987654 )
      api.GetGeometry( clean, 987654 )
    } )

    expect( api.getStatistics( clean ).getErrorCount() ).toBe( 0 )
    expect( api.getStatistics( clean ).getWarningCount() ).toBe( 0 )

    api.CloseModel( bad )
    api.CloseModel( clean )
  } )
} )

describe( 'products with geometry', () => {

  test.each( [
    // [fixture, products, products with geometry]
    [ 'data/index.ifc', 10, 7 ],
    [ 'data/nema-23-76mm.step', 3, 2 ],
    // Product structure and no shape at all — the zero-geometry case Share
    // needs to tell apart from an engine failure.
    [ 'data/as1-assembly.step', 9, 0 ],
  ] )( '%s, classic and deferred', async ( fixture, products, withGeometry ) => {

    await observeDiagnostics( async () => {

      const classicID = api.OpenModel( read( fixture ), SETTINGS )
      const classicOwners = new Set< number >()

      api.StreamAllMeshes( classicID, ( mesh: FlatMesh ) => {
        if ( mesh.geometries.size() > 0 ) {
          classicOwners.add( mesh.expressID )
        }
      } )

      const classic = api.getStatistics( classicID )

      expect( classic.getProductCount() ).toBe( products )
      expect( classic.getProductsWithGeometryCount() ).toBe( withGeometry )
      // Checked against what was actually served, not just a constant.
      expect( classicOwners.size ).toBe( withGeometry )

      const deferredID = await api.OpenModelStreamed( read( fixture ), DEFER )

      expect( api.getStatistics( deferredID ).getProductsWithGeometryCount() ).toBe( 0 )

      const deferredOwners = await drain( deferredID )
      const deferred = api.getStatistics( deferredID )

      expect( deferred.getProductCount() ).toBe( products )
      expect( deferred.getProductsWithGeometryCount() ).toBe( withGeometry )
      expect( deferredOwners.size ).toBe( withGeometry )

      api.CloseModel( classicID )
      api.CloseModel( deferredID )
    } )
  } )
} )

describe( 'STEP products with geometry stay on the product_definition identity', () => {

  // The numerator maps geometry owners (product_definition_shape for an
  // SDR-bound representation, shape_representation for a free root) back to
  // product_definition, the denominator's identity, so it can never exceed it.
  test.each( [
    'data/ap214-multibody-part.step',
    'data/ap214-reachability-arms.step',
    'data/ap214-assembly-root-unit-scale.step',
    'data/create-a-tube.step',
    'data/ap242-tessellated-solid.step',
    'data/a-gear-with-3-inch-diameter-and-20-curved-teeth.step',
    'data/nema-23-76mm.step',
    'data/as1-assembly.step',
    'data/ap214-two-representations.step',
    'data/ap214-two-representations-one-unit.step',
    'data/ap214-two-root-parts-nested-pds.step',
    'data/as1-oc-214.stp',
  ] )( '%s', async ( fixture ) => {

    await observeDiagnostics( async () => {

      const classicID = api.OpenModel( read( fixture ), SETTINGS )

      api.StreamAllMeshes( classicID, () => {} )

      const classic = api.getStatistics( classicID )

      expect( classic.getProductsWithGeometryCount() ).toBeLessThanOrEqual( classic.getProductCount() )

      const deferredID = await api.OpenModelStreamed( read( fixture ), DEFER )

      await drain( deferredID )

      const deferred = api.getStatistics( deferredID )

      expect( deferred.getProductCount() ).toBe( classic.getProductCount() )
      expect( deferred.getProductsWithGeometryCount() ).toBe( classic.getProductsWithGeometryCount() )

      api.CloseModel( classicID )
      api.CloseModel( deferredID )
    } )
  } )
} )

describe( 'STEP products with geometry: owners that are not product_definitions', () => {

  test( 'two representations of one product count the product once', async () => {

    await observeDiagnostics( async () => {

      const modelID = api.OpenModel( read( 'data/ap214-two-representations.step' ), SETTINGS )

      api.StreamAllMeshes( modelID, () => {} )

      const statistics = api.getStatistics( modelID )

      // Two geometry owners, one PRODUCT_DEFINITION: a fraction of 2/1 is
      // what counting owners directly produced.
      expect( statistics.getProductCount() ).toBe( 1 )
      expect( statistics.getProductsWithGeometryCount() ).toBe( 1 )

      api.CloseModel( modelID )
    } )
  } )

  test( 'assembly occurrences count the parts they place', async () => {

    await observeDiagnostics( async () => {

      const modelID = api.OpenModel( read( 'data/as1-oc-214.stp' ), SETTINGS )

      api.StreamAllMeshes( modelID, () => {} )

      const statistics = api.getStatistics( modelID )

      // Every owner here is a PDS bound to a NEXT_ASSEMBLY_USAGE_OCCURRENCE;
      // dropping them would read as "no geometry" for a real assembly.
      expect( statistics.getProductCount() ).toBe( 9 )
      expect( statistics.getProductsWithGeometryCount() ).toBeGreaterThan( 0 )
      expect( statistics.getProductsWithGeometryCount() ).toBeLessThanOrEqual( 9 )

      api.CloseModel( modelID )
    } )
  } )
} )

describe( 'geometry time on a whole-model drain of a deferred model', () => {

  test.each( [ 'data/index.ifc', 'data/nema-23-76mm.step' ] )( '%s', async ( fixture ) => {

    await observeDiagnostics( async () => {

      const syncID = await api.OpenModelStreamed( read( fixture ), DEFER )

      expect( api.getStatistics( syncID ).getGeometryTime() ).toBe( 0 )

      api.StreamAllMeshes( syncID, () => {} )

      const drained = api.getStatistics( syncID ).getGeometryTime()

      expect( drained ).toBeGreaterThan( 0 )

      // Serving it again extracts nothing, so it adds no geometry time.
      api.StreamAllMeshes( syncID, () => {} )

      expect( api.getStatistics( syncID ).getGeometryTime() ).toBe( drained )

      const asyncID = await api.OpenModelStreamed( read( fixture ), DEFER )

      await api.StreamAllMeshesAsync( asyncID, () => {} )

      expect( api.getStatistics( asyncID ).getGeometryTime() ).toBeGreaterThan( 0 )

      // A classic model's geometry time is the open's; serving it adds none.
      const classicID = api.OpenModel( read( fixture ), SETTINGS )
      const atOpen = api.getStatistics( classicID ).getGeometryTime()

      api.StreamAllMeshes( classicID, () => {} )

      expect( api.getStatistics( classicID ).getGeometryTime() ).toBe( atOpen )

      api.CloseModel( syncID )
      api.CloseModel( asyncID )
      api.CloseModel( classicID )
    } )
  } )
} )

describe( 'geometry time on the demand path', () => {

  test.each( [ 'data/index.ifc', 'data/nema-23-76mm.step' ] )( '%s', async ( fixture ) => {

    await observeDiagnostics( async () => {

      const modelID = await api.OpenModelStreamed( read( fixture ), DEFER )

      // A deferred open has run no geometry yet.
      expect( api.getStatistics( modelID ).getGeometryTime() ).toBe( 0 )

      await drain( modelID )

      expect( api.getStatistics( modelID ).getGeometryTime() ).toBeGreaterThan( 0 )

      api.CloseModel( modelID )
    } )
  } )
} )
