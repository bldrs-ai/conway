/**
 * Load-phase decomposition (issue #394, M3 measurement item "M3 — decompose
 * `prep` and `assemble`").
 *
 * Conway's load log reports four numbers — Parsing / Preview / Geometry /
 * Total — so every other term in a load is only ever known by subtraction.
 * The parallel-load design (`design/new/parallel-load-pipeline.md`, draft)
 * rests on one such subtracted term: `prep + assemble`, estimated at ~11.3 s
 * of a 52.9 s PSB baseline. That term is the *serial residual* — the part no
 * amount of sharding the index build or the geometry pump can remove — so it
 * sets the hard ceiling on the whole pipeline rework. Nobody had measured it.
 * This script measures it.
 *
 * What it does NOT measure: the browser-only terms. There is no fetch, no
 * OPFS write, no three.js scene build and no GPU upload in Node. Read the
 * output as "the engine-side decomposition", and see the `serial residual`
 * line for the part of it that is genuinely un-shardable.
 *
 * Method: the phases are read off the *production* path (`OpenModelStream` +
 * `ExtractGeometryBatchAsync`, which is what Share runs), by wrapping methods
 * on the shipped prototypes with timers rather than by re-implementing the
 * sequence here. A re-implementation would drift from production silently;
 * a prototype wrapper cannot, because if a call disappears its bucket goes to
 * zero and the residual grows to match.
 *
 * Phase map, in execution order (see ifc_api_proxy_ifc.ts:1180-1300):
 *
 *   wasmInit        api.Init() — engine/wasm bring-up
 *   storeOpen       fs open + stat
 *   indexBuild      buildIndexStreamingAsync — the whole windowed parse.
 *                   THE SHARDABLE TERM.
 *   indexFinalize   ColumnarIndexSink.finalize()
 *   modelConstruct  header report + extractModelInfo + new IfcStepModel
 *   prepPaging      ensureResidentForDemandPrep() — pages the relationship
 *                   records a windowed source needs before the sweeps
 *   prepMaps        prepareDemandExtraction() → prepareExtractionMaps_(),
 *                   split into its five named sub-sweeps
 *   openTail        remainder of OpenModelStream after prep
 *   worklist        ensureDemandWorklistsAsync_() — the whole-model
 *                   types(IfcProduct) walk + dispatch closure paging
 *   geomPrefetch/geomExtract/geomRelease
 *                   from the pump's own extractProfile counters
 *   sceneWalk       streamNewMeshes_() — the per-batch full-scene re-walk
 *   aggregatePass   batches drained after the product worklist is exhausted
 *   copyOut         optional (--copyout): copy every geometry payload out of
 *                   the wasm heap, the closest Node analogue of what a
 *                   consumer's "assemble render mesh" stage pays
 *
 * Usage:
 *   node --expose-gc --max-old-space-size=8192 scripts/load_phase_report.mjs \
 *     [--batch 64] [--copyout] [--preview] [--json out.json] <model.ifc>
 *
 * `--preview` sets ON_PREVIEW_MESH, which is what Share does; it makes the
 * StorePreviewChannel run *during* the parse, so `indexBuild` then includes
 * preview CPU. Default off, so the phases are disjoint.
 */
import * as fs from 'node:fs'
import * as process from 'node:process'
import { performance } from 'node:perf_hooks'

const BYTES_PER_MB = 1024 * 1024

const argv = process.argv.slice( 2 )

/**
 * Read a `--flag value` pair out of argv.
 *
 * @param {string} name Flag name including dashes.
 * @param {string|undefined} fallback Value when the flag is absent.
 * @return {string|undefined} The value.
 */
function flagValue( name, fallback ) {
  const index = argv.indexOf( name )

  return index >= 0 ? argv[ index + 1 ] : fallback
}

const batchSize = Number( flagValue( '--batch', '64' ) )
const wantCopyOut = argv.includes( '--copyout' )
const wantPreview = argv.includes( '--preview' )
const jsonOut = flagValue( '--json', void 0 )
const filePath =
  argv.find( ( a, i ) =>
    !a.startsWith( '--' ) &&
    argv[ i - 1 ] !== '--batch' &&
    argv[ i - 1 ] !== '--json' )

