import {
  ConwayGeometry,
  GeometryObject,
} from '../../index'
import { Vector3 } from '../../../dependencies/conway-geom'
import { CanonicalMaterial } from '../../index'
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
import * as glmatrix from 'gl-matrix'
import Logger from '../../logging/logger'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { ExtractResult } from '../../index'
import { ParseResult } from '../../index'
import Memory from '../../memory/memory'
import { CanonicalMeshType } from '../../index'
import AP214StepModel from '../../AP214E3_2010/ap214_step_model'
import { AP214SceneBuilder } from '../../AP214E3_2010/ap214_scene_builder'
import { AP214GeometryExtraction } from '../../AP214E3_2010/ap214_geometry_extraction'
import AP214StepParser from '../../AP214E3_2010/ap214_step_parser'
import { AP214Properties } from './ap214_properties'
import { EntityTypesAP214Count } from '../../AP214E3_2010/AP214E3_2010_gen/entity_types_ap214.gen'
import { ProgressTracker } from '../../core/progress'
import { formatModelLine } from '../../core/progress_log'
import { extractModelInfo } from '../../loaders/loading_utilities'
import { StepHeader } from '../../step/parsing/step_parser'
import { BufferByteSource } from '../../step/parsing/byte_source'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import {
  buildIndexStreamingAsync,
} from '../../step/parsing/streaming_index_builder'
import EntityTypesAP214 from '../../AP214E3_2010/AP214E3_2010_gen/entity_types_ap214.gen'

/* Moving-window size for the streamed columnar parse (matches the IFC
 * proxy; the window bounds parse-time scratch, not the source buffer,
 * which the model keeps resident here). */
// eslint-disable-next-line no-magic-numbers
const STREAMED_PARSE_POOL_BYTES = 1024 * 1024

/**
 * Everything parse/extraction produces that the proxy constructor's tail
 * (mesh vectors, statistics) consumes — precomputed by createAsync so the
 * cooperative path can await mid-parse, or computed synchronously inside
 * the constructor for the classic OpenModel path. Mirrors IfcApiProxyIfc.
 */
interface Ap214ProxyLoadState {
  conwaywasm: ConwayGeometry
  allTimeStart: number
  stepHeader: StepHeader
  model: AP214StepModel
  scene: AP214SceneBuilder
  conwayGeometry: AP214GeometryExtraction
  geometryTimeInMs: number
}

/**
 */
export class IfcApiProxyAP214 implements IfcApiModelPassthrough {

  fs?: any = undefined

  model:
    [AP214StepModel,
      AP214SceneBuilder,
      Map<number, [Vector<PlacedGeometry>, FlatMesh]>,
      Map<number, [GeometryObject, CanonicalMaterial, number[]]>,
      Vector<FlatMesh>, glmatrix.mat4]
  conwaywasm: ConwayGeometry
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
   * Get the underlying step model for this.
   *
   * @return {AP214StepModel} The underlying step model.
   */
  public get StepModel(): AP214StepModel {
    return this.model[0]
  }

  /**
   * Drop this model's materialised entity/descriptor cache (and lazily
   * rebuilt vtable data), returning that memory to the JS heap. Entities
   * rematerialise transparently on next access.
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
   * store — see StepModelBase.spillSourceToExternalStore.
   *
   * AP214 property access is served from indexes built by a one-time
   * full-model sweep of synchronous reads, so they are primed here
   * while the source is still resident; post-spill property reads are
   * then pure map lookups. (`getAllItemsOfType(_, verbose=true)` still
   * reads raw lines synchronously and is not supported post-spill.)
   *
   * @param store The external byte store.
   * @param chunkBytes Optional window size in bytes.
   * @param maxResidentChunks Optional residency cap in windows.
   */
  spillSourceToExternalStore(
      store: StepExternalByteStore,
      chunkBytes?: number,
      maxResidentChunks?: number ): void {
    this.properties.primeIndexes()
    this.model[0].spillSourceToExternalStore(store, chunkBytes, maxResidentChunks)
  }

