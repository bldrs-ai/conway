import { ConwayGeometry, FileHandlerFunction as FileHandlerCallback,
  setModulePrefix,
 } from '../../index'
import {versionString} from '../../version/version'
import Logger, { LogLevel as ConwayLogLevel } from '../../logging/logger'
import { ProgressCallback } from '../../core/progress'
import { ModelInfo } from '../../core/progress_log'
import {
  WasmHeapArrayConstructor, wasmHeapView,
} from '../../core/wasm_heap'
import Environment from '../../utilities/environment'
import * as glmatrix from 'gl-matrix'
import { StepExternalByteStore } from '../../step/step_buffer_provider'
import { IfcApiModelPassthrough } from './ifc_api_model_passthrough'
import { IfcApiModelPassthroughFactory } from './ifc_api_model_passthrough_factory'
import { Properties } from './properties'
import type { PreviewMeshPayload } from './streamed_preview_channel'

export type { PreviewMeshPayload } from './streamed_preview_channel'


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

  /**
   * Conway extension (DEFER_GEOMETRY only; conway#638): the caller declares
   * that IT owns the pumped mesh stream, so conway keeps no reference to it.
   *
   * Default (absent/false) is the historical behaviour, unchanged: every
   * `PlacedGeometry` the pump builds is filed into the model's cumulative
   * per-entity `meshMap` and its `vectorFlatMesh` spine as well as being
   * handed to the mesh callback, so a later whole-model ask can be served
   * out of that cache. On a D3D-scale model that cache is the largest single
   * bucket of JS heap a load holds — 475 MB of `FlatMesh`/`PlacedGeometry`
   * measured — and a consumer that assembles each batch as it lands (Share's
   * incremental batched builder) never reads it.
   *
   * With this set, the pump delivers each delta `FlatMesh` to the callback
   * and drops it. **The callback is the only delivery**: whatever the
   * consumer does not copy or keep is gone.
   *
   * **This drops JS pointer spines, never native geometry.** The natives
   * behind the delivered placements are owned by the model's geometry store
   * and are freed only by `GEOMETRY_BUDGET_MB` eviction or
   * `ReleaseModelGeometry`, neither of which this setting touches. The
   * copy-window guarantee above — everything pump call N delivered stays
   * resident until call N+1 begins — therefore holds exactly as it does
   * without this flag.
   *
   * **A late whole-model ask still works, until the natives are gone.**
   * `StreamAllMeshes`, `LoadAllGeometry` and `GetFlatMesh` on such a model
   * re-walk the live scene rather than replaying a cache, which costs a walk
   * but returns the same placements the pump delivered.
   *
   * **What a budget does to that ask.** The re-walk reads the geometry store,
   * and `GEOMETRY_BUDGET_MB` eviction deletes from it, so an evicted
   * placement is not recovered by the re-walk — it is simply absent from
   * what the ask returns. Partial loss is served with a warning naming the
   * count of unresolved instances; total loss — nothing resolved at all —
   * throws a descriptive error naming this contract, as does a whole-model
   * ask after `ReleaseModelGeometry`. What never happens is a silent empty
   * model. A consumer that needs every placement should copy at delivery
   * from the pump, which is what the budget's own contract already says.
   *
   * **Scope: on a windowed source the ask is async
   * ({@link StreamAllMeshesAsync}).** The synchronous whole-model entry
   * points drain through the synchronous pump, which refuses an external
   * source outright — *"ExtractGeometryBatch is synchronous and cannot page
   * a windowed source"*. That predates this setting, is identical with and
   * without it, and is unchanged: `StreamAllMeshes` on a model opened with
   * `OpenModelStream` still throws. `StreamAllMeshesAsync` (conway#660) is
   * the entry point that serves such a model — it drains through
   * `ExtractGeometryBatchAsync`, which pages each batch's product closures
   * in, and then serves the identical re-walk with the identical accounting.
   * Share pumps the async pump over a store, so that is the entry point a
   * windowed Share load reaches for.
   *
   * The re-walk itself is unaffected by windowing either way: it resolves
   * scene nodes against the model's geometry STORE, never against the byte
   * source, so what a fully drained windowed model can serve is exactly what
   * a fully drained resident one can. Paging is a property of the drain.
   *
   * Ignored on a non-deferred open, which has no pump and no accumulation to
   * suppress.
   */
  STREAMING_CONSUMER?: boolean

  /**
   * Conway extension (OpenModelStreamed + DEFER_GEOMETRY only; demand/tiled
   * rendering slice A2): receive PREVIEW mesh payloads while the parse is
   * still running — self-contained (geometry copied out of the wasm heap),
   * so they can be uploaded before the model exists. Preview quality:
   * relationship records (voids, materials) live near the end of real IFC
   * files, so previews can miss openings/materials; the durable batch pump
   * re-extracts every product after the parse and REPLACES the preview.
   * Consumers must treat these as disposable. Ignored everywhere else.
   */
  ON_PREVIEW_MESH?: ( mesh: PreviewMeshPayload ) => void

  /**
   * Conway extension (DEFER_GEOMETRY only; M3's budgeted arena): cap the
   * native geometry a model keeps resident, in MB. At the START of each pump
   * batch the least-recently-used assets are evicted until the live set
   * fits. Unset — the default — keeps everything, which is what every
   * consumer did before this existed.
   *
   * **This changes a contract, so it is opt-in.** An evicted asset is gone
   * from `GetGeometry` until something re-extracts it, which is safe for a
   * consumer that copies payloads at delivery (the invariant Share#1640
   * asserts) and unsafe for one that keeps geometry IDs and fetches them
   * lazily later.
   *
   * **What "at delivery" means, precisely.** Everything pump call N
   * delivered stays resident until pump call N+1 BEGINS, so the copy window
   * is the whole gap between calls — an embedder may return from the pump,
   * yield to the event loop, and only then read back the batch's geometry.
   * Eviction ran at the tail of the pump until Sentry SHARE-1NK, which made
   * that window a lie: a batch bigger than the whole budget was evicted by
   * its own call, and the copy that followed hit a freed handle. The price
   * of the guarantee is that the live set may transiently exceed the budget
   * by one batch.
   *
   * **The trailing batch is the consumer's job, not the engine's.** The
   * "by one batch" overshoot above is normally transient — pump call N+1's
   * head eviction trims whatever call N left over budget. But nothing forces
   * a call N+1: a consumer whose loop stops the moment `remaining` reaches 0
   * never makes that call, so if the FINAL batch pushed `liveBytes` over
   * budget, that overshoot is permanent, not transient — it persists for the
   * model's lifetime. Evicting at the tail of that last call instead is not
   * a fix: it would reintroduce the SHARE-1NK bug above for exactly that
   * batch, since the embedder's copy happens after the call returns and
   * there is still no in-engine signal for "the embedder is done copying."
   * The trim is therefore on the consumer: pump once more after `remaining`
   * reaches 0 (it extracts nothing and costs only the eviction pass) or call
   * `SetGeometryBudget` directly. Share's own loop already does the former —
   * its stop condition is `remaining === 0 && extracted === 0`, not
   * `remaining === 0` alone, which guarantees exactly one such zero-work
   * call. See {@link ExtractGeometryBatch}'s doc for the same contract from
   * the pump-signature side.
   *
   * Budgeted on each native's `getAllocationSize` — vertices, triangles,
   * edges, the triangle-edge structures and the float vertex mirror. That is
   * deliberately NOT the vertex+index payload `calculateGeometrySize`
   * reports: the extra structures are real wasm bytes, so a ceiling that
   * ignored them would bind later than its number suggests.
   *
   * The wasm heap still runs at a multiple of the budget (3-4x on the models
   * measured) and cannot be used as the signal itself: it is grow-only, so it
   * never falls when a native is freed. Expect the heap high-water to track
   * the budget proportionally rather than equal it.
   */
  GEOMETRY_BUDGET_MB?: number

  /**
   * Conway extension (OpenModelFromIndex only): verify the sidecar's
   * source hash by re-reading the whole store, rather than checking its
   * byte length alone.
   *
   * Default off, and that default is the design rather than a shortcut.
   * The distribution case — a coordinator that folded the hash into its
   * own parse handing the index to workers addressing the same store —
   * would pay a second full read *per worker* to re-derive a digest the
   * coordinator already took over those exact bytes, which is the N-way
   * I/O a shared index exists to remove. Turn it on for the revisit case,
   * where a persisted sidecar may describe a file that has since changed.
   * See `index_sidecar.ts` §"The trust gate" for what each gate does and
   * does not establish.
   */
  VERIFY_INDEX_SOURCE_HASH?: boolean
}

