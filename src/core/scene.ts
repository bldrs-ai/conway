import { CanonicalMaterial } from './canonical_material'
import { CanonicalMesh } from './canonical_mesh'
import { ConwayGeometry, NativeTransform4x4 } from '../../dependencies/conway-geom'
import { ReadonlyUint32Array } from './readonly_typed_array'
import { SceneNode, SceneNodeGeometry, SceneNodeTransform } from './scene_node'


export interface SceneListener {

  onTransformAdded( node: SceneNodeTransform ): void

  onTransformUpdated( node: SceneNodeTransform ): void

  onTransformRemoved( node: SceneNodeTransform ): void

  onGeometryAdded(
    node: SceneNodeGeometry,
    transform?: SceneNodeTransform ): void

  onGeometryUpdated(
    node: SceneNodeGeometry,
    transform?: SceneNodeTransform  ): void

  onGeometryRemoved( node: SceneNodeGeometry ): void

}

/**
 * Options for a scene listener
 */
export class SceneListenerOptions {

  /** Construct the options with default values as necessary */
  // eslint-disable-next-line no-useless-constructor, require-jsdoc
  constructor(
    public readonly replayCurrentScene = true,
    public readonly disableGeometryEvents: boolean = false,
    // eslint-disable-next-line no-empty-function
    public readonly  disableTransformEvents: boolean = true ) {}

  /** The default options */
  public static defaults = new SceneListenerOptions()

}

export interface Scene {

  getByNodeIndex( nodeIndex: number ): SceneNode | undefined

  readonly roots: ReadonlyUint32Array | ReadonlyArray< number >

  readonly conwayGeometry: ConwayGeometry

  isAllSpaces(): boolean

  addSceneListener(
    listener: SceneListener,
    options?: SceneListenerOptions ): void

  removeSceneListener( listener: SceneListener ): void

}

export interface WalkableScene< BaseEntityType > extends Scene {

    getByNodeIndex( nodeIndex: number ): SceneNode | undefined

    readonly roots: ReadonlyUint32Array | ReadonlyArray< number >

    readonly conwayGeometry: ConwayGeometry

    isAllSpaces(): boolean

    addSceneListener(
      listener: SceneListener,
      options?: SceneListenerOptions ): void

    removeSceneListener( listener: SceneListener ): void

    walk( includeSpaces?: boolean ):
      IterableIterator<[readonly number[] | undefined,
        NativeTransform4x4 | undefined,
        CanonicalMesh,
        CanonicalMaterial | undefined,
        BaseEntityType | undefined]>
}
