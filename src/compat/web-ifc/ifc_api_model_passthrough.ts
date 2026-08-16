import { StepExternalByteStore } from '../../step/step_buffer_provider'
import { FlatMesh, IfcGeometry, RawLineData, Vector } from './ifc_api'
import { PropertiesPassthrough } from './properties_passthrough'


export interface IfcApiModelPassthrough {

  properties: PropertiesPassthrough

  getFlatMesh(expressID: number): FlatMesh
  loadAllGeometry(): Vector<FlatMesh>
  streamAllMeshesWithTypes(types: number[], meshCallback: (mesh: FlatMesh) => void): void
  streamAllMeshes(meshCallback: (mesh: FlatMesh) => void): void
  /**
   * Deferred-mode batch pump (IFC proxies opened with DEFER_GEOMETRY) —
   * see IfcApiProxyIfc.extractGeometryBatch.
   */
  /** Free the model's native geometry after the consumer's scene build
   * (conway extension) — see the proxies' releaseGeometry. */
  releaseGeometry?(): boolean

  /** Metres per model unit (see IfcAPI.GetLinearScalingFactor). */
  linearScalingFactor?: number

  extractGeometryBatch?(
    batchSize: number,
    meshCallback?: (mesh: FlatMesh) => void): {extracted: number, remaining: number}

  /**
   * Async twin of extractGeometryBatch — pages windowed source ranges
   * before each product extract (M1b). Feature-detect with typeof.
   */
  extractGeometryBatchAsync?(
    batchSize: number,
    meshCallback?: (mesh: FlatMesh) => void):
    Promise<{extracted: number, remaining: number}>
  getCoordinationMatrix(): number[]

  /**
   * Optional: the coordination frame the open ACTUALLY applied to
   * emitted placements (COORDINATE_TO_ORIGIN recenter). Unlike
   * getCoordinationMatrix — whose classic identity contract consumers
   * stamp onto assembled models — this reports the real offset, so
   * embedders can map rendered points back to source-world coordinates
   * (Share#1634 acceptance).
   */
  getAppliedCoordination?(): number[]
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

  /** Optional: store-backed pump split (prefetch / extract / release). */
  readonly extractProfile?: {
    prefetchMs: number
    extractMs: number
    releaseMs: number
    batches: number
    lastPins: number
    pinMax: number
  }

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