if ( filePath === void 0 ) {
  console.error(
      'usage: load_phase_report.mjs [--batch N] [--copyout] [--preview] ' +
      '[--json out.json] <model.ifc>' )
  process.exit( 2 )
}

const { IfcAPI, LogLevel } =
  await import( '../compiled/src/compat/web-ifc/ifc_api.js' )
const { IfcApiProxyIfc } =
  await import( '../compiled/src/compat/web-ifc/ifc_api_proxy_ifc.js' )
const { IfcGeometryExtraction } =
  await import( '../compiled/src/ifc/ifc_geometry_extraction.js' )
const { ColumnarIndexSink } =
  await import( '../compiled/src/step/parsing/columnar_index.js' )
const { wasmHeapByteLength } =
  await import( '../compiled/src/core/wasm_heap.js' )

/** Accumulated wall-clock per named bucket, in ms. */
const bucket = Object.create( null )

/** One-shot timestamps, for bracketing phases the wrappers cannot enclose. */
const mark = Object.create( null )

/**
 * Add elapsed ms to a named bucket.
 *
 * @param {string} name Bucket name.
 * @param {number} ms Milliseconds to add.
 */
function add( name, ms ) {
  bucket[ name ] = ( bucket[ name ] ?? 0 ) + ms
}

/**
 * Wrap a synchronous prototype method with a timer.
 *
 * @param {object} proto The prototype carrying the method.
 * @param {string} method Method name.
 * @param {string} name Bucket to accumulate into.
 * @param {(self: object) => void} [onEnter] Optional hook run before the call.
 */
function timeSync( proto, method, name, onEnter ) {
  const original = proto[ method ]

  if ( typeof original !== 'function' ) {
    throw new Error( `no such method to instrument: ${method}` )
  }

  proto[ method ] = function( ...args ) {
    onEnter?.( this )
    mark[ `${name}:enter` ] ??= performance.now()
    const t0 = performance.now()

    try {
      return original.apply( this, args )
    } finally {
      add( name, performance.now() - t0 )
      mark[ `${name}:exit` ] = performance.now()
    }
  }
}

/**
 * Wrap an async prototype method with a timer.
 *
 * @param {object} proto The prototype carrying the method.
 * @param {string} method Method name.
 * @param {string} name Bucket to accumulate into.
 */
function timeAsync( proto, method, name ) {
  const original = proto[ method ]

  if ( typeof original !== 'function' ) {
    throw new Error( `no such method to instrument: ${method}` )
  }

  proto[ method ] = async function( ...args ) {
    mark[ `${name}:enter` ] ??= performance.now()
    const t0 = performance.now()

    try {
      return await original.apply( this, args )
    } finally {
      add( name, performance.now() - t0 )
      mark[ `${name}:exit` ] = performance.now()
    }
  }
}

// The five named sub-sweeps of prepareExtractionMaps_. The rel-materials
// sweep is the one term with no method of its own — it is an inline loop over
// model.types(IfcRelAssociatesMaterial) inside prepareExtractionMaps_ — so it
// is reported as `prepMaps.relMaterials(residual)`: prepMaps minus the four
// that do have methods. That is a subtraction, and is labelled as one.
timeSync( IfcGeometryExtraction.prototype, 'extractLinearScalingFactor',
    'prep.linearScale' )
timeSync( IfcGeometryExtraction.prototype, 'populateMaterialDefinitionsMap',
    'prep.materialDefs' )
timeSync( IfcGeometryExtraction.prototype, 'populateRelVoidsMap',
    'prep.relVoids' )
timeSync( IfcGeometryExtraction.prototype, 'populateStyledItemsMap',
    'prep.styledItems' )
timeSync( IfcGeometryExtraction.prototype, 'prepareExtractionMaps_',
    'prepMaps' )
timeAsync( IfcGeometryExtraction.prototype, 'ensureResidentForDemandPrep',
    'prepPaging' )
timeSync( IfcGeometryExtraction.prototype, 'aggregateTargetLocalIDs',
    'aggregateTargets' )
timeSync( ColumnarIndexSink.prototype, 'finalize', 'indexFinalize' )
timeSync( IfcApiProxyIfc.prototype, 'streamNewMeshes_', 'sceneWalk' )
timeAsync( IfcApiProxyIfc.prototype, 'ensureDemandWorklistsAsync_', 'worklist' )

