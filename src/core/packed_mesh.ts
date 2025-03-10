import { GeometryObject } from '../../dependencies/conway-geom'
import { extractOneHotLow } from '../indexing/bit_operations'
import { CanonicalMaterial } from './canonical_material'
import { IIndexSetCursor } from './i_index_set_cursor'
import { Model } from './model'
import { ReadonlyUint32Array } from './readonly_typed_array'
import { TriangleElementMap } from './triangle_element_map'


/**
 * A packed mesh that has all the materials, primitives and
 * the mapping back to model elements.
 *
 * This can be considered the reified version of CanonicalGeometry.
 */
export class PackedMesh< ModelType extends Model > {

  /**
   * Construct a packed mesh.
   * @param model The model this mesh came from.
   * @param materials The materials array for the packed mesh (referenced
   * by index by primitives)
   * @param primitives The primitives for this mesh (the mesh fragments
   * by material), with the material index being the second item of the tuple.
   * @param triangleElementMaps Triangle element maps (one per primitive,
   * in the same order, to map elements to primitives)
   * @param elementPrimitiveIndex Element primitive index, maps
   * element local ids to the correct primitive.
   */
   
  constructor(
    public readonly model: ModelType,
    public readonly materials: ReadonlyArray< CanonicalMaterial >,
    public readonly primitives: ReadonlyArray< [GeometryObject, number | undefined] >,
    public readonly triangleElementMaps: ReadonlyArray< TriangleElementMap >,
     
    public readonly elementPrimitiveIndex: ReadonlyMap< number, number[] >) {}

  /**
   * Get triangles from a cursor.
   * @param cursor The cursor to extract triangles for
   * @yields {[number, number, ReadonlyUint32Array]} Returns a tuple containing
   * the local ID of the element, the primitive index, and the triangles.
   *
   * Note - there may be multiple batches of triangles from the same element,
   * because the triangles maybe in different primitives.
   */
  public* triangles( cursor: IIndexSetCursor ):
    IterableIterator< [number, number, ReadonlyUint32Array] > {

    const localElementPrimitiveIndex = this.elementPrimitiveIndex

    while (cursor.step()) {
      const high = cursor.high
      let low = cursor.low

      while (low !== 0) {
        const lowestOneHot = extractOneHotLow(low)

        low ^= (1 << lowestOneHot)

        const localID = (high | lowestOneHot)
        const primitiveIndices = localElementPrimitiveIndex.get( localID )

        if ( primitiveIndices === void 0 ) {
          continue
        }

        for ( const primitiveIndex of primitiveIndices ) {

          const inverseMap = this.triangleElementMaps[ primitiveIndex ].inverseMap
          const foundTriangles = inverseMap.get( localID )

          if (foundTriangles === void 0) {
            continue
          }

          yield [localID, primitiveIndex, foundTriangles]
        }
      }
    }
  }
}
