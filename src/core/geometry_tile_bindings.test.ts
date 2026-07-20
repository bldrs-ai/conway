/* eslint-disable no-magic-numbers */
// Phase B: the wasm-backed tile composition — TS accounting over the module's
// physical pool — and the segment-walk payload reader, verified against a
// faithful in-memory fake of the embind surface (same layout, same chunking,
// same non-contiguous segments a fragmented pool produces).
import { describe, expect, test } from '@jest/globals'

import { DemandGeometryQueue } from './demand_geometry_queue'
import {
  GeometryTilePoolBindings,
  TileAssetExtractor,
  createWasmTileBackend,
  readGeometryTilePayload,
} from './geometry_tile_bindings'
import { GeometryAsset } from './geometry_tile_pool'

const HEADER_BYTES = 8

/**
 * A faithful in-memory fake of the wasm tile pool bindings: a byte "heap"
 * carved into chunks with a LIFO freelist, tiles committed as (possibly
 * non-contiguous) chunk lists — the same observable behaviour as the C++
 * TilePool through the embind surface.
 *
 * @return {object} `{ bindings, heap, commitPayload }` where commitPayload
 * scatter-commits a payload built from header+floats+indices.
 */
function fakeWasmPool(): {
  bindings: GeometryTilePoolBindings,
  heap: Uint8Array,
  commitPayload: ( assetID: number, floats: number[], indices: number[] ) => boolean,
} {
  const HEAP_BYTES = 64 * 1024
  const heap = new Uint8Array( HEAP_BYTES )

  let chunkBytes = 0
  let regionBase = 0
  let freeList: number[] = []
  const tiles = new Map<number, { chunks: number[], byteSize: number, refCount: number }>()
  let failedCommits = 0
  let totalChunks = 0

  const bindings: GeometryTilePoolBindings = {
    initGeometryTilePool: ( budget, chunk ) => {
      if ( chunk < 16 || budget < chunk ) {
        return false
      }
      chunkBytes = chunk
      totalChunks = Math.floor( budget / chunk )
      regionBase = 1024 // nonzero base, like a real heap allocation
      freeList = []
      for ( let c = totalChunks - 1; c >= 0; --c ) {
        freeList.push( c )
      }
      tiles.clear()
      return true
    },
    geometryTilePoolInitialized: () => chunkBytes > 0,
    commitGeometryTileBytes: ( assetID, sourceAddress, byteLength ) => {
      const needed = Math.ceil( byteLength / chunkBytes )
      if ( tiles.has( assetID ) || needed > freeList.length ) {
        ++failedCommits
        return false
      }
      const chunks: number[] = []
      let copied = 0
      for ( let where = 0; where < needed; ++where ) {
        const chunk = freeList.pop() as number
        chunks.push( chunk )
        const span = Math.min( byteLength - copied, chunkBytes )
        heap.set(
            heap.subarray( sourceAddress + copied, sourceAddress + copied + span ),
            regionBase + chunk * chunkBytes )
        copied += span
      }
      tiles.set( assetID, { chunks, byteSize: byteLength, refCount: 1 } )
      return true
    },
    retainGeometryTile: ( assetID ) => {
      const tile = tiles.get( assetID )
      if ( tile === void 0 ) {
        return false
      }
      ++tile.refCount
      return true
    },
    releaseGeometryTile: ( assetID ) => {
      const tile = tiles.get( assetID )
      if ( tile === void 0 ) {
        return false
      }
      if ( --tile.refCount > 0 ) {
        return false
      }
      freeList.push( ...tile.chunks )
      tiles.delete( assetID )
      return true
    },
    geometryTileResident: ( assetID ) => tiles.has( assetID ),
    geometryTileRefCount: ( assetID ) => tiles.get( assetID )?.refCount ?? 0,
    geometryTileByteSize: ( assetID ) => tiles.get( assetID )?.byteSize ?? 0,
    geometryTileSegmentCount: ( assetID ) => tiles.get( assetID )?.chunks.length ?? 0,
    geometryTileSegmentAddress: ( assetID, segment ) => {
      const tile = tiles.get( assetID )
      if ( tile === void 0 || segment >= tile.chunks.length ) {
        return 0
      }
      return regionBase + tile.chunks[ segment ] * chunkBytes
    },
    geometryTileSegmentByteLength: ( assetID, segment ) => {
      const tile = tiles.get( assetID )
      if ( tile === void 0 || segment >= tile.chunks.length ) {
        return 0
      }
      return Math.min( tile.byteSize - segment * chunkBytes, chunkBytes )
    },
    geometryTileVertexByteLength: ( assetID ) => {
      const address = bindings.geometryTileSegmentAddress( assetID, 0 )
      return address === 0 ?
        0 : new DataView( heap.buffer ).getUint32( address, true )
    },
    geometryTileIndexByteLength: ( assetID ) => {
      const address = bindings.geometryTileSegmentAddress( assetID, 0 )
      return address === 0 ?
        0 : new DataView( heap.buffer ).getUint32( address + 4, true )
    },
    geometryTilePoolBytesInUse: () => ( totalChunks - freeList.length ) * chunkBytes,
    geometryTilePoolTotalBytes: () => totalChunks * chunkBytes,
    geometryTilePoolFreeChunks: () => freeList.length,
    geometryTilePoolFailedCommits: () => failedCommits,
  }

  // Stage a payload high in the fake heap and scatter-commit it.
  const commitPayload = ( assetID: number, floats: number[], indices: number[] ): boolean => {
    const staging = HEAP_BYTES - 8192
    const view = new DataView( heap.buffer, staging )
    view.setUint32( 0, floats.length * 4, true )
    view.setUint32( 4, indices.length * 4, true )
    floats.forEach( ( value, i ) => view.setFloat32( HEADER_BYTES + i * 4, value, true ) )
    indices.forEach( ( value, i ) =>
      view.setUint32( HEADER_BYTES + floats.length * 4 + i * 4, value, true ) )

    return bindings.commitGeometryTileBytes(
        assetID, staging, HEADER_BYTES + floats.length * 4 + indices.length * 4 )
  }

  return { bindings, heap, commitPayload }
}