/** Set once the pump has begun draining rel-aggregates rather than products. */
let inAggregatePass = false

// The aggregate drain is the one part of the pump with no profile counters of
// its own (extractGeometryBatchAsync's product branch keeps prefetchMs /
// extractMs / releaseMs; the rel-aggregate branch below it keeps nothing), so
// on a model where that branch dominates, every attribution would otherwise be
// a subtraction. Time it directly instead: the pager's per-step paging
// (`ensureForStep`), the setup (`beginAggregateExtract`), and the stepper's
// own `next()`, which is where the extraction happens.
timeAsync( IfcGeometryExtraction.prototype, 'beginAggregateExtract',
    'agg.begin' )

const beginAggregateExtract = IfcGeometryExtraction.prototype.beginAggregateExtract

IfcGeometryExtraction.prototype.beginAggregateExtract = async function( ...args ) {

  inAggregatePass = true

  const pager = await beginAggregateExtract.apply( this, args )

  if ( pager !== void 0 && typeof pager.ensureForStep === 'function' ) {

    const ensureForStep = pager.ensureForStep.bind( pager )

    pager.ensureForStep = async ( ...stepArgs ) => {
      const t0 = performance.now()

      try {
        return await ensureForStep( ...stepArgs )
      } finally {
        add( 'agg.paging', performance.now() - t0 )
      }
    }
  }

  return pager
}

const extractRelAggregateGeometryIncremental =
  IfcGeometryExtraction.prototype.extractRelAggregateGeometryIncremental

IfcGeometryExtraction.prototype.extractRelAggregateGeometryIncremental =
  function( ...args ) {

    const stepper =
      extractRelAggregateGeometryIncremental.apply( this, args )
    const next = stepper.next.bind( stepper )

    stepper.next = ( ...nextArgs ) => {
      const t0 = performance.now()

      try {
        return next( ...nextArgs )
      } finally {
        add( 'agg.step', performance.now() - t0 )
      }
    }

    return stepper
  }

/**
 * Node heap/RSS snapshot in MB, after a forced GC so retention rather than
 * garbage is what gets reported.
 *
 * @return {object} Memory figures in MB.
 */
function memMB() {
  globalThis.gc?.()

  const u = process.memoryUsage()

  return { heap: u.heapUsed / BYTES_PER_MB, rss: u.rss / BYTES_PER_MB }
}

/**
 * Current wasm linear-memory size in MB.
 *
 * @param {object} api The IfcAPI instance.
 * @return {number} Megabytes.
 */
function wasmMB( api ) {
  return api.wasmModule !== void 0 ?
    wasmHeapByteLength( api.wasmModule ) / BYTES_PER_MB : 0
}

/** Minimal byte store over a file descriptor, with read accounting. */
class CountingFileStore {

  /**
   * Open the file.
   *
   * @param {string} path File path.
   */
  constructor( path ) {
    this.fd = fs.openSync( path, 'r' )
    this.byteLength = fs.fstatSync( this.fd ).size
    this.reads = 0
    this.bytes = 0
    this.ms = 0
  }

  /**
   * Read a byte range.
   *
   * @param {number} offset Byte offset.
   * @param {number} length Byte count.
   * @return {Promise<Uint8Array>} The bytes read.
   */
  async read( offset, length ) {
    const t0 = performance.now()
    const buf = Buffer.allocUnsafe( length )
    const got = fs.readSync( this.fd, buf, 0, length, offset )

    this.ms += performance.now() - t0
    this.reads++
    this.bytes += got

    return new Uint8Array( buf.buffer, buf.byteOffset, got )
  }

  /** Close the descriptor. */
  close() {
    fs.closeSync( this.fd )
  }
}

const fileSize = fs.statSync( filePath ).size

const tProcess = performance.now()

const api = new IfcAPI()

const tInit = performance.now()

await api.Init()
add( 'wasmInit', performance.now() - tInit )

api.SetLogLevel( LogLevel.LOG_LEVEL_ERROR )

const tStoreOpen = performance.now()
const store = new CountingFileStore( filePath )

add( 'storeOpen', performance.now() - tStoreOpen )

const settings = {
  COORDINATE_TO_ORIGIN: true,
  USE_FAST_BOOLS: true,
  DEFER_GEOMETRY: true,
}

