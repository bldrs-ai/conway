import { CanonicalMaterial } from './canonical_material'
import { CanonicalMesh } from './canonical_mesh'
import {CanonicalProfile} from './canonical_profile'
import { Entity } from './entity'
import { IIndexSetCursor } from './i_index_set_cursor'
import { ModelMaterials } from './model_materials'
import { SceneNodeGeometry } from './scene_node'

/**
 * Geometry capability, this model has geometry.
 */
export interface ModelGeometry extends Iterable< CanonicalMesh > {

  length: number

  getByLocalID(localID: number): CanonicalMesh | undefined

}

/**
 * Geometry capability, this model has profiles.
 */
export interface ModelProfile extends Iterable< CanonicalProfile > {

  length: number

  getByLocalID(localID: number): CanonicalProfile | undefined

}

export interface Model extends Iterable<Entity> {

  getElementByLocalID(localID: number): Entity | undefined

  extract(from: Iterable<number>): IterableIterator<Entity>

  from(cursor: IIndexSetCursor, freeCursor: boolean): IterableIterator<Entity>

  /**
   * Get the material matching a geometry node.
   *
   * Geometry must have been extracted first.
   * @param node The geometry node to match a material for.
   * @returns A material, or undefined if it is not found.
   */
  getMaterialFromGeometryNode( node: SceneNodeGeometry ): CanonicalMaterial | undefined

  /**
   * Get the material matching a geometry node.
   *
   * Geometry must have been extracted first.
   * @param node The geometry node to match a material for.
   * @returns A material, or undefined if it is not found.
   */
  getMeshFromGeometryNode( node: SceneNodeGeometry ): CanonicalMesh | undefined

  readonly geometry?: ModelGeometry

  readonly materials?: ModelMaterials

  readonly size: number
}
