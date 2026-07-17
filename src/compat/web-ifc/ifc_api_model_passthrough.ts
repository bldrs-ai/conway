import { StepExternalByteStore } from '../../step/step_buffer_provider'
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

  /**
   * Optional: drop the model's materialised entity/descriptor caches,
   * returning that memory. Entities rematerialise on next access.
   */
  releaseEntityCache?(): void

  /**
   * Optional: true when the model's source bytes are spilled to an
   * external store and served through on-demand windows.
   */
  readonly sourceIsExternal?: boolean

  /**
   * Optional: release the resident source buffer, serving subsequent
   * record reads through windows paged from the given external store.
   */
  spillSourceToExternalStore?(
    store: StepExternalByteStore,
    chunkBytes?: number,
    maxResidentChunks?: number ): void

  /**
   * Optional: page in the byte range backing a record so a following
   * synchronous read succeeds. Fast no-op while fully resident.
   */
  ensureLineResident?( expressID: number ): Promise< void >

  /**
   * Optional: lazily iterate the express IDs of all root-derived
   * (GlobalId-bearing) entities via the type index, without
   * materialising entities or touching the source buffer.
   * Multi-mapped entities may repeat; callers should dedupe.
   */
  rootExpressIDs?(): IterableIterator< number >
}
