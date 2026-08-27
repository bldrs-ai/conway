/**
 * Window-request tracer for the rel-aggregate pager (issue #616).
 *
 * #616 measured that a D3D.ifc load reads 47.1 GB from a 213.6 MB file and
 * that 56.2 % of the wall clock is `AggregateExtractPager.ensureForStep`. The
 * number was measured; the mechanism was not. This script is the "instrument
 * the pager's window requests before changing anything" step from that issue:
 * it records every chunk the {@link WindowedStepBufferProvider} is asked for —
 * offset, size, hit or miss — together with **which caller asked**, so the
 * access pattern can be characterised rather than guessed at.
 *
 * It drives the same production path `scripts/load_phase_report.mjs` does
 * (`OpenModelStream` + `ExtractGeometryBatchAsync`) and wraps shipped
 * prototypes, so what it measures cannot drift from what runs.
 *
 * What is recorded
 * ----------------
 *  - Per **phase** (parse / prep / worklist / product-batch / agg.begin /
 *    agg.ensureForStep / agg.step / other): chunk requests, hits, misses,
 *    bytes read from the store.
 *  - Per **chunk index**: how many times it was (re-)loaded. A file read once
 *    end to end gives every chunk a count of 1; the amplification factor is
 *    the mean of this histogram.
 *  - Per **wave** (one `ensureForStep` that actually rolled the window):
 *    relationship, product range, closure records paged, distinct chunks
 *    touched, misses, address span, and the provider's resident/pinned chunk
 *    counts on entry and exit.
 *  - The **load order** of chunk misses, so "sequential", "strided",
 *    "random" and "repeated-sequential" can be told apart: forward/backward
 *    step histogram and monotone run lengths over the miss sequence.
 *
 * Usage:
 *   node --expose-gc --max-old-space-size=8192 scripts/agg_pager_trace.mjs \
 *     [--batch 64] [--max-waves N] [--chunk BYTES] [--cap CHUNKS] \
 *     [--structure-only] [--json out.json] <model.ifc>
 *
 * `--structure-only` stops after the open and reports just the aggregate
 * shape (relationship count, related-product counts, address spans). That is
 * the cheap probe: it answers "why does PSB not show this" without paying for
 * a geometry pass.
 *
 * `--max-waves N` stops the drain after N pager waves. Use it to sample a
 * long load; every rate in the report is per-wave so a sample extrapolates.
 *
 * One assumption worth knowing: per-wave attribution uses a single module
 * global set around the awaited `ensureForStep`, so it is only correct while
 * the aggregate drain is the one thing paging. The demand pump guarantees
 * that — it exhausts the product worklist before it touches a relationship —
 * but a caller that interleaved the two would mis-attribute. Per-PHASE
 * attribution has no such assumption; it is a tag read at request time.
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
const maxWaves = Number( flagValue( '--max-waves', '0' ) )
const structureOnly = argv.includes( '--structure-only' )
const jsonOut = flagValue( '--json', void 0 )
const chunkOverride = Number( flagValue( '--chunk', '0' ) )
const capOverride = Number( flagValue( '--cap', '0' ) )
const valueFlags =
  new Set( [ '--batch', '--max-waves', '--json', '--chunk', '--cap' ] )
const filePath =
  argv.find( ( a, i ) => !a.startsWith( '--' ) && !valueFlags.has( argv[ i - 1 ] ) )

if ( filePath === void 0 ) {
  console.error(
      'usage: agg_pager_trace.mjs [--batch N] [--max-waves N] ' +
      '[--chunk BYTES] [--cap CHUNKS] [--structure-only] ' +
      '[--json out.json] <model.ifc>' )
  process.exit( 2 )
}

const { IfcAPI, LogLevel } =
  await import( '../compiled/src/compat/web-ifc/ifc_api.js' )
const { IfcApiProxyIfc } =
  await import( '../compiled/src/compat/web-ifc/ifc_api_proxy_ifc.js' )
const { IfcGeometryExtraction } =
  await import( '../compiled/src/ifc/ifc_geometry_extraction.js' )
const { WindowedStepBufferProvider } =
  await import( '../compiled/src/step/step_buffer_provider.js' )
const { IfcProduct } =
  await import( '../compiled/src/ifc/ifc4_gen/index.js' )

/* ------------------------------------------------------------------ */
/* Phase tagging                                                       */
/* ------------------------------------------------------------------ */

