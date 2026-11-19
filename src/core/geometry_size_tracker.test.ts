/* eslint-disable no-magic-numbers */
import { describe, expect, test } from '@jest/globals'

import { CanonicalMesh, CanonicalMeshType } from './canonical_mesh'
import { GeometrySizeTracker, canonicalMeshBytes } from './geometry_size_tracker'


/**
 * A buffer-geometry mesh whose native reports the given sizes.
 *
 * @param localID The entry's local ID.
 * @param vertexElements GetVertexDataSize().
 * @param indexElements GetIndexDataSize().
 * @return {CanonicalMesh} The fake mesh.
 */
function mesh( localID: number, vertexElements: number, indexElements: number ): CanonicalMesh {
  return {
    type: CanonicalMeshType.BUFFER_GEOMETRY,
    localID,
    temporary: false,
    geometry: {
      GetVertexDataSize: () => vertexElements,
      GetIndexDataSize: () => indexElements,
    },
  } as unknown as CanonicalMesh
}


describe( 'canonicalMeshBytes', () => {

  test( 'counts vertices as doubles and indices as 32-bit, like calculateGeometrySize', () => {
    expect( canonicalMeshBytes( mesh( 1, 9, 3 ) ) ).toBe( 9 * 8 + 3 * 4 )
  } )
} )


describe( 'GeometrySizeTracker', () => {

  test( 'tracks what is held now, and keeps the high-water mark through evictions', () => {
    const size = new GeometrySizeTracker()

    size.noteAdded( 1, mesh( 1, 100, 0 ) )
    size.noteAdded( 2, mesh( 2, 50, 0 ) )

    expect( size.bytes ).toBe( 1200 )
    expect( size.peakBytes ).toBe( 1200 )

    // A residency budget evicting a cold entry: what is held falls, the peak
    // does not — the store's size at the end is not the model's footprint.
    size.noteRemoved( 1 )

    expect( size.bytes ).toBe( 400 )
    expect( size.peakBytes ).toBe( 1200 )

    size.noteAdded( 3, mesh( 3, 25, 0 ) )

    expect( size.bytes ).toBe( 600 )
    expect( size.peakBytes ).toBe( 1200 )
  } )

  test( 'a re-added key replaces its old count instead of adding to it', () => {
    const size = new GeometrySizeTracker()

    size.noteAdded( 1, mesh( 1, 100, 0 ) )
    size.noteAdded( 1, mesh( 1, 10, 0 ) )

    expect( size.bytes ).toBe( 80 )
    expect( size.peakBytes ).toBe( 800 )
  } )

  test( 'removing uses the bytes recorded at add time, and ignores unknown keys', () => {
    const size = new GeometrySizeTracker()
    let vertexElements = 100
    const changing = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      localID: 1,
      geometry: { GetVertexDataSize: () => vertexElements, GetIndexDataSize: () => 0 },
    } as unknown as CanonicalMesh

    size.noteAdded( 1, changing )
    // The native freed, or changed, after it was counted.
    vertexElements = 0
    size.noteRemoved( 1 )
    size.noteRemoved( 99 )

    expect( size.bytes ).toBe( 0 )
    expect( size.peakBytes ).toBe( 800 )
  } )

  // STEP's staged face tessellation stores a mesh before its triangles land;
  // counting it at add time would read it empty forever.
  test( 'a pending entry is measured at settle(), after its staged work lands', () => {
    const size = new GeometrySizeTracker()
    let vertexElements = 0
    const staged = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      localID: 1,
      geometry: { GetVertexDataSize: () => vertexElements, GetIndexDataSize: () => 0 },
    } as unknown as CanonicalMesh

    size.notePending( 1, staged )

    expect( size.bytes ).toBe( 0 )

    // finalizeStagedFaces() appends the queued faces to the native.
    vertexElements = 100
    size.settle()

    expect( size.bytes ).toBe( 800 )
    expect( size.peakBytes ).toBe( 800 )

    // Settled entries are not measured again.
    vertexElements = 1000
    size.settle()

    expect( size.bytes ).toBe( 800 )
  } )

  test( 'a pending entry removed before settle() is dropped unmeasured', () => {
    const size = new GeometrySizeTracker()
    const freed = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      localID: 1,
      geometry: {
        GetVertexDataSize: () => {
          throw new Error( 'measured a freed native' )
        },
        GetIndexDataSize: () => 0,
      },
    } as unknown as CanonicalMesh

    size.notePending( 1, freed )
    size.noteRemoved( 1 )
    size.settle()

    expect( size.bytes ).toBe( 0 )
    expect( size.peakBytes ).toBe( 0 )
  } )

  test( 'notePending replaces a counted entry under the same key', () => {
    const size = new GeometrySizeTracker()

    size.noteAdded( 1, mesh( 1, 100, 0 ) )
    size.notePending( 1, mesh( 1, 10, 0 ) )

    expect( size.bytes ).toBe( 0 )

    size.settle()

    expect( size.bytes ).toBe( 80 )
    expect( size.peakBytes ).toBe( 800 )
  } )
} )
