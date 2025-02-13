import { GeometryObject } from '../../dependencies/conway-geom'
import { Model } from './model'


/* eslint-disable no-shadow,no-unused-vars,no-magic-numbers */
export enum CanonicalMeshType {
    BUFFER_GEOMETRY = 0,
    GLTF_URL        = 1,
    GLB_BUFFER      = 2
}


export interface CanonicalMeshBase {
    readonly type: CanonicalMeshType
    readonly geometry: GeometryObject | string | ArrayBuffer
    readonly model: Model
    readonly localID: number
    /**
     * This is true if this is not final geometry, some geometry is only kept for intermediate
     * calculation purposes, and is removed, if it is not final.
     */
    // todo, change back to readonly
    temporary?: boolean
}

export interface CanonicalMeshBuffer extends CanonicalMeshBase {
    readonly type: CanonicalMeshType.BUFFER_GEOMETRY
    readonly geometry: GeometryObject
}

export interface CanonicalMeshUrl extends CanonicalMeshBase {
    readonly type: CanonicalMeshType.GLTF_URL
    readonly geometry: string
    readonly temporary: undefined
}

export interface CanonicalMeshGLBBuffer extends CanonicalMeshBase {
    readonly type: CanonicalMeshType.GLB_BUFFER
    readonly geometry: ArrayBuffer
    readonly temporary: undefined
}

export type CanonicalMesh = CanonicalMeshBuffer | CanonicalMeshUrl | CanonicalMeshGLBBuffer