if ( wantPreview ) {
  settings.ON_PREVIEW_MESH = () => { /* count nothing; cost is the point */ }
}

let peakWasmMB = wasmMB( api )
let peakRssMB = process.memoryUsage().rss / BYTES_PER_MB

const tOpen = performance.now()
const modelID = await api.OpenModelStream( store, settings )
const openWall = performance.now() - tOpen

if ( modelID < 0 ) {
  console.error( 'open failed' )
  process.exit( 1 )
}

peakWasmMB = Math.max( peakWasmMB, wasmMB( api ) )
peakRssMB = Math.max( peakRssMB, process.memoryUsage().rss / BYTES_PER_MB )

const afterOpen = memMB()

// indexBuild is bracketed rather than wrapped: buildIndexStreamingAsync is a
// module-level function, and an ESM namespace binding cannot be replaced from
// outside. Its span is "OpenModelStream entry → the first finalize() call",
// minus the finalize itself, which is the same interval the source shows
// (ifc_api_proxy_ifc.ts:1206-1221) with nothing else in it.
const indexBuild = ( mark[ 'indexFinalize:enter' ] ?? performance.now() ) - tOpen

// modelConstruct: finalize exit → prep paging entry. Holds
// reportHeaderParseResult, extractModelInfo, the model-line log, and the
// IfcStepModel + WindowedStepBufferProvider construction.
const modelConstruct =
  ( mark[ 'prepPaging:enter' ] ?? mark[ 'indexFinalize:exit' ] ) -
  ( mark[ 'indexFinalize:exit' ] ?? tOpen )

const openTail = ( tOpen + openWall ) - ( mark[ 'prepMaps:exit' ] ?? tOpen )

let meshes = 0
let batches = 0
let copyOutMs = 0
let copiedGeometries = 0

const seenGeometry = new Set()

/**
 * Copy every not-yet-copied geometry payload for a mesh out of the wasm heap,
 * the way a consumer building its own scene does. Timed separately so the
 * marshalling term is visible rather than folded into extraction.
 *
 * @param {object} mesh The FlatMesh delivered by the pump.
 */
function copyOutMesh( mesh ) {
  const t0 = performance.now()
  const placedVector = mesh.geometries

  for ( let i = 0; i < placedVector.size(); ++i ) {

    const placed = placedVector.get( i )

    if ( seenGeometry.has( placed.geometryExpressID ) ) {
      continue
    }

    seenGeometry.add( placed.geometryExpressID )

    const geometry = api.GetGeometry( modelID, placed.geometryExpressID )

    // GetVertexArray/GetIndexArray already return owning copies; a second
    // slice would double every payload and inflate the very number this
    // bucket exists to report (see m3_pump_spike.mjs:348-356).
    api.GetVertexArray( geometry.GetVertexData(), geometry.GetVertexDataSize() )
    api.GetIndexArray( geometry.GetIndexData(), geometry.GetIndexDataSize() )

    // GetGeometry hands back an owning native clone; embind frees it only at
    // finalization, so a harness that forgets this accumulates one clone per
    // geometry inside the heap it is measuring.
    geometry.delete()
    ++copiedGeometries
  }

  copyOutMs += performance.now() - t0
}

const meshCallback = wantCopyOut ?
  ( mesh ) => {
    ++meshes
    copyOutMesh( mesh )
  } :
  () => {
    ++meshes
  }

const tGeom = performance.now()
let aggregateWall = 0

for ( ;; ) {
  const tBatch = performance.now()
  const { extracted, remaining } =
    await api.ExtractGeometryBatchAsync( modelID, batchSize, meshCallback )
  const batchWall = performance.now() - tBatch

  if ( inAggregatePass ) {
    aggregateWall += batchWall
  }

  ++batches

  peakWasmMB = Math.max( peakWasmMB, wasmMB( api ) )
  peakRssMB = Math.max( peakRssMB, process.memoryUsage().rss / BYTES_PER_MB )

  if ( remaining === 0 && extracted === 0 ) {
    break
  }
}

const geomWall = performance.now() - tGeom
const totalWall = performance.now() - tProcess

const passthrough = api.getPassthrough( modelID )
const profile = passthrough?.extractProfile ?? {}
const afterGeom = memMB()

