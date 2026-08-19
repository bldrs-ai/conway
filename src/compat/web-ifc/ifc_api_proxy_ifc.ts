import {
  ConwayGeometry,
  GeometryObject,
} from '../../index'
import { Vector3 } from '../../../dependencies/conway-geom'
import { CanonicalMaterial } from '../../index'
import {
  computeDispatchKeys,
  computeRelatingLocalIDs,
  geometryDispatchKey,
  relatingLocalIDOf,
  shardOfDispatchKey,
} from '../../ifc/geometry_dispatch'
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
import { StepExternalByteStore, WindowedStepBufferProvider } from '../../step/step_buffer_provider'
import { IfcApiModelPassthrough } from './ifc_api_model_passthrough'
import { NodeValueHandle } from './properties_passthrough'
import * as glmatrix from 'gl-matrix'
import { IDENTITY_MAT4, LARGE_COORDINATE_BUDGET_M, TRANSLATION_X, TRANSLATION_Y,
  TRANSLATION_Z, composeTransformF64, deriveCoordinationF64 } from './coordination_f64'
import { IfcProperties } from './ifc_properties'
import Logger from '../../logging/logger'
import { ProgressTracker } from '../../core/progress'
import { formatModelLine } from '../../core/progress_log'
import {
  WasmHeapArrayConstructor, wasmHeapView,
} from '../../core/wasm_heap'
import { extractModelInfo } from '../../loaders/loading_utilities'
import IfcStepParser from '../../ifc/ifc_step_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { BufferByteSource, StoreByteSource } from '../../step/parsing/byte_source'
import {
  buildIndexStreamingAsync,
  buildColumnarIndexStreamingAsync,
} from '../../step/parsing/streaming_index_builder'
import { ColumnarIndexSink } from '../../step/parsing/columnar_index'
import { StorePreviewChannel } from './store_preview_channel'
import {
  ifcPreviewAdapter,
  StreamedPreviewChannel,
} from './streamed_preview_channel'
import { emitSpatialStructureImposters } from './spatial_imposter'
import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { StepHeader } from '../../step/parsing/step_parser'
import { ExtractResult } from '../../index'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import { ParseResult } from '../../index'
import { releaseScratchParsingBuffer } from '../../step/parsing/step_deserialization_functions'
import Memory from '../../memory/memory'
import { FromRawLineData } from './ifc2x4_helper'
import { shimIfcEntityMap, shimIfcEntityReverseMap } from './shim_schema_mapping'
import { EntityTypesIfcCount } from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { IfcProduct, IfcRelAggregates, IfcRoot } from '../../ifc/ifc4_gen'
import { CanonicalMeshType } from '../../index'

// Batch size used when a whole-model consumer (streamAllMeshes) drains
// a deferred model's remaining products synchronously.
const DEFERRED_DRAIN_BATCH = 256

/* How many later captures re-check a scene node whose geometry did not
 * resolve when its index passed the cursor, before giving up on it. See
 * demandPendingNodes_ for why the bound exists and why the value is
 * generous rather than tuned: nothing in the corpus, PSB or D3D parks a
 * node at all, and a node that is waiting on anything real is waiting on
 * the very next extraction, not the eighth. */
// eslint-disable-next-line no-magic-numbers
const DEMAND_PARKED_NODE_RETRIES = 8

/* Moving-window size for the streamed columnar parse (matches the
 * ifc_stream_open default; the window bounds parse-time scratch, not
 * the source buffer, which the model keeps resident here). */
// eslint-disable-next-line no-magic-numbers
const STREAMED_PARSE_POOL_BYTES = 1024 * 1024

/* Store-backed open pays an await per window slide (`File.slice`).
 * 1 MiB on an 860 MB IFC is ~1700 trips; 16 MiB is ~100. The window
 * is scratch — it does not stay resident after parse. */
// eslint-disable-next-line no-magic-numbers
const STORE_PARSE_POOL_BYTES = 16 * 1024 * 1024
// eslint-disable-next-line no-magic-numbers
const BYTES_PER_MIB = 1024 * 1024

/**
 * The coordination frame spatial-structure imposters compose under.
 *
 * With COORDINATE_TO_ORIGIN on, that is whatever frame the preview
 * channel latched (undefined when it never captured an instance — the
 * imposter walk then derives an equivalent one itself). With it OFF the
 * durable capture composes against a bare identity, so the plates must
 * too, or they would be the only thing in the scene in metres and Y-up.
 *
 * @param settings The open's loader settings.
 * @param previewCoordination The preview channel's latched frame.
 * @return {ArrayLike<number> | undefined} The frame, or undefined to let
 * the imposter walk derive one.
 */
function imposterCoordination(
    settings: Loadersettings | undefined,
    previewCoordination: number[] | undefined ): ArrayLike< number > | undefined {

  return settings?.COORDINATE_TO_ORIGIN === true ?
    previewCoordination : IDENTITY_MAT4
}

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
  /** True when a parse-time preview channel ran and emitted. Recorded
   * separately from the matrix above, which only exists when recentring
   * was on — sharding has to know about the preview either way. */
  previewEmitted?: boolean
  allTimeStart: number
  stepHeader: StepHeader
  model: IfcStepModel
  scene: IfcSceneBuilder
  conwayGeometry: IfcGeometryExtraction
  geometryTimeInMs: number
  /** Parse tracker, kept so the deferred batch pump can emit Geometry. */
  tracker?: ProgressTracker
}

/**
 * The proxy for IFC from the shim.
 */
/**
 * The placements of a FlatMesh whose native geometry is still alive.
 *
 * There is no "is this deleted" predicate on the binding, so liveness is
 * probed by the cheapest call that touches the native and throws when it is
 * gone. Only used on the degraded StreamAllMeshes path, where the
 * alternative is handing a consumer a handle that aborts on read.
 *
 * @param mesh The accumulated per-entity mesh.
 * @param geometryMap Express ID to [geometry, material, transform].
 * @return {PlacedGeometry[]} The placements still backed by live geometry.
 */