/** Current attribution bucket for anything the store is asked to read. */
let phase = 'boot'

/** Per-phase counters, keyed by phase name. */
const phases = Object.create( null )

/**
 * Counter block for one phase, created on first use.
 *
 * @param {string} name Phase name.
 * @return {object} The counters.
 */
function phaseOf( name ) {
  return phases[ name ] ??= {
    requests: 0, hits: 0, loads: 0, inflight: 0, storeReads: 0, storeBytes: 0,
    ms: 0,
  }
}

/**
 * Run a function with the phase tag set, restoring it afterwards.
 *
 * @param {string} name Phase to attribute to.
 * @param {Function} body The call.
 * @return {*} Whatever `body` returns.
 */
function inPhase( name, body ) {
  const previous = phase
  const t0 = performance.now()

  phase = name

  try {
    return body()
  } finally {
    phaseOf( name ).ms += performance.now() - t0
    phase = previous
  }
}

/**
 * Async twin of {@link inPhase}.
 *
 * @param {string} name Phase to attribute to.
 * @param {Function} body The call.
 * @return {Promise<*>} Whatever `body` resolves to.
 */
async function inPhaseAsync( name, body ) {
  const previous = phase
  const t0 = performance.now()

  phase = name

  try {
    return await body()
  } finally {
    phaseOf( name ).ms += performance.now() - t0
    phase = previous
  }
}

/* ------------------------------------------------------------------ */
/* Store, with per-read accounting                                     */
/* ------------------------------------------------------------------ */

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

    const counters = phaseOf( phase )

    counters.storeReads++
    counters.storeBytes += got

    return new Uint8Array( buf.buffer, buf.byteOffset, got )
  }

  /** Close the descriptor. */
  close() {
    fs.closeSync( this.fd )
  }
}

/* ------------------------------------------------------------------ */
/* Provider instrumentation: every window request, hit or miss         */
/* ------------------------------------------------------------------ */

/** Loads per chunk index, over the whole run. */
const chunkLoads = new Map()

/** Requests per chunk index, over the whole run. */
const chunkRequests = new Map()

/** Chunk indices in load order, for access-pattern shape. */
const missOrder = []

/** Per-wave scratch, set by the ensureForStep wrapper. */
let wave

const providerProto = WindowedStepBufferProvider.prototype

// `OpenModelStream` constructs the provider itself, with the shipped
// defaults, and an ESM namespace binding cannot be replaced from outside — so
// window geometry is overridden by shadowing the two fields with prototype
// accessors that ignore what the constructor assigns. Sensitivity sweeps
// (does the amplification move with the window?) need this; a default run
// leaves the shipped 4 MiB x 16 in place.
if ( chunkOverride > 0 ) {
  Object.defineProperty( providerProto, 'chunkBytes_', {
    get() { return chunkOverride },
    set() { /* discard the constructor's value */ },
    configurable: true,
  } )
}

if ( capOverride > 0 ) {
  Object.defineProperty( providerProto, 'maxResidentChunks_', {
    get() { return capOverride },
    set() { /* discard the constructor's value */ },
    configurable: true,
  } )
}

const rawEnsureResident = providerProto.ensureResident