add( 'geom.prefetch', profile.prefetchMs ?? 0 )
add( 'geom.extract', profile.extractMs ?? 0 )
add( 'geom.release', profile.releaseMs ?? 0 )

const relMaterialsResidual =
  ( bucket.prepMaps ?? 0 ) -
  ( bucket[ 'prep.linearScale' ] ?? 0 ) -
  ( bucket[ 'prep.materialDefs' ] ?? 0 ) -
  ( bucket[ 'prep.relVoids' ] ?? 0 ) -
  ( bucket[ 'prep.styledItems' ] ?? 0 )

// copyOut runs inside the mesh callback, which streamNewMeshes_ invokes, so
// the sceneWalk bucket ALREADY contains it. Subtract it once (out of
// sceneWalk) and never again out of the wall, or the residual goes negative —
// which is how this was caught.
const sceneWalkExCopy = ( bucket.sceneWalk ?? 0 ) - copyOutMs

// The pump's own counters do not cover the aggregate drain, the progress
// ticks or evictToBudget, so name what is left rather than assigning it.
const aggregateMeasured =
  ( bucket[ 'agg.begin' ] ?? 0 ) +
  ( bucket[ 'agg.paging' ] ?? 0 ) +
  ( bucket[ 'agg.step' ] ?? 0 )

const geomResidual =
  geomWall -
  ( bucket.worklist ?? 0 ) -
  ( profile.prefetchMs ?? 0 ) -
  ( profile.extractMs ?? 0 ) -
  ( profile.releaseMs ?? 0 ) -
  ( bucket.sceneWalk ?? 0 ) -
  aggregateMeasured

const rows = [
  [ 'wasmInit', bucket.wasmInit ?? 0, 'serial' ],
  [ 'storeOpen', bucket.storeOpen ?? 0, 'serial' ],
  [ 'indexBuild', indexBuild, 'SHARDABLE (task 2)' ],
  [ 'indexFinalize', bucket.indexFinalize ?? 0, 'serial (merge point)' ],
  [ 'modelConstruct', modelConstruct, 'serial' ],
  [ 'prepPaging', bucket.prepPaging ?? 0, 'serial' ],
  [ 'prepMaps (total)', bucket.prepMaps ?? 0, 'serial' ],
  [ '  .linearScale', bucket[ 'prep.linearScale' ] ?? 0, '' ],
  [ '  .relMaterials(residual)', relMaterialsResidual, '' ],
  [ '  .materialDefs', bucket[ 'prep.materialDefs' ] ?? 0, '' ],
  [ '  .relVoids', bucket[ 'prep.relVoids' ] ?? 0, '' ],
  [ '  .styledItems', bucket[ 'prep.styledItems' ] ?? 0, '' ],
  [ 'openTail', openTail, 'serial' ],
  [ 'worklist', bucket.worklist ?? 0, 'serial' ],
  [ 'geom.prefetch', profile.prefetchMs ?? 0, 'parallelisable' ],
  [ 'geom.extract', profile.extractMs ?? 0, 'parallelisable' ],
  [ 'geom.release', profile.releaseMs ?? 0, 'parallelisable' ],
  [ 'sceneWalk (excl copyOut)', sceneWalkExCopy, 'serial (per batch)' ],
  [ 'copyOut', copyOutMs, wantCopyOut ? 'serial (marshalling)' : 'not measured' ],
  [ 'agg.begin', bucket[ 'agg.begin' ] ?? 0, 'serial (aggregate setup)' ],
  [ 'agg.paging', bucket[ 'agg.paging' ] ?? 0, 'serial (aggregate paging)' ],
  [ 'agg.step', bucket[ 'agg.step' ] ?? 0, 'serial (aggregate extraction)' ],
  [ 'geom.residual', geomResidual, 'unattributed' ],
]

const serialMs =
  ( bucket.wasmInit ?? 0 ) +
  ( bucket.storeOpen ?? 0 ) +
  ( bucket.indexFinalize ?? 0 ) +
  modelConstruct +
  ( bucket.prepPaging ?? 0 ) +
  ( bucket.prepMaps ?? 0 ) +
  openTail +
  ( bucket.worklist ?? 0 ) +
  ( bucket.sceneWalk ?? 0 ) +
  aggregateMeasured +
  geomResidual