function livePlacements(
    mesh: FlatMesh,
    geometryMap: Map<number, [GeometryObject, CanonicalMaterial, number[]]> ):
    PlacedGeometry[] {

  const live: PlacedGeometry[] = []

  for (let where = 0; where < mesh.geometries.size(); ++where) {

    const placed = mesh.geometries.get(where)
    const entry = geometryMap.get(placed.geometryExpressID)

    if (entry === void 0) {
      continue
    }

    try {
      entry[0].GetVertexDataSize()
      live.push(placed)
    } catch {
      /* Native freed by eviction — drop the placement. */
    }
  }

  return live
}


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

  /** Parse/load tracker — deferred opens resume it for the Geometry phase. */
  private progressTracker_?: ProgressTracker

  /** True once beginPhase('geometry') has fired for this deferred pump. */
  private geometryPhaseStarted_: boolean = false

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
  /**
   * How much of the scene array the delta capture has consumed. The scene
   * is append-only, so this is a stable cursor: everything a batch adds
   * sits above it. Replaces the per-entity walk watermark this used to
   * keep, which existed only because the capture restarted its walk from
   * zero every batch — an O(batches x scene) cost that dominated on
   * instance-dense models (D3D: 562k instances, 1182 batches at size 64).
   */
  private demandSceneCursor_ = 0

  /**
   * Node indices walkFrom yielded without resolvable geometry, against the
   * number of times a later capture has re-checked them. Parked because a
   * cursor passes each index once, where the whole-scene walk this replaced
   * re-checked every node on every call. See IfcSceneBuilder.walkFrom.
   *
   * Bounded by DEMAND_PARKED_NODE_RETRIES because not every unresolved node
   * is waiting on something: extraction can append a scene node and then
   * fail to cache geometry for it (extractSweptDiskSolid returns early on a
   * failed directrix; extractRepresentationItem still calls addGeometry),
   * and no amount of re-checking makes a deterministic failure resolve.
   * Retrying those forever would be O(batches x unresolvable) — still under
   * the O(batches x scene) this replaced, but unbounded in batch count for
   * no benefit. Expiring after a fixed number of attempts makes the total
   * retry work O(retries x unresolvable) regardless of batch size.
   *
   * Measured at zero on every model available here — the 12-model smoke
   * corpus, PSB, and D3D (which logs exactly the malformed-geometry errors
   * that produce this case) all park nothing — so this path is a
   * correctness guard rather than a hot path, and its constant is chosen to
   * be generous rather than tuned.
   */
  private readonly demandPendingNodes_ = new Map<number, number>()

  /** Cursor into demandProducts_ — products before it are extracted. */
  /* Which shard of the model this instance extracts, or undefined for all
   * of it. See setGeometryShard. */
  private shard_?: { index: number, count: number }

  private demandCursor_ = 0

  /** Wall-clock split of the store-backed batch pump (profile script). */
  private readonly extractProfile_ = {
    prefetchMs: 0,
    extractMs: 0,
    releaseMs: 0,
    batches: 0,
    lastPins: 0,
    pinMax: 0,
  }

  /**
   * Deferred-mode rel-aggregates worklist, pumped batch-by-batch AFTER
   * the product cursor completes. Classic's whole-model walk follows
   * its product loop with a second pass extracting every
   * IfcRelAggregates related product using the relating object's
   * rel-voids. Aggregate-target products are EXCLUDED from
   * demandProducts_ (see aggregateTargetLocalIDs) so this pass is their
   * first and only extraction — content is final when their instances
   * are captured, and no placement is ever appended over an
   * already-delivered one (the ILNA missing-facades / 388_4
   * duplicate-placement class).
   */
  private demandAggregates_?: IfcRelAggregates[]

  /** Cursor into demandAggregates_ — items before it are extracted. */
  private demandAggregatesCursor_ = 0

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

  /** Whether a parse-time preview channel already emitted for this model.
   * The preview runs during open, before a shard can be claimed, so its
   * output is never partitioned (see setGeometryShard). */
  private previewEmitted_ = false

  /**
   * True while an adopted preview-channel coordination frame is still
   * unvalidated against the durable walk's first geometry. A model can
   * carry geometry in more than one frame (ISSUE_129: a local-scale
   * annotation previews first while the body is georeferenced at
   * ~8.3e6 m), so a frame anchored on the wrong unit leaves the body
   * raw — the Share#1634 browser-vs-node divergence, which was really
   * preview-vs-no-preview. streamNewMeshes_ clears this on its first
   * geometry, re-deriving from it when the adopted frame fails the
   * large-coordinate budget.
   */
  private demandCoordinationFromPreview_: boolean = false

  /**
   * True when the coordination frame was HANDED to this instance rather than
   * derived from its own first geometry (see setCoordinationFrame).
   *
   * The distinction is what makes a recentred model shardable. A derived
   * frame is anchored on whichever product this instance happened to extract
   * first, so N workers derive N frames and their outputs merge shifted by
   * whole recentre cells; a supplied one is the same for every worker by
   * construction, which is the only property the refusals in
   * checkShardPreconditions_ were ever protecting.
   */
  private coordinationSupplied_: boolean = false

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
    this.progressTracker_ = loadState.tracker

    const statistics = Logger.getStatistics(modelID)

    const {
      allTimeStart,
      stepHeader,
      model,
      scene,
      conwayGeometry,
      geometryTimeInMs: executionTimeInMs,
    } = loadState

    // M3's budgeted arena. Applied here rather than at parse time because
    // the model only exists now, and eviction cannot matter before the first
    // pump batch anyway. Absent or non-positive leaves it unlimited, which
    // is every pre-existing consumer's behaviour.
    if ( settings?.GEOMETRY_BUDGET_MB !== void 0 ) {

      model.geometryResidency.setBudgetBytes(
          settings.GEOMETRY_BUDGET_MB * BYTES_PER_MIB )
    }

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
    this.previewEmitted_ = loadState.previewEmitted === true

    if (this.deferredMode_ && loadState.previewCoordinationMatrix !== void 0) {
      this.demandCoordination_ = loadState.previewCoordinationMatrix
      this._isCoordinated = true
      // Adopted, not derived: validate against the durable walk's first
      // geometry before trusting it (see demandCoordinationFromPreview_).
      this.demandCoordinationFromPreview_ = true
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
   * M1b store-backed open: parse through a moving window over `store`
   * and keep the model windowed from birth — the source is never held
   * as one `ArrayBuffer`. Geometry extract pages product closures
   * through {@link extractGeometryBatchAsync}.
   *
   * @param modelID The model ID being opened.
   * @param store External store holding the source bytes.
   * @param wasmModule The wasm module.
   * @param settings Loader settings (ON_PROGRESS is honored).
   * @return {Promise<IfcApiProxyIfc>} The constructed proxy.
   */
  public static async createFromStore(
      modelID: number,
      store: StepExternalByteStore,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiProxyIfc> {

    const loadState = await IfcApiProxyIfc.parseColumnarFromStore(
        modelID, store, new ConwayGeometry(wasmModule), settings,
        settings?.DEFER_GEOMETRY === true )

    return new IfcApiProxyIfc(modelID, new Uint8Array( 0 ), wasmModule, settings, loadState)
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

      if ( settings?.ON_PREVIEW_MESH !== void 0 ) {

        try {
          // After prepareDemandExtraction, not before: the plates are
          // composed under the coordination frame, whose scaling comes
          // from getLinearScalingFactor() — which reads 1 until the
          // extraction maps (and with them the unit assignment) are
          // prepared. Both calls run in the same synchronous stretch
          // after the parse, so nothing reaches the screen any later.
          await emitSpatialStructureImposters(
              model,
              settings.ON_PREVIEW_MESH,
              imposterCoordination( settings, previewChannel?.coordinationMatrix ),
              conwayGeometry.getLinearScalingFactor() )
        } catch {
          // Spatial imposters must never break a deferred open.
        }
      }

      statistics?.setProductCount(model.typeCount(IfcProduct))

      return {
        conwaywasm,
        deferred: true,
        // Pin the durable pump's coordination to the preview channel's
        // (derived from the same first instance with the same math), so
        // preview payloads and durable meshes share one frame.
        previewCoordinationMatrix: previewChannel?.coordinationMatrix,
        previewEmitted: previewChannel !== void 0,
        allTimeStart,
        stepHeader,
        model,
        scene: conwayGeometry.scene,
        conwayGeometry,
        geometryTimeInMs: 0,
        tracker,
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
   * Windowed-from-birth twin of parseColumnarAndExtractAsync: the
   * source stays in `store`, parse windows are filled through it, and
   * the model never holds a resident copy. During parse a bounded
   * prefix extract pages product closures from the store and emits
   * placed meshes (same COORDINATE_TO_ORIGIN frame as durable). After
   * the index exists, spatial-structure AABB plates go out too.
   * Deferred opens page prep closures before prepareDemandExtraction;
   * non-deferred opens drain the demand pump with per-product residency.
   *
   * @param modelID The model ID being opened.
   * @param store External store holding the source bytes.
   * @param conwaywasm The conway geometry wasm wrapper.
   * @param settings Loader settings (ON_PROGRESS is honored).
   * @param deferGeometry Skip extraction (Share demand pump).
   * @return {Promise<IfcProxyLoadState>} Everything the constructor tail needs.
   */
  private static async parseColumnarFromStore(
      modelID: number,
      store: StepExternalByteStore,
      conwaywasm: ConwayGeometry,
      settings?: Loadersettings,
      deferGeometry: boolean = false ): Promise<IfcProxyLoadState> {

    const tracker = IfcApiProxyIfc.makeTracker(settings)
    const allTimeStart = Date.now()
    const parser = IfcStepParser.Instance
    const fileSize = store.byteLength

    Logger.createStatistics(modelID)

    const statistics = Logger.getStatistics(modelID)

    tracker?.beginPhase('dataParse', 'bytes', fileSize)

    const parseTick = tracker !== void 0 ?
      (cursorBytes: number) => tracker.update(cursorBytes) : void 0

    const parseStartTime = Date.now()

    // Live sink so the store preview channel can snapshot a prefix
    // mid-parse without a resident source buffer.
    const sink = new ColumnarIndexSink< EntityTypesIfc >()
    const storePreview = settings?.ON_PREVIEW_MESH !== void 0 ?
      new StorePreviewChannel(
          store,
          sink,
          conwaywasm,
          settings.COORDINATE_TO_ORIGIN === true,
          settings.ON_PREVIEW_MESH ) : void 0

    const parseProgress = async ( cursorBytes: number ): Promise< void > => {
      parseTick?.( cursorBytes )
      await storePreview?.maybeTickAsync()
    }

    // One windowed pass: header comes out of the same slide as the
    // data block so we do not hold a second 16 MiB prefix copy.
    let result
    let stepHeader

    try {
      ( { result, header: stepHeader } = await buildIndexStreamingAsync(
          new StoreByteSource( store ),
          parser,
          STORE_PARSE_POOL_BYTES,
          void 0,
          sink,
          parseProgress ) )

      if ( storePreview !== void 0 ) {
        await storePreview.flushAsync()
      }
    } finally {
      storePreview?.stop()
    }

    const columns = sink.finalize()

    // Parse window is out of scope; drop the module scratch in case a
    // numeric read during the slide left it pointed at that 16 MiB view.
    releaseScratchParsingBuffer()

    IfcApiProxyIfc.reportHeaderParseResult(
        result, new ParsingBuffer( new Uint8Array( 0 ) ), modelID )

    const modelInfo = extractModelInfo(stepHeader, fileSize)

    Logger.info(formatModelLine(modelInfo))
    settings?.ON_MODEL_INFO?.(modelInfo)

    const parseEndTime = Date.now()

    tracker?.endPhase(fileSize)

    if (result !== ParseResult.COMPLETE) {
      Logger.warning(`[OpenModelStream]: streamed parse result ${result}`)
      statistics?.setLoadStatus('PARSE_FAIL')
      throw new Error( 'Streamed parse did not complete' )
    }

    const provider = new WindowedStepBufferProvider( store )
    const model = new IfcStepModel( void 0, columns, provider )

    statistics?.setParseTime(parseEndTime - parseStartTime)

    const conwayGeometry = new IfcGeometryExtraction(conwaywasm, model)

    const prepPins = await conwayGeometry.ensureResidentForDemandPrep()

    try {
      conwayGeometry.prepareDemandExtraction()
    } finally {
      model.releaseSourceViews( prepPins )
      model.unpinLocalIDs( prepPins )
    }

    if ( settings?.ON_PREVIEW_MESH !== void 0 ) {

      try {
        // Emitted after demand prep so getLinearScalingFactor() reports
        // the model's real units — see the resident path's note.
        await emitSpatialStructureImposters(
            model,
            settings.ON_PREVIEW_MESH,
            imposterCoordination( settings, storePreview?.coordinationMatrix ),
            conwayGeometry.getLinearScalingFactor() )
      } catch {
        // Spatial imposters must never break a store-backed open.
      }
    }

    if (deferGeometry) {

      statistics?.setProductCount(model.typeCount(IfcProduct))

      return {
        conwaywasm,
        deferred: true,
        previewCoordinationMatrix: storePreview?.coordinationMatrix,
        allTimeStart,
        stepHeader,
        model,
        scene: conwayGeometry.scene,
        conwayGeometry,
        geometryTimeInMs: 0,
        tracker,
      }
    }

    tracker?.beginPhase('geometry', 'products')

    const startTime = Date.now()

    const aggregateTargets = conwayGeometry.aggregateTargetLocalIDs()
    let completed = 0

    tracker?.setPhaseTotal( model.typeCount( IfcProduct ) )

    // eslint-disable-next-line no-magic-numbers
    const EXTRACT_BATCH = 8
    const pending: number[] = []

    const flushProductBatch = async () => {

      if ( pending.length === 0 ) {
        return
      }

      const pins = new Set< number >()
      const leafSpans: { address: number, length: number }[] = []

      try {

        await Promise.all( pending.map( ( localID ) =>
          conwayGeometry.ensureResidentForProductExtract(
              localID, pins, leafSpans ) ) )

        for ( const localID of pending ) {

          try {
            conwayGeometry.extractProductGeometryByLocalID( localID )
          } catch ( error ) {
            Logger.error(
                `Error extracting product localID ${localID}: ` +
                `${error instanceof Error ? error.message : String( error )}` )
          }

          model.releaseSourceViews( pins )
          ++completed
        }
      } finally {
        model.releaseSourceViews( pins )
        model.unpinLocalIDs( pins )
        for ( const span of leafSpans ) {
          model.unpinAddressRange( span.address, span.length )
        }
        pending.length = 0
      }

      tracker?.update( completed, {
        residentSourceMb: model.residentSourceBytes / BYTES_PER_MIB,
      } )
    }

    for ( const product of model.types( IfcProduct ) ) {

      if ( aggregateTargets.has( product.localID ) ) {
        continue
      }

      pending.push( product.localID )

      if ( pending.length >= EXTRACT_BATCH ) {
        await flushProductBatch()
      }
    }

    await flushProductBatch()

    for ( const relAggregate of model.types( IfcRelAggregates ) ) {

      const leafSpans: { address: number, length: number }[] = []
      const pins =
        await conwayGeometry.ensureResidentForAggregateExtract(
            relAggregate, leafSpans )

      try {
        conwayGeometry.extractRelAggregateGeometry( relAggregate )
      } catch ( error ) {
        Logger.error(
            `Error extracting aggregate ${relAggregate.expressID}: ` +
            `${error instanceof Error ? error.message : String( error )}` )
      } finally {
        model.releaseSourceViews( pins )
        model.unpinLocalIDs( pins )
        for ( const span of leafSpans ) {
          model.unpinAddressRange( span.address, span.length )
        }
      }

      ++completed
      tracker?.update( completed, {
        residentSourceMb: model.residentSourceBytes / BYTES_PER_MIB,
      } )
    }

    const endTime = Date.now()

    tracker?.endPhase()

    statistics?.setProductCount(model.typeCount(IfcProduct))
    statistics?.setGeometryTypeCounts(conwayGeometry.geometryTypeCounts)

    return {
      conwaywasm,
      allTimeStart,
      stepHeader,
      model,
      scene: conwayGeometry.scene,
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
          Logger.error(`[GetGeometry]: Geometry Object not found for expressID: \n          ${geometryExpressID}`)
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
   * Store-backed pump split (prefetch / extract / release).
   *
   * @return {object} Cumulative milliseconds and pin telemetry.
   */
  get extractProfile(): {
    prefetchMs: number
    extractMs: number
    releaseMs: number
    batches: number
    lastPins: number
    pinMax: number
  } {
    return this.extractProfile_
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
   * The coordination frame actually applied to emitted placements —
   * the derived (or validated adopted) recenter, identity when no
   * recenter ran. See ifc_api_model_passthrough.getAppliedCoordination.
   *
   * @return {Array<number>} column-major mat4
   */
  getAppliedCoordination(): Array<number> {
    return [...(this.demandCoordination_ ?? this.identity)]
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
        (this.demandCursor_ < this.demandProducts_.length ||
          this.demandAggregatesCursor_ <
            (this.demandAggregates_?.length ?? 0))) {
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

    if (this.model[0].isSourceExternal) {
      throw new Error(
          'ExtractGeometryBatch is synchronous and cannot page a windowed ' +
          'source — use ExtractGeometryBatchAsync' )
    }

    this.checkShardPreconditions_()
    this.ensureDemandWorklists_()

    return this.pumpGeometryBatch_(batchSize, meshCallback)
  }

  /**
   * Async twin of {@link extractGeometryBatch}: pages each product's
   * `#ref` closure before extracting it, so a model opened through
   * {@link IfcApiProxyIfc.createFromStore} (windowed from birth) can
   * be pumped. Safe on a resident source (prefetch is a no-op).
   *
   * @param batchSize Max products to extract this call (min 1).
   * @param meshCallback Receives each newly-extracted product's mesh.
   * @return {Promise<object>} `{extracted, remaining}`.
   */
  async extractGeometryBatchAsync(
      batchSize: number,
      meshCallback?: (mesh: FlatMesh) => void ):
      Promise<{extracted: number, remaining: number}> {

    if (!this.deferredMode_) {
      return {extracted: 0, remaining: 0}
    }

    this.checkShardPreconditions_()
    await this.ensureDemandWorklistsAsync_()

    if (!this.model[0].isSourceExternal) {
      return this.pumpGeometryBatch_(batchSize, meshCallback)
    }

    const products = this.demandProducts_ ?? []
    const aggregates = this.demandAggregates_ ?? []
    const totalWork = products.length + aggregates.length
    const budget = Math.max(batchSize, 1)
    let extracted = 0

    if (this.progressTracker_ !== void 0 && !this.geometryPhaseStarted_) {
      this.progressTracker_.beginPhase('geometry', 'products', totalWork)
      this.geometryPhaseStarted_ = true
    }

    const productEnd = Math.min(this.demandCursor_ + budget, products.length)
    const batchIDs = products.slice(this.demandCursor_, productEnd)

    if (batchIDs.length > 0) {

      // One pin set for the batch so mapped geometry stays resident
      // across the instances that share it.
      const pins = new Set<number>()
      const leafSpans: { address: number, length: number }[] = []
      const profile = this.extractProfile_

      try {

        const prefetchStart = Date.now()
        await Promise.all(batchIDs.map((localID) =>
          this.conwayGeometry_.ensureResidentForProductExtract(
              localID, pins, leafSpans)))
        profile.prefetchMs += Date.now() - prefetchStart
        if ( pins.size > profile.pinMax ) {
          profile.pinMax = pins.size
        }
        profile.lastPins = pins.size

        const extractStart = Date.now()
        for (const localID of batchIDs) {

          try {
            if (this.conwayGeometry_.extractProductGeometryByLocalID(localID)) {
              ++extracted
            }
          } catch (error) {
            Logger.error(
                `Error extracting product localID ${localID}: ` +
                `${error instanceof Error ? error.message : String(error)}`)
          }

          // Drop JS views after each product; chunks stay pinned for
          // the rest of the batch so rematerialise is a cache hit.
          this.model[0].releaseSourceViews(pins)
        }
        profile.extractMs += Date.now() - extractStart

        this.demandCursor_ = productEnd
      } finally {
        const releaseStart = Date.now()
        this.model[0].releaseSourceViews(pins)
        this.model[0].unpinLocalIDs(pins)
        for (const span of leafSpans) {
          this.model[0].unpinAddressRange(span.address, span.length)
        }
        profile.releaseMs += Date.now() - releaseStart
        profile.batches++
      }
    }

    if (this.demandCursor_ >= products.length &&
        this.demandAggregatesCursor_ < aggregates.length) {

      const aggregatesEnd = Math.min(
          this.demandAggregatesCursor_ + (budget - extracted),
          aggregates.length)

      for (; this.demandAggregatesCursor_ < aggregatesEnd;
        ++this.demandAggregatesCursor_) {

        const relAggregate = aggregates[this.demandAggregatesCursor_]
        const leafSpans: { address: number, length: number }[] = []
        const pins =
          await this.conwayGeometry_.ensureResidentForAggregateExtract(
              relAggregate, leafSpans)

        try {
          this.conwayGeometry_.extractRelAggregateGeometry(relAggregate)
          ++extracted
        } catch (error) {
          Logger.error(
              `Error extracting aggregate ${relAggregate.expressID}: ` +
              `${error instanceof Error ? error.message : String(error)}`)
        } finally {
          this.model[0].releaseSourceViews(pins)
          this.model[0].unpinLocalIDs(pins)
          for (const span of leafSpans) {
            this.model[0].unpinAddressRange(span.address, span.length)
          }
        }
      }
    }

    // Capture before eviction — and capture even when nobody asked for
    // meshes. The deferred StreamAllMeshes drain pumps with `noCallback` for
    // every batch and captures once at the end (see streamAllMeshes), which
    // works only while geometry survives to be captured. With a budget it
    // does not: anything evicted before that final capture can no longer be
    // resolved, so those instances vanish from the model with no error. On
    // the shared-representation fixture at a 2 KiB budget that path
    // delivered 3 placements against classic's 16.
    if (meshCallback !== void 0) {
      this.streamNewMeshes_(meshCallback)
    } else if (this.model[0].geometryResidency.enabled) {
      this.streamNewMeshes_(() => { /* capture into meshMap before eviction */ })
    }

    // Evict AFTER the capture, never before: the delta capture resolves each
    // new node's geometry to emit it, so evicting first would drop assets
    // this batch is about to deliver and re-extract them immediately. A
    // no-op unless a budget is configured.
    this.model[0].geometryResidency.evictToBudget()

    const remaining = (products.length - this.demandCursor_) +
        (aggregates.length - this.demandAggregatesCursor_)

    const windowMb = this.model[0].residentSourceBytes / BYTES_PER_MIB

    if (this.progressTracker_ !== void 0) {
      const completed = totalWork - remaining
      if (remaining === 0) {
        this.progressTracker_.update(completed, { residentSourceMb: windowMb })
        this.progressTracker_.endPhase(totalWork)
      } else {
        this.progressTracker_.update(completed, { residentSourceMb: windowMb })
      }
    }

    return {extracted, remaining}
  }

  /**
   * Enumerate the deferred worklists once (file-order products, then
   * rel-aggregates). Shared by the sync and async pumps.
   */
  private ensureDemandWorklists_(): void {

    if (this.demandProducts_ !== void 0) {
      return
    }

    const {products, aggregates} = this.collectDemandCandidates_()

    if (this.shard_ === void 0) {
      this.adoptDemandWorklists_(products, aggregates)
      return
    }

    // Reachable only on a resident source: the sync pump refuses a windowed
    // one outright, and the async pump routes a sharded model through
    // ensureDemandWorklistsAsync_. Asserted rather than assumed, because the
    // failure it guards against is a silently wrong partition — a walk that
    // hit a non-resident record here would throw out of the load instead
    // (see geometryDispatchKey), but the diagnostic would name a record
    // rather than the missing await.
    if (this.model[0].isSourceExternal) {

      throw new Error(
          'a sharded windowed model needs the async worklist build, which ' +
          'pages each product\'s dispatch closure — reached the synchronous ' +
          'one instead')
    }

    const productKeys = new Uint32Array(products.length)

    for (let where = 0; where < products.length; ++where) {
      productKeys[where] = geometryDispatchKey(this.model[0], products[where])
    }

    const aggregateKeys = new Uint32Array(aggregates.length)

    for (let where = 0; where < aggregates.length; ++where) {
      aggregateKeys[where] = geometryDispatchKey(
          this.model[0],
          relatingLocalIDOf(this.model[0], aggregates[where].localID))
    }

    this.adoptShardedWorklists_(
        products, aggregates, productKeys, aggregateKeys)
  }


  /**
   * Worklist build for a windowed source — the same partition, with the
   * dispatch walk's records paged before they are read.
   *
   * Sharding a windowed model rests on every worker computing the SAME key
   * for a product, and an inline walk cannot promise that: whether a record
   * read resolves depends on which chunks THIS worker holds, so workers
   * disagree and both moduli select a product (extracted twice) or neither
   * (dropped). computeDispatchKeys pages each hop of the walk first, which
   * is what makes the keys a function of the file rather than of paging —
   * and is why the pool can finally serve a store-backed open, the only kind
   * Share performs.
   *
   * Resident sources take the same route with the paging short-circuited, so
   * there is one partition rather than a windowed one and a resident one.
   */
  private async ensureDemandWorklistsAsync_(): Promise<void> {

    if (this.demandProducts_ !== void 0) {
      return
    }

    const {products, aggregates} = this.collectDemandCandidates_()

    if (this.shard_ === void 0) {
      this.adoptDemandWorklists_(products, aggregates)
      return
    }

    const productKeys = await computeDispatchKeys(this.model[0], products)

    const aggregateKeys = await computeDispatchKeys(
        this.model[0],
        await computeRelatingLocalIDs(
            this.model[0], aggregates.map((aggregate) => aggregate.localID)))

    // Re-checked after the awaits: a concurrent pump could have built the
    // worklists while this one was paging, and adopting a second set would
    // reset the cursors under it, re-extracting everything already pumped.
    if (this.demandProducts_ !== void 0) {
      return
    }

    this.adoptShardedWorklists_(
        products, aggregates, productKeys, aggregateKeys)
  }


  /**
   * Everything the pump could extract, before any shard narrows it.
   *
   * Reads no record bytes — products come from the type index and aggregate
   * targets from the geometry side — so it is identical on a resident and a
   * windowed source, and both key computations start from the same lists in
   * the same order. That order is what makes the keys align to the
   * worklists.
   *
   * @return {object} The unsharded product and rel-aggregates worklists.
   */
  private collectDemandCandidates_():
      {products: number[], aggregates: IfcRelAggregates[]} {

    // Aggregate-target products are extracted ONLY by the
    // rel-aggregates pass below (with the relating object's master
    // rel-voids), never by the per-product pass: extracting them here
    // first would emit their instances with the uncut/placeholder
    // content and the pass's later replacement would never reach an
    // incremental consumer (it copies at delivery), while the pass's
    // second scene instance would draw over the first (see
    // aggregateTargetLocalIDs).
    const aggregateTargets = this.conwayGeometry_.aggregateTargetLocalIDs()

    const products: number[] = []

    for (const product of this.model[0].types(IfcProduct)) {

      if (aggregateTargets.has(product.localID)) {
        continue
      }
      products.push(product.localID)
    }

    const aggregates: IfcRelAggregates[] = []

    for (const relAggregate of this.model[0].types(IfcRelAggregates)) {
      aggregates.push(relAggregate)
    }

    return {products, aggregates}
  }


  /**
   * Install the whole model's worklists — the unsharded case.
   *
   * @param products Every extractable product, in index order.
   * @param aggregates Every rel-aggregates entry, in index order.
   */
  private adoptDemandWorklists_(
      products: number[],
      aggregates: IfcRelAggregates[]): void {

    this.demandProducts_ = products
    this.demandAggregates_ = aggregates
    this.demandCursor_ = 0
    this.demandAggregatesCursor_ = 0
  }


  /**
   * Install the worklists narrowed to this instance's shard.
   *
   * Keys are passed in rather than computed here because where they come
   * from is the whole difference between a resident and a windowed source —
   * one walks the attributes directly, the other pages the walk's closure
   * first — while the narrowing itself is identical. Separate from
   * {@link adoptDemandWorklists_} so the keys are required by the signature
   * rather than by a comment.
   *
   * @param products Every extractable product, in index order.
   * @param aggregates Every rel-aggregates entry, in index order.
   * @param productKeys Placement keys aligned to `products`.
   * @param aggregateKeys Placement keys aligned to `aggregates`.
   */
  private adoptShardedWorklists_(
      products: number[],
      aggregates: IfcRelAggregates[],
      productKeys: Uint32Array,
      aggregateKeys: Uint32Array): void {

    const shard = this.shard_!

    let placed = 0
    let positional = 0

    this.demandProducts_ = products.filter((localID, where) => {

      const key = productKeys[where]

      // A key equal to the product's own local ID means the walk found
      // nothing to place by — a product with no representation. That
      // costs affinity, not correctness: the key is still a pure
      // function of the product, so every worker computes the same one
      // and the partition holds; it just stops avoiding duplication.
      key === localID ? ++positional : ++placed

      return shardOfDispatchKey(key, shard.count) === shard.index
    })

    if (positional > placed) {

      Logger.warning(
          `[shard ${shard.index}/${shard.count}] ` +
          `${positional} of ${positional + placed} products have no ` +
          'placement key, so sharding is mostly positional and shared ' +
          'geometry will be rebuilt per shard.')
    }

    // Aggregates place by the RELATING OBJECT's key — the assembly whose
    // geometry the pass builds — not the relationship record's. An
    // IfcRelAggregates is not an IfcProduct, so keying on it would fall
    // straight through geometryDispatchKey to its own local ID and shard
    // by record position while claiming to place by representation.
    //
    // This matters most exactly where placement matters most: on an
    // assembly-heavy model the rel-aggregates pass creates most of the
    // geometry, so getting it wrong leaves placement with almost nothing
    // to control (measured on D3D, where that mistake made every strategy
    // look identical).
    this.demandAggregates_ = aggregates.filter((relAggregate, where) =>
      shardOfDispatchKey(aggregateKeys[where], shard.count) === shard.index)

    this.demandCursor_ = 0
    this.demandAggregatesCursor_ = 0
  }


  /**
   * Hand this model the recentre frame to apply, instead of letting it
   * derive one — the other half of what a worker pool needs.
   *
   * `COORDINATE_TO_ORIGIN` normally recentres a model onto an anchor taken
   * from the FIRST geometry the instance captures. That is fine for one
   * instance and fatal for N: each worker starts on a different product, so
   * each derives a different frame, and a model spanning more than one
   * recentre cell reassembles with its shards offset by whole cells. Nothing
   * downstream can detect it — the placements are individually plausible.
   *
   * So the frame becomes an input. A coordinator derives it once (Share's
   * parse-time preview channel already does, and
   * {@link getAppliedCoordination} reports what any instance applied), hands
   * the same matrix to every worker, and the shards agree by construction
   * rather than by luck. This is what lifts the COORDINATE_TO_ORIGIN refusal
   * in {@link setGeometryShard}.
   *
   * A supplied frame is FINAL. The adopted-preview path re-derives when the
   * first durable placement lands outside the large-coordinate budget
   * (Share#1634); that check is disabled here, because a worker that
   * re-derived would silently leave the frame its siblings are still using.
   * A coordinator that wants that validation runs it on its own instance,
   * before it hands the frame out.
   *
   * Deferred models only, like sharding itself: a classic open has already
   * placed everything by the time this could be called.
   *
   * Supply it BEFORE claiming a shard: {@link setGeometryShard} refuses a
   * COORDINATE_TO_ORIGIN model that has no frame yet, so the reverse order
   * fails at the claim rather than at the pump.
   *
   * @param matrix Column-major mat4 of 16 finite numbers, or undefined to
   * drop a previously supplied frame and go back to deriving.
   */
  public setCoordinationFrame( matrix?: number[] ): void {

    // Same "before the first pump" rule as setGeometryShard, and for a
    // sharper reason: placements already emitted carry the old frame, and
    // nothing re-places them, so a late call would leave one model in two
    // coordinate systems.
    if (this.demandProducts_ !== void 0) {

      throw new Error(
          'SetCoordinationFrame must be called before the first ' +
          'ExtractGeometryBatch: placements already emitted carry the frame ' +
          'that was in force when they were captured, and are not re-placed.')
    }

    if (!this.deferredMode_) {

      throw new Error(
          'SetCoordinationFrame requires DEFER_GEOMETRY: a classic open has ' +
          'already placed every product, so a frame supplied now would be ' +
          'accepted and then ignored.')
    }

    if (matrix === void 0) {

      if (this.coordinationSupplied_) {
        this.demandCoordination_ = void 0
        this.coordinationSupplied_ = false
        this._isCoordinated = false
      }

      return
    }

    if (matrix.length !== IDENTITY_MAT4.length ||
        !matrix.every((element) => Number.isFinite(element))) {

      throw new Error(
          `invalid coordination frame: expected ${IDENTITY_MAT4.length} ` +
          `finite numbers (column-major mat4), got ${matrix.length}`)
    }

    // A frame this instance DERIVED (or adopted from its own preview) is not
    // one a coordinator can reconcile with — geometry has already been placed
    // in it. Overwriting would leave that geometry in the old frame and
    // everything after it in the new one.
    if (this.demandCoordination_ !== void 0 && !this.coordinationSupplied_) {

      throw new Error(
          'this model has already adopted a coordination frame of its own ' +
          '(a preview channel, or a first durable capture), so it cannot be ' +
          'given another: geometry placed in the old frame is not re-placed.')
    }

    // Copied, not retained: a coordinator handing one array to N instances
    // and mutating it between calls would otherwise leave every instance
    // pointing at the last frame written. Same aliasing class as the shard
    // descriptor below.
    this.demandCoordination_ = [...matrix]
    this.coordinationSupplied_ = true

    // Stops the capture path from deriving over the top of it (see
    // streamNewMeshes_), and stops the adopted-preview revalidation from
    // replacing it.
    this._isCoordinated = true
    this.demandCoordinationFromPreview_ = false
  }


  /**
   * Extract only one shard of this model's geometry — the across-product
   * parallelism seam.
   *
   * Each worker in a pool opens the model, claims a shard, and pumps: no
   * scheduling channel between them, because placement is a pure function of
   * the product (see geometryDispatchKey). Products sharing a representation
   * land on the same shard, so shards do not rebuild each other's geometry —
   * round-robin costs +25 % assets on MB-Khaya and +40.7 % on D3D at N=4,
   * where this key costs +0 % and +38.1 % respectively, for 1.76x and 2.34x
   * wall-clock.
   *
   * **A shard extracts a SUBSET, and the consumer is responsible for the
   * union.** One shard's output is not a model; assembling all of them is.
   * Must be set before the first pump call, since the worklists are built
   * once — setting it later throws rather than silently extracting the wrong
   * subset.
   *
   * @param shard `{index, count}`, or undefined for the whole model.
   */
  public setGeometryShard( shard?: { index: number, count: number } ): void {

    if (this.demandProducts_ !== void 0) {

      throw new Error(
          'setGeometryShard must be called before the first ' +
          'ExtractGeometryBatch: the worklists are already built, and ' +
          'narrowing them now would drop products this model has already ' +
          'reported as pending.')
    }

    if (shard === void 0) {
      this.shard_ = void 0
      return
    }

    // Validated before anything is decided from it, so a malformed
    // descriptor is reported as malformed rather than as whichever
    // incompatibility it happens to trip first.
    if (!Number.isInteger(shard.count) || shard.count < 1 ||
        !Number.isInteger(shard.index) || shard.index < 0 ||
        shard.index >= shard.count) {

      throw new Error(
          `invalid shard ${shard.index}/${shard.count}: index must be an ` +
          'integer in [0, count) and count a positive integer')
    }

    // A single worker is the unsharded model, so it is normalised here —
    // BEFORE the checks below, every one of which exists because workers
    // have to agree with each other. One worker agrees with nobody, and a
    // coordinator that calls this uniformly for its N=1 baseline is doing
    // nothing that needs a shared frame or a residency-independent key.
    // Refusing it would fail a configuration that is exactly equivalent to
    // never having called this at all.
    if (shard.count === 1) {
      this.shard_ = void 0
      return
    }

    // Refused rather than silently wrong. With COORDINATE_TO_ORIGIN the
    // recentre anchor is derived from the FIRST geometry a model captures
    // (see demandCoordination_ in streamNewMeshes_), so shards that begin on
    // different products derive different frames — and a model spanning more
    // than one recentre cell then merges subsets shifted by whole grid cells.
    // Nothing in a union-of-placements check catches that on a model sitting
    // at the origin, which is every fixture here.
    //
    // Sharding a recentred model therefore needs one anchor agreed before
    // the split: either derived independently of the shard, or established
    // once and handed to every worker. Until that exists, the combination
    // is an error rather than a quiet coordinate bug — which does mean the
    // pool cannot serve Share's own open settings yet.
    // Sharding only means anything on the deferred pump: it narrows the
    // worklists ensureDemandWorklists_ builds. A classic open has already
    // extracted everything, so ExtractGeometryBatch returns zero work and
    // StreamAllMeshes serves the whole scene — a coordinator that forgot
    // DEFER_GEOMETRY would see every worker claim successfully and then
    // receive the COMPLETE model from each, which is the silent-wrong
    // outcome every other check here exists to prevent.
    //
    // Placed after the N=1 normalisation above: {index: 0, count: 1} is a
    // request for the whole model, which is exactly what a classic open
    // delivers, so there is nothing to refuse.
    if (!this.deferredMode_) {

      throw new Error(
          'SetGeometryShard requires DEFER_GEOMETRY: a classic open has ' +
          'already extracted the whole model, so a shard claim would be ' +
          'accepted and then ignored, and every worker would deliver ' +
          'everything.')
    }

    // The preview channel runs during open, before a shard can be claimed,
    // so its payloads are never partitioned: every worker performs the same
    // capped preview extraction and emits the same imposters, and a pool
    // forwarding those callbacks gets N overlapping copies. Only the
    // durable pump is sharded.
    //
    // Refused rather than deduplicated, because the fix is to make the
    // shard available during open so the preview path can filter by it —
    // an open-signature change, not a dispatch one. Same shape as the
    // other two refusals: close the path that has no caller, and name the
    // precondition for reopening it.
    if (this.previewEmitted_) {

      throw new Error(
          'SetGeometryShard cannot be used on a model opened with ' +
          'ON_PREVIEW_MESH: the preview runs during open, before a shard ' +
          'exists, so every worker would emit the same unpartitioned ' +
          'preview payloads.')
    }

    // Already-adopted frame, not just the current flag — see
    // checkShardPreconditions_, which carries the reasoning. A SUPPLIED
    // frame is the exception both refusals exist to allow: it is the same
    // matrix in every worker, so there is nothing left to disagree about.
    if (this.demandCoordination_ !== void 0 && !this.coordinationSupplied_) {

      throw new Error(
          'SetGeometryShard cannot be used on a model that has already ' +
          'adopted a recentre frame (for example via ON_PREVIEW_MESH): the ' +
          'frame is derived from whichever geometry this instance saw ' +
          'first, so workers would not share it.')
    }

    if (this.settings?.COORDINATE_TO_ORIGIN === true && !this.coordinationSupplied_) {

      throw new Error(
          'SetGeometryShard cannot be combined with COORDINATE_TO_ORIGIN ' +
          'unless a coordination frame was supplied: each shard would ' +
          'otherwise derive its own recentre anchor from whichever product ' +
          'it happens to extract first, so merged output can be shifted ' +
          'between shards. Call SetCoordinationFrame with one frame for the ' +
          'whole pool, or open without COORDINATE_TO_ORIGIN.')
    }

    // Snapshotted, not retained. A coordinator configuring several engine
    // instances from one descriptor object — mutating `index` between calls
    // — would otherwise leave every proxy pointing at the same object, and
    // ensureDemandWorklists_ reads it later, at first pump. Every descriptor
    // would pass validation here and the partition would still collapse:
    // several workers claiming the final index, nobody claiming the rest.
    //
    // Same class as the settings-object aliasing above: values validated at
    // one moment and consumed at another have to be copied at the boundary.
    this.shard_ = { index: shard.index, count: shard.count }
  }

  /**
   * Synchronous extract of the next batch. Caller must have paged
   * ranges if the source is windowed.
   *
   * @param batchSize Max products this call.
   * @param meshCallback Optional mesh consumer.
   * @return {object} `{extracted, remaining}`.
   */
  /**
   * The conditions a sharded pump requires, re-checked on every batch.
   *
   * Not only in setGeometryShard, because `this.settings` is the CALLER'S
   * object, held by reference, and the model reads it live — a caller can
   * open with a flag off, claim a shard past the claim-time check, then set
   * the flag on its own object. The check that has to hold is the one at the
   * point the property is consumed, so this runs from both pump entries,
   * upstream of every capture.
   *
   * Unsharded models are unaffected: every condition here is about workers
   * having to agree with each other.
   */
  /**
   * Whether this model should recentre — the question the CAPTURE path asks.
   *
   * Distinct from the refusals in checkShardPreconditions_, and deliberately
   * so. Those refuse the combination when they can observe it; this makes
   * the combination harmless when they cannot. A guard checks at one moment
   * and the frame is derived at another, and the caller owns the settings
   * object throughout — so anything running in between can flip the flag.
   * ON_PROGRESS is one such window (it is invoked synchronously from
   * beginPhase, between the precondition check and the first capture), and
   * it is the third such window found in this review; patching each one as
   * it turns up is losing strategy.
   *
   * So a sharded model never DERIVES a frame, whatever the flag says at the
   * instant one would be derived. The refusals still fire first in every
   * observable case, which is what a caller should see; this is what makes a
   * missed one merely refused-late rather than silently wrong.
   *
   * Deriving is all this governs. A frame handed in by
   * {@link setCoordinationFrame} is applied by the capture path
   * unconditionally — that is the point of supplying one — and this staying
   * false for a sharded model is exactly what keeps a worker from deriving
   * over the top of it.
   *
   * @return {boolean} Whether to derive a recentre frame from this
   * instance's first geometry.
   */
  private recentreEnabled_(): boolean {

    return this.shard_ === void 0 && this.settings?.COORDINATE_TO_ORIGIN === true
  }


  private checkShardPreconditions_(): void {

    if (this.shard_ === void 0) {
      return
    }

    // Each shard would derive its own recentre anchor from whichever product
    // it extracts first (see demandCoordination_ in streamNewMeshes_), so a
    // model spanning more than one recentre cell merges subsets shifted by
    // whole grid cells.
    // Two questions, because neither answers the other. The FLAG says
    // whether recentring is wanted from here on; demandCoordination_ says
    // whether a frame has already been adopted. A caller that opened with
    // ON_PREVIEW_MESH and COORDINATE_TO_ORIGIN, let the preview channel
    // adopt a frame, then set the flag false on its own settings object
    // would pass a flag-only check while already sitting in a
    // preview-derived frame that other workers do not share.
    if (this.previewEmitted_) {

      throw new Error(
          'a preview channel already emitted for this model, so it cannot ' +
          'be sharded: the preview runs during open, before a shard ' +
          'exists, so its payloads are not partitioned.')
    }

    if (this.demandCoordination_ !== void 0 && !this.coordinationSupplied_) {

      throw new Error(
          'a recentre frame has already been adopted on this model, so it ' +
          'cannot be sharded: the frame came from whichever geometry this ' +
          'instance saw first, and other workers will have adopted their ' +
          'own.')
    }

    if (this.settings?.COORDINATE_TO_ORIGIN === true && !this.coordinationSupplied_) {

      throw new Error(
          'COORDINATE_TO_ORIGIN was enabled on a sharded model with no ' +
          'supplied coordination frame: each shard would derive its own ' +
          'recentre anchor from whichever product it extracts first, so ' +
          'merged output can be shifted between shards. Supply one frame ' +
          'for the pool with SetCoordinationFrame.')
    }

  }


  private pumpGeometryBatch_(
      batchSize: number,
      meshCallback?: (mesh: FlatMesh) => void ): {extracted: number, remaining: number} {

    const products = this.demandProducts_ ?? []
    const aggregates = this.demandAggregates_ ?? []
    const totalWork = products.length + aggregates.length

    if (this.progressTracker_ !== void 0 && !this.geometryPhaseStarted_) {
      this.progressTracker_.beginPhase('geometry', 'products', totalWork)
      this.geometryPhaseStarted_ = true
    }

    const budget = Math.max(batchSize, 1)
    const end = Math.min(
        this.demandCursor_ + budget,
        products.length)

    let extracted = 0

    for (; this.demandCursor_ < end; ++this.demandCursor_) {

      const localID = products[this.demandCursor_]

      if (this.conwayGeometry_.extractProductGeometryByLocalID(localID)) {
        ++extracted
      }
    }

    // Classic parity: once the product walk completes, pump the
    // whole-model walk's second (rel-aggregates master-voids) pass with
    // the same per-call budget — batch-by-batch, not as one end-of-load
    // stall — so aggregate parts stream in cut, exactly once, with
    // final content (see demandAggregates_).
    if (this.demandCursor_ >= products.length &&
        this.demandAggregatesCursor_ < aggregates.length) {

      const aggregatesEnd = Math.min(
          this.demandAggregatesCursor_ + (budget - extracted),
          aggregates.length)

      for (; this.demandAggregatesCursor_ < aggregatesEnd;
        ++this.demandAggregatesCursor_) {

        this.conwayGeometry_.extractRelAggregateGeometry(
            aggregates[this.demandAggregatesCursor_])
        ++extracted
      }
    }

    // Capture before eviction — and capture even when nobody asked for
    // meshes. The deferred StreamAllMeshes drain pumps with `noCallback` for
    // every batch and captures once at the end (see streamAllMeshes), which
    // works only while geometry survives to be captured. With a budget it
    // does not: anything evicted before that final capture can no longer be
    // resolved, so those instances vanish from the model with no error. On
    // the shared-representation fixture at a 2 KiB budget that path
    // delivered 3 placements against classic's 16.
    if (meshCallback !== void 0) {
      this.streamNewMeshes_(meshCallback)
    } else if (this.model[0].geometryResidency.enabled) {
      this.streamNewMeshes_(() => { /* capture into meshMap before eviction */ })
    }

    // Evict AFTER the capture, never before: the delta capture resolves
    // each new node's geometry to emit it, so evicting first would drop
    // assets this batch is about to deliver and re-extract them at once.
    // A no-op unless a budget is configured. Both pumps need this — the
    // async twin is what Share drives, this one is what a synchronous
    // embedder and the test suite drive, and a budget honoured on only
    // one of them is a budget that silently does not apply.
    this.model[0].geometryResidency.evictToBudget()

    const remaining = (products.length - this.demandCursor_) +
        (aggregates.length - this.demandAggregatesCursor_)

    if (this.progressTracker_ !== void 0) {
      const completed = totalWork - remaining
      if (remaining === 0) {
        this.progressTracker_.endPhase(totalWork)
      } else {
        this.progressTracker_.update(completed)
      }
    }

    return {
      extracted,
      remaining,
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
  /**
   * Set the resident-geometry budget, in bytes, after the open.
   *
   * The setting form (GEOMETRY_BUDGET_MB) fixes the budget for a model's
   * lifetime; this exists because the right number is a property of the
   * device and the moment — a tab under pressure wants a smaller one than
   * the same tab on load — and re-opening an 860 MB model to change it is
   * not a real option.
   *
   * Takes effect at the next pump batch, so lowering it mid-load does not
   * stall the current one freeing memory.
   *
   * @param bytes The ceiling; non-finite or non-positive disables eviction.
   * @return {{budgetBytes: number, liveBytes: number}} The budget now in
   * force and what is currently accounted resident.
   */
  public setGeometryBudget( bytes: number ): { budgetBytes: number, liveBytes: number } {

    const residency = this.model[0].geometryResidency

    residency.setBudgetBytes( bytes )

    return { budgetBytes: residency.budgetBytes, liveBytes: residency.liveBytes }
  }

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
    const deltas = new Map<number, PlacedGeometry[]>()

    // Everything the scene has gained since the last capture, plus any
    // node parked earlier for unresolvable geometry. Each node passes
    // through exactly once, so no watermark is needed to suppress
    // re-emission - the cursor IS the watermark, one for the whole scene
    // rather than one per entity.
    const capturedCursor = this.demandSceneCursor_
    const pending = this.demandPendingNodes_

    this.demandSceneCursor_ = scene.nodeCount

    const candidates = function* (this: void ) {

      for (const [index, attempts] of [...pending]) {

        const retried = scene.walkNode(index)

        if (retried === void 0 || retried[2] === void 0) {

          if (attempts + 1 >= DEMAND_PARKED_NODE_RETRIES) {
            pending.delete(index)
          } else {
            pending.set(index, attempts + 1)
          }

          continue
        }

        pending.delete(index)
        yield retried
      }

      for (const candidate of scene.walkFrom(capturedCursor)) {

        if (candidate[2] === void 0) {
          pending.set(candidate[5], 0)
          continue
        }

        yield candidate
      }
    }

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of candidates()) {

      // `candidates` never yields an unresolved geometry — the undefined
      // arm is the parked-node signal, handled there — but the tuple type
      // allows it, so narrow here rather than asserting at each use.
      if (geometry === void 0 ||
          entity?.localID === void 0 || entity.expressID === void 0) {
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

      const validatePreviewFrame = this.demandCoordinationFromPreview_ &&
        this.recentreEnabled_()

      let nativePt: Vector3
      if ((!this._isCoordinated || validatePreviewFrame) &&
          this.recentreEnabled_()) {
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

      if (!this._isCoordinated && this.recentreEnabled_()) {

        const derived = deriveCoordinationF64(
            geometryTransform, nativePt!, this.NormalizeMat, this.linearScalingFactor)

        coordinationMatrix = derived

        // Persist for every later batch (internal only — see
        // demandCoordination_'s identity-contract note).
        this.demandCoordination_ = derived
        this._isCoordinated = true
      } else if (validatePreviewFrame) {
        // One-shot check of an adopted preview frame against the durable
        // walk's first geometry: when the composed placement still lands
        // beyond the large-coordinate budget, the preview anchored in a
        // different frame than the model body (Share#1634) — re-derive
        // from this geometry, the classic path's anchor. The throwaway
        // preview scene may briefly disagree; the durable model must
        // place like the classic open.
        this.demandCoordinationFromPreview_ = false

        const probe = composeTransformF64(coordinationMatrix, geometryTransform, center)
        const magnitude = Math.max(
            Math.abs(probe[TRANSLATION_X]),
            Math.abs(probe[TRANSLATION_Y]),
            Math.abs(probe[TRANSLATION_Z]))

        if (magnitude > LARGE_COORDINATE_BUDGET_M) {
          const derived = deriveCoordinationF64(
              geometryTransform, nativePt!, this.NormalizeMat, this.linearScalingFactor)

          coordinationMatrix = derived
          this.demandCoordination_ = derived
          Logger.info(
              `[deferred] preview coordination frame rejected (first durable ` +
              `placement at ${Math.round(magnitude)}m); re-derived from the durable anchor`)
        }
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

      // A budget cannot hold across this call, and pretending otherwise
      // hands the consumer freed memory.
      //
      // StreamAllMeshes asks for the WHOLE model at once and delivers every
      // entity after the drain completes, so a consumer reading geometry in
      // its callback — the classic contract, and the only way to copy a
      // payload here — reaches natives evicted batches ago. Capturing before
      // eviction (see the pumps) saves the FlatMesh metadata but not the
      // natives it points at, so it fixes the silent-omission half of this
      // and not the dangling half.
      //
      // So the budget is suspended for the call and restored after, with one
      // eviction pass to trim what the drain accumulated. The peak during
      // StreamAllMeshes is therefore the UNBUDGETED peak, which is what
      // asking for every mesh at once means. A consumer that wants the
      // budget honoured throughout should pump ExtractGeometryBatch and copy
      // per batch, which is what Share does.
      const residency = this.model[0].geometryResidency
      const suspendedBudgetBytes = residency.budgetBytes

      // Degraded, and said so once. Suspending stops future eviction, but
      // nothing recovers what a caller's own budgeted batches already freed:
      // the accumulated meshes reference natives that are gone, and
      // re-extracting the owning products restores geometry under NEW local
      // IDs, so the old meshes still fail to resolve while a fresh capture
      // emits the same instances again (21 placements against classic's 16
      // on the shared-representation fixture). Rather than hand out dangling
      // handles, this delivers what is still resident and drops the rest —
      // see the filter below. Properly serving this combination needs the
      // meshes re-keyed onto re-extracted geometry, which is follow-up work.
      const degraded = residency.everEvicted

      residency.setBudgetBytes(0)

      try {

        const noCallback = void 0

        while (this.extractGeometryBatch(
            DEFERRED_DRAIN_BATCH, noCallback).remaining > 0) {
          // draining
        }
        this.streamNewMeshes_(() => { /* absorb stragglers into meshMap */ })

        const [, , meshMap, geometryMaterialTransformMap, vectorFlatMesh] =
          this.model

        let droppedInstances = 0
        let droppedEntities = 0

        meshMap.forEach((mesh) => {

          if (degraded) {

            const live = livePlacements(mesh[1], geometryMaterialTransformMap)

            droppedInstances += mesh[1].geometries.size() - live.length

            if (live.length === 0) {
              ++droppedEntities
              return
            }
          }

          vectorFlatMesh.push(mesh[1])
          meshCallback(mesh[1])
        })

        // One line for the whole call, not one per dropped instance: this
        // fires on a path that may drop thousands, and a per-instance log
        // would bury the fact that anything was dropped at all.
        if (degraded) {
          Logger.warning(
              `[geometry budget] StreamAllMeshes served a model that evicted ` +
              `under a budget: ${droppedInstances} instance(s) across ` +
              `${droppedEntities} entit(ies) were dropped because their ` +
              `geometry was freed. Pump ExtractGeometryBatch and copy at ` +
              `delivery to receive everything.`)
        }

      } finally {

        // In a finally because meshCallback is the CALLER's code: if it
        // throws — including from a geometry read — an early return would
        // leave the model permanently unbudgeted, holding the unbudgeted
        // drain's whole resident set, with nothing to signal it.
        if (Number.isFinite(suspendedBudgetBytes)) {

          // Restoring seeds from everything now resident; the pass then
          // trims to the ceiling, so the model is back under budget by the
          // time this returns rather than at some later pump that may never
          // come.
          residency.setBudgetBytes(suspendedBudgetBytes)
          residency.evictToBudget()
        }
      }

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
        if (!this._isCoordinated && this.recentreEnabled_()) {
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

        if (!this._isCoordinated && this.recentreEnabled_()) {
          coordinationMatrix = deriveCoordinationF64(
              geometryTransform, nativePt!, this.NormalizeMat, this.linearScalingFactor)
          // Persisted for getAppliedCoordination (Share#1634): report
          // the real applied frame, not the classic silent identity.
          this.demandCoordination_ = Array.from(coordinationMatrix)
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
        if (!this._isCoordinated && this.recentreEnabled_()) {
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

        if (!this._isCoordinated && this.recentreEnabled_()) {
          Logger.info('Setting up coordinationMatrix')
          coordinationMatrix = deriveCoordinationF64(
              geometryTransform, nativePt!, this.NormalizeMat, this.linearScalingFactor)
          // Persisted for getAppliedCoordination (Share#1634).
          this.demandCoordination_ = Array.from(coordinationMatrix)
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
        if (!this._isCoordinated && this.recentreEnabled_()) {
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

        if (!this._isCoordinated && this.recentreEnabled_()) {
          Logger.info('Setting up coordinationMatrix')
          coordinationMatrix = deriveCoordinationF64(
              geometryTransform, nativePt!, this.NormalizeMat, this.linearScalingFactor)
          // Persisted for getAppliedCoordination (Share#1634).
          this.demandCoordination_ = Array.from(coordinationMatrix)
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