providerProto.ensureResident = async function( address, length ) {

  const chunkBytes = this.chunkBytes_
  const firstChunk = Math.floor( address / chunkBytes )
  const lastChunk =
    Math.floor( ( address + Math.max( length, 1 ) - 1 ) / chunkBytes )
  const counters = phaseOf( phase )

  for ( let chunkIndex = firstChunk; chunkIndex <= lastChunk; ++chunkIndex ) {

    const hit = this.chunks_.has( chunkIndex )

    // Three outcomes, not two. A request that finds the chunk absent but
    // already in `loading_` is de-duplicated by the provider and issues no
    // store read: counting it as a load overstates amplification by the
    // fan-out of the closure walk's `Promise.all` (measured 9,237 absent
    // requests against 47 real reads in one D3D worklist pass). `load` is
    // the outcome that costs bytes.
    const load = !hit && !this.loading_.has( chunkIndex )

    ++counters.requests
    chunkRequests.set( chunkIndex, ( chunkRequests.get( chunkIndex ) ?? 0 ) + 1 )

    if ( hit ) {
      ++counters.hits
    } else if ( load ) {
      ++counters.loads
      chunkLoads.set( chunkIndex, ( chunkLoads.get( chunkIndex ) ?? 0 ) + 1 )
      missOrder.push( chunkIndex )
    } else {
      ++counters.inflight
    }

    if ( wave !== void 0 ) {
      wave.chunks.add( chunkIndex )
      ++wave.requests
      if ( hit ) {
        ++wave.hits
      } else if ( load ) {
        ++wave.loads
      } else {
        ++wave.inflight
      }
    }
  }

  if ( wave !== void 0 ) {
    ++wave.ensures
    wave.minAddress = Math.min( wave.minAddress, address )
    wave.maxAddress = Math.max( wave.maxAddress, address + length )
  }

  return await rawEnsureResident.call( this, address, length )
}

/**
 * Chunks the provider currently holds pinned against eviction.
 *
 * @param {object} provider The windowed provider.
 * @return {number} Pinned chunk count.
 */
function pinnedChunks( provider ) {
  return provider?.ensurePins_?.size ?? 0
}

/* ------------------------------------------------------------------ */
/* Extraction instrumentation                                          */
/* ------------------------------------------------------------------ */

const extractionProto = IfcGeometryExtraction.prototype

/** The live extraction, captured from the first prototype call. */
let extraction

const rawPrepPaging = extractionProto.ensureResidentForDemandPrep

extractionProto.ensureResidentForDemandPrep = async function( ...args ) {
  extraction = this

  return await inPhaseAsync( 'prep', () => rawPrepPaging.apply( this, args ) )
}

const rawProductExtract = extractionProto.ensureResidentForProductExtract

extractionProto.ensureResidentForProductExtract = async function( ...args ) {

  const before = wave !== void 0 ? wave.requests : 0
  const result = await rawProductExtract.apply( this, args )

  if ( wave !== void 0 ) {
    wave.closureRequests += wave.requests - before
    ++wave.products
  }

  return result
}

const proxyProto = IfcApiProxyIfc.prototype
const rawWorklists = proxyProto.ensureDemandWorklistsAsync_

proxyProto.ensureDemandWorklistsAsync_ = async function( ...args ) {
  return await inPhaseAsync( 'worklist', () => rawWorklists.apply( this, args ) )
}

const rawSceneWalk = proxyProto.streamNewMeshes_

proxyProto.streamNewMeshes_ = function( ...args ) {
  return inPhase( 'sceneWalk', () => rawSceneWalk.apply( this, args ) )
}

/** Per-wave records, one per `ensureForStep` that rolled the window. */
const waves = []

/** Per-relationship records. */
const relationships = []

/** True once the pump has moved off products onto rel-aggregates. */
let inAggregatePass = false

const rawBeginAggregate = extractionProto.beginAggregateExtract

