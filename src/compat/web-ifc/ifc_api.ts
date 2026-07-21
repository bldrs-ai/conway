import { ConwayGeometry, FileHandlerFunction as FileHandlerCallback,
  setModulePrefix,
 } from '../../index'
import {versionString} from '../../version/version'
import Logger, { LogLevel as ConwayLogLevel } from '../../logging/logger'
import { ProgressCallback } from '../../core/progress'
import { ModelInfo } from '../../core/progress_log'
import Environment from '../../utilities/environment'
import * as glmatrix from 'gl-matrix'
import { StepExternalByteStore } from '../../step/step_buffer_provider'
import { IfcApiModelPassthrough } from './ifc_api_model_passthrough'
import { IfcApiModelPassthroughFactory } from './ifc_api_model_passthrough_factory'
import { Properties } from './properties'


export * from './ifc2x4'


export const UNKNOWN = 0
export const STRING = 1
export const LABEL = 2
export const ENUM = 3
export const REAL = 4
export const REF = 5
export const EMPTY = 6
export const SET_BEGIN = 7
export const SET_END = 8
export const LINE_END = 9

export interface Loadersettings {
  COORDINATE_TO_ORIGIN: boolean
  USE_FAST_BOOLS: boolean
  CIRCLE_SEGMENTS_LOW?: number
  CIRCLE_SEGMENTS_MEDIUM?: number
  CIRCLE_SEGMENTS_HIGH?: number
  BOOL_ABORT_THRESHOLD?: number

  /**
   * Conway extension (real web-ifc has no per-phase progress surface):
   * throttled structured progress events during OpenModel/OpenModelAsync —
   * see core/progress.ts and conway issue #301. Embedders should
   * feature-detect ('ON_PROGRESS simply ignored by older engines').
   */
  ON_PROGRESS?: ProgressCallback

  /**
   * Conway extension: fired once, right after the STEP header parses —
   * before the full file parse — with everything the header reveals
   * (file name, schema, originating system, preprocessor, byte size), so
   * embedders can print the model line as early as possible (issue #301).
   */
  ON_MODEL_INFO?: ( info: ModelInfo ) => void

  /**
   * Conway extension (OpenModelStreamed only; Share demand/tiled
   * rendering slice A): open with NO geometry extraction — the model
   * registers with an empty scene and the embedder pumps
   * `ExtractGeometryBatch` to extract products in file-order batches,
   * receiving each batch's meshes incrementally. Properties and the
   * spatial structure work from the first batch. Ignored by the
   * classic open paths and by the internal streamed→classic fallback.
   */
  DEFER_GEOMETRY?: boolean
}

/**
 * web-ifc compatible log levels (numeric values match web-ifc's enum so an
 * engine swap keeps SetLogLevel calls working). Mapped onto conway's
 * Logger threshold — see logging/logger.ts.
 */
export enum LogLevel {
  LOG_LEVEL_DEBUG = 1,
  LOG_LEVEL_INFO = 2,
  LOG_LEVEL_WARN = 3,
  LOG_LEVEL_ERROR = 4,
  LOG_LEVEL_OFF = 5,
}

const CONWAY_LOG_LEVEL_BY_WEBIFC: Record<LogLevel, ConwayLogLevel> = {
  [LogLevel.LOG_LEVEL_DEBUG]: ConwayLogLevel.DEBUG,
  [LogLevel.LOG_LEVEL_INFO]: ConwayLogLevel.INFO,
  [LogLevel.LOG_LEVEL_WARN]: ConwayLogLevel.WARNING,
  [LogLevel.LOG_LEVEL_ERROR]: ConwayLogLevel.ERROR,
  [LogLevel.LOG_LEVEL_OFF]: ConwayLogLevel.OFF,
}

// The directory conway-geom's web init locates wasm from when no
// embedder path is configured — also the conventional serve location
// (Share copies Dist/* there at build time).
const DEFAULT_WEB_WASM_DIRECTORY = '/static/js/'

/**
 * Normalize an embedder wasm directory (the SetWasmPath value) to the
 * absolute site path the web engine modules are served from — the
 * runtime module prefix isolated (multithreaded) contexts import the
 * engine from. Web wasm paths are site-root-relative by convention
 * ('./static/js/'); missing input falls back to the same '/static/js/'
 * directory conway-geom's web init already uses to locate wasm.
 *
 * @param wasmPath The embedder-configured wasm directory, if any.
 * @return {string} Absolute directory with a trailing slash.
 */
