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
