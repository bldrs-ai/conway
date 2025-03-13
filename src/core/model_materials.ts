import { CanonicalMaterial } from './canonical_material'
import { SceneNodeGeometry } from './scene_node'


export interface ModelMaterials {

  getMaterialByGeometryID( geometryLocalID: number ) :
    [CanonicalMaterial, number] | undefined

  getMaterialIDByGeometryID( geometryLocalID: number ): number | undefined

  materials(): IterableIterator<CanonicalMaterial>

  readonly size: number

  readonly defaultMaterialLocalID: number | undefined

  get( localID: number ): CanonicalMaterial | undefined


  /**
   * Get the material matching a geometry node.
   *
   * @param node The geometry node to match a material for.
   * @return {CanonicalMaterial | undefined} A material, or undefined if it is not found.
   */
  getMaterialFromGeometryNode( node: SceneNodeGeometry ): CanonicalMaterial | undefined
}
