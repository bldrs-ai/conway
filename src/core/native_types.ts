import {
  Bound3DObject,
  CurveObject,
  GeometryCollection,
  GeometryObject,
  IndexedPolygonalFace,
  MaterialObject,
  ProfileObject,
  Segment,
  StdVector,
  Vector2,
  Vector3,
} from '../../dependencies/conway-geom'


export type NativeVectorGlmVec3 = StdVector<Vector3>
export type NativeVectorGlmVec2 = StdVector<Vector2>
export type NativeUintVector = StdVector<number>
export type NativeULongVector = StdVector<number>
export type NativeVectorIndexedPolygonalFace = StdVector<IndexedPolygonalFace>

export type NativeVectorSegment = StdVector<Segment>
export type NativeVectorGeometry = StdVector<GeometryObject>
export type NativeVectorGeometryCollection = StdVector<GeometryCollection>
export type NativeVectorMaterial = StdVector<MaterialObject>
export type NativeVectorProfile = StdVector<ProfileObject>
export type NativeVectorCurve = StdVector<CurveObject>
export type NativeVectorBound3D = StdVector<Bound3DObject>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WasmModule = any
