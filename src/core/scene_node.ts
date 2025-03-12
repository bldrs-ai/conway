import { Model } from './model'
import { ReadonlyUint32Array } from './readonly_typed_array'


 
export enum SceneNodeModelType {
    GEOMETRY  = 0,
    TRANSFORM = 1,
    URL       = 2
}


export interface SceneNodeModelBase {
    readonly type: SceneNodeModelType

    readonly model: string | Model

    readonly localID: number

    readonly parentIndex?: number

    readonly index: number
}

export interface SceneNodeTransform extends SceneNodeModelBase {

  readonly type: SceneNodeModelType.TRANSFORM

  readonly model: Model

    /**
     * 4x4 transform matrix, stored in OpenGL Convention.
     *
     * If none is found, the identity transform is assumeer
     */
    readonly transform: Float64Array | Float32Array | ReadonlyArray< number >

  readonly children: ReadonlyUint32Array | ReadonlyArray< number >
}

export interface SceneNodeGeometry extends SceneNodeModelBase {

    readonly type: SceneNodeModelType.GEOMETRY

    readonly model: Model

    readonly relatedElementLocalId?: number
}

export interface SceneNodeUrl extends SceneNodeModelBase {

    readonly type: SceneNodeModelType.URL

    readonly model: string

    resolve(): Promise< void >
  }

export type SceneNode = SceneNodeUrl | SceneNodeGeometry | SceneNodeTransform
