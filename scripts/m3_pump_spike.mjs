/**
 * M3 pump spike (issue #394): what does the durable demand pump cost, and
 * does per-batch copy-out + native release actually bound the wasm heap?
 *
 * M3 as re-scoped (2026-08-16 triage on #390) is no longer "conway-geom
 * needs a per-product free into the general heap" — eviction into mimalloc
 * freelists measured ~0 RSS back. It is: **the durable pump must not leave
 * the tab holding the whole model's geometry**. Today it extracts every
 * product into `model.geometry` and keeps it there for the session, so the
 * wasm heap's high-water mark is O(model) and permanent. The preview
 * channels already copy each payload out of the wasm heap at emission; the
 * durable pump does not.
 *
 * Phases (child process per phase — wasm heaps and JIT state never bleed
 * across measurements):
 *
 *   classic  : OpenModel + StreamAllMeshes. Today's whole-model extraction,
 *              the baseline every other row is measured against.
 *   pump     : OpenModelStreamed + DEFER_GEOMETRY, drained through
 *              ExtractGeometryBatch. Same work, batched — isolates what the
 *              batching itself costs before any memory discipline.
 *   copyout  : pump + copy each new geometry's vertex/index payload out of
 *              the wasm heap per batch (what a consumer building its own
 *              scene does). Isolates the copy from the release.
 *   bounded  : copyout + release this batch's natives once copied. This is
 *              the M3 discipline, in its most aggressive form (release
 *              everything, retain nothing).
 *
 * Every phase copies out the same payloads (`classic`/`copyout`/`bounded`)
 * or none (`pump`), and hashes them into a digest so the M3 exit criterion
 * (M3 changes when work happens, not what it produces) is checked rather
 * than assumed. `bounded` releasing everything is expected to LOSE instances
 * whose geometry is shared with a later product (the scene walk skips a
 * released geometry); the digest and instance counts are what size that
 * loss, and therefore what sizes the retention/refcount rule the production
 * pump needs (SharedAssetPool, per the design doc).
 *
 * The headline number is `wasmPeakMB`: the high-water mark of the wasm
 * linear memory, read through `wasmHeapByteLength` (the module's cached
 * HEAPU8 view can be a growth step behind the real heap — #485), sampled
 * after every batch.
 *
 * Usage:
 *   node scripts/m3_pump_spike.mjs --models <file with one path per line>
 *                                  [--batch 64] [--repeats 1] [--json out]
 *   node scripts/m3_pump_spike.mjs --child <phase> <path> <batch>  # internal
 */