/* MB as the API's unit, bytes as the engine's: the budget is a number a
 * human picks, and the accounting is in bytes. */
// eslint-disable-next-line no-magic-numbers
const BYTES_PER_MIB = 1024 * 1024

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
   * M1b store-backed open (conway extension; feature-detect with
   * `typeof api.OpenModelStream === 'function'`). Parses through a
   * moving window over `store` and keeps the model windowed from
   * birth — the source is never one JS `ArrayBuffer`. Geometry
   * extract on the deferred path must use
   * {@link ExtractGeometryBatchAsync} so product closures can be
   * paged in.
   *
   * IFC only; other formats return -1 (caller should fall back to
   * buffering + OpenModelStreamed).
   *
   * @param store External store holding the source bytes (OPFS File).
   * @param settings settings for loading the model
   * @return {Promise<number>} model ID, or -1 on failure
   */
  async OpenModelStream(
      store: StepExternalByteStore,
      settings?: Loadersettings ): Promise<number> {

    const modelIdResult = this.globalModelIDCounter++

    const result =
      await IfcApiModelPassthroughFactory.fromStore(
          modelIdResult,
          store,
          this.wasmModule,
          settings)

    if ( result === void 0 ) {
      return -1
    }

    this.models.set( modelIdResult, result )

    return modelIdResult
  }

  /**
   * Index-first open (conway extension; feature-detect with
   * `typeof api.OpenModelFromIndex === 'function'`). Consumes a **prebuilt
   * entity index** — a sidecar from `serializeIndexSidecarFromColumns` —
   * instead of building one, and keeps the model windowed over `store`
   * exactly as {@link OpenModelStream} does. Everything downstream is
   * identical; only the parse is gone.
   *
   * This is what makes a geometry worker pool pay. Every worker used to
   * `OpenModelStream` and parse the whole file itself: on PSB in Chrome
   * that measured 3.0× *slower* overall than no pool at all, with the main
   * thread's own untouched parse going 15.8 s → 27.7 s under the
   * contention (conway#541). One parse, N consumers of its index, is the
   * precondition rather than an optimisation.
   *
   * IFC only, inheriting the store path's restriction. Returns **-1** on
   * any failure — including a sidecar that does not match the store — so
   * the caller falls back to `OpenModelStream` **explicitly**. There is no
   * internal cold-parse fallback: taking one silently would spend the
   * whole cost the call exists to avoid and make a stale index invisible.
   *
   * @param store External store holding the source bytes (OPFS File).
   * @param sidecar The serialised index.
   * @param settings settings for loading the model
   * @return {Promise<number>} model ID, or -1 on failure
   */
  async OpenModelFromIndex(
      store: StepExternalByteStore,
      sidecar: Uint8Array,
      settings?: Loadersettings ): Promise<number> {

    const modelIdResult = this.globalModelIDCounter++

    const result =
      await IfcApiModelPassthroughFactory.fromIndex(
          modelIdResult,
          store,
          sidecar,
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
   * Conway extension: the coordination frame the open ACTUALLY applied
   * to emitted placements (the COORDINATE_TO_ORIGIN recenter), identity
   * when none ran. GetCoordinationMatrix keeps its classic identity
   * contract (consumers stamp it onto assembled models); this is the
   * explicit report of the real offset so embedders can map rendered
   * points back to source-world coordinates (Share#1634 acceptance).
   * Feature-detect: typeof api.GetAppliedCoordinationMatrix.
   *
   * @param modelID
   * @return {Array<number>} column-major mat4
   */
  GetAppliedCoordinationMatrix(modelID: number): Array<number> {

    const result = this.models.get(modelID)

    if (result !== void 0 && result.getAppliedCoordination !== void 0) {

      return result.getAppliedCoordination()
    }

    return Array.from(glmatrix.mat4.create())
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

    // `heap` stays in the signature because web-ifc's API puts it there, but
    // it is now read only for its element type. The view itself is rebuilt
    // over the module's CURRENT heap buffer: a caller-held HEAPF32/HEAPU32 can
    // be bound to a pre-growth buffer on the MT build, and subarray() on such
    // a view clamps the window silently and returns short data rather than
    // failing (#485, and see core/wasm_heap.ts).
    const arrayType =
      heap.constructor as WasmHeapArrayConstructor<Float32Array | Uint32Array>

    // slice(0) as before, so the result outlives the next call into wasm.
    return wasmHeapView(this.wasmModule, arrayType, startPtr, sizeBytes).slice(0)
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
   * `typeof api.ExtractGeometryBatch === 'function'`; call repeatedly until
   * `remaining === 0 && extracted === 0` — one call PAST `remaining` alone
   * first reaching 0. That extra call extracts nothing, but it still runs
   * the geometry budget's head eviction (see `GEOMETRY_BUDGET_MB`), which is
   * the only thing that trims an overshoot the final real batch left over
   * budget; stopping at `remaining === 0` alone can leave that overshoot
   * resident for the model's lifetime.
   *
   * DELTA CONTRACT: an entity may be emitted again in a LATER call with
   * a FlatMesh containing only its NEW placed instances (shared/mapped
   * geometry attributes instances to an entity from other products'
   * extractions). Consumers must render/accumulate deltas additively —
   * never key emissions by expressID with overwrite semantics. Each
   * placed instance is emitted exactly once across all calls.
   *
   * @param modelID handle retrieved by OpenModelStreamed
   * @param batchSize max products to extract this call
   * @param meshCallback receives each newly-extracted product's mesh
   * @return {object} `{extracted, remaining}`; `{extracted: 0,
   * remaining: 0}` for unknown models or models without the deferred
   * pump (non-IFC / fully-extracted opens).
   */
  /**
   * Conway extension (M3's budgeted arena): cap the native geometry a model
   * keeps resident, in MB, after it is already open. At each pump batch the
   * least-recently-used assets are evicted until the live set fits. Pass 0
   * or a non-finite value to remove the cap.
   *
   * Prefer this over the GEOMETRY_BUDGET_MB open setting when the right
   * number depends on the device or the moment — reopening an 860 MB model
   * to change a budget is not a real option.
   *
   * Same contract as the setting: an evicted asset is gone from GetGeometry
   * until something re-extracts it, which is safe for a consumer that copies
   * payloads at delivery and unsafe for one that fetches lazily later.
   *
   * Same trailing-batch caveat as the setting, too: this eviction pass runs
   * against the live set as it stands right now, so it does not by itself
   * guarantee a LATER pump call won't push `liveBytes` back over budget.
   * Calling this explicitly after a demand pump's `remaining` reaches 0 is
   * exactly the "pump once more" trim `GEOMETRY_BUDGET_MB` describes — a
   * direct call here is equivalent to that trailing zero-work pump call.
   *
   * @param modelID handle retrieved by an open
   * @param megabytes the ceiling, in MB of native allocation (see
   * GEOMETRY_BUDGET_MB for what that counts)
   * @return {object|undefined} the budget now in force and the bytes
   * currently accounted resident, or undefined for unknown models and for
   * passthroughs with no evictable geometry store (AP214/STEP).
   */
  SetGeometryBudget( modelID: number, megabytes: number ):
      { budgetBytes: number, liveBytes: number } | undefined {

    const result = this.models.get(modelID)

    if (result?.setGeometryBudget === void 0) {
      return void 0
    }

    return result.setGeometryBudget( megabytes * BYTES_PER_MIB )
  }

  /**
   * Conway extension (M3): extract only one shard of a deferred model's
   * geometry, so N workers — each with its own instance and heap — can pump
   * disjoint products with no scheduling channel between them.
   *
   * Placement is a pure function of the product (its representation's mapped
   * source), so every worker independently agrees on who owns what, and
   * products sharing geometry land together rather than each shard rebuilding
   * it. Measured at N=4: +0 % extra assets on MB-Khaya and +38.1 % on D3D
   * against round-robin's +25 % and +40.7 %, for 1.76x and 2.34x wall-clock.
   *
   * **A shard is a SUBSET of the model.** Pumping one to completion yields
   * part of the geometry; the consumer unions the shards. Call before the
   * first ExtractGeometryBatch — after that the worklists exist and narrowing
   * them would drop products already reported as pending, so it throws.
   *
   * **Order matters against {@link SetCoordinationFrame}.** A model opened
   * with COORDINATE_TO_ORIGIN is refused here unless a frame has already
   * been supplied, so supply the frame first. The refusal names it.
   *
   * @param modelID handle from a DEFER_GEOMETRY open
   * @param shard `{index, count}`, or omitted for the whole model
   * @return {boolean} false for unknown models and for passthroughs with no
   * demand worklists (AP214/STEP), which cannot shard
   */
  SetGeometryShard(
      modelID: number,
      shard?: { index: number, count: number } ): boolean {

    const result = this.models.get(modelID)

    if (result?.setGeometryShard === void 0) {
      return false
    }

    result.setGeometryShard(shard)

    return true
  }

  /**
   * Conway extension (M3): supply the recentre frame a deferred model
   * applies, instead of letting it derive one from its own first geometry.
   *
   * This is what makes COORDINATE_TO_ORIGIN and {@link SetGeometryShard}
   * combinable. A derived frame is anchored on whichever product the
   * instance extracts first, so N workers derive N frames and a model
   * spanning more than one recentre cell reassembles with its shards offset
   * by whole cells — individually plausible placements, a wrong picture.
   * One frame handed to every worker removes the disagreement at the source.
   *
   * Typical use: the coordinator opens once (its parse-time preview channel
   * derives a frame), reads it back with {@link GetAppliedCoordinationMatrix}, and
   * passes it to every worker before their first batch.
   *
   * @param modelID handle from a DEFER_GEOMETRY open
   * @param matrix column-major mat4 of 16 finite numbers, or omitted to drop
   * a previously supplied frame
   * @return {boolean} false for unknown models and for passthroughs with no
   * deferred pump (AP214/STEP), which have no frame to supply
   */
  SetCoordinationFrame( modelID: number, matrix?: number[] ): boolean {

    const result = this.models.get(modelID)

    if (result?.setCoordinationFrame === void 0) {
      return false
    }

    result.setCoordinationFrame(matrix)

    return true
  }

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
   * Async twin of {@link ExtractGeometryBatch}: pages each product's
   * source-byte closure before extracting it. Required for models
   * opened with {@link OpenModelStream}; a no-op-prefetch on a
   * resident-source deferred open. Feature-detect with
   * `typeof api.ExtractGeometryBatchAsync === 'function'`.
   *
   * @param modelID handle retrieved by OpenModelStream / OpenModelStreamed
   * @param batchSize max products to extract this call
   * @param meshCallback receives each newly-extracted product's mesh
   * @return {Promise<object>} `{extracted, remaining}`
   */
  async ExtractGeometryBatchAsync(
      modelID: number,
      batchSize: number,
      meshCallback?: (mesh: FlatMesh) => void ):
      Promise<{extracted: number, remaining: number}> {

    const result = this.models.get(modelID)

    if (result?.extractGeometryBatchAsync !== void 0) {
      return result.extractGeometryBatchAsync(batchSize, meshCallback)
    }

    if (result?.extractGeometryBatch === void 0) {
      return {extracted: 0, remaining: 0}
    }

    return result.extractGeometryBatch(batchSize, meshCallback)
  }

  /**
   * Conway extension: free a model's native geometry once the consumer
   * has built its own scene from the meshes — every canonical mesh the
   * extraction produced plus the GetGeometry map. Subsequent
   * GetGeometry calls return an empty dummy; placed transforms, the
   * spatial structure and properties are untouched. Feature-detect with
   * `typeof api.ReleaseModelGeometry === 'function'`.
   *
   * The wasm heap never shrinks, but freed pages are reused — repeated
   * loads in one tab plateau instead of stacking whole model scenes.
   * On a deferred model whose pump has not drained this is a safe
   * no-op returning false.
   *
   * @param modelID handle retrieved by OpenModel/OpenModelStreamed
   * @return {boolean} True when geometry was released.
   */
  /**
   * Conway extension: the model's linear scaling factor to metres
   * (1 = metres, 0.001 = millimetres, 0.0254 = inches), derived from
   * the model's unit assignment during extraction. Feature-detect with
   * `typeof`. Returns 1 for unknown models.
   *
   * @param modelID handle retrieved by OpenModel/OpenModelStreamed
   * @return {number} metres per model unit.
   */
  GetLinearScalingFactor(modelID: number): number {
    return this.models.get(modelID)?.linearScalingFactor ?? 1
  }

  ReleaseModelGeometry(modelID: number): boolean {

    const result = this.models.get(modelID)

    if (result?.releaseGeometry === void 0) {
      return false
    }

    return result.releaseGeometry()
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
   * Conway extension (conway#660): async twin of {@link StreamAllMeshes},
   * and the ONLY whole-model ask a **windowed** deferred model can answer.
   *
   * `StreamAllMeshes` drains a deferred model through the synchronous pump,
   * which refuses an external source — *"ExtractGeometryBatch is synchronous
   * and cannot page a windowed source"* — so on a model opened with
   * {@link OpenModelStream} it throws before serving anything. This drains
   * through {@link ExtractGeometryBatchAsync} instead, paging each batch's
   * product closures in, and then serves exactly what the sync entry point
   * would have served on the same model: the same placements, the same
   * `STREAMING_CONSUMER` re-walk, the same budget accounting (partial loss
   * warns with the unresolved count, total loss throws), and the same loud
   * throw once `ReleaseModelGeometry` has freed the natives.
   *
   * **What it does not do is recover geometry.** The re-walk that serves the
   * ask reads the model's geometry store, not the byte source, so paging is
   * a property of the DRAIN only — anything a `GEOMETRY_BUDGET_MB` eviction
   * already freed is reported as missing rather than fetched back, exactly
   * as on a resident source. A consumer that needs every placement copies at
   * delivery from the pump.
   *
   * Safe on a resident source and on a non-deferred model, both of which are
   * served by the synchronous path internally. Feature-detect with
   * `typeof api.StreamAllMeshesAsync === 'function'`.
   *
   * @param modelID handle retrieved by OpenModelStream / OpenModelStreamed
   * @param meshCallback receives one whole-model FlatMesh per entity
   * @return {Promise<void>} resolves once every entity has been delivered
   */
  async StreamAllMeshesAsync(
      modelID: number,
      meshCallback: (mesh: FlatMesh) => void ): Promise<void> {

    const result = this.models.get(modelID)

    if (result !== void 0) {

      // Passthroughs predating conway#660 (and any future non-conway one)
      // have no async twin; the sync entry point is the whole of what they
      // can do, and on a resident source it is equivalent.
      if (result.streamAllMeshesAsync !== void 0) {
        await result.streamAllMeshesAsync(meshCallback)
      } else {
        result.streamAllMeshes(meshCallback)
      }
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