export function webWasmDirectory(wasmPath: string | undefined): string {

  let directory = wasmPath ?? ''

  if (directory === '') {
    return DEFAULT_WEB_WASM_DIRECTORY
  }

  if (directory.startsWith('./')) {
    directory = directory.substring(1)
  } else if (!directory.startsWith('/')) {
    directory = `/${directory}`
  }

  return directory.endsWith('/') ? directory : `${directory}/`
}

export interface Vector<T> {
  get(index: number): T
  push(parameter: T): void
  size(): number
}

export interface Color {
  x: number
  y: number
  z: number
  w: number
}

export interface PlacedGeometry {
  color: Color
  geometryExpressID: number
  flatTransformation: Array<number>
  // Shim extension (STEP/AP214): the occurrence path (NAUO express ids,
  // root->leaf) uniquely placing this instance. web-ifc keys picking on a
  // scalar expressID, but STEP reuses one part across occurrences, so the
  // `geometryExpressID` alone collides; this per-instance path lets Share
  // resolve a pick to the exact product-structure node. Undefined for IFC
  // (never set); empty for an AP214 root-level / single-occurrence placement.
  occurrencePath?: ReadonlyArray<number>
}

export interface FlatMesh {
  geometries: Vector<PlacedGeometry>
  expressID: number
}

export interface RawLineData {
  ID: number
  type: number
  arguments: any[]
}

export interface LoaderError {
  type: string
  message: string
  expressID: number
  ifcType: number
}

export interface IfcGeometry {
  GetVertexData(): number
  GetVertexDataSize(): number
  GetIndexData(): number
  GetIndexDataSize(): number
}

/**
 * @return {number} current time in ms
 */
export function ms(): number {
  return new Date().getTime()
}

export type LocateFileHandlerFn = FileHandlerCallback

/**
 * IfcAPI - Web-IFC API Shim Implementation for full read functionality
 */
export class IfcAPI {
  wasmModule: undefined | any = undefined
  fs: undefined | any = undefined
  wasmPath: string = ''
  isWasmPathAbsolute = false
  settings: Loadersettings | undefined
  globalModelIDCounter = 0
  models = new Map<number, IfcApiModelPassthrough>()
  conwaywasm = new ConwayGeometry()
  _isCoordinated: boolean = false
  linearScalingFactor: number = 1
  identity: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

  // Initialize the matrix using an array
  NormalizeMat: glmatrix.mat4 = glmatrix.mat4.fromValues(
      1, 0, 0, 0,  // First column
      0, 0, -1, 0, // Second column
      0, 1, 0, 0,  // Third column
      0, 0, 0, 1,   // Fourth column
  )

  properties = new Properties(this)

  /**
   * Get the passthrough for a particular model id.
   *
   * @param modelID
   * @return {IfcApiModelPassthrough | undefined}
   */
  public getPassthrough( modelID: number ): IfcApiModelPassthrough | undefined {
    return this.models.get( modelID )
  }

  /**
   * Initializes the WASM module (WebIFCWasm), required before using any other functionality.
   *
   * @param customLocateFileHandler An optional locateFile function that let's
   * you override the path from which the wasm module is loaded.
   */
  async Init(customLocateFileHandler?: LocateFileHandlerFn) {
    Environment.checkEnvironment()
    Logger.initializeWasmCallbacks()
    Logger.info(versionString)

    // Cross-origin-isolated web contexts select the multithreaded wasm,
    // whose pthread workers resolve their worker script from the engine
    // module's own import.meta.url. A bundler-inlined copy of the glue
    // gives workers a wrong URL (the worker script 404s and MT init dies
    // with a bare error Event — Share #1610). Setting a runtime module
    // prefix makes conway-geom import the engine module from the
    // directory it is actually served from, so import.meta.url — and
    // therefore the worker script URL — is correct. Web wasm paths are
    // site-root-relative by convention; no-op outside isolated windows.
    if (typeof window !== 'undefined' &&
        (window as { crossOriginIsolated?: boolean }).crossOriginIsolated === true) {
      setModulePrefix(webWasmDirectory(this.wasmPath))
    }
    const locateFileHandler: LocateFileHandlerFn = (path, prefix) => {
      // when the wasm module requests the wasm file, we redirect to include the user specified path
      if (path.endsWith('.wasm')) {
        if (this.isWasmPathAbsolute) {
          return this.wasmPath + path
        }

        return prefix + this.wasmPath + path
      }
      // otherwise use the default path
      return prefix + path
    }

    // @ts-ignore
    const initializationStatus = await
    this.conwaywasm.initialize((customLocateFileHandler !== void 0) ?
        customLocateFileHandler : locateFileHandler)

    if (!initializationStatus) {
      Logger.error('Could not initialize Conway Wasm')
      return
    }

    this.wasmModule = this.conwaywasm.wasmModule
  }

