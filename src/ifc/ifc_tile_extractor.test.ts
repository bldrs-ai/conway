/* eslint-disable no-magic-numbers, @typescript-eslint/no-explicit-any */
// Phase B3: the production TileAssetExtractor drives the per-product demand
// seam (B2) and commits reified meshes through the wasm tile surface —
// verified with real extraction and recording commit bindings, composed all
// the way up through the queue + pump.
import fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import { IfcTileAssetExtractor, TileCommitBindings } from './ifc_tile_extractor'
import { ParseResult } from '../step/parsing/step_parser'
import IfcStepParser from './ifc_step_parser'
import IfcStepModel from './ifc_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { createWasmTileBackend } from '../core/geometry_tile_bindings'
import { DemandGeometryQueue } from '../core/demand_geometry_queue'
import { DemandResidencyPump } from '../core/demand_residency_pump'
import { IfcProduct } from './ifc4_gen'

let conwayGeometry: ConwayGeometry

/**
 * @return {IfcStepModel} A fresh parsed model of index.ifc.
 */
function freshModel(): IfcStepModel {
  const bytes: Buffer = fs.readFileSync( 'data/index.ifc' )
  const input = new ParsingBuffer( bytes )
  expect( IfcStepParser.Instance.parseHeader( input )[ 1 ] ).toBe( ParseResult.COMPLETE )
  const [ , model ] = IfcStepParser.Instance.parseDataToModel( input )
  return model as IfcStepModel
}

/**
 * Recording fake of the commit surface: accepts every init/commit/release,
 * records ids, verifies commit receives a live reified geometry.
 *
 * @return {object} `{ bindings, committed, released }`.
 */
function recordingBindings(): {
  bindings: TileCommitBindings, committed: number[], released: number[],
} {
  const committed: number[] = []
  const released: number[] = []

  const bindings = {
    initGeometryTilePool: () => true,
    geometryTilePoolInitialized: () => true,
    commitGeometryTile: ( assetID: number, geometry: any ) => {
      // A real reified geometry must be handed over.
      expect( typeof geometry.GetVertexDataSize ).toBe( 'function' )
      expect( geometry.GetVertexDataSize() ).toBeGreaterThan( 0 )
      committed.push( assetID )
      return true
    },
    commitGeometryTileBytes: () => true,
    retainGeometryTile: () => true,
    releaseGeometryTile: ( assetID: number ) => {
      released.push( assetID )
      return true
    },
    geometryTileResident: ( assetID: number ) =>
      committed.includes( assetID ) && !released.includes( assetID ),
    geometryTileRefCount: () => 1,
    geometryTileByteSize: () => 0,
    geometryTileSegmentCount: () => 0,
    geometryTileSegmentAddress: () => 0,
    geometryTileSegmentByteLength: () => 0,
    geometryTileVertexByteLength: () => 0,
    geometryTileIndexByteLength: () => 0,
    geometryTilePoolBytesInUse: () => 0,
    geometryTilePoolTotalBytes: () => 0,
    geometryTilePoolFreeChunks: () => 0,
    geometryTilePoolFailedCommits: () => 0,
  } as TileCommitBindings

  return { bindings, committed, released }
}

beforeAll( async () => {
  conwayGeometry = new ConwayGeometry()
  expect( await conwayGeometry.initialize() ).toBe( true )
} )

describe( 'IfcTileAssetExtractor (Phase B3)', () => {

  test( 'assetsOf extracts on first ask, caches, and sizes at reified cost', () => {
    const model = freshModel()
    const extraction = new IfcGeometryExtraction( conwayGeometry, model )
    const { bindings } = recordingBindings()
    const extractor = new IfcTileAssetExtractor( extraction, bindings )

    // Find a product with geometry.
    let assets: ReturnType<typeof extractor.assetsOf> = []
    let productID = -1

    for ( const product of model.types( IfcProduct ) ) {
      assets = extractor.assetsOf( product.localID )
      if ( assets.length > 0 ) {
        productID = product.localID
        break
      }
    }

    expect( assets.length ).toBeGreaterThan( 0 )

    for ( const asset of assets ) {
      expect( asset.byteSize ).toBeGreaterThan( 8 ) // header + payload
    }

    // Cached: second ask returns the same array without re-extraction.
    expect( extractor.assetsOf( productID ) ).toBe( assets )
  } )

  test( 'full composition: pump → queue → tiles → extractor → wasm commit', async () => {
    const model = freshModel()
    const extraction = new IfcGeometryExtraction( conwayGeometry, model )
    const { bindings, committed, released } = recordingBindings()
    const extractor = new IfcTileAssetExtractor( extraction, bindings )

    const backend = createWasmTileBackend( bindings, extractor, 64 * 1024 * 1024, 4096 )
    const queue = new DemandGeometryQueue( backend.tiles, 64 * 1024 * 1024 )
    const pump = new DemandResidencyPump( queue, model )

    for ( const product of model.types( IfcProduct ) ) {
      pump.request( product.localID, 1 )
    }

    // Drain admission in batches.
    while ( pump.pendingCount > 0 ) {
      const result = await pump.pump()
      expect( result.prefetchFailures ).toBe( 0 )
    }

    expect( committed.length ).toBeGreaterThan( 0 )
    expect( queue.stats.residentCount ).toBeGreaterThan( 0 )

    // Evicting everything releases every committed wasm tile.
    queue.evictAll()
    expect( new Set( released ) ).toEqual( new Set( committed ) )
  } )
} )
