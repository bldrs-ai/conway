/* eslint-disable no-magic-numbers */
import { describe, expect, test } from '@jest/globals'

import { CanonicalMesh, CanonicalMeshType } from '../core/canonical_mesh'
import { AP214ModelGeometry } from './ap214_model_geometry'


describe( 'AP214ModelGeometry size accounting', () => {

  // Under staged face tessellation (the MT build) a face mesh is stored with
  // its job still queued; the triangles land at finalizeStagedFaces(), which
  // settles the tracker. The store must not count the mesh at add time.
  test( 'a stored mesh is counted when the tracker settles, not at add', () => {
    const geometry = new AP214ModelGeometry()
    let vertexElements = 0
    const staged = {
      type: CanonicalMeshType.BUFFER_GEOMETRY,
      localID: 7,
      temporary: false,
      geometry: {
        GetVertexData: () => void 0,
        GetVertexDataSize: () => vertexElements,
        GetIndexDataSize: () => 3,
      },
    } as unknown as CanonicalMesh

    geometry.add( staged )

    expect( geometry.size.bytes ).toBe( 0 )

    vertexElements = 9
    geometry.size.settle()

    expect( geometry.size.peakBytes ).toBe( 9 * 8 + 3 * 4 )
  } )
} )
