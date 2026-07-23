import {
  ConwayGeometry,
  GeometryObject,
} from '../../index'
import { Vector3 } from '../../../dependencies/conway-geom'
import { CanonicalMaterial } from '../../index'
import { IfcSceneBuilder } from '../../ifc/ifc_scene_builder'
import IfcStepModel from '../../ifc/ifc_step_model'
import {
  FlatMesh,
  IfcGeometry,
  LoaderError,
  Loadersettings,
  PlacedGeometry,
  RawLineData,
  Vector,
} from './ifc_api'
import { StepExternalByteStore } from '../../step/step_buffer_provider'
import { IfcApiModelPassthrough } from './ifc_api_model_passthrough'
import { NodeValueHandle } from './properties_passthrough'
import * as glmatrix from 'gl-matrix'
import { composeTransformF64, deriveCoordinationF64 } from './coordination_f64'
import { IfcProperties } from './ifc_properties'
import Logger from '../../logging/logger'
import { ProgressTracker } from '../../core/progress'
import { formatModelLine } from '../../core/progress_log'
import { extractModelInfo } from '../../loaders/loading_utilities'
import IfcStepParser from '../../ifc/ifc_step_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { BufferByteSource } from '../../step/parsing/byte_source'
import {
  buildIndexStreamingAsync,
} from '../../step/parsing/streaming_index_builder'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import {
  ifcPreviewAdapter,
  StreamedPreviewChannel,
} from './streamed_preview_channel'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { StepHeader } from '../../step/parsing/step_parser'
import { ExtractResult } from '../../index'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import { ParseResult } from '../../index'
import Memory from '../../memory/memory'
import { FromRawLineData } from './ifc2x4_helper'
import { shimIfcEntityMap, shimIfcEntityReverseMap } from './shim_schema_mapping'
import { EntityTypesIfcCount } from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { IfcProduct, IfcRoot } from '../../ifc/ifc4_gen'
import { CanonicalMeshType } from '../../index'

// Batch size used when a whole-model consumer (streamAllMeshes) drains
// a deferred model's remaining products synchronously.
const DEFERRED_DRAIN_BATCH = 256

/* Moving-window size for the streamed columnar parse (matches the
 * ifc_stream_open default; the window bounds parse-time scratch, not
 * the source buffer, which the model keeps resident here). */
// eslint-disable-next-line no-magic-numbers
const STREAMED_PARSE_POOL_BYTES = 1024 * 1024

/**
 * Everything parse/extraction produces that the proxy constructor's tail
 * (mesh vectors, statistics) consumes — precomputed by createAsync so the
 * cooperative path can await mid-parse, or computed synchronously inside
 * the constructor for the classic OpenModel path.
 */
interface IfcProxyLoadState {
  conwaywasm: ConwayGeometry
  /** True when opened without extraction (createDeferred). */
  deferred?: boolean
  /** Coordination matrix the parse-time preview channel derived (slice
   * A2) — adopted by the durable capture so both share one frame. */
  previewCoordinationMatrix?: number[]
  allTimeStart: number
  stepHeader: StepHeader
  model: IfcStepModel
  scene: IfcSceneBuilder
  conwayGeometry: IfcGeometryExtraction
  geometryTimeInMs: number
}

/**
 * The proxy for IFC from the shim.
 */
export class IfcApiProxyIfc implements IfcApiModelPassthrough {

  fs?: any = undefined

  model:
    [IfcStepModel,
      IfcSceneBuilder,
      Map<number, [Vector<PlacedGeometry>, FlatMesh]>,
      Map<number, [GeometryObject, CanonicalMaterial, number[]]>,

      Vector<FlatMesh>, glmatrix.mat4]
  conwaywasm: ConwayGeometry

  /** The extraction behind this model (drives the deferred batch pump). */
  private conwayGeometry_: IfcGeometryExtraction

  /** Was this model opened without extraction (DEFER_GEOMETRY)? */
  private deferredMode_: boolean = false

  /** Deferred-mode product worklist (file order), lazily enumerated. */
  private demandProducts_?: number[]

  /**
   * Deferred capture watermarks: entity localID -> how many of its
   * placed instances (in scene-walk order) have been captured. Shared
   * (mapped) geometry attributes instances to an entity from OTHER
   * products' extractions, so an entity's instance set grows across
   * batches - the watermark makes each instance captured exactly once,
   * in the same order the classic single walk would process it.
   */
  private readonly demandCapturedCounts_ = new Map<number, number>()

  /** Cursor into demandProducts_ — products before it are extracted. */
  private demandCursor_ = 0

  /**
   * Has the pump run the rel-aggregates master-voids pass? Classic's
   * whole-model walk follows its product loop with a second pass that
   * re-extracts every IfcRelAggregates related product using the
   * relating object's rel-voids (extractRelAggregatesGeometry), which
   * REPLACES the canonical mesh under the same localID — aggregate
   * parts whose parent carries openings end up cut. The pump must run
   * that same pass once after its last product batch or GetGeometry
   * serves the uncut content classic never exposes.
   */
  private demandAggregatesDone_ = false

  /**
   * Coordination matrix the deferred capture derived (or adopted from
   * the parse-time preview channel). Kept OFF the model tuple's slot 5
   * deliberately: classic streamAllMeshes derives its coordination into
   * a local and getCoordinationMatrix therefore returns identity —
   * consumers (Share) stamp that result onto the assembled model, so a
   * deferred open must present the same identity or coordination would
   * apply twice. This field is only the pump's internal multi-call
   * memory.
   */
  private demandCoordination_?: number[]

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

  /**
   * Contains all the logic and methods regarding properties, psets, qsets, etc.
   */
  properties = new IfcProperties(this)