  /**
   * Opens a model and returns a modelID number
   *
   * @param data containing IFC data (bytes)
   * @param settings settings for loading the model
   * @return {number} model ID
   */
  OpenModel(data: Uint8Array, settings?: Loadersettings): number {

    const modelIdResult = this.globalModelIDCounter

    const result =
      IfcApiModelPassthroughFactory.from(
          modelIdResult,
          data,
          this.wasmModule,
          settings)

    if ( result === void 0 ) {
      return -1
    }

    this.globalModelIDCounter++

    this.models.set( modelIdResult, result )

    return modelIdResult
  }

  /**
   * Cooperative variant of OpenModel (conway extension; feature-detect with
   * typeof api.OpenModelAsync === 'function'). Identical parse/extraction,
   * but periodically yields to the event loop so browsers can repaint
   * progress UI (settings.ON_PROGRESS) and the tab is not flagged as
   * stalled — conway issue #301 §2. Currently cooperative for IFC input;
   * AP214/AP203/AP242 fall back to the synchronous path.
   *
   * @param data containing IFC data (bytes)
   * @param settings settings for loading the model
   * @return {Promise<number>} model ID
   */
  async OpenModelAsync(data: Uint8Array, settings?: Loadersettings): Promise<number> {

    // Reserve the ID before the first await — another OpenModel(Async) call
    // interleaving with the cooperative parse must not get the same ID. A
    // failed open burns an ID, which is harmless (IDs are only keys).
    const modelIdResult = this.globalModelIDCounter++

    const result =
      await IfcApiModelPassthroughFactory.fromAsync(
          modelIdResult,
          data,
          this.wasmModule,
          settings)

    if ( result === void 0 ) {
      return -1
    }

    this.models.set( modelIdResult, result )

    return modelIdResult
  }

  /**
   * Streamed-open variant of OpenModelAsync (conway extension;
   * feature-detect with typeof api.OpenModelStreamed === 'function').
   * IFC input parses through the streaming columnar indexer, so the
   * model's record index is columnar from birth and the classic
   * per-record object phase — the dominant JS-heap cost of parsing
   * large models — never exists. Everything downstream is identical to
   * OpenModelAsync: same cooperative geometry extraction, same
   * meshes/properties surface, and SpillModelSource works afterwards
   * as usual.
   *
   * Never does worse than OpenModelAsync: non-IFC formats and any
   * streamed-parse failure fall back to the classic path internally,
   * so -1 here means the classic open would have failed too.
   *
   * @param data containing IFC data (bytes)
   * @param settings settings for loading the model
   * @return {Promise<number>} model ID
   */
  async OpenModelStreamed(data: Uint8Array, settings?: Loadersettings): Promise<number> {

    // Reserve the ID before the first await — see OpenModelAsync.
    const modelIdResult = this.globalModelIDCounter++

    const result =
      await IfcApiModelPassthroughFactory.fromStreamed(
          modelIdResult,
          data,
          this.wasmModule,
          settings)

    if ( result === void 0 ) {
      return -1
    }

    this.models.set( modelIdResult, result )

    return modelIdResult
  }

  /**
   * Set conway's console-echo log threshold, web-ifc compatible surface
   * (numeric LogLevel enum). Embedders (e.g. Share) use this to quiet a
   * clean load's console down to warnings/errors — conway issue #301.
   *
   * @param level the web-ifc style numeric log level
   */
  SetLogLevel(level: LogLevel): void {
    const mapped = CONWAY_LOG_LEVEL_BY_WEBIFC[level]

    if (mapped === void 0) {
      Logger.warning(`[SetLogLevel]: unknown log level ${level}`)
      return
    }

    Logger.setLogLevel(mapped)
  }