extractionProto.beginAggregateExtract = async function( relAggregate, waveSize ) {

  inAggregatePass = true
  extraction = this

  const relRecord = {
    index: relationships.length,
    expressID: relAggregate.expressID,
    localID: relAggregate.localID,
    waveSize,
    products: 0,
    baseRequests: 0,
    baseLoads: 0,
    waves: 0,
    loads: 0,
    requests: 0,
    cheapSteps: 0,
  }

  relationships.push( relRecord )

  const baseWave = {
    kind: 'base',
    rel: relRecord.index,
    from: -1,
    to: -1,
    products: 0,
    ensures: 0,
    requests: 0,
    hits: 0,
    loads: 0,
    inflight: 0,
    closureRequests: 0,
    chunks: new Set(),
    minAddress: Number.POSITIVE_INFINITY,
    maxAddress: 0,
  }

  wave = baseWave

  const pager = await inPhaseAsync(
      'agg.begin', () => rawBeginAggregate.call( this, relAggregate, waveSize ) )

  wave = void 0

  relRecord.baseRequests = baseWave.requests
  relRecord.baseLoads = baseWave.loads
  relRecord.baseChunks = baseWave.chunks.size
  relRecord.products = pager?.products_?.length ?? 0

  if ( pager === void 0 || typeof pager.ensureForStep !== 'function' ) {
    return pager
  }

  const provider = this.model?.bufferProvider_
  const rawEnsureForStep = pager.ensureForStep.bind( pager )

  pager.ensureForStep = async ( step ) => {

    // Mirror the shipped method's two early returns as well as its roll
    // test, or the roll count is inflated by the no-op step every
    // relationship ends on: the pump calls `ensureForStep` once more than
    // there are targets, to find out that the stepper is done. Counting
    // that as a roll double-counted a one-target relationship's waves.
    const products = pager.products_
    const rolls =
      products !== void 0 && step < products.length && step >= pager.pagedThrough_

    if ( !rolls ) {
      // Counted so the roll rate is a measurement rather than an inference.
      ++relRecord.cheapSteps
      return await rawEnsureForStep( step )
    }

    const record = {
      kind: 'wave',
      rel: relRecord.index,
      from: step,
      to: Math.min( relRecord.products, step + waveSize ),
      products: 0,
      ensures: 0,
      requests: 0,
      hits: 0,
      loads: 0,
      inflight: 0,
      closureRequests: 0,
      chunks: new Set(),
      minAddress: Number.POSITIVE_INFINITY,
      maxAddress: 0,
      residentIn: provider?.residentChunkCount ?? 0,
      pinnedIn: pinnedChunks( provider ),
      ms: 0,
    }

    wave = record

    const t0 = performance.now()

    try {
      return await inPhaseAsync( 'agg.ensureForStep', () => rawEnsureForStep( step ) )
    } finally {
      record.ms = performance.now() - t0
      record.residentOut = provider?.residentChunkCount ?? 0
      record.pinnedOut = pinnedChunks( provider )
      record.chunkCount = record.chunks.size
      record.chunkList = [ ...record.chunks ].sort( ( a, b ) => a - b )
      delete record.chunks
      wave = void 0

      relRecord.waves++
      relRecord.requests += record.requests
      relRecord.loads += record.loads
      waves.push( record )
    }
  }

  return pager
}

const rawStepper = extractionProto.extractRelAggregateGeometryIncremental

extractionProto.extractRelAggregateGeometryIncremental = function( ...args ) {

  const stepper = rawStepper.apply( this, args )
  const next = stepper.next.bind( stepper )

  stepper.next = ( ...nextArgs ) => inPhase( 'agg.step', () => next( ...nextArgs ) )

  return stepper
}

/* ------------------------------------------------------------------ */
/* Run                                                                 */
/* ------------------------------------------------------------------ */

const fileSize = fs.statSync( filePath ).size
const tProcess = performance.now()
const api = new IfcAPI()

await inPhaseAsync( 'wasmInit', () => api.Init() )

api.SetLogLevel( LogLevel.LOG_LEVEL_ERROR )

const store = new CountingFileStore( filePath )

phase = 'parse'

const tOpen = performance.now()
const modelID = await api.OpenModelStream( store, {
  COORDINATE_TO_ORIGIN: true,
  USE_FAST_BOOLS: true,
  DEFER_GEOMETRY: true,
} )
const openWall = performance.now() - tOpen

phase = 'other'

if ( modelID < 0 ) {
  console.error( 'open failed' )
  process.exit( 1 )
}

const model = extraction?.model
const provider = model?.bufferProvider_
const chunkBytes = provider?.chunkBytes_ ?? 0
const maxResidentChunks = provider?.maxResidentChunks_ ?? 0