  /**
   * Construct wwih a wasm module.
   *
   * @param wasmModule The wasm module.
   */
  // eslint-disable-next-line require-jsdoc
  constructor(
      public readonly modelID: number,
      data: Uint8Array,
      private readonly wasmModule: any,
      private readonly settings?: Loadersettings,
      precomputed?: IfcProxyLoadState ) {

    // The cooperative path (createAsync) parses/extracts before construction
    // so it can await mid-load; the classic OpenModel path does it here,
    // synchronously. Both share the tail below (mesh vectors, statistics).
    const loadState = precomputed ??
      IfcApiProxyIfc.parseAndExtract(modelID, data, new ConwayGeometry(wasmModule), settings)

    this.conwaywasm = loadState.conwaywasm
    this.conwayGeometry_ = loadState.conwayGeometry
    this.deferredMode_ = loadState.deferred === true

    const statistics = Logger.getStatistics(modelID)

    const {
      allTimeStart,
      stepHeader,
      model,
      scene,
      conwayGeometry,
      geometryTimeInMs: executionTimeInMs,
    } = loadState

    // get linear scaling factor
    this.linearScalingFactor = conwayGeometry.getLinearScalingFactor()

    const ifcProjectName = conwayGeometry.getIfcProjectName()

    if (ifcProjectName !== null) {
      statistics?.setProjectName(ifcProjectName)
    }

    // build packed mesh model
    // const packedMeshModel = scene.buildPackedMeshModel()

    const vectorGeometryMap = new Map<number, [Vector<PlacedGeometry>, FlatMesh]>()

    const geometryMap = new Map<number, [GeometryObject, CanonicalMaterial, number[]]>()

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
    const vectorFlatMesh: Vector<FlatMesh> = {
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

    const coordinationMatrix: glmatrix.mat4 = glmatrix.mat4.create()

    this.model = [
      model,
      scene,
      vectorGeometryMap,
      geometryMap,
      vectorFlatMesh,
      coordinationMatrix,
    ]

    // save settings
    this.settings = settings

    // Deferred opens whose preview channel already established the
    // coordination frame: adopt it, so the durable capture skips its own
    // derivation and places exactly where the preview did. (Internal
    // only — getCoordinationMatrix stays identity, see
    // demandCoordination_.)
    if (this.deferredMode_ && loadState.previewCoordinationMatrix !== void 0) {
      this.demandCoordination_ = loadState.previewCoordinationMatrix
      this._isCoordinated = true
    }

    let FILE_NAME = stepHeader.headers.get('FILE_NAME')

    if (FILE_NAME !== void 0) {
      // strip start / end parenthesis
      FILE_NAME = FILE_NAME.substring(1, FILE_NAME.length - 1)
    }

    const ifcVersion = stepHeader.headers.get('FILE_SCHEMA')

    const allTimeEnd = Date.now()

    const allTime = allTimeEnd - allTimeStart

    statistics?.setLoadStatus('OK')
    statistics?.setTotalTime(allTime)

    if (ifcVersion !== void 0) {
      statistics?.setVersion(ifcVersion)
    }

    if (FILE_NAME !== void 0) {
      const fileNameSplit: string[] = this.parseFileHeader(FILE_NAME)

      // eslint-disable-next-line no-magic-numbers
      if (fileNameSplit.length > 5) {
        const preprocessorVersion = fileNameSplit[5]
        const originatingSystem = fileNameSplit[6]

        statistics?.setPreprocessorVersion(preprocessorVersion)
        statistics?.setOriginatingSystem(originatingSystem)
      }
    }

    statistics?.setMemoryStatistics(Memory.checkMemoryUsage())

    statistics?.setGeometryTime(executionTimeInMs)
    // eslint-disable-next-line no-magic-numbers
    statistics?.setGeometryMemory(scene.model.geometry.calculateGeometrySize() / (1024 * 1024))
  }

  /**
   * Cooperative construction (conway extension, used by OpenModelAsync):
   * identical parse/extraction to the constructor path, but periodically
   * yields to the event loop so progress UI can repaint — issue #301 §2.
   *
   * @param modelID The model ID being opened.
   * @param data The IFC data buffer.
   * @param wasmModule The wasm module.
   * @param settings Loader settings (ON_PROGRESS is honored).
   * @return {Promise<IfcApiProxyIfc>} The constructed proxy.
   */
  public static async createAsync(
      modelID: number,
      data: Uint8Array,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiProxyIfc> {

    const loadState = await IfcApiProxyIfc.parseAndExtractAsync(
        modelID, data, new ConwayGeometry(wasmModule), settings)

    return new IfcApiProxyIfc(modelID, data, wasmModule, settings, loadState)
  }

  /**
   * Streamed-open construction (conway extension, used by
   * OpenModelStreamed): the parse runs through the streaming columnar
   * indexer, so the model's index is columnar from birth and the
   * per-record object phase — the dominant JS-heap cost of the classic
   * parse on large models — never exists. Geometry extraction is the
   * same cooperative path OpenModelAsync uses, and everything
   * downstream (meshes, properties, SpillModelSource) behaves
   * identically to a classic open.
   *
   * @param modelID The model ID being opened.
   * @param data The IFC data buffer.
   * @param wasmModule The wasm module.
   * @param settings Loader settings (ON_PROGRESS is honored).
   * @return {Promise<IfcApiProxyIfc>} The constructed proxy.
   */
  public static async createStreamed(
      modelID: number,
      data: Uint8Array,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiProxyIfc> {

    const loadState = await IfcApiProxyIfc.parseColumnarAndExtractAsync(
        modelID, data, new ConwayGeometry(wasmModule), settings)

    return new IfcApiProxyIfc(modelID, data, wasmModule, settings, loadState)
  }

  /**
   * Deferred-geometry streamed open (conway extension; slice A of
   * Share's demand/tiled rendering — design doc
   * demand-tiled-rendering.md): identical streamed columnar parse, but
   * NO geometry extraction happens at open. The proxy registers with an
   * empty scene wired to the demand-extraction seam; callers then pump
   * {@link extractGeometryBatch} to extract products in file-order
   * batches, receiving each batch's meshes incrementally — the scene,
   * properties, and spatial structure work from the first batch.
   *
   * @param modelID The model ID being opened.
   * @param data The IFC data buffer.
   * @param wasmModule The wasm module.
   * @param settings Loader settings (ON_PROGRESS is honored for parse).
   * @return {Promise<IfcApiProxyIfc>} The constructed proxy.
   */
  public static async createDeferred(
      modelID: number,
      data: Uint8Array,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiProxyIfc> {

    const loadState = await IfcApiProxyIfc.parseColumnarAndExtractAsync(
        modelID, data, new ConwayGeometry(wasmModule), settings, true)

    return new IfcApiProxyIfc(modelID, data, wasmModule, settings, loadState)
  }

  /**
   * Log + record the header parse result on the model statistics.
   *
   * @param result0 The header parse result.
   * @param bufferInput The parsing buffer (for line numbers).
   * @param modelID The model ID (for statistics lookup).
   */
  private static reportHeaderParseResult(
      result0: ParseResult,
      bufferInput: ParsingBuffer,
      modelID: number ): void {

    const statistics = Logger.getStatistics(modelID)

    switch (result0) {
      case ParseResult.COMPLETE:

        break

      case ParseResult.INCOMPLETE:

        Logger.warning('Parse incomplete but no errors')
        statistics?.setLoadStatus('HEADER PARSE: INCOMPLETE')
        break

      case ParseResult.INVALID_STEP:

        Logger.error('Error: Invalid STEP detected in parse, but no syntax error detected')
        statistics?.setLoadStatus('HEADER PARSE: INVALID_STEP')
        break

      case ParseResult.MISSING_TYPE:

        Logger.warning('Error: missing STEP type, but no syntax error detected')
        statistics?.setLoadStatus('HEADER PARSE: MISSING_TYPE')
        break

      case ParseResult.SYNTAX_ERROR:

        Logger.error(`Error: Syntax error detected on line ${bufferInput.lineCount}`)
        statistics?.setLoadStatus('HEADER PARSE: SYNTAX_ERROR')
        break

      default:
    }
  }

  /**
   * Build the progress tracker for a load, when the settings carry an
   * ON_PROGRESS callback.
   *
   * @param settings Loader settings.
   * @return {ProgressTracker | undefined} The tracker, if progress is wanted.
   */
  private static makeTracker(
      settings: Loadersettings | undefined ): ProgressTracker | undefined {

    if (settings?.ON_PROGRESS === void 0) {
      return void 0
    }

    return new ProgressTracker(settings.ON_PROGRESS)
  }

  /**
   * Synchronous parse + geometry extraction (the classic OpenModel path).
   *
   * @param modelID The model ID being opened.
   * @param data The IFC data buffer.
   * @param conwaywasm The conway geometry wasm wrapper.
   * @param settings Loader settings (ON_PROGRESS is honored).
   * @return {IfcProxyLoadState} Everything the constructor tail needs.
   */
  private static parseAndExtract(
      modelID: number,
      data: Uint8Array,
      conwaywasm: ConwayGeometry,
      settings?: Loadersettings ): IfcProxyLoadState {

    const tracker = IfcApiProxyIfc.makeTracker(settings)

    const allTimeStart = Date.now()
    const parser = IfcStepParser.Instance
    const bufferInput = new ParsingBuffer(data)

    tracker?.beginPhase('headerParse', 'bytes', data.length)

    const [stepHeader, result0] = parser.parseHeader(bufferInput)

    Logger.createStatistics(modelID)

    const statistics = Logger.getStatistics(modelID)

    IfcApiProxyIfc.reportHeaderParseResult(result0, bufferInput, modelID)

    // Model line as early as possible — header-only, before the full file
    // parse (issue #301 follow-up, log line 3).
    const modelInfo = extractModelInfo(stepHeader, data.length)

    Logger.info(formatModelLine(modelInfo))
    settings?.ON_MODEL_INFO?.(modelInfo)

    tracker?.beginPhase('dataParse', 'bytes', data.length)

    const parseTick = tracker !== void 0 ?
      (cursorBytes: number) => tracker.update(cursorBytes) : void 0

    const parseStartTime = Date.now()
    const model = parser.parseDataToModel(bufferInput, parseTick)[1]
    const parseEndTime = Date.now()

    tracker?.endPhase(data.length)

    if (model === void 0) {
      Logger.error('[OpenModel]: model === undefined')
      statistics?.setLoadStatus('PARSE_FAIL')
      throw new Error( 'Failed to load model' )
    }

    statistics?.setParseTime(parseEndTime - parseStartTime)

    const conwayGeometry = new IfcGeometryExtraction(conwaywasm, model)

    tracker?.beginPhase('geometry', 'products')

    const geometryTick = tracker !== void 0 ?
      (completed: number, total: number) => {
        tracker.setPhaseTotal(total)
        tracker.update(completed)
      } : void 0

    const startTime = Date.now()
    const [extractionResult, scene] =
      conwayGeometry.extractIFCGeometryData(geometryTick)

    const endTime = Date.now()

    tracker?.endPhase()

    if (extractionResult !== ExtractResult.COMPLETE) {
      Logger.error('[OpenModel]: Error extracting geometry, exiting...')
      statistics?.setLoadStatus('FAIL')
      throw new Error( 'Couldn\'t extract model' )
    }

    statistics?.setProductCount(model.typeCount(IfcProduct))
    statistics?.setGeometryTypeCounts(conwayGeometry.geometryTypeCounts)

    return {
      conwaywasm,
      allTimeStart,
      stepHeader,
      model,
      scene,
      conwayGeometry,
      geometryTimeInMs: endTime - startTime,
    }
  }

  /**
   * Cooperative twin of parseAndExtract: awaits the *Async parser/extraction
   * variants so the event loop can run between progress ticks.
   *
   * @param modelID The model ID being opened.
   * @param data The IFC data buffer.
   * @param conwaywasm The conway geometry wasm wrapper.
   * @param settings Loader settings (ON_PROGRESS is honored).
   * @return {Promise<IfcProxyLoadState>} Everything the constructor tail needs.
   */
  private static async parseAndExtractAsync(
      modelID: number,
      data: Uint8Array,
      conwaywasm: ConwayGeometry,
      settings?: Loadersettings ): Promise<IfcProxyLoadState> {

    const tracker = IfcApiProxyIfc.makeTracker(settings)

    const allTimeStart = Date.now()
    const parser = IfcStepParser.Instance
    const bufferInput = new ParsingBuffer(data)

    tracker?.beginPhase('headerParse', 'bytes', data.length)

    const [stepHeader, result0] = parser.parseHeader(bufferInput)

    Logger.createStatistics(modelID)

    const statistics = Logger.getStatistics(modelID)

    IfcApiProxyIfc.reportHeaderParseResult(result0, bufferInput, modelID)

    // Model line as early as possible — header-only, before the full file
    // parse (issue #301 follow-up, log line 3).
    const modelInfo = extractModelInfo(stepHeader, data.length)

    Logger.info(formatModelLine(modelInfo))
    settings?.ON_MODEL_INFO?.(modelInfo)

    tracker?.beginPhase('dataParse', 'bytes', data.length)

    const parseTick = tracker !== void 0 ?
      (cursorBytes: number) => tracker.update(cursorBytes) : void 0

    const parseStartTime = Date.now()
    const model = (await parser.parseDataToModelAsync(bufferInput, parseTick))[1]
    const parseEndTime = Date.now()

    tracker?.endPhase(data.length)

    if (model === void 0) {
      Logger.error('[OpenModel]: model === undefined')
      statistics?.setLoadStatus('PARSE_FAIL')
      throw new Error( 'Failed to load model' )
    }

    statistics?.setParseTime(parseEndTime - parseStartTime)

    const conwayGeometry = new IfcGeometryExtraction(conwaywasm, model)

    tracker?.beginPhase('geometry', 'products')

    const geometryTick = tracker !== void 0 ?
      (completed: number, total: number) => {
        tracker.setPhaseTotal(total)
        tracker.update(completed)
      } : void 0

    const startTime = Date.now()
    const [extractionResult, scene] =
      await conwayGeometry.extractIFCGeometryDataAsync(geometryTick)

    const endTime = Date.now()

    tracker?.endPhase()

    if (extractionResult !== ExtractResult.COMPLETE) {
      Logger.error('[OpenModel]: Error extracting geometry, exiting...')
      statistics?.setLoadStatus('FAIL')
      throw new Error( 'Couldn\'t extract model' )
    }

    statistics?.setProductCount(model.typeCount(IfcProduct))
    statistics?.setGeometryTypeCounts(conwayGeometry.geometryTypeCounts)

    return {
      conwaywasm,
      allTimeStart,
      stepHeader,
      model,
      scene,
      conwayGeometry,
      geometryTimeInMs: endTime - startTime,
    }
  }

  /**
   * Streamed twin of parseAndExtractAsync: the data parse runs through
   * the streaming columnar indexer over a moving window instead of the
   * per-record object parse, so the index is columnar from birth (no
   * object phase). The source buffer stays resident behind the model —
   * extraction and synchronous property reads behave exactly like a
   * classic open, and `spillSourceToExternalStore` works afterwards as
   * usual.
   *
   * The columnar build is cooperative (periodic event-loop yields, like
   * the classic parseDataBlockAsync) with absolute byte-cursor progress
   * ticks, and extraction is cooperative too — the streamed open keeps
   * the repaint/no-stall property of OpenModelAsync (#301 §2). Throws
   * when the streamed parse is anything but COMPLETE — the caller
   * (OpenModelStreamed) falls back to the classic path, which tolerates
   * recoverable parses.
   *
   * @param modelID The model ID being opened.
   * @param data The IFC data buffer.
   * @param conwaywasm The conway geometry wasm wrapper.
   * @param settings Loader settings (ON_PROGRESS is honored).
   * @return {Promise<IfcProxyLoadState>} Everything the constructor tail needs.
   */
  private static async parseColumnarAndExtractAsync(
      modelID: number,
      data: Uint8Array,
      conwaywasm: ConwayGeometry,
      settings?: Loadersettings,
      deferGeometry: boolean = false ): Promise<IfcProxyLoadState> {

    const tracker = IfcApiProxyIfc.makeTracker(settings)

    const allTimeStart = Date.now()
    const parser = IfcStepParser.Instance
    const bufferInput = new ParsingBuffer(data)

    tracker?.beginPhase('headerParse', 'bytes', data.length)

    // Header parsed standalone first so the model line fires before the
    // full parse, exactly like the classic path (the columnar build
    // re-reads the tiny header internally; the cost is negligible).
    const [stepHeader, result0] = parser.parseHeader(bufferInput)

    Logger.createStatistics(modelID)

    const statistics = Logger.getStatistics(modelID)

    IfcApiProxyIfc.reportHeaderParseResult(result0, bufferInput, modelID)

    const modelInfo = extractModelInfo(stepHeader, data.length)

    Logger.info(formatModelLine(modelInfo))
    settings?.ON_MODEL_INFO?.(modelInfo)

    tracker?.beginPhase('dataParse', 'bytes', data.length)

    const parseTick = tracker !== void 0 ?
      (cursorBytes: number) => tracker.update(cursorBytes) : void 0

    const parseStartTime = Date.now()

    // Inline twin of buildColumnarIndexStreamingAsync — the sink is created
    // here so the parse-time preview channel (slice A2) can watch it grow
    // and snapshot prefix models between the parse's cooperative yields.
    const sink = new ColumnarIndexSink<EntityTypesIfc>()

    const previewChannel =
      deferGeometry && settings?.ON_PREVIEW_MESH !== void 0 ?
        new StreamedPreviewChannel(
            data, conwaywasm, sink, ifcPreviewAdapter(),
            settings.COORDINATE_TO_ORIGIN === true,
            settings.ON_PREVIEW_MESH ) : void 0

    previewChannel?.start()

    // Channel ticks ride the parse's own progress callback (see
    // maybeTickInline) — timer ticks alone starve under the parse's
    // scheduler-priority yields in browsers.
    const parseProgress = previewChannel !== void 0 ?
      (cursorBytes: number) => {
        parseTick?.(cursorBytes)
        previewChannel.maybeTickInline()
      } : parseTick

    let result: ParseResult

    try {
      ( { result } = await buildIndexStreamingAsync(
          new BufferByteSource(data), parser, STREAMED_PARSE_POOL_BYTES,
          void 0, sink, parseProgress) )
    } finally {
      previewChannel?.stop()
    }

    const columns = sink.finalize()

    const parseEndTime = Date.now()

    tracker?.endPhase(data.length)

    if (result !== ParseResult.COMPLETE) {
      Logger.warning(`[OpenModelStreamed]: streamed parse result ${result}`)
      statistics?.setLoadStatus('PARSE_FAIL')
      throw new Error( 'Streamed parse did not complete' )
    }

    const model = new IfcStepModel(data, columns)

    statistics?.setParseTime(parseEndTime - parseStartTime)

    const conwayGeometry = new IfcGeometryExtraction(conwaywasm, model)

    // Deferred mode (createDeferred): no extraction now — prime the
    // per-product demand seam and hand back the (empty) live scene the
    // batch pump populates. `scene` is the same object streamAllMeshes
    // walks, so meshes appear to consumers as batches extract.
    if (deferGeometry) {

      conwayGeometry.prepareDemandExtraction()

      statistics?.setProductCount(model.typeCount(IfcProduct))

      return {
        conwaywasm,
        deferred: true,
        // Pin the durable pump's coordination to the preview channel's
        // (derived from the same first instance with the same math), so
        // preview payloads and durable meshes share one frame.
        previewCoordinationMatrix: previewChannel?.coordinationMatrix,
        allTimeStart,
        stepHeader,
        model,
        scene: conwayGeometry.scene,
        conwayGeometry,
        geometryTimeInMs: 0,
      }
    }

    tracker?.beginPhase('geometry', 'products')

    const geometryTick = tracker !== void 0 ?
      (completed: number, total: number) => {
        tracker.setPhaseTotal(total)
        tracker.update(completed)
      } : void 0

    const startTime = Date.now()
    const [extractionResult, scene] =
      await conwayGeometry.extractIFCGeometryDataAsync(geometryTick)

    const endTime = Date.now()

    tracker?.endPhase()

    if (extractionResult !== ExtractResult.COMPLETE) {
      Logger.error('[OpenModelStreamed]: Error extracting geometry, exiting...')
      statistics?.setLoadStatus('FAIL')
      throw new Error( 'Couldn\'t extract model' )
    }

    statistics?.setProductCount(model.typeCount(IfcProduct))
    statistics?.setGeometryTypeCounts(conwayGeometry.geometryTypeCounts)

    return {
      conwaywasm,
      allTimeStart,
      stepHeader,
      model,
      scene,
      conwayGeometry,
      geometryTimeInMs: endTime - startTime,
    }
  }


  /**
   *
   * @param input - FILE_HEADER from step header
   * @return {string[]} array of fields in FILE_NAME
   */
  parseFileHeader(input: string): string[] {
    const result: string[] = []
    let currentSegment = ''
    let parenthesesCount = 0

    for (const char of input) {
      if (char === '(') {
        parenthesesCount++
      } else if (char === ')') {
        parenthesesCount--
      }

      if (char === ',' && parenthesesCount === 0) {
        result.push(currentSegment.trim())
        currentSegment = ''
      } else {
        currentSegment += char
      }
    }

    // Add the last segment if it's not empty
    if (currentSegment.trim() !== '') {
      result.push(currentSegment.trim())
    }

    return result
  }

  /**
   * Creates a new model and returns a modelID number (unimplemented)
   *
   * @param settings settings for generating data the model
   * @return {number} model ID
   */
  createModel(settings?: Loadersettings): number {

    Logger.warning('[CreateModel]: Shim - Unimplemented')
    return 0
  }

  /**
   *
   * @param modelID
   * @return {Uint8Array} unimplemented
   */
  exportFileAsIFC(modelID: number): Uint8Array {
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
  getGeometry(geometryExpressID: number): IfcGeometry {
    const result = this.model

    if (result !== void 0) {
      const geometryMap = result[3]

      const mapResult = geometryMap.get(geometryExpressID)

      if (mapResult !== undefined) {

        // eslint-disable-next-line no-unused-vars
        const [geometryObject, _] = mapResult
        if (geometryObject !== void 0) {
          const clone = geometryObject.clone()

          return clone
        } else {
          Logger.error(`[GetGeometry]: Geometry Object not found for expressID: 
          ${geometryExpressID}`)
        }
      }
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
  getLine(expressID: number, flatten: boolean = false) {


    const rawLineData = this.getRawLineData(expressID)

    if (rawLineData.type === -1) {
      Logger.warning(`RawLineData null, expressID: ${expressID}`)
      return
    }

    // Check if the type exists in FromRawLineData mapping
    const typeConverter = FromRawLineData[rawLineData.type]
    if (typeof typeConverter !== 'function') {
      Logger.warning(`No converter function for type ${rawLineData.type}, expressID: ${expressID}`)
      return rawLineData // Return raw data as fallback
    }

    const lineData = typeConverter(rawLineData)
    if (flatten) {

      this.flattenLine(lineData)
    }

    return lineData
  }

  /**
   * Light attribute read: Name / LongName / GlobalId as web-ifc value
   * handles, WITHOUT materialising the entity's full flattened record.
   * Reads go through the typed entity's lazy per-field getters — the
   * first access tokenizes the record's field offsets into the shared
   * vtable, but only these attributes' values are deserialized. Used by
   * the spatial structure's `'names'` mode.
   *
   * @param expressID
   * @return {object} `{ Name?, LongName?, GlobalId? }` string handles
   * (`{type: 1, value}`), each present only when the attribute exists
   * and is non-null on the entity.
   */
  getLineNameAttributes(expressID: number):
    { Name?: NodeValueHandle,
      LongName?: NodeValueHandle,
      GlobalId?: NodeValueHandle } {

    const result: {
      Name?: NodeValueHandle,
      LongName?: NodeValueHandle,
      GlobalId?: NodeValueHandle } = {}

    const entity = this.model[0].getElementByExpressID(expressID) as any

    if (entity === void 0) {
      return result
    }

    // web-ifc tape type 1 = string; ifclib's deref switches on this code.
    const WEB_IFC_STRING_TYPE = 1

    // Absent attributes (e.g. LongName on non-spatial types) read as
    // undefined and are omitted via the typeof check. The catch guards
    // malformed records: field extraction throws on truncated records
    // regardless of the model's nullOnErrors setting.
    for (const attribute of ['Name', 'LongName', 'GlobalId'] as const) {
      try {
        const value = entity[attribute]

        if (typeof value === 'string') {
          result[attribute] = { type: WEB_IFC_STRING_TYPE, value }
        }
      } catch (e) {
        Logger.warning(
            `[getLineNameAttributes]: unreadable ${attribute} for expressID: ${expressID}`)
      }
    }

    return result
  }

  /**
   * Drop this model's materialised entity/descriptor cache (and lazily
   * rebuilt vtable data), returning that memory to the JS heap. Entities
   * and attributes rematerialise transparently on next access, so this is
   * safe to call between UI interactions to keep the property working set
   * bounded to what the active UI has touched.
   */
  releaseEntityCache(): void {
    this.model[0].invalidate(true)
  }

  /**
   * Are the model's source bytes spilled to an external store (served
   * through on-demand windows) rather than fully resident?
   *
   * @return {boolean} True after spillSourceToExternalStore.
   */
  get sourceIsExternal(): boolean {
    return this.model[0].isSourceExternal
  }

  /**
   * Release the resident source buffer and serve subsequent record
   * reads through fixed-size windows paged in from the given external
   * store (which must hold exactly the model's source bytes — e.g.
   * the original file already sitting in OPFS). See
   * StepModelBase.spillSourceToExternalStore.
   *
   * @param store The external byte store.
   * @param chunkBytes Optional window size in bytes.
   * @param maxResidentChunks Optional residency cap in windows.
   */
  spillSourceToExternalStore(
      store: StepExternalByteStore,
      chunkBytes?: number,
      maxResidentChunks?: number ): void {
    this.model[0].spillSourceToExternalStore(store, chunkBytes, maxResidentChunks)
  }

  /**
   * Page in the byte range backing a record so a following synchronous
   * read (getLine / attribute access) succeeds. Fast no-op while the
   * source is fully resident.
   *
   * Note: covers the record itself (including its inline elements),
   * NOT entities it merely references — recursive flattening across
   * references needs each referenced record ensured in turn.
   *
   * @param expressID The record's express ID.
   * @return {Promise<void>} Resolves when resident.
   */
  async ensureLineResident(expressID: number): Promise<void> {
    await this.model[0].ensureResidentByExpressID(expressID)
  }

  /**
   * Lazily iterate the express IDs of all IfcRoot-derived entities
   * (products, relationships, property sets, quantities — everything
   * carrying a GlobalId) straight from the type index, without
   * materialising entity descriptors or touching the source buffer.
   *
   * This lets property sweeps skip the ~96% of records in large models
   * that are geometric resources, and stays safe on a spilled source.
   * Multi-mapped entities may repeat, so callers should dedupe.
   *
   * @return {IterableIterator<number>} Express IDs of IfcRoot subtypes.
   */
  rootExpressIDs(): IterableIterator<number> {
    return this.model[0].expressIDsOfTypes(IfcRoot)
  }

  /**
   *
   * @param modelID
   * @return {Vector<LoaderError>}
   */
  getAndClearErrors(): Vector<LoaderError> {
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
  writeLine(lineObject: any) {
    Logger.warning('[WriteLine]: Shim - Unimplemented')
  }

  /**
   *
   * @param modelID
   * @param line
   */
  flattenLine(line: any): void {
    Logger.warning('[FlattenLine]: Shim - implemented')
    Object.keys(line).forEach((propertyName) => {
      const property = line[propertyName]
      // eslint-disable-next-line no-magic-numbers
      if (property && property.type === 5) {

        line[propertyName] = this.getLine(property.value, true)
        // eslint-disable-next-line no-magic-numbers
      } else if (Array.isArray(property) && property.length > 0 && property[0].type === 5) {
        for (let i = 0; i < property.length; i++) {

          line[propertyName][i] = this.getLine(property[i].value, true)
        }
      }
    })
  }

  /**
   *
   * @param modelID
   * @param expressID
   * @return {RawLineData}
   */
  getRawLineData(expressID: number): RawLineData {

    // eslint-disable-next-line no-unused-vars
    const [model, scene] = this.model

    const element = model.getElementByExpressID(expressID)

    const args: any[] = []

    if (element !== void 0) {
      const lineArguments = element.extractLineArguments()

      const parsingBuffer = new ParsingBuffer(lineArguments)
      if (element.expressID !== void 0) {
        const result_ = IfcStepParser.Instance.extractArguments(parsingBuffer, element.expressID)
        if (result_[1] === ParseResult.COMPLETE) {
          const rawLineData: RawLineData = {
            ID: expressID,
            type: shimIfcEntityReverseMap[element.type],
            arguments: result_[0],
          }

          return rawLineData
        }
      } else {
        Logger.warning('element express ID null')
      }

      const rawLineData: RawLineData = {
        ID: expressID,
        type: shimIfcEntityReverseMap[element.type],
        arguments: args,
      }

      return rawLineData
    } else {
      Logger.warning(`element === undefined, expressID: ${expressID}`)
    }

    const dummyRawLineData: RawLineData = {
      ID: expressID,
      type: -1,
      arguments: ['invalid'],
    }

    return dummyRawLineData
  }

  /**
   *
   * @param modelID
   * @param data
   */
  writeRawLineData(data: RawLineData) {
    Logger.warning('[WriteRawLineData]: Shim - Unimplemented')
  }

  /**
   *
   * @param modelID
   * @param type
   * @return {Vector<number>}
   */
  getLineIDsWithType(type: number): Vector<number> {
    const vectorArray: Array<number> = []
    const expressIDVector: Vector<number> = {
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

    // eslint-disable-next-line no-unused-vars
    const [model, _] = this.model
    if (type in shimIfcEntityMap) {
      const value = shimIfcEntityMap[type]
      // Do something with value
      const results = model.typeIDs(value)
      const arr = Array.from(results)

      for (let arrIndex = 0; arrIndex < arr.length; ++arrIndex) {

        if (arr[arrIndex].expressID !== void 0) {
          expressIDVector.push(arr[arrIndex].expressID!)
        } else {
          Logger.warning('[GetLineIDsWithType] No express ID found?')
        }
      }

    } else {
      // Handle case where key does not exist
      Logger.warning(`[GetLineIDsWithType] Type: ${type} does not exist in shimIfcEntityMap`)
    }
    return expressIDVector
  }

  /**
   *
   * @param modelID
   * @return {Vector<number>}
   */
  getAllLines(): Vector<number> {
    const vectorArray: Array<number> = []
    const expressIDVector: Vector<number> = {
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

    // eslint-disable-next-line no-unused-vars
    const [model, scene] = this.model
    // TODO(nickcastel50): This is absolutely horrid but I don't know a better way yet.
    // This implementation also kills our lazy loading...
    for (let typeIndex = 0; typeIndex < EntityTypesIfcCount; ++typeIndex) {
      const results = model.typeIDs(typeIndex)
      const arr = Array.from(results)

      for (let arrIndex = 0; arrIndex < arr.length; ++arrIndex) {

        if (arr[arrIndex].expressID !== void 0) {
          expressIDVector.push(arr[arrIndex].expressID!)
        } else {
          Logger.warning('[GetLineIDsWithType] No express ID found?')
        }
      }
    }

    return expressIDVector
  }

  /**
   *
   * @param modelID
   * @param transformationMatrix
   */
  setGeometryTransformation(transformationMatrix: Array<number>) {
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
  getCoordinationMatrix(): Array<number> {
    // TODO: Add coordination matrix to models map

    /* eslint-disable no-unused-vars */
    const [model,
      scene,
      meshMap,
      geometryMaterialTransformMap,
      vectorFlatMesh, coordinationMatrix] = this.model
    /* eslint-enable no-unused-vars */

    return Array.from(coordinationMatrix)
  }

  /**
   *
   * @param ptr
   * @param size
   * @return {Float32Array}
   */
  getVertexArray(ptr: number, size: number): Float32Array {
    return this.getSubArray(this.wasmModule.HEAPF32, ptr, size) as Float32Array
  }

  /**
   *
   * @param ptr
   * @param size
   * @return {Uint32Array}
   */
  getIndexArray(ptr: number, size: number): Uint32Array {
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
  closeModel() {
    // Null operation.
  }

  /**
   * Free this model's native geometry (conway extension): every
   * canonical mesh the extraction produced plus the GetGeometry map.
   * Call AFTER the consumer has built its own scene from the meshes —
   * subsequent GetGeometry calls return an empty dummy. On a deferred
   * model whose pump has not drained, this is a no-op (releasing would
   * break the remaining extraction).
   *
   * The wasm heap never shrinks, but freed pages are reused: repeated
   * loads in one tab plateau instead of stacking whole model scenes
   * (the multi-load crash).
   *
   * @return {boolean} True when geometry was released.
   */
  releaseGeometry(): boolean {

    if (this.deferredMode_ &&
        this.demandProducts_ !== void 0 &&
        this.demandCursor_ < this.demandProducts_.length) {
      Logger.warning(
          '[ReleaseModelGeometry]: deferred pump not drained — not releasing')
      return false
    }

    const model = this.model[0]
    const localIDs: number[] = []

    for (const mesh of model.geometry) {
      localIDs.push((mesh as {localID: number}).localID)
    }

    for (const localID of localIDs) {
      try {
        model.geometry.delete(localID)
      } catch {
        // Never let a free break a loaded model.
      }
    }

    // The GetGeometry map holds references to the now-freed natives —
    // clear it so lookups degrade to the dummy instead of touching them.
    this.model[3].clear()

    this.released_ = true

    return true
  }

  /** Native geometry freed (releaseGeometry) — scene walks would touch
   * freed objects, so mesh serving degrades to the accumulated maps. */
  private released_ = false

  /**
   * Deferred-mode batch pump (conway extension; Share demand/tiled
   * rendering slice A): extract the next `batchSize` products (file
   * order) through the per-product demand seam and emit THIS BATCH's
   * meshes through `meshCallback` — the incremental twin of
   * streamAllMeshes. Placed-geometry math (coordination, scaling,
   * centering) is identical; the shared meshMap is updated so
   * getFlatMesh keeps working. Call repeatedly until `remaining` is 0.
   *
   * Requires a model opened with deferred geometry
   * (`OpenModelStreamed(data, {..., DEFER_GEOMETRY: true})`); on a
   * fully-extracted model this is a no-op returning remaining 0.
   *
   * @param batchSize Max products to extract this call (min 1).
   * @param meshCallback Receives each newly-extracted product's mesh.
   * @return {object} `{extracted, remaining}` — products processed this
   * call and products still pending.
   */
  extractGeometryBatch(
      batchSize: number,
      meshCallback?: (mesh: FlatMesh) => void ): {extracted: number, remaining: number} {

    // Fully-extracted opens have nothing to pump — re-running the
    // per-product extraction on them would duplicate scene work.
    if (!this.deferredMode_) {
      return {extracted: 0, remaining: 0}
    }

    if (this.demandProducts_ === void 0) {

      const products: number[] = []

      for (const product of this.model[0].types(IfcProduct)) {
        products.push(product.localID)
      }

      this.demandProducts_ = products
      this.demandCursor_ = 0
    }

    const end = Math.min(
        this.demandCursor_ + Math.max(batchSize, 1),
        this.demandProducts_.length)

    let extracted = 0

    for (; this.demandCursor_ < end; ++this.demandCursor_) {

      const localID = this.demandProducts_[this.demandCursor_]

      if (this.conwayGeometry_.extractProductGeometryByLocalID(localID)) {
        ++extracted
      }
    }

    // Classic parity: once the product walk completes, run the
    // whole-model walk's second (rel-aggregates master-voids) pass in
    // the SAME call, so this call's delta capture already emits the
    // re-extracted instances and the GetGeometry map's last writer for
    // every replaced mesh matches classic exactly (see
    // demandAggregatesDone_).
    if (this.demandCursor_ >= this.demandProducts_.length &&
        !this.demandAggregatesDone_) {

      this.demandAggregatesDone_ = true
      this.conwayGeometry_.extractRelAggregatesGeometry()
    }

    if (meshCallback !== void 0) {
      this.streamNewMeshes_(meshCallback)
    }

    return {
      extracted,
      remaining: this.demandProducts_.length - this.demandCursor_,
    }
  }

  /**
   * Walk the scene and emit every not-yet-captured placed instance as
   * per-entity DELTA FlatMeshes — the incremental core of
   * streamAllMeshes with identical placed-geometry math, processed in
   * walk order exactly once per instance (per-entity watermarks). An
   * entity re-emits with only its NEW instances when shared/mapped
   * geometry attributes more to it in later batches; consumers render
   * deltas additively (the shared meshMap still accumulates each
   * entity's FULL vector, so getFlatMesh stays whole-model correct).
   *
   * Also fixes a latent multi-call bug: the derived coordination
   * matrix is remembered (demandCoordination_), so later batches place
   * with the SAME coordination the first batch established
   * (streamAllMeshes never needed this — it runs once). It is NOT
   * exposed through getCoordinationMatrix, which keeps the classic
   * identity contract consumers stamp onto assembled models.
   *
   * @param meshCallback Receives one delta FlatMesh per entity that
   * gained instances this call.
   */
  private streamNewMeshes_(
      meshCallback: (mesh: FlatMesh) => void ): void {

    // Released models: the scene's natives are freed — nothing new can
    // exist to capture, and walking would touch freed objects.
    if (this.released_) {
      return
    }

    const [model, scene, meshMap, geometryMaterialTransformMap] = this.model

    let coordinationMatrix: ArrayLike<number> =
      this.demandCoordination_ ?? glmatrix.mat4.create()
    const seenThisPass = new Map<number, number>()
    const deltas = new Map<number, PlacedGeometry[]>()

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of scene.walk()) {

      if (entity?.localID === void 0 || entity.expressID === void 0) {
        continue
      }

      // Per-entity walk position vs watermark: instances before the
      // watermark were captured in an earlier call (append-only walk
      // order makes the count a stable cursor).
      const walkIndex = seenThisPass.get(entity.localID) ?? 0
      seenThisPass.set(entity.localID, walkIndex + 1)

      if (walkIndex < (this.demandCapturedCounts_.get(entity.localID) ?? 0)) {
        continue
      }

      if (geometry.type !== CanonicalMeshType.BUFFER_GEOMETRY || geometry.temporary) {
        continue
      }

      const material_: CanonicalMaterial = material ?? {
        name: '',
        // eslint-disable-next-line no-magic-numbers
        baseColor: [0.8, 0.8, 0.8, 1],
        // eslint-disable-next-line no-magic-numbers
        legacyColor: [0.8, 0.8, 0.8, 1],
        doubleSided: true,
        blend: 0,
      }

      let nativePt: Vector3
      if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
        nativePt = geometry.geometry.getPoint(0)
      }

      // normalize() recenters the shared geometry buffer (side effect)
      // and returns the local centre used to place it.
      const center = geometry.geometry.normalize()

      const expressID = model.getElementByLocalID(geometry.localID)?.expressID as number

      // Full-precision float64 placement straight from the wasm boundary
      // (glm::dmat4). NOT re-truncated through a gl-matrix Float32Array —
      // the recentre math runs in double precision (see coordination_f64).
      const geometryTransform = nativeTransform?.getValues()

      if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {

        const derived = deriveCoordinationF64(
            geometryTransform, nativePt!, this.NormalizeMat, this.linearScalingFactor)

        coordinationMatrix = derived

        // Persist for every later batch (internal only — see
        // demandCoordination_'s identity-contract note).
        this.demandCoordination_ = derived
        this._isCoordinated = true
      }

      const newTransformArr =
          composeTransformF64(coordinationMatrix, geometryTransform, center)

      geometryMaterialTransformMap.set(expressID,
          [geometry.geometry, material_, newTransformArr])

      const color = {
        x: material_.legacyColor[0],
        y: material_.legacyColor[1],
        z: material_.legacyColor[2],
        w: material_.legacyColor[3],
      }

      const placed: PlacedGeometry = {
        color,
        geometryExpressID: expressID,
        flatTransformation: newTransformArr,
      }

      let mesh = meshMap.get(entity.expressID)

      if (mesh === void 0) {

        const placedArray = new Array<PlacedGeometry>()
        const placedVector: Vector<PlacedGeometry> = {
          get: (index: number) => placedArray[index] ?? placed,
          size: () => placedArray.length,
          push: (parameter: PlacedGeometry) => {
            placedArray.push(parameter)
          },
        }
        const flatMesh: FlatMesh = {
          geometries: placedVector,
          expressID: entity.expressID,
        }

        mesh = [placedVector, flatMesh]
        meshMap.set(entity.expressID, mesh)
      }

      mesh[0].push(placed)
      mesh[1].geometries = mesh[0]

      this.demandCapturedCounts_.set(
          entity.localID,
          (this.demandCapturedCounts_.get(entity.localID) ?? 0) + 1)

      let delta = deltas.get(entity.expressID)
      if (delta === void 0) {
        delta = []
        deltas.set(entity.expressID, delta)
      }
      delta.push(placed)
    }

    const vectorFlatMesh = this.model[4]

    for (const [expressID, placedList] of deltas) {

      const placedVector: Vector<PlacedGeometry> = {
        get: (index: number) => placedList[index] ?? placedList[0],
        size: () => placedList.length,
        push: (parameter: PlacedGeometry) => {
          placedList.push(parameter)
        },
      }
      const deltaMesh: FlatMesh = {geometries: placedVector, expressID}

      vectorFlatMesh.push(deltaMesh)
      meshCallback(deltaMesh)
    }
  }

  /**
   *
   * @param modelID
   * @param meshCallback
   */
  streamAllMeshes( meshCallback: (mesh: FlatMesh) => void) {

    // Released models: the natives behind the scene are freed — serve
    // the accumulated per-entity meshes instead of re-walking.
    if (this.released_ && !this.deferredMode_) {

      const [, , meshMap, , vectorFlatMesh] = this.model

      meshMap.forEach((mesh) => {
        vectorFlatMesh.push(mesh[1])
        meshCallback(mesh[1])
      })

      return
    }

    // Deferred models: the delta capture has already populated (or will
    // populate) the shared meshMap — re-running the classic walk would
    // push every instance a second time. Pump any remainder to
    // completion and serve the accumulated full per-entity meshes.
    if (this.deferredMode_) {

      const noCallback = void 0

      while (this.extractGeometryBatch(
          DEFERRED_DRAIN_BATCH, noCallback).remaining > 0) {
        // draining
      }
      this.streamNewMeshes_(() => { /* absorb stragglers into meshMap */ })

      const [, , meshMap, , vectorFlatMesh] = this.model

      meshMap.forEach((mesh) => {
        vectorFlatMesh.push(mesh[1])
        meshCallback(mesh[1])
      })

      return
    }

    const [model,
      scene,
      meshMap,
      geometryMaterialTransformMap,
      vectorFlatMesh] = this.model

    let coordinationMatrix: ArrayLike<number> = this.model[5]

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of scene.walk()) {

      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY && !geometry.temporary) {
        let material_: CanonicalMaterial | undefined
        if (material === void 0) {
          material_ = {
            name: '',
            // eslint-disable-next-line no-magic-numbers
            baseColor: [0.8, 0.8, 0.8, 1],
            // eslint-disable-next-line no-magic-numbers
            legacyColor: [0.8, 0.8, 0.8, 1],
            doubleSided: true,
            blend: 0,
          }
        } else {
          material_ = material
        }

        let nativePt:Vector3
        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          nativePt = geometry.geometry.getPoint(0)
        }

        // normalize() recenters the geometry buffer (side effect) and
        // returns the local centre used to place it.
        const center = geometry.geometry.normalize()

        // create PlacedGeometry
        const expressID = model.getElementByLocalID(geometry.localID)?.expressID as number

        // Full-precision float64 placement straight from the wasm boundary
        // (glm::dmat4) — never truncated through a gl-matrix Float32Array;
        // the recentre math runs in double precision (see coordination_f64).
        const geometryTransform = nativeTransform?.getValues()

        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          coordinationMatrix = deriveCoordinationF64(
              geometryTransform, nativePt!, this.NormalizeMat, this.linearScalingFactor)
          this._isCoordinated = true
        }

        const newTransformArr =
            composeTransformF64(coordinationMatrix, geometryTransform, center)
        geometryMaterialTransformMap.set(expressID,
            [geometry.geometry, material_!, newTransformArr])

        if (entity?.localID !== void 0) {
          if (entity?.expressID !== void 0) {
            const mesh = meshMap.get(entity.expressID)
            if (mesh !== void 0) {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              mesh[0].push(singlePlacedGeometry)
              mesh[1].geometries = mesh[0]

              meshMap.set(entity.expressID, [mesh[0], mesh[1]])


            } else {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry_: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              // eslint-disable-next-line no-array-constructor
              const placedGeometryArray_ = new Array<PlacedGeometry>()

              // Vector of PlacedGeometry
              const vectorOfPlacedGeometry_: Vector<PlacedGeometry> = {
                get(index: number): PlacedGeometry {
                  if (index >= placedGeometryArray_.length) {
                    return singlePlacedGeometry_
                  }

                  return placedGeometryArray_[index]
                },
                size(): number {
                  return placedGeometryArray_.length
                },
                push(parameter: PlacedGeometry): void {
                  placedGeometryArray_.push(parameter)
                },
              }

              vectorOfPlacedGeometry_.push(singlePlacedGeometry_)

              const singleFlatMesh: FlatMesh = {
                geometries: vectorOfPlacedGeometry_,
                expressID: entity.expressID,
              }

              meshMap.set(entity.expressID, [vectorOfPlacedGeometry_, singleFlatMesh])
            }
          }
        }
      }
    }

    meshMap.forEach((mesh, productLocalID) => {

      vectorFlatMesh.push(mesh[1])

      meshCallback(mesh[1])
    })
  }

  /**
   *
   * @param modelID
   * @param types
   * @param meshCallback
   */
  streamAllMeshesWithTypes(
      types: Array<number>,
      meshCallback: (mesh: FlatMesh) => void) {
    const [model,
      scene,
      meshMap,
      geometryMaterialTransformMap,
      vectorFlatMesh] = this.model

    let coordinationMatrix: ArrayLike<number> = this.model[5]

    const conwayTypesArray: number[] = []
    types.forEach((type) => {
      const value = shimIfcEntityMap[type]
      // Do something with value
      conwayTypesArray.push(value)
    })

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of scene.walk()) {

      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY && !geometry.temporary) {

        let material_: CanonicalMaterial | undefined
        if (material === void 0) {
          material_ = {
            name: '',
            // eslint-disable-next-line no-magic-numbers
            baseColor: [0.8, 0.8, 0.8, 1],
            // eslint-disable-next-line no-magic-numbers
            legacyColor: [0.8, 0.8, 0.8, 1],
            doubleSided: true,
            blend: 0,
          }
        } else {
          material_ = material
        }

        // type check
        const typedElement = model.getElementByLocalID(geometry.localID)

        if (typedElement !== void 0) {
          if (conwayTypesArray.indexOf(typedElement.type.valueOf()) === -1) {
            continue
          }
        }

        let nativePt:Vector3
        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          nativePt = geometry.geometry.getPoint(0)
        }

        // normalize() recenters the geometry buffer (side effect) and
        // returns the local centre used to place it.
        const center = geometry.geometry.normalize()

        // create PlacedGeometry
        const expressID = model.getElementByLocalID(geometry.localID)?.expressID as number

        // Full-precision float64 placement straight from the wasm boundary
        // (glm::dmat4) — never truncated through a gl-matrix Float32Array;
        // the recentre math runs in double precision (see coordination_f64).
        const geometryTransform = nativeTransform?.getValues()

        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          Logger.info('Setting up coordinationMatrix')
          coordinationMatrix = deriveCoordinationF64(
              geometryTransform, nativePt!, this.NormalizeMat, this.linearScalingFactor)
          this._isCoordinated = true
        }

        const newTransformArr =
            composeTransformF64(coordinationMatrix, geometryTransform, center)
        geometryMaterialTransformMap.set(expressID,
            [geometry.geometry, material_!, newTransformArr])

        if (entity?.localID !== void 0) {
          if (entity?.expressID !== void 0) {
            const mesh = meshMap.get(entity.expressID)
            if (mesh !== void 0) {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              mesh[0].push(singlePlacedGeometry)
              mesh[1].geometries = mesh[0]

              meshMap.set(entity.expressID, [mesh[0], mesh[1]])


            } else {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry_: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              // eslint-disable-next-line no-array-constructor
              const placedGeometryArray_ = new Array<PlacedGeometry>()

              // Vector of PlacedGeometry
              const vectorOfPlacedGeometry_: Vector<PlacedGeometry> = {
                get(index: number): PlacedGeometry {
                  if (index >= placedGeometryArray_.length) {
                    return singlePlacedGeometry_
                  }

                  return placedGeometryArray_[index]
                },
                size(): number {
                  return placedGeometryArray_.length
                },
                push(parameter: PlacedGeometry): void {
                  placedGeometryArray_.push(parameter)
                },
              }

              vectorOfPlacedGeometry_.push(singlePlacedGeometry_)

              const singleFlatMesh: FlatMesh = {
                geometries: vectorOfPlacedGeometry_,
                expressID: entity.expressID,
              }

              meshMap.set(entity.expressID, [vectorOfPlacedGeometry_, singleFlatMesh])
            }
          }
        }
      }


      meshMap.forEach((mesh, productLocalID) => {

        vectorFlatMesh.push(mesh[1])

        meshCallback(mesh[1])
      })
    }
  }

  /**
   * Load all geometry in a model
   *
   * @return {Vector<FlatMesh>}
   */
  loadAllGeometry(): Vector<FlatMesh> {
    const [model,
      scene,
      meshMap,
      geometryMaterialTransformMap,
      vectorFlatMesh] = this.model

    let coordinationMatrix: ArrayLike<number> = this.model[5]

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of scene.walk()) {

      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY && !geometry.temporary) {
        let material_: CanonicalMaterial | undefined
        if (material === void 0) {
          material_ = {
            name: '',
            // eslint-disable-next-line no-magic-numbers
            baseColor: [0.8, 0.8, 0.8, 1],
            // eslint-disable-next-line no-magic-numbers
            legacyColor: [0.8, 0.8, 0.8, 1],
            doubleSided: true,
            blend: 0,
          }
        } else {
          material_ = material
        }

        let nativePt:Vector3
        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          nativePt = geometry.geometry.getPoint(0)
        }

        // normalize() recenters the geometry buffer (side effect) and
        // returns the local centre used to place it.
        const center = geometry.geometry.normalize()

        // create PlacedGeometry
        const expressID = model.getElementByLocalID(geometry.localID)?.expressID as number

        // Full-precision float64 placement straight from the wasm boundary
        // (glm::dmat4) — never truncated through a gl-matrix Float32Array;
        // the recentre math runs in double precision (see coordination_f64).
        const geometryTransform = nativeTransform?.getValues()

        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          Logger.info('Setting up coordinationMatrix')
          coordinationMatrix = deriveCoordinationF64(
              geometryTransform, nativePt!, this.NormalizeMat, this.linearScalingFactor)
          this._isCoordinated = true
        }

        const newTransformArr =
            composeTransformF64(coordinationMatrix, geometryTransform, center)
        geometryMaterialTransformMap.set(expressID,
            [geometry.geometry, material_!, newTransformArr])

        if (entity?.localID !== void 0) {
          if (entity?.expressID !== void 0) {
            const mesh = meshMap.get(entity.expressID)
            if (mesh !== void 0) {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              mesh[0].push(singlePlacedGeometry)
              mesh[1].geometries = mesh[0]

              meshMap.set(entity.expressID, [mesh[0], mesh[1]])


            } else {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry_: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              // eslint-disable-next-line no-array-constructor
              const placedGeometryArray_ = new Array<PlacedGeometry>()

              // Vector of PlacedGeometry
              const vectorOfPlacedGeometry_: Vector<PlacedGeometry> = {
                get(index: number): PlacedGeometry {
                  if (index >= placedGeometryArray_.length) {
                    return singlePlacedGeometry_
                  }

                  return placedGeometryArray_[index]
                },
                size(): number {
                  return placedGeometryArray_.length
                },
                push(parameter: PlacedGeometry): void {
                  placedGeometryArray_.push(parameter)
                },
              }

              vectorOfPlacedGeometry_.push(singlePlacedGeometry_)

              const singleFlatMesh: FlatMesh = {
                geometries: vectorOfPlacedGeometry_,
                expressID: entity.expressID,
              }

              meshMap.set(entity.expressID, [vectorOfPlacedGeometry_, singleFlatMesh])
            }
          }
        }
      }

      meshMap.forEach((mesh, productLocalID) => {

        vectorFlatMesh.push(mesh[1])
      })

      return vectorFlatMesh
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
   * @param expressID express ID of flat mesh
   * @return {FlatMesh}
   */
  getFlatMesh(expressID: number): FlatMesh {

    // eslint-disable-next-line no-unused-vars
    const [model, scene, meshMap] = this.model

    if (meshMap.size <= 0) {

      this.loadAllGeometry()
    }

    const mesh = meshMap.get(expressID)

    if (mesh !== void 0) {
      return mesh[1]
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
  createGuidToExpressIdMapping(): void {
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

    Logger.warning(`[CreateIfcGuidToExpressIdMapping]: Model ${this.modelID}: Shim - Unimplemented`)
  }
}