  /**
   * Creates a new model and returns a modelID number (unimplemented)
   *
   * @param settings settings for generating data the model
   * @return {number} model ID
   */
  CreateModel(settings?: Loadersettings): number {

    Logger.warning('[CreateModel]: Shim - Unimplemented')
    return 0
  }

  /**
   *
   * @param modelID
   * @return {Uint8Array} unimplemented
   */
  ExportFileAsIFC(modelID: number): Uint8Array {
    Logger.warning(`[ExportFileAsIFC]: Model ${modelID}: Shim - Unimplemented`)
    const emptyArray = new Uint8Array(1)
    return emptyArray
  }


  /**
   * Opens a model and returns a modelID number
   *
   * @param modelID handle retrieved by OpenModel, model must not be closed
   * @param geometryExpressID containing IFC data (bytes)
   * @return {IfcGeometry}
   */
  GetGeometry(modelID: number, geometryExpressID: number): IfcGeometry {
    const result = this.models.get(modelID)

    if (result !== void 0) {

      return result.getGeometry(geometryExpressID)

    } else {

      Logger.error('[GetGeometry]: model === undefined')
    }

    Logger.error('[GetGeometry]: Error - returning dummyGeometry object')

    const dummyGeometry: IfcGeometry = (new (this.wasmModule.IfcGeometry)())

    return dummyGeometry
  }

  /**
   *
   * @param modelID
   * @param expressID
   * @param flatten
   * @return {any} line data
   */
  GetLine(modelID: number, expressID: number, flatten: boolean = false) {

    const result = this.models.get(modelID)

    if (result === void 0) {

      Logger.error('[GetLine]: model === undefined')
      return
    }

    return result.getLine(expressID, flatten)
  }

  /**
   * Conway extension (no web-ifc equivalent): drop the model's
   * materialised entity/descriptor caches, returning that memory to the
   * JS heap. Entities and attributes rematerialise transparently on the
   * next property access, so callers can invoke this between UI
   * interactions to keep the property working set bounded to what the
   * active UI is touching.
   *
   * @param modelID
   */
  ReleaseEntityCache(modelID: number): void {

    const result = this.models.get(modelID)

    if (result === void 0) {

      Logger.error('[ReleaseEntityCache]: model === undefined')
      return
    }

    result.releaseEntityCache?.()
  }

  /**
   * Conway extension: release the model's resident source buffer and
   * serve subsequent record reads through fixed-size windows paged in
   * from an external byte store (which must hold exactly the model's
   * source bytes — e.g. the original file already sitting in OPFS).
   *
   * After a spill, asynchronous property APIs page ranges in on
   * demand; SYNCHRONOUS record reads (getLine on the passthrough)
   * require the range to be resident and throw otherwise. Call this
   * only after load-time sweeps (geometry extraction, spatial tree,
   * GLB property capture) are done.
   *
   * @param modelID The model to spill.
   * @param store The external byte store holding the source bytes.
   * @param chunkBytes Optional window size in bytes (default 4MiB).
   * @param maxResidentChunks Optional residency cap (default 16 windows).
   * @return {boolean} True when the spill happened.
   */
  SpillModelSource(
      modelID: number,
      store: StepExternalByteStore,
      chunkBytes?: number,
      maxResidentChunks?: number ): boolean {

    const result = this.models.get(modelID)

    if (result === void 0) {

      Logger.error('[SpillModelSource]: model === undefined')
      return false
    }

    if (result.spillSourceToExternalStore === void 0) {
      return false
    }

    result.spillSourceToExternalStore(store, chunkBytes, maxResidentChunks)
    return true
  }

  /**
   * Conway extension: lazily iterate the express IDs of all root-derived
   * (GlobalId-bearing) entities — products, relationships, property sets,
   * quantities — straight from the type index. No entity descriptors are
   * materialised and the source buffer is never touched, so this is safe
   * and cheap even after SpillModelSource, and lets property sweeps skip
   * the geometric-resource records that dominate large models.
   *
   * Multi-mapped entities may be yielded once per mapping; callers that
   * need distinct IDs should dedupe. Returns undefined when the model
   * doesn't exist or its schema has no root-type notion (e.g. AP214).
   *
   * @param modelID The model to iterate.
   * @return {IterableIterator<number> | undefined} Lazy express ID
   * iterator, or undefined when unsupported.
   */
  RootExpressIDs(modelID: number): IterableIterator<number> | undefined {

    const result = this.models.get(modelID)

    if (result === void 0) {

      Logger.error('[RootExpressIDs]: model === undefined')
      return void 0
    }

    return result.rootExpressIDs?.()
  }