import { execFile, execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import { performance } from 'node:perf_hooks'

const PHASES = [ 'classic', 'pump', 'copyout', 'bounded' ]

/**
 * Phases that never pass a meshCallback, so `streamNewMeshes_` — the
 * full-scene re-walk the pump does per batch — never runs. Differencing one
 * of these against `pump` prices the walk separately from the extraction,
 * which is what says whether the parallel ceiling is in the work or in the
 * bookkeeping around it.
 */
const EXTRACT_ONLY_PHASES = new Set( [ 'extractonly' ] )

const DEFAULT_BATCH = 64
const BYTES_PER_MB = 1024 * 1024

const REPO_ROOT = path.dirname( path.dirname( new URL( import.meta.url ).pathname ) )

/** Node heap ceiling for the children — PSB-class models need the headroom. */
const CHILD_MAX_OLD_SPACE_MB = 12288

/**
 * A digest of the geometry a phase delivers: each instance and each payload
 * is hashed on its own, and the per-item hashes are combined **commutatively**
 * (summed mod 2^32). Order-independent by construction, because emission
 * order is exactly what M3 is allowed to change — the classic walk emits in
 * scene order, the pump in batch order, and the delta contract already tells
 * consumers to accumulate additively. An order-sensitive rolling hash reports
 * that reordering as a content change (it did, on `Right_Hand.step`, where a
 * sorted dump of both paths is byte-identical).
 *
 * What still diverges: a dropped, duplicated, differently-placed or
 * differently-tessellated instance — which is the invariant worth holding.
 */
class Digest {

  constructor() {
    this.placedHash = 0
    this.payloadHash = 0
    this.instances = 0
    this.payloads = 0
    this.payloadBytes = 0
  }

  /**
   * Hash one placed instance into the order-independent accumulator.
   *
   * @param expressID The product's express ID.
   * @param geometryExpressID The geometry's express ID.
   * @param transform The 16-element placement.
   */
  placed( expressID, geometryExpressID, transform ) {

    ++this.instances

    let hash = 2166136261

    hash = mix32( hash, expressID )
    hash = mix32( hash, geometryExpressID )

    for ( const component of transform ) {
      hash = mix32( hash, quantise( component ) )
    }

    this.placedHash = ( this.placedHash + hash ) >>> 0
  }

  /**
   * Hash one geometry payload (once per geometry, as it is emitted).
   *
   * @param geometryExpressID The geometry's express ID.
   * @param vertices Interleaved position+normal floats.
   * @param indices Triangle indices.
   */
  payload( geometryExpressID, vertices, indices ) {

    ++this.payloads
    this.payloadBytes += vertices.byteLength + indices.byteLength

    let hash = 2166136261

    hash = mix32( hash, geometryExpressID )
    hash = mix32( hash, vertices.length )
    hash = mix32( hash, indices.length )

    // Sample rather than hash every float: a full hash of PSB's ~2 GB of
    // vertex data would dominate the measurement it is there to validate.
    // Stride 97 (prime, > any vertex stride) so the sample can't alias to
    // one component of the interleaved layout.
    for ( let i = 0; i < vertices.length; i += 97 ) {
      hash = mix32( hash, quantise( vertices[ i ] ) )
    }

    for ( let i = 0; i < indices.length; i += 97 ) {
      hash = mix32( hash, indices[ i ] )
    }

    this.payloadHash = ( this.payloadHash + hash ) >>> 0
  }
}

/**
 * One FNV-1a step.
 *
 * @param hash The running hash.
 * @param value A 32-bit value.
 * @return {number} The updated hash.
 */
function mix32( hash, value ) {
  return Math.imul( hash ^ ( value | 0 ), 16777619 ) >>> 0
}

/**
 * Quantise a float so an f32/f64 round-trip (native dmat4 vs copied floats)
 * doesn't read as divergence.
 *
 * @param value The float.
 * @return {number} An integer.
 */
function quantise( value ) {
  return Math.round( value * 1024 )
}

/**
 * Retained JS working set, after a collect so transient garbage isn't counted.
 *
 * @return {number} Megabytes.
 */
function retainedMB() {
  globalThis.gc?.()
  const usage = process.memoryUsage()
  return ( usage.heapUsed + usage.arrayBuffers ) / BYTES_PER_MB
}

/**
 * Copy every geometry a batch's meshes newly reference out of the wasm heap,
 * exactly as a consumer building its own scene does, and record which
 * geometries were touched so the caller can release them.
 *
 * @param api The IfcAPI instance.
 * @param modelID The open model.
 * @param meshes FlatMesh deltas from this batch.
 * @param seen Geometry express IDs already copied (shared/mapped geometry is
 * copied once, like the preview channel's emittedGeometry_).
 * @param digest Digest to feed.
 * @param retained Array the copied payloads are appended to, so they stay
 * reachable for the life of the measurement — a consumer building a navigable
 * scene keeps its vertex and index buffers, so dropping them here would report
 * a JS working set no real consumer has.
 * @return {number[]} Geometry express IDs copied by this call.
 */
function copyBatchPayloads( api, modelID, meshes, seen, digest, retained ) {

  const copied = []

  for ( const mesh of meshes ) {

    const placedVector = mesh.geometries

    for ( let i = 0; i < placedVector.size(); ++i ) {

      const placed = placedVector.get( i )

      digest.placed( mesh.expressID, placed.geometryExpressID, placed.flatTransformation )

      if ( seen.has( placed.geometryExpressID ) ) {
        continue
      }

      seen.add( placed.geometryExpressID )

      // No .slice() here: `GetVertexArray`/`GetIndexArray` already return
      // owning copies (`getSubArray` ends with `slice(0)`), so copying again
      // would double every payload and leave the first generation as garbage —
      // inflating copy time and GC pressure in exactly the measurement those
      // columns exist to report. Retain what the API returns, which is what a
      // consumer does.
      const geometry = api.GetGeometry( modelID, placed.geometryExpressID )
      const vertices = api.GetVertexArray(
          geometry.GetVertexData(), geometry.GetVertexDataSize() )
      const indices = api.GetIndexArray(
          geometry.GetIndexData(), geometry.GetIndexDataSize() )

      digest.payload( placed.geometryExpressID, vertices, indices )
      retained.push( vertices, indices )
      copied.push( placed.geometryExpressID )

      // `GetGeometry` hands back `geometryObject.clone()` — an OWNING native
      // copy, not a view (`IfcApiProxyIfc.getGeometry` → C++ `Geometry::Clone`,
      // which copies the vectors). Embind will not free it until finalization,
      // which is nondeterministic, so a harness that forgets this accumulates
      // one clone per geometry inside the very wasm heap it is measuring.
      // Delete it the moment its bytes are in JS.
      geometry.delete()
    }
  }

  return copied
}

/**
 * The wasm heap's current byte length — the number M3's memory gate is
 * written against.
 *
 * @param api The IfcAPI instance.
 * @param wasmHeapByteLength The imported accessor.
 * @return {number} Megabytes.
 */
function wasmMB( api, wasmHeapByteLength ) {
  return api.wasmModule !== void 0 ?
    wasmHeapByteLength( api.wasmModule ) / BYTES_PER_MB : 0
}

/**
 * Release the natives behind a set of geometry express IDs, dropping them
 * from the GetGeometry map too so a later lookup degrades to the dummy
 * instead of touching freed memory.
 *
 * @param api The IfcAPI instance.
 * @param modelID The open model.
 * @param geometryExpressIDs Geometry express IDs to free.
 * @return {number} How many were actually freed.
 */
function releaseGeometries( api, modelID, geometryExpressIDs ) {

  const passthrough = api.getPassthrough( modelID )
  const model = passthrough?.model?.[ 0 ]
  const geometryMap = passthrough?.model?.[ 3 ]

  if ( model === void 0 ) {
    return 0
  }

  let freed = 0

  for ( const expressID of geometryExpressIDs ) {

    const localID = model.getElementByExpressID?.( expressID )?.localID

    if ( localID === void 0 ) {
      continue
    }

    try {
      model.geometry.delete( localID )
      geometryMap?.delete( expressID )
      ++freed
    } catch {
      // Never let a free break the measurement — a phase that cannot free
      // is a finding, not a crash.
    }
  }

  return freed
}

/**
 * Cut the pump's worklists down to one shard, round-robin by position.
 *
 * This is the across-product parallelism axis the design doc specifies
 * ("products are naturally independent at tessellation time") — the one a
 * pool of workers, each holding its OWN wasm instance, would exploit. It is
 * NOT the axis the MT build parallelises: pthreads inside one instance split
 * the work *within* a product's tessellation while a single JS driver feeds
 * them serially. Each process here is one such worker, minus the postMessage
 * plumbing: own instance, own heap, own driver.
 *
 * Round-robin rather than contiguous ranges, because product cost varies by
 * orders of magnitude and file order is spatially clustered — contiguous
 * shards would measure the imbalance rather than the scaling.
 *
 * Reaches into the passthrough's worklist fields deliberately: the shard is a
 * measurement fixture, not a proposed API. What ships is a queue that hands
 * out product IDs, which is `DemandGeometryQueue`'s job.
 *
 * @param api The IfcAPI instance.
 * @param modelID The open model.
 * @param shard `{index, count}`.
 * @param filePath The model being run, checked against the assignment's own.
 * @return {object|undefined} What this shard owns.
 */
function shardWorklists( api, modelID, shard, filePath ) {

  const passthrough = api.getPassthrough( modelID )

  if ( passthrough?.ensureDemandWorklists_ === void 0 ) {
    return void 0
  }

  passthrough.ensureDemandWorklists_()

  const products = passthrough.demandProducts_ ?? []
  const aggregates = passthrough.demandAggregates_ ?? []

  // An explicit assignment (from m3_affinity_spike's --emit) overrides the
  // positional rules: this is how a SIMULATED partition gets checked against
  // the real extractor instead of being believed. Aggregates stay positional
  // because the captured graph does not cover the rel-aggregates pass — which
  // is itself one of the open questions about where the duplication lives.
  if ( process.env.M3_ASSIGNMENT !== void 0 ) {

    const assignment =
      JSON.parse( fs.readFileSync( process.env.M3_ASSIGNMENT, 'utf8' ) )

    // Local IDs are model-relative, so an assignment from another model
    // filters to an arbitrary overlapping subset and drops the rest — which
    // still runs, and still prints a speedup. Refuse instead: a wrong number
    // is worse than no number.
    if ( assignment.model !== void 0 && assignment.model !== filePath ) {
      throw new Error(
          `assignment was captured from ${assignment.model}, running ${filePath}` )
    }

    // An assignment is cut for ONE shard count. The sweep always runs an N=1
    // baseline (see the count normalisation in main), and handing that child
    // `shards[0]` would give it a quarter of the products while the sweep
    // treated it as the whole model — every ratio computed against it would be
    // silently wrong. The baseline runs the full unassigned worklist; any
    // other mismatch is a caller error rather than something to paper over.
    if ( shard.count === 1 ) {

      return {
        products: products.length,
        ofProducts: products.length,
        aggregates: aggregates.length,
        strategy: `${assignment.strategy} (baseline: full worklist)`,
      }
    }

    if ( assignment.shards.length !== shard.count ) {
      throw new Error(
          `assignment is cut for ${assignment.shards.length} shards, ` +
          `sweep is running ${shard.count}` )
    }

    // Every product exactly once across shards, or the sweep is measuring a
    // partition of something other than this model's worklist.
    const assigned = assignment.shards.flat()
    const unique = new Set( assigned )

    if ( assigned.length !== unique.size || unique.size !== products.length ) {
      throw new Error(
          `assignment covers ${unique.size} unique products ` +
          `(${assigned.length} entries) against a worklist of ${products.length}` )
    }

    const mineSet = new Set( assignment.shards[ shard.index ] )

    passthrough.demandProducts_ = products.filter( ( id ) => mineSet.has( id ) )
    passthrough.demandAggregates_ =
      aggregates.filter( ( _, index ) => index % shard.count === shard.index )

    return {
      products: passthrough.demandProducts_.length,
      ofProducts: products.length,
      aggregates: passthrough.demandAggregates_.length,
      strategy: assignment.strategy,
    }
  }

  // Round-robin spreads cost evenly but scatters shared geometry across every
  // shard, so each one re-extracts it. Contiguous keeps file-order locality —
  // and exporters emit spatially and structurally clustered — so instances
  // sharing a representation tend to land on the same shard. Which one wins
  // says whether the ceiling is imbalance or duplicated shared work.
  const perShard = Math.ceil( products.length / shard.count )
  const mine = shard.mode === 'contiguous' ?
    ( _, index ) => Math.floor( index / perShard ) === shard.index :
    ( _, index ) => index % shard.count === shard.index

  passthrough.demandProducts_ = products.filter( mine )
  passthrough.demandAggregates_ = aggregates.filter( mine )

  return {
    products: passthrough.demandProducts_.length,
    ofProducts: products.length,
    aggregates: passthrough.demandAggregates_.length,
  }
}

/**
 * Run one phase against one model in this (child) process.
 *
 * @param phase One of PHASES.
 * @param filePath The model.
 * @param batchSize Products per pump call.
 * @param shard Optional `{index, count}` — extract only this shard's products.
 */
async function runChild( phase, filePath, batchSize, shard ) {

  const { IfcAPI, LogLevel } =
    await import( '../compiled/src/compat/web-ifc/ifc_api.js' )
  const { wasmHeapByteLength } =
    await import( '../compiled/src/core/wasm_heap.js' )

  const api = new IfcAPI()

  await api.Init()
  api.SetLogLevel( LogLevel.LOG_LEVEL_ERROR )

  const digest = new Digest()
  const seen = new Set()

  // Every payload a phase copies out, held until the child reports. This is
  // what a consumer that renders the model holds, so retained/RSS describe the
  // real cost of delivery rather than the cost of hashing and forgetting.
  const retainedPayloads = []
  const deferred = phase !== 'classic'
  const copies = phase === 'copyout' || phase === 'bounded'
  const emits = !EXTRACT_ONLY_PHASES.has( phase )

  const settings = {
    COORDINATE_TO_ORIGIN: true,
    USE_FAST_BOOLS: true,
  }

  if ( deferred ) {
    settings.DEFER_GEOMETRY = true
  }

  const bytes = new Uint8Array( fs.readFileSync( filePath ) )

  const tOpen = performance.now()
  const modelID = deferred ?
    await api.OpenModelStreamed( bytes, settings ) :
    api.OpenModel( bytes, settings )
  const openMs = performance.now() - tOpen

  if ( modelID < 0 ) {
    console.log( JSON.stringify( { phase, failed: 'open' } ) )
    return
  }

  const sharded = deferred && shard !== void 0 ?
    shardWorklists( api, modelID, shard, filePath ) : void 0

  // Count what this process actually builds. Summed across shards against a
  // single-shard run, this is the REAL duplication a partition causes —
  // measured at the cache, not inferred from a captured graph.
  let assetsCreated = 0

  if ( deferred ) {

    const geometry = api.getPassthrough( modelID )?.model?.[ 0 ]?.geometry

    if ( geometry !== void 0 ) {

      const originalAdd = geometry.add.bind( geometry )

      geometry.add = ( mesh ) => {
        ++assetsCreated
        return originalAdd( mesh )
      }
    }
  }

  let wasmPeakMB = wasmMB( api, wasmHeapByteLength )
  const wasmAfterOpenMB = wasmPeakMB
  let batches = 0
  let released = 0
  let copyMs = 0

  const cpuBefore = process.cpuUsage()
  const tGeometry = performance.now()

  if ( !deferred ) {

    // Classic: one whole-model walk. Payloads are copied inside the callback
    // so the copy cost lands in the same place it does on the pump paths.
    const meshes = []

    api.StreamAllMeshes( modelID, ( mesh ) => {
      meshes.push( mesh )
    } )

    const tCopy = performance.now()

    copyBatchPayloads( api, modelID, meshes, seen, digest, retainedPayloads )
    copyMs += performance.now() - tCopy

    wasmPeakMB = Math.max( wasmPeakMB, wasmMB( api, wasmHeapByteLength ) )

  } else {

    for ( ;; ) {

      const batchMeshes = []
      const { extracted, remaining } = emits ?
        api.ExtractGeometryBatch( modelID, batchSize, ( mesh ) => {
          batchMeshes.push( mesh )
        } ) :
        api.ExtractGeometryBatch( modelID, batchSize )

      ++batches

      if ( copies ) {

        const tCopy = performance.now()
        const copied =
          copyBatchPayloads( api, modelID, batchMeshes, seen, digest, retainedPayloads )

        copyMs += performance.now() - tCopy

        if ( phase === 'bounded' ) {
          released += releaseGeometries( api, modelID, copied )
        }
      }

      wasmPeakMB = Math.max( wasmPeakMB, wasmMB( api, wasmHeapByteLength ) )

      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }
  }

  const geometryMs = performance.now() - tGeometry
  const cpu = process.cpuUsage( cpuBefore )
  const geometryCpuMs = ( cpu.user + cpu.system ) / 1000

  console.log( JSON.stringify( {
    phase,
    openMs,
    geometryMs,
    geometryCpuMs,
    copyMs,
    totalMs: openMs + geometryMs,
    batches,
    released,
    assetsCreated,
    shard,
    sharded,
    wasmAfterOpenMB,
    wasmPeakMB,
    wasmEndMB: wasmMB( api, wasmHeapByteLength ),
    retainedMB: retainedMB(),
    rssMB: process.memoryUsage().rss / BYTES_PER_MB,
    instances: digest.instances,
    payloads: digest.payloads,
    payloadMB: digest.payloadBytes / BYTES_PER_MB,
    retainedPayloadBuffers: retainedPayloads.length,
    placedDigest: digest.placedHash,
    payloadDigest: digest.payloadHash,
  } ) )
}

/**
 * Spawn one phase in its own process.
 *
 * @param phase One of PHASES.
 * @param filePath The model.
 * @param batchSize Products per pump call.
 * @param shard Optional `{index, count}` — extract only this shard's products.
 * @return {object} The child's JSON result.
 */
function spawnChild( phase, filePath, batchSize, shard ) {

  const args = [
    '--expose-gc', `--max-old-space-size=${CHILD_MAX_OLD_SPACE_MB}`,
    process.argv[ 1 ], '--child', phase, filePath, String( batchSize ),
  ]

  if ( shard !== void 0 ) {
    args.push( `${shard.index}/${shard.count}` )
  }

  const out = execFileSync( process.execPath, args,
      { encoding: 'utf8', maxBuffer: 1 << 26, cwd: REPO_ROOT } )

  return JSON.parse( out.trim().split( '\n' ).at( -1 ) )
}

/**
 * Environment for a shard child: single-threaded wasm, unconditionally.
 *
 * A shard models ONE worker holding one wasm instance, so it must be one
 * core. `pThreadsAllowed()` returns true in node whenever `SharedArrayBuffer`
 * exists unless `FORCE_SINGLE_THREAD` is exactly `'true'`, so a shard child
 * that merely inherits the ambient environment loads the MT module and starts
 * its own pthread pool. N shards then measure N nested thread pools
 * oversubscribing the box — which is not the across-product axis this sweep
 * exists to isolate, and reads as a scaling ceiling that isn't one.
 *
 * Set here rather than left to the caller: an invocation that forgets it
 * produces plausible, wrong numbers rather than an error.
 *
 * @return {object} The child environment.
 */
function shardEnv() {
  return { ...process.env, FORCE_SINGLE_THREAD: 'true' }
}

/**
 * Run one phase as N concurrent shards, each in its own process with its own
 * wasm instance — the worker-pool shape, measured without building workers.
 * Wall-clock is the slowest shard, since they run at the same time.
 *
 * @param phase One of PHASES.
 * @param filePath The model.
 * @param batchSize Products per pump call.
 * @param count How many shards.
 * @param shardMode 'roundrobin' or 'contiguous'.
 * @return {Promise<object[]>} One result per shard.
 */
function spawnShards( phase, filePath, batchSize, count, shardMode ) {

  const running = []

  for ( let index = 0; index < count; ++index ) {

    const args = [
      '--expose-gc', `--max-old-space-size=${CHILD_MAX_OLD_SPACE_MB}`,
      process.argv[ 1 ], '--child', phase, filePath, String( batchSize ),
      `${index}/${count}`, shardMode,
    ]

    running.push( new Promise( ( resolve, reject ) => {
      execFile( process.execPath, args,
          { encoding: 'utf8', maxBuffer: 1 << 26, cwd: REPO_ROOT, env: shardEnv() },
          ( error, stdout ) => {
            if ( error !== null ) {
              reject( error )
              return
            }
            resolve( JSON.parse( stdout.trim().split( '\n' ).at( -1 ) ) )
          } )
    } ) )
  }

  return Promise.all( running )
}

/**
 * Scaling sweep for the across-product axis: run the same extraction as N
 * concurrent one-shard processes and report wall-clock against N = 1.
 *
 * Each shard pays its own parse, so only the GEOMETRY phase is comparable —
 * in the real design the index is built once and shared with the pool as
 * typed-array columns (transferable / SAB), which is exactly what M2's
 * columns-from-birth index made possible. Shards also re-extract any geometry
 * they share, so sub-linear scaling here has two distinct causes worth
 * separating before drawing conclusions: real serialisation, and duplicated
 * shared work (visible as a rising payload count).
 *
 * @param models Model paths.
 * @param phase The phase to run.
 * @param batchSize Products per pump call.
 * @param counts Shard counts to sweep.
 * @param jsonOut Optional output path.
 * @param shardMode 'roundrobin' or 'contiguous'.
 */
async function runShardSweep( models, phase, batchSize, counts, jsonOut, shardMode ) {

  const rows = []

  for ( const model of models ) {

    const name = path.basename( model )
    const byCount = {}

    for ( const count of counts ) {

      const t0 = performance.now()
      const results = await spawnShards( phase, model, batchSize, count, shardMode )
      const wallMs = performance.now() - t0

      const total = ( key ) => results.reduce( ( sum, r ) => sum + ( r[ key ] ?? 0 ), 0 )
      const slowestGeometryMs = Math.max( ...results.map( ( r ) => r.geometryMs ) )

      byCount[ count ] = {
        count,
        wallMs,
        slowestGeometryMs,
        geometryMsPerShard: results.map( ( r ) => Math.round( r.geometryMs ) ),
        cpuMsTotal: total( 'geometryCpuMs' ),
        instances: total( 'instances' ),
        assetsCreated: total( 'assetsCreated' ),
        payloads: total( 'payloads' ),
        wasmPeakMBSum: results.reduce( ( sum, r ) => sum + r.wasmPeakMB, 0 ),
        wasmPeakMBMax: Math.max( ...results.map( ( r ) => r.wasmPeakMB ) ),
      }

      const base = byCount[ counts[ 0 ] ]
      const speedup = base.slowestGeometryMs / slowestGeometryMs

      console.log(
          `${name} ${shardMode} shards=${count} geometry=${( slowestGeometryMs / 1000 ).toFixed( 1 )}s ` +
          `(${speedup.toFixed( 2 )}x) per-shard=${byCount[ count ].geometryMsPerShard.join( '/' )} ` +
          `cpu=${( byCount[ count ].cpuMsTotal / 1000 ).toFixed( 1 )}s ` +
          `inst=${byCount[ count ].instances} assets=${byCount[ count ].assetsCreated} ` +
          `wasmMax=${byCount[ count ].wasmPeakMBMax.toFixed( 0 )}MB ` +
          `wasmSum=${byCount[ count ].wasmPeakMBSum.toFixed( 0 )}MB` )
    }

    rows.push( { name, model, batchSize, phase, byCount } )
  }

  if ( jsonOut !== void 0 ) {
    fs.writeFileSync( jsonOut, `${JSON.stringify( rows, null, 2 )}\n` )
  }
}

/**
 * Sweep phases over models, or shard counts when `--shards` is given.
 *
 * @return {Promise<void>|void} The shard sweep's promise, when sweeping.
 */
function main() {

  const argv = process.argv.slice( 2 )

  if ( argv[ 0 ] === '--child' ) {
    const spec = argv[ 4 ]
    const shard = spec !== void 0 ? {
      index: Number( spec.split( '/' )[ 0 ] ),
      count: Number( spec.split( '/' )[ 1 ] ),
      mode: argv[ 5 ] ?? 'roundrobin',
    } : void 0

    return runChild( argv[ 1 ], argv[ 2 ], Number( argv[ 3 ] ), shard )
  }

  const flag = ( name, fallback ) => {
    const index = argv.indexOf( name )
    return index >= 0 ? argv[ index + 1 ] : fallback
  }

  const modelsFile = flag( '--models' )
  const batchSize = Number( flag( '--batch', DEFAULT_BATCH ) )
  const repeats = Number( flag( '--repeats', 1 ) )
  const jsonOut = flag( '--json' )
  const only = flag( '--phases' )
  const phases = only !== void 0 ? only.split( ',' ) : PHASES
  const shards = flag( '--shards' )

  if ( modelsFile === void 0 ) {
    console.error(
        'usage: m3_pump_spike.mjs --models <file with one path per line> ' +
        '[--batch N] [--repeats N] [--phases a,b] [--json out]' )
    process.exit( 2 )
  }

  const models = fs.readFileSync( modelsFile, 'utf8' )
      .split( '\n' )
      .map( ( line ) => line.trim() )
      .filter( ( line ) => line.length > 0 && !line.startsWith( '#' ) )

  const rows = []

  if ( shards !== void 0 ) {

    // `classic` opens without DEFER_GEOMETRY, so the pump worklists never
    // exist and the shard filter never runs: every child would extract the
    // WHOLE model while the output labelled them shards and computed a
    // speedup from them. Default to the deferred extract phase, and refuse a
    // non-deferred one rather than publishing invalid scaling.
    const shardPhase = only !== void 0 ? phases[ 0 ] : 'extractonly'

    if ( shardPhase === 'classic' ) {
      console.error(
          'shard sweeps need a deferred phase (extractonly/pump/copyout/bounded); ' +
          '`classic` extracts the whole model in every child' )
      process.exit( 2 )
    }

    // Every speedup in the sweep is a ratio against the FIRST count, and the
    // function promises that is one shard. A list like `2,3,4` would silently
    // make N=2 the baseline and print ratios against it; `4,1,2` would be
    // worse. Normalise instead of trusting the caller: dedupe, sort ascending,
    // and run a one-shard baseline whether or not it was asked for.
    const requested = shards.split( ',' ).map( Number )
    const counts = [ ...new Set( [ 1, ...requested ] ) ].sort( ( a, b ) => a - b )

    if ( counts.length !== requested.length ) {
      console.log( `note: added an N=1 baseline (sweeping ${counts.join( ',' )})` )
    }

    return runShardSweep( models, shardPhase, batchSize, counts, jsonOut,
        flag( '--shard-mode', 'roundrobin' ) )
  }

  for ( const model of models ) {

    const name = path.basename( model )
    const byPhase = {}

    for ( const phase of phases ) {

      const runs = []

      for ( let repeat = 0; repeat < repeats; ++repeat ) {
        runs.push( spawnChild( phase, model, batchSize ) )
      }

      // Min of N: wall-clock noise is one-sided, so the minimum is the
      // least-contaminated estimate. Memory is taken from the same run so
      // the row describes one coherent execution.
      byPhase[ phase ] =
        runs.reduce( ( a, b ) => ( ( a.totalMs ?? Infinity ) <= ( b.totalMs ?? Infinity ) ? a : b ) )
    }

    const base = byPhase[ phases[ 0 ] ]

    rows.push( { name, model, batchSize, byPhase } )

    const cell = ( phase ) => {
      const row = byPhase[ phase ]

      if ( row?.totalMs === void 0 ) {
        return `${phase}=failed`
      }

      const pct = base?.totalMs !== void 0 ?
        ` (${( ( row.totalMs / base.totalMs - 1 ) * 100 ).toFixed( 1 )}%)` : ''

      return `${phase}=${row.totalMs.toFixed( 0 )}ms${pct} ` +
        `wasm=${row.wasmPeakMB.toFixed( 0 )}MB inst=${row.instances} ` +
        `placed=${row.placedDigest} payload=${row.payloadDigest}`
    }

    console.log( `${name}\n  ${phases.map( cell ).join( '\n  ' )}` )
  }

  if ( jsonOut !== void 0 ) {
    fs.writeFileSync( jsonOut, `${JSON.stringify( rows, null, 2 )}\n` )
  }
}

await main()