  /**
   * Page in the byte range backing a record so a following synchronous
   * read succeeds. Fast no-op while the source is fully resident.
   *
   * @param expressID The record's express ID.
   * @return {Promise<void>} Resolves when resident.
   */
  async ensureLineResident(expressID: number): Promise<void> {
    await this.model[0].ensureResidentByExpressID(expressID)
  }

  /**
   * Contains all the logic and methods regarding properties, psets, qsets, etc.
   */
  properties = new AP214Properties(this)

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
      precomputed?: Ap214ProxyLoadState ) {

    // The cooperative path (createAsync) parses/extracts before construction
    // so it can await mid-load; the classic OpenModel path does it here,
    // synchronously. Both share the tail below (mesh vectors, statistics).
    const loadState = precomputed ??
      IfcApiProxyAP214.parseAndExtract(modelID, data, new ConwayGeometry(wasmModule), settings)

    this.conwaywasm = loadState.conwaywasm

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

    const productName = conwayGeometry.getAP214ProductName()

    if (productName !== null) {
      statistics?.setProjectName(productName)
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

    let FILE_NAME = stepHeader.headers.get('FILE_NAME')

    if (FILE_NAME !== void 0) {
      // strip start / end parenthesis
      FILE_NAME = FILE_NAME.substring(1, FILE_NAME.length - 1)
    }

    const ap214Version = stepHeader.headers.get('FILE_SCHEMA')

    const allTimeEnd = Date.now()

    const allTime = allTimeEnd - allTimeStart

    statistics?.setLoadStatus('OK')
    statistics?.setTotalTime(allTime)

    if (ap214Version !== void 0) {
      statistics?.setVersion(ap214Version)
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
   * identical parse/extraction to the constructor path, but the data parse
   * periodically yields to the event loop so progress UI can repaint —
   * issue #301 §2. Geometry extraction stays synchronous (the AP214
   * thunk-tree walk has no flat product loop yet) and reports as a
   * heartbeat phase.
   *
   * @param modelID The model ID being opened.
   * @param data The STEP data buffer.
   * @param wasmModule The wasm module.
   * @param settings Loader settings (ON_PROGRESS / ON_MODEL_INFO honored).
   * @return {Promise<IfcApiProxyAP214>} The constructed proxy.
   */
  public static async createAsync(
      modelID: number,
      data: Uint8Array,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiProxyAP214> {

    const loadState = await IfcApiProxyAP214.parseAndExtractAsync(
        modelID, data, new ConwayGeometry(wasmModule), settings)

    return new IfcApiProxyAP214(modelID, data, wasmModule, settings, loadState)
  }

  /**
   * Streamed columnar construction (conway extension, used by
   * OpenModelStreamed): the data parse runs through the streaming
   * columnar indexer over a moving window instead of the per-record
   * object parse, so the index is columnar from birth — the AP214 twin
   * of IfcApiProxyIfc.createStreamed (STEP demand parity phase 1).
   * Geometry extraction stays the classic whole-model thunk-tree walk;
   * the deferred pump and preview channel follow in later phases.
   * Throws when the streamed parse is anything but COMPLETE — the
   * factory falls back to the classic open.
   *
   * @param modelID The model ID being opened.
   * @param data The STEP data buffer.
   * @param wasmModule The wasm module.
   * @param settings Loader settings (ON_PROGRESS / ON_MODEL_INFO honored).
   * @return {Promise<IfcApiProxyAP214>} The constructed proxy.
   */
  public static async createStreamed(
      modelID: number,
      data: Uint8Array,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiProxyAP214> {

    const loadState = await IfcApiProxyAP214.parseColumnarAndExtractAsync(
        modelID, data, new ConwayGeometry(wasmModule), settings)

    return new IfcApiProxyAP214(modelID, data, wasmModule, settings, loadState)
  }

  /**
   * Streamed twin of parseAndExtractAsync: cooperative columnar index
   * build (periodic event-loop yields, absolute byte-cursor progress),
   * then the model adopts the columns directly — no per-record object
   * phase. Mirrors IfcApiProxyIfc.parseColumnarAndExtractAsync minus
   * the deferred branch.
   *
   * @param modelID The model ID being opened.
   * @param data The STEP data buffer.
   * @param conwaywasm The conway geometry wasm wrapper.
   * @param settings Loader settings (ON_PROGRESS / ON_MODEL_INFO honored).
   * @return {Promise<Ap214ProxyLoadState>} Everything the constructor tail needs.
   */
  private static async parseColumnarAndExtractAsync(
      modelID: number,
      data: Uint8Array,
      conwaywasm: ConwayGeometry,
      settings?: Loadersettings ): Promise<Ap214ProxyLoadState> {

    const tracker = IfcApiProxyAP214.makeTracker(settings)

    const allTimeStart = Date.now()
    const parser = AP214StepParser.Instance
    const bufferInput = new ParsingBuffer(data)

    tracker?.beginPhase('headerParse', 'bytes', data.length)

    // Header parsed standalone first so the model line fires before the
    // full parse (the columnar build re-reads the tiny header
    // internally; the cost is negligible).
    const [stepHeader, result0] = parser.parseHeader(bufferInput)

    Logger.createStatistics(modelID)

    const statistics = Logger.getStatistics(modelID)

    IfcApiProxyAP214.reportHeaderParseResult(result0, bufferInput, modelID)

    const modelInfo = extractModelInfo(stepHeader, data.length)

    Logger.info(formatModelLine(modelInfo))
    settings?.ON_MODEL_INFO?.(modelInfo)

    tracker?.beginPhase('dataParse', 'bytes', data.length)

    const parseTick = tracker !== void 0 ?
      (cursorBytes: number) => tracker.update(cursorBytes) : void 0

    const parseStartTime = Date.now()

    const sink = new ColumnarIndexSink<EntityTypesAP214>()

    const { result } = await buildIndexStreamingAsync(
        new BufferByteSource(data), parser, STREAMED_PARSE_POOL_BYTES,
        void 0, sink, parseTick)

    const columns = sink.finalize()

    const parseEndTime = Date.now()

    tracker?.endPhase(data.length)

    if (result !== ParseResult.COMPLETE) {
      Logger.warning(`[OpenModelStreamed]: streamed parse result ${result}`)
      statistics?.setLoadStatus('PARSE_FAIL')
      throw new Error( 'Streamed parse did not complete' )
    }

    const model = new AP214StepModel(data, columns)

    statistics?.setParseTime(parseEndTime - parseStartTime)

    const conwayGeometry = new AP214GeometryExtraction(conwaywasm, model)

    // Heartbeat only: the AP214 thunk-tree extraction has no flat
    // product loop to tick from yet.
    tracker?.beginPhase('geometry', 'products')

    const startTime = Date.now()
    const [extractionResult, scene] =
      conwayGeometry.extractAP214GeometryData()

    const endTime = Date.now()

    tracker?.endPhase()

    if (extractionResult !== ExtractResult.COMPLETE) {
      Logger.error('[OpenModelStreamed]: Error extracting geometry, exiting...')
      statistics?.setLoadStatus('FAIL')
      throw new Error( 'Couldn\'t extract model' )
    }

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
   * @param data The STEP data buffer.
   * @param conwaywasm The conway geometry wasm wrapper.
   * @param settings Loader settings (ON_PROGRESS / ON_MODEL_INFO honored).
   * @return {Ap214ProxyLoadState} Everything the constructor tail needs.
   */
  private static parseAndExtract(
      modelID: number,
      data: Uint8Array,
      conwaywasm: ConwayGeometry,
      settings?: Loadersettings ): Ap214ProxyLoadState {

    const tracker = IfcApiProxyAP214.makeTracker(settings)

    const allTimeStart = Date.now()
    const parser = AP214StepParser.Instance
    const bufferInput = new ParsingBuffer(data)

    tracker?.beginPhase('headerParse', 'bytes', data.length)

    const [stepHeader, result0] = parser.parseHeader(bufferInput)

    Logger.createStatistics(modelID)

    const statistics = Logger.getStatistics(modelID)

    IfcApiProxyAP214.reportHeaderParseResult(result0, bufferInput, modelID)

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

    const conwayGeometry = new AP214GeometryExtraction(conwaywasm, model)

    // Heartbeat only: the AP214 thunk-tree extraction has no flat product
    // loop to tick from yet (see conway_model_loader's matching note).
    tracker?.beginPhase('geometry', 'products')

    const startTime = Date.now()
    const [extractionResult, scene] =
      conwayGeometry.extractAP214GeometryData()

    const endTime = Date.now()

    tracker?.endPhase()

    if (extractionResult !== ExtractResult.COMPLETE) {
      Logger.error('[OpenModel]: Error extracting geometry, exiting...')
      statistics?.setLoadStatus('FAIL')
      throw new Error( 'Couldn\'t extract model' )
    }

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
   * Cooperative twin of parseAndExtract: awaits the async data parse so the
   * event loop can run between progress ticks.
   *
   * @param modelID The model ID being opened.
   * @param data The STEP data buffer.
   * @param conwaywasm The conway geometry wasm wrapper.
   * @param settings Loader settings (ON_PROGRESS / ON_MODEL_INFO honored).
   * @return {Promise<Ap214ProxyLoadState>} Everything the constructor tail needs.
   */
  private static async parseAndExtractAsync(
      modelID: number,
      data: Uint8Array,
      conwaywasm: ConwayGeometry,
      settings?: Loadersettings ): Promise<Ap214ProxyLoadState> {

    const tracker = IfcApiProxyAP214.makeTracker(settings)

    const allTimeStart = Date.now()
    const parser = AP214StepParser.Instance
    const bufferInput = new ParsingBuffer(data)

    tracker?.beginPhase('headerParse', 'bytes', data.length)

    const [stepHeader, result0] = parser.parseHeader(bufferInput)

    Logger.createStatistics(modelID)

    const statistics = Logger.getStatistics(modelID)

    IfcApiProxyAP214.reportHeaderParseResult(result0, bufferInput, modelID)

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

    const conwayGeometry = new AP214GeometryExtraction(conwaywasm, model)

    // Heartbeat only: the AP214 thunk-tree extraction has no flat product
    // loop to tick from yet (see conway_model_loader's matching note).
    tracker?.beginPhase('geometry', 'products')

    const startTime = Date.now()
    const [extractionResult, scene] =
      conwayGeometry.extractAP214GeometryData()

    const endTime = Date.now()

    tracker?.endPhase()

    if (extractionResult !== ExtractResult.COMPLETE) {
      Logger.error('[OpenModel]: Error extracting geometry, exiting...')
      statistics?.setLoadStatus('FAIL')
      throw new Error( 'Couldn\'t extract model' )
    }

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

    Logger.warning(`RawLineData null, expressID: ${expressID}`)
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
    Logger.warning('[FlattenLine]: AP214 Shim - unimplemented')
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

        const result_ = AP214StepParser.Instance.extractArguments(parsingBuffer, element.expressID)

        if (result_[1] === ParseResult.COMPLETE) {
          const rawLineData: RawLineData = {
            ID: expressID,
            type: element.type,
            arguments: result_[0],
          }

          return rawLineData
        }
      } else {
        Logger.warning('element express ID null')
      }

      const rawLineData: RawLineData = {
        ID: expressID,
        type: element.type,
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

    // Note - null implementation - CS

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
    for (let typeIndex = 0; typeIndex < EntityTypesAP214Count; ++typeIndex) {

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

    const coordinationMatrix = this.model[5]

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
   *
   * @param modelID
   * @param meshCallback
   */
  streamAllMeshes( meshCallback: (mesh: FlatMesh) => void) {

    const [model,
      scene,
      meshMap,
      geometryMaterialTransformMap,
      vectorFlatMesh] = this.model

    let coordinationMatrix = this.model[5]

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity, occurrencePath]
      of scene.walkWithOccurrence()) {

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

        // create PlacedGeometry
        const expressID = model.getElementByLocalID(geometry.localID)?.expressID as number

        const geometryTransform = nativeTransform?.getValues()
        let newMatrix: glmatrix.mat4 | undefined
        if (geometryTransform !== void 0) {
          newMatrix = glmatrix.mat4.fromValues(
              geometryTransform[0],
              geometryTransform[1],
              geometryTransform[2],
              geometryTransform[3],
              geometryTransform[4],
              geometryTransform[5],
              geometryTransform[6],
              geometryTransform[7],
              geometryTransform[8],
              geometryTransform[9],
              geometryTransform[10],
              geometryTransform[11],
              geometryTransform[12],
              geometryTransform[13],
              geometryTransform[14],
              geometryTransform[15],
          )
        } else {
          // set to identity if no transform found
          newMatrix = glmatrix.mat4.create()
        }

        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          // coordinate the geometry to the origin
          const pt: number[] = [nativePt!.x, nativePt!.y, nativePt!.z]

          // Transform the point by the matrix.
          const transformedPt: glmatrix.vec4 = glmatrix.vec4.create()
          glmatrix.vec4.transformMat4(transformedPt, [pt[0], pt[1], pt[2], 1], newMatrix!)

          // Create the translation matrix.
          coordinationMatrix = glmatrix.mat4.create()

          glmatrix.mat4.fromTranslation(coordinationMatrix,
              [-transformedPt[0], -transformedPt[1], -transformedPt[2]])

          const scaleMatrix = glmatrix.mat4.create()

          // Create a 3D vector for scaling factors
          const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
              this.linearScalingFactor,
              this.linearScalingFactor)

          // Scale the matrix
          glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

          glmatrix.mat4.multiply(coordinationMatrix,
              this.NormalizeMat,
              coordinationMatrix)
          glmatrix.mat4.multiply(coordinationMatrix,
              scaleMatrix,
              coordinationMatrix)

          this._isCoordinated = true
        }

        // extract color
        const newTransform = glmatrix.mat4.create()

        // Create a 4x4 identity matrix
        const scaleMatrix = glmatrix.mat4.create()

        // Create a 3D vector for scaling factors
        const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
            this.linearScalingFactor,
            this.linearScalingFactor)

        // Scale the matrix
        glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

        // Compose the world transform from the engine's scene transform
        // (newMatrix = nativeTransform). Geometry vertices stay in their
        // source-unit local space; nativeTransform maps them to metre world
        // space — the same bare composition the native consumer
        // geometry_aggregator uses. The per-leaf geometry.normalize() recenter
        // was removed: AP214 instances/mapped-items share one geometry buffer,
        // so normalize() mutated it once and later instances lost their offset
        // and collapsed toward the origin (issue #308 "port cluster"). The
        // global coordinationMatrix still carries Y-up + COORDINATE_TO_ORIGIN.
        if (newMatrix !== void 0) {
          glmatrix.mat4.multiply(newTransform, coordinationMatrix, newMatrix)
        } else {
          glmatrix.mat4.copy(newTransform, coordinationMatrix)
        }
        const newTransformArr = Array.from(newTransform)
        geometryMaterialTransformMap.set(expressID,
            [geometry.geometry, material_, newTransformArr])

        if (entity?.localID !== void 0) {
          if (entity?.expressID !== void 0) {
            const mesh = meshMap.get(entity.localID)
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
                occurrencePath,
              }

              mesh[0].push(singlePlacedGeometry)
              mesh[1].geometries = mesh[0]

              meshMap.set(entity.localID, [mesh[0], mesh[1]])


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
                occurrencePath,
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

              meshMap.set(entity.localID, [vectorOfPlacedGeometry_, singleFlatMesh])
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
    // Null implementation - CS
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

    let coordinationMatrix = this.model[5]

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity, occurrencePath]
      of scene.walkWithOccurrence()) {

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

        // create PlacedGeometry
        const expressID = model.getElementByLocalID(geometry.localID)?.expressID as number

        const geometryTransform = nativeTransform?.getValues()
        let newMatrix: glmatrix.mat4 | undefined
        if (geometryTransform !== void 0) {
          newMatrix = glmatrix.mat4.fromValues(
              geometryTransform[0],
              geometryTransform[1],
              geometryTransform[2],
              geometryTransform[3],
              geometryTransform[4],
              geometryTransform[5],
              geometryTransform[6],
              geometryTransform[7],
              geometryTransform[8],
              geometryTransform[9],
              geometryTransform[10],
              geometryTransform[11],
              geometryTransform[12],
              geometryTransform[13],
              geometryTransform[14],
              geometryTransform[15],
          )
        }

        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          // coordinate the geometry to the origin
          // Assuming geom.GetPoint(0) returns a glm::dvec3, i.e., a 3D vector.
          // In TypeScript, you can represent it as number[] or Float64Array.
          Logger.info('Setting up coordinationMatrix')
          const pt: number[] = [nativePt!.x, nativePt!.y, nativePt!.z]

          // Transform the point by the matrix.
          const transformedPt: glmatrix.vec4 = glmatrix.vec4.create()
          glmatrix.vec4.transformMat4(transformedPt, [pt[0], pt[1], pt[2], 1], newMatrix!)

          // Create the translation matrix.
          coordinationMatrix = glmatrix.mat4.create()

          glmatrix.mat4.fromTranslation(coordinationMatrix,
              [-transformedPt[0], -transformedPt[1], -transformedPt[2]])

          const scaleMatrix = glmatrix.mat4.create()

          // Create a 3D vector for scaling factors
          const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
              this.linearScalingFactor,
              this.linearScalingFactor)

          // Scale the matrix
          glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

          glmatrix.mat4.multiply(coordinationMatrix,
              this.NormalizeMat,
              coordinationMatrix)
          glmatrix.mat4.multiply(coordinationMatrix,
              scaleMatrix,
              coordinationMatrix)

          this._isCoordinated = true
        }

        // extract color
        const newTransform = glmatrix.mat4.create()

        // Create a 4x4 identity matrix
        const scaleMatrix = glmatrix.mat4.create()

        // Create a 3D vector for scaling factors
        const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
            this.linearScalingFactor,
            this.linearScalingFactor)

        // Scale the matrix
        glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

        // Compose the world transform from the engine's scene transform
        // (newMatrix = nativeTransform). Geometry vertices stay in their
        // source-unit local space; nativeTransform maps them to metre world
        // space — the same bare composition the native consumer
        // geometry_aggregator uses. The per-leaf geometry.normalize() recenter
        // was removed: AP214 instances/mapped-items share one geometry buffer,
        // so normalize() mutated it once and later instances lost their offset
        // and collapsed toward the origin (issue #308 "port cluster"). The
        // global coordinationMatrix still carries Y-up + COORDINATE_TO_ORIGIN.
        if (newMatrix !== void 0) {
          glmatrix.mat4.multiply(newTransform, coordinationMatrix, newMatrix)
        } else {
          glmatrix.mat4.copy(newTransform, coordinationMatrix)
        }
        const newTransformArr = Array.from(newTransform)
        geometryMaterialTransformMap.set(expressID,
            [geometry.geometry, material_, newTransformArr])

        if (entity?.localID !== void 0) {
          if (entity?.expressID !== void 0) {
            const mesh = meshMap.get(entity.localID)
            if (mesh !== void 0) {
              // set color
              const color = {
                x: material_.legacyColor[0],
                y: material_.legacyColor[1],
                z: material_.legacyColor[2],
                w: material_.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
                occurrencePath,
              }

              mesh[0].push(singlePlacedGeometry)
              mesh[1].geometries = mesh[0]

              meshMap.set(entity.localID, [mesh[0], mesh[1]])


            } else {
              // set color
              const color = {
                x: material_.legacyColor[0],
                y: material_.legacyColor[1],
                z: material_.legacyColor[2],
                w: material_.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry_: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
                occurrencePath,
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

              meshMap.set(entity.localID, [vectorOfPlacedGeometry_, singleFlatMesh])
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