  /**
   *
   * @param modelID
   * @return {Vector<LoaderError>}
   */
  GetAndClearErrors(modelID: number): Vector<LoaderError> {
    Logger.warning('[GetAndClearErrors]: Shim - Unimplemented')
    const wasmErrorsDummy: Vector<LoaderError> = {
      get(index: number): LoaderError {
        // Implementation here
        return { type: '', message: '', expressID: 0, ifcType: 0 }
      },
      size(): number {
        // Implementation here
        return 0
      },
      push(): void {
        // eslint-disable-next-line no-useless-return
        return
      },
    }

    return wasmErrorsDummy
  }

  /**
   *
   * @param modelID
   * @param lineObject
   */
  WriteLine(modelID: number, lineObject: any) {
    Logger.warning('[WriteLine]: Shim - Unimplemented')
  }

  /**
   *
   * @param modelID
   * @param line
   * @return {string | undefined}
   */
  FlattenLine(modelID: number, line: any) {
    const result = this.models.get(modelID)

    if (result === void 0) {

      Logger.error('[FlattenLine]: model === undefined')
      return
    }

    return result.flattenLine(line)
  }

  /**
   *
   * @param modelID
   * @param expressID
   * @return {RawLineData}
   */
  GetRawLineData(modelID: number, expressID: number): RawLineData {

    const result = this.models.get(modelID)

    if (result === void 0) {

      Logger.error('[GetRawLineData]: model === undefined')

      return {
        ID: expressID,
        type: -1,
        arguments: ['invalid'],
      }
    }

    return result.getRawLineData(expressID)

  }


  /**
   * Get all line ids with the matching type
   *
   * @param modelID
   * @param type
   * @return {Vector<number>} The matching express IDs
   */
  GetLineIDsWithType(modelID: number, type: number): Vector<number> {
    const result = this.models.get(modelID)

    if (result === void 0) {

      Logger.error('[GetLineIDsWithType]: model === undefined')

      const vectorArray: Array<number> = []
      return {
        get(index: number): number {
          // Your implementation here
          if (index >= vectorArray.length) {
            return -1
          }

          return vectorArray[index]
        },
        size(): number {
          // Your implementation here
          return vectorArray.length
        },

        push(parameter: number): void {
          vectorArray.push(parameter)
        },
      }
    }

    return result.getLineIDsWithType(type)
  }

  /**
   *
   * @param modelID
   * @return {Vector<number>}
   */
  GetAllLines(modelID: number): Vector<number> {

    const result = this.models.get(modelID)

    if (result === void 0) {

      Logger.error('[GetAllLines]: model === undefined')

      const vectorArray: Array<number> = []
      return {
        get(index: number): number {
          // Your implementation here
          if (index >= vectorArray.length) {
            return -1
          }

          return vectorArray[index]
        },
        size(): number {
          // Your implementation here
          return vectorArray.length
        },

        push(parameter: number): void {
          vectorArray.push(parameter)
        },
      }
    }

    return result.getAllLines()
  }

  /**
   *
   * @param modelID
   * @param transformationMatrix
   */
  setGeometryTransformation(modelID: number, transformationMatrix: Array<number>) {
    /* if (transformationMatrix.length != 16) {
            Logger.error(`Bad transformation matrix size: ${transformationMatrix.length}`)
            return
        }
        this.wasmModule.setGeometryTransformation(modelID, transformationMatrix)*/

    Logger.warning('[setGeometryTransformation]: Shim - Unimplemented')
  }

  /**
   *
   * @param modelID
   * @return {Array<number>}
   */
  GetCoordinationMatrix(modelID: number): Array<number> {

    const result = this.models.get(modelID)

    if (result !== void 0) {

      return result.getCoordinationMatrix()
    }

    const coordinationMatrix: glmatrix.mat4 = glmatrix.mat4.create()

    return Array.from(coordinationMatrix)
  }