/**
 * The aggregate shape of a model: how many IfcRelAggregates, how many
 * related products each owns, and how far apart in the file those products
 * sit. This is the PSB-vs-D3D discriminator, and it costs one open.
 *
 * @return {object} Structure summary.
 */
async function aggregateStructure() {

  const passthrough = api.getPassthrough( modelID )
  const aggregates = passthrough?.demandAggregates_ ?? []
  const rows = []

  let totalProducts = 0

  for ( const relAggregate of aggregates ) {

    // The relationship's own record has to be resident to be read: demand
    // prep pins these, then unpins after prepareDemandExtraction, so by the
    // time anything asks again the chunk is long gone.
    await model.ensureResidentByLocalID( relAggregate.localID )

    const products = extraction.relatedAggregateProductLocalIDs( relAggregate )

    if ( products === void 0 ) {
      rows.push( { expressID: relAggregate.expressID, products: -1 } )
      continue
    }

    let minAddress = Number.POSITIVE_INFINITY
    let maxAddress = 0

    for ( const localID of products ) {
      const address = model.address_[ localID ]

      minAddress = Math.min( minAddress, address )
      maxAddress = Math.max( maxAddress, address + model.length_[ localID ] )
    }

    totalProducts += products.length
    rows.push( {
      expressID: relAggregate.expressID,
      products: products.length,
      minAddress: products.length > 0 ? minAddress : 0,
      maxAddress,
      spanMb: products.length > 0 ? ( maxAddress - minAddress ) / BYTES_PER_MB : 0,
    } )
  }

  // The deferred pump partitions the model: a product is either on the
  // per-product worklist or an aggregate target, never both. Reported so
  // #539's failure mode (an incomplete target set, cached for the model's
  // life, leaving a child on BOTH lists) is a check rather than an
  // assumption on any traced run.
  const targets = extraction.aggregateTargetLocalIDs()

  return {
    count: aggregates.length,
    totalProducts,
    targetSetSize: targets.size,
    demandProducts: passthrough?.demandProducts_?.length ?? -1,
    productCount: model.typeCount( IfcProduct ),
    rows,
  }
}

let structure

if ( structureOnly ) {

  // The worklists are what populate demandAggregates_; the drain would do it,
  // but structure-only never drains.
  await api.ExtractGeometryBatchAsync( modelID, 1, () => { /* no meshes */ } )
  structure = await aggregateStructure()
} else {

  let batches = 0
  let meshes = 0

  for ( ;; ) {

    const { extracted, remaining } =
      await api.ExtractGeometryBatchAsync( modelID, batchSize, () => { ++meshes } )

    ++batches

    if ( remaining === 0 && extracted === 0 ) {
      break
    }

    if ( maxWaves > 0 && waves.length >= maxWaves ) {
      break
    }
  }

  structure = await aggregateStructure()
  structure.batches = batches
  structure.meshes = meshes
}

const totalWall = performance.now() - tProcess

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

/**
 * Sum a numeric field over an array of records.
 *
 * @param {Array<object>} rows The records.
 * @param {string} field Field name.
 * @return {number} The sum.
 */
function sum( rows, field ) {
  let total = 0

  for ( const row of rows ) {
    total += row[ field ] ?? 0
  }

  return total
}

/**
 * Percentile of a numeric array (nearest-rank, array is sorted in place).
 *
 * @param {number[]} values The values.
 * @param {number} fraction 0..1.
 * @return {number} The percentile.
 */
function percentile( values, fraction ) {

  if ( values.length === 0 ) {
    return 0
  }

  values.sort( ( a, b ) => a - b )

  return values[ Math.min( values.length - 1,
      Math.floor( fraction * values.length ) ) ]
}

const totalChunks = Math.ceil( fileSize / Math.max( chunkBytes, 1 ) )
const loadCounts = [ ...chunkLoads.values() ]
const loadedChunks = loadCounts.length
const totalLoads = loadCounts.reduce( ( a, b ) => a + b, 0 )

let forward = 0
let backward = 0
let adjacentForward = 0
let repeats = 0
const jumpSizes = []