describe( 'createWasmTileBackend', () => {

  test( 'composes TS accounting over the wasm pool end to end with the queue', () => {
    const { bindings, commitPayload } = fakeWasmPool()

    // Two products share one representation; extraction commits real bytes.
    const composition: Record<number, GeometryAsset<number>[]> = {
      1: [ { assetID: 100, byteSize: 200 } ],
      2: [ { assetID: 100, byteSize: 200 }, { assetID: 200, byteSize: 100 } ],
    }
    const extracted: number[] = []

    const extractor: TileAssetExtractor = {
      assetsOf: ( id ) => composition[ id ] ?? [],
      extractIntoTile: ( assetID ) => {
        extracted.push( assetID )
        if ( !commitPayload( assetID, [ 1, 2, 3 ], [ 0, 1, 2 ] ) ) {
          throw new Error( 'commit failed' )
        }
      },
    }

    const backend = createWasmTileBackend( bindings, extractor, 4096, 64 )
    const queue = new DemandGeometryQueue( backend.tiles, 4096 )

    queue.request( 1, 10 )
    queue.request( 2, 20 )
    queue.pump()

    // Shared asset extracted once; both tiles resident wasm-side.
    expect( extracted ).toEqual( [ 100, 200 ] )
    expect( bindings.geometryTileResident( 100 ) ).toBe( true )
    expect( bindings.geometryTileResident( 200 ) ).toBe( true )

    // Evicting product 2 releases only its unique asset (100 is shared).
    queue.evictAll()
    expect( bindings.geometryTileResident( 100 ) ).toBe( false )
    expect( bindings.geometryTileResident( 200 ) ).toBe( false )
    expect( bindings.geometryTilePoolBytesInUse() ).toBe( 0 )
  } )

  test( 'rejects a config the wasm pool refuses', () => {
    const { bindings } = fakeWasmPool()
    const extractor: TileAssetExtractor = {
      assetsOf: () => [],
      extractIntoTile: () => { /* never called */ },
    }

    expect( () => createWasmTileBackend( bindings, extractor, 4096, 8 ) )
        .toThrow( /rejected init/ )
  } )
} )

describe( 'readGeometryTilePayload', () => {

  test( 'gathers a multi-segment payload back to exact typed arrays', () => {
    const { bindings, heap, commitPayload } = fakeWasmPool()
    bindings.initGeometryTilePool( 4096, 64 )

    // 40 floats + 20 indices + header = 248 bytes over 64-byte chunks →
    // 4 non-contiguous segments with a partial tail.
    const floats = Array.from( { length: 40 }, ( _v, i ) => i * 0.5 )
    const indices = Array.from( { length: 20 }, ( _v, i ) => i * 3 )

    expect( commitPayload( 7, floats, indices ) ).toBe( true )
    expect( bindings.geometryTileSegmentCount( 7 ) ).toBe( 4 )

    const payload = readGeometryTilePayload( bindings, heap, 7 )

    expect( Array.from( payload.vertexData ) ).toEqual( floats )
    expect( Array.from( payload.indexData ) ).toEqual( indices )
    expect( bindings.geometryTileVertexByteLength( 7 ) ).toBe( 160 )
    expect( bindings.geometryTileIndexByteLength( 7 ) ).toBe( 80 )
  } )

  test( 'survives freelist fragmentation (interleaved tiles)', () => {
    const { bindings, heap, commitPayload } = fakeWasmPool()
    bindings.initGeometryTilePool( 4096, 64 )

    commitPayload( 1, [ 1, 1, 1, 1 ], [ 1 ] )
    commitPayload( 2, Array( 30 ).fill( 2 ), [ 2, 2 ] )
    bindings.releaseGeometryTile( 1 )
    // Tile 3's chunks interleave with tile 2's.
    const floats = Array.from( { length: 25 }, ( _v, i ) => i + 0.25 )
    commitPayload( 3, floats, [ 9, 8, 7 ] )

    const payload = readGeometryTilePayload( bindings, heap, 3 )
    expect( Array.from( payload.vertexData ) ).toEqual( floats )
    expect( Array.from( payload.indexData ) ).toEqual( [ 9, 8, 7 ] )
  } )

  test( 'rejects a non-resident tile and a corrupt header', () => {
    const { bindings, heap, commitPayload } = fakeWasmPool()
    bindings.initGeometryTilePool( 4096, 64 )

    expect( () => readGeometryTilePayload( bindings, heap, 42 ) )
        .toThrow( /not resident/ )

    commitPayload( 5, [ 1 ], [ 2 ] )
    // Corrupt the header's vertex byte length in place.
    const address = bindings.geometryTileSegmentAddress( 5, 0 )
    new DataView( heap.buffer ).setUint32( address, 9999, true )

    expect( () => readGeometryTilePayload( bindings, heap, 5 ) )
        .toThrow( /inconsistent/ )
  } )
} )