  /**
   *
   * @param ptr
   * @param size
   * @return {Float32Array}
   */
  GetVertexArray(ptr: number, size: number): Float32Array {
    return this.getSubArray(this.wasmModule.HEAPF32, ptr, size) as Float32Array
  }

  /**
   *
   * @param ptr
   * @param size
   * @return {Uint32Array}
   */
  GetIndexArray(ptr: number, size: number): Uint32Array {
    return this.getSubArray(this.wasmModule.HEAPU32, ptr, size) as Uint32Array
  }

  /**
   *
   * @param heap
   * @param startPtr
   * @param sizeBytes
   * @return {Float32Array | Uint32Array}
   */
  getSubArray(heap: Float32Array | Uint32Array, startPtr: number, sizeBytes: number):
    Float32Array | Uint32Array {
    // eslint-disable-next-line no-magic-numbers, no-mixed-operators
    return heap.subarray(startPtr / 4, startPtr / 4 + sizeBytes).slice(0)
  }

  /**
   * Closes a model and frees all related memory
   *
   * @param modelID Model handle retrieved by OpenModel, model must not be closed
   */
  CloseModel(modelID: number) {
    if (this.models.has(modelID) === false) {
      Logger.error(`[CloseModel]: Model ${modelID} not found`)
      return
    }

    Logger.info(`[CloseModel]: Closing model ${modelID}`)
    this.models.delete(modelID)
    this.conwaywasm.destroy()
  }

  /**
   * Conway extension (Share demand/tiled rendering slice A): on a model
   * opened with `OpenModelStreamed(data, {DEFER_GEOMETRY: true})`,
   * extract the next `batchSize` products and emit this batch's meshes —
   * the incremental twin of StreamAllMeshes. Feature-detect with
   * `typeof api.ExtractGeometryBatch === 'function'`; call repeatedly
   * until `remaining` is 0.
   *
   * @param modelID handle retrieved by OpenModelStreamed
   * @param batchSize max products to extract this call
   * @param meshCallback receives each newly-extracted product's mesh
   * @return {object} `{extracted, remaining}`; `{extracted: 0,
   * remaining: 0}` for unknown models or models without the deferred
   * pump (non-IFC / fully-extracted opens).
   */
  ExtractGeometryBatch(
      modelID: number,
      batchSize: number,
      meshCallback?: (mesh: FlatMesh) => void ): {extracted: number, remaining: number} {

    const result = this.models.get(modelID)

    if (result?.extractGeometryBatch === void 0) {
      return {extracted: 0, remaining: 0}
    }

    return result.extractGeometryBatch(batchSize, meshCallback)
  }

  /**
   *
   * @param modelID
   * @param meshCallback
   */
  StreamAllMeshes(modelID: number, meshCallback: (mesh: FlatMesh) => void): void {
    const result = this.models.get(modelID)

    if (result !== void 0) {

      result.streamAllMeshes(meshCallback)
    }

    Logger.displayLogs()
    Logger.clearLogs()
    Logger.printStatistics(modelID)
  }


  /**
   *
   * @param modelID
   * @param types
   * @param meshCallback
   */
  StreamAllMeshesWithTypes(modelID: number,
      types: Array<number>,
      meshCallback: (mesh: FlatMesh) => void): void {
    const result = this.models.get(modelID)

    if (result !== void 0) {

      result.streamAllMeshesWithTypes(types, meshCallback)
    }
  }

  /**
   * Checks if a specific model ID is open or closed
   *
   * @param modelID handle retrieved by OpenModel
   * @return {boolean}
   */
  IsModelOpen(modelID: number): boolean {
    if (this.models.has(modelID)) {
      return true
    }

    return false
  }