for ( let i = 1; i < missOrder.length; ++i ) {

  const delta = missOrder[ i ] - missOrder[ i - 1 ]

  if ( delta > 0 ) {
    ++forward
    if ( delta === 1 ) {
      ++adjacentForward
    }
  } else if ( delta < 0 ) {
    ++backward
  } else {
    ++repeats
  }

  jumpSizes.push( Math.abs( delta ) )
}

console.log( `\n=== #616 pager window trace — ${filePath}` )
console.log( `file ${( fileSize / BYTES_PER_MB ).toFixed( 1 )} MB, ` +
  `chunk ${( chunkBytes / 1024 ).toFixed( 0 )} KiB, ` +
  `cap ${maxResidentChunks} chunks ` +
  `(${( maxResidentChunks * chunkBytes / BYTES_PER_MB ).toFixed( 1 )} MB window), ` +
  `${totalChunks} chunks in file` )
console.log( `open ${( openWall / 1000 ).toFixed( 1 )} s, ` +
  `total ${( totalWall / 1000 ).toFixed( 1 )} s, ` +
  `batch ${batchSize}` )

console.log( `\nstore: ${store.reads} reads, ` +
  `${( store.bytes / BYTES_PER_MB ).toFixed( 1 )} MB ` +
  `(${( store.bytes / fileSize ).toFixed( 1 )}x file), ` +
  `${( store.ms / 1000 ).toFixed( 1 )} s in read()` )

console.log( '\nphase                bytes(MB)   reads   requests    hits    loads inflight     ms' )

for ( const [ name, counters ] of Object.entries( phases ) ) {
  console.log(
      `${name.padEnd( 20 )} ${( counters.storeBytes / BYTES_PER_MB ).toFixed( 1 ).padStart( 9 )} ` +
      `${String( counters.storeReads ).padStart( 7 )} ` +
      `${String( counters.requests ).padStart( 10 )} ` +
      `${String( counters.hits ).padStart( 7 )} ` +
      `${String( counters.loads ).padStart( 8 )} ` +
      `${String( counters.inflight ).padStart( 8 )} ` +
      `${counters.ms.toFixed( 0 ).padStart( 6 )}` )
}

console.log( `\nprovider chunk loads ${totalLoads} x ` +
  `${( chunkBytes / BYTES_PER_MB ).toFixed( 0 )} MiB = ` +
  `${( totalLoads * chunkBytes / BYTES_PER_MB ).toFixed( 0 )} MB; ` +
  `store reports ${( store.bytes / BYTES_PER_MB ).toFixed( 0 )} MB over ` +
  `${store.reads} reads (the difference is the parse's own ` +
  `StoreByteSource slide, which does not go through the provider)` )
console.log( `chunk histogram: ${loadedChunks}/${totalChunks} distinct chunks loaded, ` +
  `${totalLoads} loads, mean ${( totalLoads / Math.max( loadedChunks, 1 ) ).toFixed( 1 )} ` +
  `loads/chunk, max ${Math.max( 0, ...loadCounts )}` )

console.log( `load order: ${forward} forward (${adjacentForward} adjacent), ` +
  `${backward} backward, ${repeats} same-chunk-twice; ` +
  `median |jump| ${percentile( jumpSizes.slice(), 0.5 )}, ` +
  `p90 ${percentile( jumpSizes.slice(), 0.9 )}` )

console.log( `\nproducts in model: ${structure.productCount}` )
console.log( `worklist partition: ${structure.demandProducts} per-product + ` +
  `${structure.targetSetSize} aggregate targets = ` +
  `${structure.demandProducts + structure.targetSetSize} ` +
  `(equal to the product count means no product is on both lists — #539)` )
console.log( `aggregates: ${structure.count} IfcRelAggregates, ` +
  `${structure.totalProducts} related products ` +
  `(${( structure.totalProducts / Math.max( structure.productCount, 1 ) )
    .toFixed( 2 )}x the product count)` )

const productCounts = structure.rows.map( ( row ) => row.products )
const spans = structure.rows.map( ( row ) => row.spanMb ?? 0 )