const parallelMs =
  indexBuild +
  ( profile.prefetchMs ?? 0 ) +
  ( profile.extractMs ?? 0 ) +
  ( profile.releaseMs ?? 0 )

console.log( '' )
console.log(
    `model      ${filePath}  ${( fileSize / BYTES_PER_MB ).toFixed( 1 )} MB` )
console.log(
    `settings   batch=${batchSize} copyout=${wantCopyOut} preview=${wantPreview}` )
console.log(
    `products   meshes=${meshes} batches=${batches} ` +
    `geometriesCopied=${copiedGeometries}` )
console.log( '' )
console.log( 'phase                        ms       %total  class' )
console.log( '---------------------------------------------------------------' )

for ( const [ name, ms, note ] of rows ) {
  console.log(
      `${name.padEnd( 26 )} ${ms.toFixed( 0 ).padStart( 8 )} ` +
      `${( 100 * ms / totalWall ).toFixed( 1 ).padStart( 7 )}  ${note}` )
}

console.log( '---------------------------------------------------------------' )
console.log(
    `${'openWall'.padEnd( 26 )} ${openWall.toFixed( 0 ).padStart( 8 )}` )
console.log(
    `${'geomWall'.padEnd( 26 )} ${geomWall.toFixed( 0 ).padStart( 8 )}` )
console.log(
    `${'TOTAL'.padEnd( 26 )} ${totalWall.toFixed( 0 ).padStart( 8 )}` )
console.log( '' )
console.log(
    `aggregate drain: measured ${aggregateMeasured.toFixed( 0 )} ms ` +
    `(begin+paging+step) against ${aggregateWall.toFixed( 0 )} ms of batch ` +
    `wall after the product worklist emptied — the latter also contains that ` +
    `phase's scene walks, so it is the larger of the two.` )
console.log( '' )
console.log(
    `serial residual (prep+assemble+init) ${serialMs.toFixed( 0 )} ms ` +
    `= ${( 100 * serialMs / totalWall ).toFixed( 1 )} % of total` )
console.log(
    `parallelisable (index+geometry)      ${parallelMs.toFixed( 0 )} ms ` +
    `= ${( 100 * parallelMs / totalWall ).toFixed( 1 )} % of total` )
console.log(
    `Amdahl ceiling at N=infinity          ` +
    `${( totalWall / serialMs ).toFixed( 2 )}x` )

for ( const n of [ 2, 4, 8 ] ) {
  console.log(
      `Amdahl ceiling at N=${n}                  ` +
      `${( totalWall / ( serialMs + parallelMs / n ) ).toFixed( 2 )}x ` +
      `(${( serialMs + parallelMs / n ).toFixed( 0 )} ms)` )
}

console.log( '' )
console.log(
    `memory     afterOpen rss=${afterOpen.rss.toFixed( 0 )} ` +
    `heap=${afterOpen.heap.toFixed( 0 )} | ` +
    `afterGeom rss=${afterGeom.rss.toFixed( 0 )} ` +
    `heap=${afterGeom.heap.toFixed( 0 )} | ` +
    `peakRss=${peakRssMB.toFixed( 0 )} peakWasm=${peakWasmMB.toFixed( 0 )}` )
console.log(
    `io         reads=${store.reads} ` +
    `MB=${( store.bytes / BYTES_PER_MB ).toFixed( 1 )} ` +
    `ms=${store.ms.toFixed( 0 )}` )

if ( jsonOut !== void 0 ) {
  fs.writeFileSync( jsonOut, `${JSON.stringify( {
    file: filePath,
    fileSize,
    batchSize,
    copyOut: wantCopyOut,
    preview: wantPreview,
    meshes,
    batches,
    phases: Object.fromEntries( rows.map( ( [ n, ms ] ) => [ n.trim(), ms ] ) ),
    openWall,
    geomWall,
    totalWall,
    serialMs,
    parallelMs,
    aggregateWall,
    aggregateMeasured,
    peakRssMB,
    peakWasmMB,
    io: { reads: store.reads, bytes: store.bytes, ms: store.ms },
  }, null, 2 )}\n` )
  console.log( `\nwrote ${jsonOut}` )
}

api.CloseModel( modelID )
store.close()
