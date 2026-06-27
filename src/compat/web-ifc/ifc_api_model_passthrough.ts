import { FlatMesh, IfcGeometry, RawLineData, Vector } from './ifc_api'
import { PropertiesPassthrough } from './properties_passthrough'


export interface IfcApiModelPassthrough {

  properties: PropertiesPassthrough

  getFlatMesh(expressID: number): FlatMesh
  loadAllGeometry(): Vector<FlatMesh>
  streamAllMeshesWithTypes(types: number[], meshCallback: (mesh: FlatMesh) => void): void
  streamAllMeshes(meshCallback: (mesh: FlatMesh) => void): void
  getCoordinationMatrix(): number[]
  getAllLines(): Vector<number>
  getLineIDsWithType(type: number): Vector<number>
  getRawLineData(expressID: number): RawLineData
  flattenLine(line: any): void
  getLine(expressID: number, flatten?: boolean): string | void
  getGeometry(geometryExpressID: number): IfcGeometry
}
