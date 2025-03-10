import { GeometryObject } from '../../dependencies/conway-geom'
import { Model } from './model'


 
export enum CanonicalMeshType {
    BUFFER_GEOMETRY = 0
}


export interface CanonicalMeshBase {
    readonly type: CanonicalMeshType
    readonly geometry:
      GeometryObject |
      string |
      ArrayBuffer |
      ( () => ( Promise< GeometryObject > | GeometryObject ) )
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

export type CanonicalMesh = CanonicalMeshBuffer