  /**
   * Load all geometry in a model
   *
   * @param modelID handle retrieved by OpenModel
   * @return {Vector<FlatMesh>}
   */
  LoadAllGeometry(modelID: number): Vector<FlatMesh> {
    const result = this.models.get(modelID)

    if (result !== void 0) {

      return result.loadAllGeometry()
    }

    // dummy vars
    const dummyColor = {
      x: 0,
      y: 0,
      z: 0,
      w: 0,
    }

    // Single PlacedGeometry variable
    const singlePlacedGeometry: PlacedGeometry = {
      color: dummyColor,
      geometryExpressID: 0, // replace with actual ID
      flatTransformation: this.identity,
    }

    // eslint-disable-next-line no-array-constructor
    const placedGeometryArray = new Array<PlacedGeometry>()

    // Vector of PlacedGeometry
    const vectorOfPlacedGeometry: Vector<PlacedGeometry> = {
      get(index: number): PlacedGeometry {
        if (index >= placedGeometryArray.length) {
          return singlePlacedGeometry
        }

        return placedGeometryArray[index]
      },
      size(): number {
        return placedGeometryArray.length
      },
      push(parameter: PlacedGeometry): void {
        placedGeometryArray.push(parameter)
      },
    }

    // eslint-disable-next-line no-array-constructor
    const flatMeshArray = new Array<FlatMesh>()
    const flatMeshDummy: FlatMesh = {
      geometries: vectorOfPlacedGeometry,
      expressID: 0, // replace with actual expressID
    }

    // Vector of FlatMesh
    const vectorOfFlatMesh: Vector<FlatMesh> = {
      get(index: number): FlatMesh {
        if (index >= placedGeometryArray.length) {
          return flatMeshDummy
        }

        return flatMeshArray[index]
      },
      size(): number {
        // Your implementation here
        return flatMeshArray.length
      },
      push(parameter: FlatMesh): void {
        flatMeshArray.push(parameter)
      },
    }
    return vectorOfFlatMesh
  }

  /**
   * Load geometry for a single element
   *
   * @param modelID handle retrieved by OpenModel
   * @param expressID express ID of flat mesh
   * @return {FlatMesh}
   */
  GetFlatMesh(modelID: number, expressID: number): FlatMesh {
    const result = this.models.get(modelID)

    if (result !== void 0) {

      return result.getFlatMesh(expressID)
    }

    // Single PlacedGeometry variable
    const dummyColor = {
      x: 0,
      y: 0,
      z: 0,
      w: 0,
    }
    const singlePlacedGeometry: PlacedGeometry = {
      color: dummyColor,
      geometryExpressID: 0, // replace with actual ID
      flatTransformation: [/* your array of numbers here */],
    }

    // Vector of PlacedGeometry
    const vectorOfPlacedGeometry: Vector<PlacedGeometry> = {
      get(index: number): PlacedGeometry {
        // Your implementation here
        return singlePlacedGeometry // Dummy return, replace with actual implementation
      },
      size(): number {
        // Your implementation here
        return 1 // Dummy return, replace with actual implementation
      },
      push(): void {
        // eslint-disable-next-line no-useless-return
        return
      },
    }

    const flatMeshDummy: FlatMesh = {
      geometries: vectorOfPlacedGeometry,
      expressID: 0, // replace with actual expressID
    }

    return flatMeshDummy
  }

  /**
   * Creates a map between element ExpressIDs and GlobalIDs.
   * Each element has two entries, (ExpressID -> GlobalID) and (GlobalID -> ExpressID).
   *
   * @param modelID handle retrieved by OpenModel
   */
  CreateIfcGuidToExpressIdMapping(modelID: number): void {
    /* const map = new Map<string | number, string | number>()

        for (let x = 0; x < IfcElements.length; x++) {

            const type = IfcElements[x]
            const lines = this.GetLineIDsWithType(modelID, type)
            const size = lines.size()

            for (let y = 0; y < size; y++) {

                const expressID = lines.get(y)
                const info = this.GetLine(modelID, expressID)
                const globalID = info.GlobalId.value

                map.set(expressID, globalID)
                map.set(globalID, expressID)
            }
        }

        this.ifcGuidMap.push(modelID, map)*/

    Logger.warning(`[CreateIfcGuidToExpressIdMapping]: Model ${modelID}: Shim - Unimplemented`)
  }

  /**
   *
   * @param path new wasm path
   * @param absolute is the path absolute?
   */
  SetWasmPath(path: string, absolute = false) {
    this.wasmPath = path
    this.isWasmPathAbsolute = absolute
  }

  // Non web-ifc methods
  /** The conway version string like "0.23.940-WebMT" */
  getConwayVersion(): string {
    return versionString
  }  

  /** @see https://bldrs-ai.github.io/conway/classes/statistics_statistics.Statistics.html */
  getStatistics(modelID: number): any {
    return Logger.getStatistics(modelID)
  }  
}