console.log( `  products/rel: max ${Math.max( 0, ...productCounts )}, ` +
  `median ${percentile( productCounts.slice(), 0.5 )}; ` +
  `address span/rel (MB): max ${Math.max( 0, ...spans ).toFixed( 1 )}, ` +
  `median ${percentile( spans.slice(), 0.5 ).toFixed( 1 )}` )

if ( waves.length > 0 ) {

  const waveLoads = waves.map( ( row ) => row.loads )
  const waveChunks = waves.map( ( row ) => row.chunkCount )
  const waveRequests = waves.map( ( row ) => row.requests )

  console.log( `\nwaves: ${waves.length} rolls over ` +
    `${relationships.length} relationships, ` +
    `${sum( relationships, 'cheapSteps' )} steps served from the resident wave` )
  console.log( `  per wave: requests ${( sum( waves, 'requests' ) / waves.length ).toFixed( 0 )}, ` +
    `loads ${( sum( waves, 'loads' ) / waves.length ).toFixed( 1 )}, ` +
    `distinct chunks ${( sum( waves, 'chunkCount' ) / waves.length ).toFixed( 1 )}, ` +
    `products ${( sum( waves, 'products' ) / waves.length ).toFixed( 1 )}, ` +
    `closure records/product ` +
    `${( sum( waves, 'closureRequests' ) / Math.max( sum( waves, 'products' ), 1 ) ).toFixed( 1 )}` )
  console.log( `  load/request ratio ${( sum( waves, 'loads' ) /
    Math.max( sum( waves, 'requests' ), 1 ) ).toFixed( 3 )}` )
  console.log( `  loads/wave: median ${percentile( waveLoads.slice(), 0.5 )}, ` +
    `p90 ${percentile( waveLoads.slice(), 0.9 )}, ` +
    `max ${Math.max( 0, ...waveLoads )}` )
  console.log( `  chunks/wave: median ${percentile( waveChunks.slice(), 0.5 )}, ` +
    `p90 ${percentile( waveChunks.slice(), 0.9 )}, ` +
    `max ${Math.max( 0, ...waveChunks )}` )
  console.log( `  requests/wave: median ${percentile( waveRequests.slice(), 0.5 )}, ` +
    `max ${Math.max( 0, ...waveRequests )}` )
  console.log( `  resident chunks on wave entry: median ` +
    `${percentile( waves.map( ( r ) => r.residentIn ), 0.5 )}, ` +
    `pinned on entry: median ` +
    `${percentile( waves.map( ( r ) => r.pinnedIn ), 0.5 )}` )

  console.log( '\nfirst 12 waves:' )
  console.log( '  rel  from    to  prods  ensures  reqs  load  chunks  resIn  ms' )

  for ( const row of waves.slice( 0, 12 ) ) {
    console.log(
        `  ${String( row.rel ).padStart( 3 )} ${String( row.from ).padStart( 5 )} ` +
        `${String( row.to ).padStart( 5 )} ${String( row.products ).padStart( 6 )} ` +
        `${String( row.ensures ).padStart( 8 )} ${String( row.requests ).padStart( 5 )} ` +
        `${String( row.loads ).padStart( 5 )} ${String( row.chunkCount ).padStart( 7 )} ` +
        `${String( row.residentIn ).padStart( 6 )} ${row.ms.toFixed( 0 ).padStart( 6 )}` )
  }
}

if ( jsonOut !== void 0 ) {
  fs.writeFileSync( jsonOut, JSON.stringify( {
    file: filePath,
    fileSize,
    chunkBytes,
    maxResidentChunks,
    batchSize,
    openMs: openWall,
    totalMs: totalWall,
    store: { reads: store.reads, bytes: store.bytes, ms: store.ms },
    phases,
    chunkLoads: [ ...chunkLoads.entries() ],
    chunkRequests: [ ...chunkRequests.entries() ],
    missOrder: missOrder.slice( 0, 200000 ),
    structure,
    relationships,
    waves: waves.slice( 0, 5000 ),
  }, void 0, 1 ) )
  console.log( `\njson: ${jsonOut}` )
}

store.close()
