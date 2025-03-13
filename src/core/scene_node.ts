import { NativeTransform4x4 } from '../../dependencies/conway-geom'
import { Model } from './model'
import { ReadonlyUint32Array } from './readonly_typed_array'


 
export enum SceneNodeModelType {
    GEOMETRY  = 0,
    TRANSFORM = 1
}

/** Base type for scene nodes */
export interface SceneNodeModelBase {

  /**
   * Type of the scene node.
   */
  readonly type: SceneNodeModelType

  /**
   * Model of the scene node.
   */
  readonly model: Model

  /**
   * Local id the scene node represents in the model.
   */
  readonly localID: number

  /**
   * The index of a parent node for this node within
   * the scene array.
   */
  readonly parentIndex?: number

  /**
   * The index of this node within the scene array.
   */
  readonly index: number
}


/** A transform scene node */
export interface SceneNodeTransform extends SceneNodeModelBase {

  /**
   * The type of this scene node.
   */
  readonly type: SceneNodeModelType.TRANSFORM

  /**
   * The model this node relates to.
   */
  readonly model: Model

  /**
   * The absolute (non-relative) transform of this as a 4x4 matrix in OpenGL convention
   */
  readonly absoluteTransform: Float64Array | Float32Array | ReadonlyArray<number>

  /**
   * The local id of the matching entity in the model of this.
   */
  readonly localID: number

  /**
   * The index of this in the scene array
   */
  readonly index: number

  /**
   * Native transform relative to the parent transform,
   * or whole model transform if this has no parent.
   */
  readonly nativeTransform: NativeTransform4x4

  /**
   * Transform object on the natative heap absolute to the model (i.e.
   * concatenating all the parents
   */
  readonly absoluteNativeTransform: NativeTransform4x4

  /**
   * The index of the parent scene node of this, will always be a
   * transform node or undefined.
   */
  readonly parentIndex?: number

  /**
   * 4x4 transform matrix, stored in OpenGL Convention.
   *
   * If none is found, the identity transform is assumed
   */
  readonly transform: Float64Array | Float32Array | ReadonlyArray< number >

  /**
   * The current children of this node.
   */
  readonly children: ReadonlyUint32Array | ReadonlyArray< number >
}

export interface SceneNodeGeometry extends SceneNodeModelBase {

  /**
   * Geometry node.
   */
  readonly type: SceneNodeModelType.GEOMETRY

  /**
   * The model it came from.
   */
  readonly model: Model

  /**
   * The local id of the related element in the model (i.e. the IfcProduct).
   */
  readonly relatedElementLocalId?: number

  /**
   * The local id of the geometry in the model.
   */
  readonly localID: number

  /**
   * The index of this node in the scene array.
   */
  readonly index: number

  /**
   * The index of the parent of this node in the scene array,
   * note it will always be a transform if it exists.
   */
  readonly parentIndex?: number

  /**
   * Does this geometry represent a "space" (i.e. is it an "empty area",
   * not part of the regular body geometry)
   */
  readonly isSpace: boolean

  /**
   * Overrides the geometry id used to lookup a material for this,
   * used where a proxy piece of geometry (for example, in a boolean operation)
   * is used to give this a material.
   */
  readonly materialOverideLocalID?: number
}

/** Composite scene node tagged union type */
export type SceneNode = SceneNodeGeometry | SceneNodeTransform
