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
 * than assumed. A `bounded`/`copyout` difference is a FAILURE: those two run
 * identical extraction and differ only in that `bounded` releases, so any
 * divergence means release changed what a consumer receives.
 *
 * Retain-nothing release CAN lose instances in principle — the scene walk
 * resolves geometry through `getByLocalID` and skips what it cannot find, so
 * releasing an asset a later product shares makes that product re-extract —
 * but this corpus never triggers it at batch 64, because shared geometry is
 * released within the batch that emits all of its instances. (An earlier
 * version of this comment said the loss was expected and measured, citing
 * 169 instances against 101 on `supercap.step`. That came from the
 * payload-keyed release this harness no longer uses; `bounded` is now
 * identical to `copyout` on all 12 models. Retracted — see the design doc.)
 * The retention rule the production pump needs (SharedAssetPool) is
 * therefore justified by the code path, not by a number from here.
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
import { createHash } from 'node:crypto'
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

/**
 * How `--shards` splits the worklists. Anything else is a caller error, not a
 * silent default: an unrecognised mode used to fall through to round-robin
 * while every printed line and the JSON kept the label the caller typed, so
 * `--shard-mode contigous` produced a plausible "contiguous" table measuring
 * round-robin. Same failure the `--strategy` validation fixes in the affinity
 * harness.
 */
const SHARD_MODES = [ 'roundrobin', 'contiguous' ]

/**
 * Validate a shard mode, or exit.
 *
 * @param mode The caller's `--shard-mode`.
 * @return {string} The same mode, once known to be supported.
 */
function shardMode( mode ) {

  if ( !SHARD_MODES.includes( mode ) ) {
    console.error(
        `unknown shard mode '${mode}' — expected one of ${SHARD_MODES.join( ', ' )}` )
    process.exit( 2 )
  }

  return mode
}

const DEFAULT_BATCH = 64
const BYTES_PER_MB = 1024 * 1024

const REPO_ROOT = path.dirname( path.dirname( new URL( import.meta.url ).pathname ) )

/** Node heap ceiling for the children — PSB-class models need the headroom. */
const CHILD_MAX_OLD_SPACE_MB = 12288

/**
 * A digest of the geometry a phase delivers: each instance and each payload
 * is SHA-256'd on its own, and the per-item digests are combined by sorting
 * them and hashing the concatenation — **order-independent**, and unlike a
 * modular sum it preserves multiplicity, so a dropped or duplicated item
 * still moves the result. Order-independent by construction, because emission
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
    this.placedRecords = []
    this.instances = 0
    this.payloads = 0
    this.payloadBytes = 0
  }

  /**
   * Hash one placed instance into the order-independent accumulator.
   *
   * @param placedGeometry The placed instance as delivered to the consumer.
   * @param expressID The product's express ID.
   */
  placed( placedGeometry, expressID ) {

    ++this.instances

    // Record the canonical field list; hash it at report time. Hashing here
    // would put the cost of the check inside the measurement the check exists
    // to validate, and the instance count is small next to the payloads this
    // run already retains.
    const record = [ expressID, placedGeometry.geometryExpressID ]

    for ( const component of placedGeometry.flatTransformation ) {
      record.push( quantise( component ) )
    }

    // Colour and occurrence path are delivered output, not metadata: colour is
    // what the instance looks like, and `occurrencePath` is what a pick
    // resolves to on an AP214 assembly where one definition appears many
    // times. A batching or release regression that swapped either while
    // preserving counts and transforms would otherwise pass this check.
    const colour = placedGeometry.color

    // Colour is recorded RAW. `quantise` exists for the placement transform,
    // where the two paths compose f64 matrices in a different order so the last
    // bits legitimately differ. Colour has no such phase-dependent arithmetic —
    // it is carried through unchanged — so rounding it to 1/1024 only creates a
    // bucket in which a real appearance change (1 vs 1.0001) compares equal,
    // against a check that claims delivery is invariant.
    record.push( colour === void 0 ? 'nocolour' :
      [ colour.x, colour.y, colour.z, colour.w ].join( ',' ) )
    record.push( ( placedGeometry.occurrencePath ?? [] ).join( '.' ) )

    this.placedRecords.push( record.join( '|' ) )
  }

  /**
   * Record one geometry payload. The bytes are NOT hashed here: hashing every
   * float inside the copy loop would put the cost of the check inside the
   * measurement the check exists to validate. The payloads are retained
   * anyway (a consumer keeps them), so the exact digest is computed once at
   * report time by {@link exactPayloadDigest}.
   *
   * @param vertices Interleaved position+normal floats.
   * @param indices Triangle indices.
   */
  payload( vertices, indices ) {
    ++this.payloads
    this.payloadBytes += vertices.byteLength + indices.byteLength
  }
}

/**
 * Combine per-item digests into one order-independent digest.
 *
 * Sorting the hex digests and hashing the concatenation is order-independent
 * without being lossy the way a modular sum is: a sum mod 2^32 lets distinct
 * SETS of per-item hashes collide (and lets two changes cancel), whereas the
 * sorted list preserves multiplicity, so a duplicated or dropped item moves
 * the result.
 *
 * @param itemDigests Hex digests, one per item, in any order.
 * @return {string} Hex digest of the multiset.
 */
function combineDigests( itemDigests ) {

  const combined = createHash( 'sha256' )

  for ( const digest of itemDigests.slice().sort() ) {
    combined.update( digest )
  }

  return combined.digest( 'hex' )
}

/**
 * Digest EVERY delivered byte, commutatively across payloads.
 *
 * SHA-256 over the raw bytes, not a 32-bit rolling hash. The claim this
 * supports is "two runs delivering different payloads do not agree", and a
 * 32-bit value cannot support it: an arbitrarily large payload collapsed to
 * 32 bits has collisions by counting alone, so a real tessellation change
 * could print OK. At 256 bits, disagreeing runs colliding requires a SHA-256
 * collision — which is the honest bound, and is why the digest is stated as
 * cryptographic rather than exact.
 *
 * Byte-for-byte comparison is not available here: each phase runs in its own
 * child process and reports over stdout, so the parent never holds two
 * phases' payloads at once. A digest is what crosses that boundary.
 *
 * Lengths and the geometry ID are framed into the hash separately so that
 * concatenation cannot alias — a payload of (a, b) and one of (ab, ) are
 * different inputs.
 *
 * Runs at report time, after the timers have stopped, so exactness costs the
 * measurement nothing.
 *
 * @param payloads `{geometryExpressID, vertices, indices}` in emission order.
 * @return {string} Order-independent hex digest.
 */
function exactPayloadDigest( payloads ) {

  const itemDigests = []

  for ( const { geometryExpressID, vertices, indices } of payloads ) {

    const item = createHash( 'sha256' )

    item.update(
        `${geometryExpressID}:${vertices.length}:${indices.length}:` )

    // RAW BYTES, not quantised values. `quantise` exists for placement, where
    // the two paths compose f64 matrices differently and the last bits
    // legitimately differ; applying it to vertices would put 1.0 and 1.0001
    // in the same bucket and let a small tessellation change pass a check
    // that claims identical payloads. Vertices come from the same frozen
    // native mirror on every path, so they are comparable bit-for-bit.
    item.update( new Uint8Array(
        vertices.buffer, vertices.byteOffset, vertices.byteLength ) )
    item.update( new Uint8Array(
        indices.buffer, indices.byteOffset, indices.byteLength ) )

    itemDigests.push( item.digest( 'hex' ) )
  }

  return combineDigests( itemDigests )
}

/**
 * Digest the placed instances a phase delivered.
 *
 * @param records Canonical per-instance field strings from {@link Digest}.
 * @return {string} Order-independent hex digest.
 */
function exactPlacedDigest( records ) {

  return combineDigests( records.map(
      ( record ) => createHash( 'sha256' ).update( record ).digest( 'hex' ) ) )
}

/**
 * Quantise a float for PLACEMENT comparison only.
 *
 * The two paths compose their f64 placement matrices in a different order, so
 * the last bits legitimately differ; rounding to 1/1024 keeps that from
 * reading as a divergence. Deliberately NOT used for vertex payloads, which
 * are compared bit-for-bit — see {@link exactPayloadDigest}.
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

      digest.placed( placed, mesh.expressID )

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

      digest.payload( vertices, indices )
      retained.push( { geometryExpressID: placed.geometryExpressID, vertices, indices } )
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
function releaseGeometries( api, modelID, created, geometryExpressIDs ) {

  const passthrough = api.getPassthrough( modelID )
  const model = passthrough?.model?.[ 0 ]
  const geometryMap = passthrough?.model?.[ 3 ]

  if ( model === void 0 ) {
    return { freed: 0, alreadyGone: 0 }
  }

  let freed = 0

  // Created natives the ENGINE already reclaimed before we got here.
  // `IfcGeometryExtraction` calls `deleteTemporaries()` on both stores
  // (ifc_geometry_extraction.ts:7690-7691), which drops temporary meshes AND
  // deletes their natives, so a localID counted at `add` can legitimately be
  // gone by release time. Tracked separately rather than ignored: what must
  // hold is that nothing created is still resident, and "we freed it" and
  // "the engine freed it" are both ways of satisfying that.
  let alreadyGone = 0

  // BOTH geometry stores. `IfcStepModel` carries `geometry` and a separate
  // `voidGeometry` (ifc_step_model.ts:27), and extraction adds to both —
  // opening and boolean-operand meshes land in `voidGeometry`
  // (ifc_geometry_extraction.ts:995, 1112, 1595). Releasing only `geometry`
  // left those resident for the life of the model while the counters, which
  // also only watched `geometry`, reported everything freed. Local IDs are
  // per-store, so the two sets are kept and released separately.
  const stores = [
    [ model.geometry, created.geometry ],
    [ model.voidGeometry, created.voidGeometry ],
  ]

  for ( const [ store, localIDs ] of stores ) {

    if ( store === void 0 ) {
      continue
    }

    for ( const localID of localIDs ) {

      try {

        // `IfcModelGeometry.delete` returns void and silently returns when the
        // local ID is absent, so "the call did not throw" is not evidence that
        // anything was freed — and `released === assetsCreated` was resting on
        // exactly that. Require the observable transition instead: present
        // before, absent after.
        if ( store.getByLocalID( localID ) === void 0 ) {
          ++alreadyGone
          continue
        }

        store.delete( localID )

        if ( store.getByLocalID( localID ) === void 0 ) {
          ++freed
        }
      } catch {
        // Never let a free break the measurement — a phase that cannot free
        // is a finding, not a crash.
      }
    }
  }

  // Drop the compat GetGeometry entries too, so a later lookup degrades to the
  // dummy instead of handing back a handle to freed memory.
  for ( const expressID of geometryExpressIDs ) {
    geometryMap?.delete( expressID )
  }

  return { freed, alreadyGone }
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

  // No demand worklists means nothing to partition — AP214/STEP passthroughs
  // don't carry the seam. Returning silently left the filter unapplied, so
  // every "shard" extracted the WHOLE model while the sweep labelled them
  // shards and computed a speedup from them: `ap214-multibody-part.step`
  // reported 7 instances at N=1 and 14 at N=2, which is two full extractions,
  // not a partition. Refuse — a shard sweep of a format whose demand units
  // aren't shardable is not a measurement.
  if ( passthrough?.ensureDemandWorklists_ === void 0 ) {
    throw new Error(
        `${filePath}: this model's passthrough has no demand worklists ` +
        '(AP214/STEP), so the shard filter cannot apply and every child would ' +
        'extract the whole model — shard sweeps need an IFC model until ' +
        'AP214 demand units are shardable' )
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

    if ( assigned.length !== unique.size ) {
      throw new Error(
          `assignment lists ${assigned.length} entries for ${unique.size} ` +
          `unique products — a product assigned twice is extracted twice` )
    }

    // Membership, not cardinality: an assignment of the right SIZE built from
    // ids this worklist doesn't contain filters everything out and still
    // prints a speedup (a one-product model with `[[999999999], []]` reported
    // 40.63x on zero assets). Compare the sets.
    const worklist = new Set( products )
    const foreign = [ ...unique ].filter( ( id ) => !worklist.has( id ) )
    const missing = products.filter( ( id ) => !unique.has( id ) )

    if ( foreign.length > 0 || missing.length > 0 ) {
      throw new Error(
          `assignment does not match this worklist: ${foreign.length} ids ` +
          `absent from it, ${missing.length} of its products unassigned` )
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
  // Each worklist gets its own span: products and aggregates are independent
  // lists of different lengths, so a span sized from the products would push
  // the (shorter) aggregate list entirely into the early shards — 2/1/0/0 on
  // index.ifc's 7 products and 3 aggregates, where a contiguous split is
  // 1/1/1/0. Aggregate extraction is real geometry work, so that imbalance
  // lands in the slowest-shard timing the scaling table reports.
  const mineOf = ( length ) => {

    if ( shard.mode !== 'contiguous' ) {
      return ( _, index ) => index % shard.count === shard.index
    }

    const perShard = Math.ceil( length / shard.count )

    return ( _, index ) => Math.floor( index / perShard ) === shard.index
  }

  passthrough.demandProducts_ = products.filter( mineOf( products.length ) )
  passthrough.demandAggregates_ = aggregates.filter( mineOf( aggregates.length ) )

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

  // Adds that land on a local ID the cache ALREADY holds. `IfcModelGeometry.add`
  // is a bare `meshes_.set( localID, mesh )` (ifc_model_geometry.ts:75), so a
  // replacement would drop the previous `CanonicalMesh` from the map without
  // calling `.delete()` on its native, leaving it unreachable — not by
  // `releaseGeometries`, not by anything — for the life of the model.
  //
  // NOT observed. This counter exists because that leak is possible by
  // inspection, not because anything here exhibits it: every model measured
  // reports `assetsReplaced = 0`, `aggregate_master_voids.ifc` included. Its
  // 2-created/1-delivered split is two DISTINCT assets, one of them never
  // handed out — which is the create-vs-deliver gap the release keying fixes,
  // a different mechanism entirely. Counted so that a model which does
  // overwrite is visible rather than silently unbounded.
  let assetsReplaced = 0

  // Local IDs each store created since the last release. `bounded` frees these
  // rather than the copied payload IDs — see releaseGeometries. Kept per store
  // because local IDs are store-relative.
  const createdThisBatch = { geometry: new Set(), voidGeometry: new Set() }

  if ( deferred ) {

    const ifcModel = api.getPassthrough( modelID )?.model?.[ 0 ]

    // Both stores: extraction adds opening and boolean-operand meshes to
    // `voidGeometry`, and watching only `geometry` meant those natives were
    // neither counted nor released while the counters reported everything
    // freed.
    for ( const store of [ 'geometry', 'voidGeometry' ] ) {

      const cache = ifcModel?.[ store ]

      if ( cache === void 0 ) {
        continue
      }

      const originalAdd = cache.add.bind( cache )
      const originalGet = cache.getByLocalID.bind( cache )

      cache.add = ( mesh ) => {

        ++assetsCreated

        if ( originalGet( mesh.localID ) !== void 0 ) {
          ++assetsReplaced
        }

        createdThisBatch[ store ].add( mesh.localID )

        return originalAdd( mesh )
      }
    }
  }

  let wasmPeakMB = wasmMB( api, wasmHeapByteLength )
  const wasmAfterOpenMB = wasmPeakMB
  let batches = 0
  let released = 0

  // Created natives the engine reclaimed itself (temporaries). Reported so the
  // release invariant can be "nothing created is still resident" rather than
  // "we personally freed everything", which is false by construction.
  let selfFreed = 0
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

          const release =
            releaseGeometries( api, modelID, createdThisBatch, copied )

          released += release.freed
          selfFreed += release.alreadyGone
          createdThisBatch.geometry.clear()
          createdThisBatch.voidGeometry.clear()
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
    selfFreed,
    assetsCreated,
    assetsReplaced,
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
    placedDigest: exactPlacedDigest( digest.placedRecords ),
    payloadDigest: exactPayloadDigest( retainedPayloads ),
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
 * @param models Model entries `{path, allowEmpty}` from the models file — the
 * `#empty` declaration has to reach here too, since this path never runs
 * `verdicts()` and would otherwise accept a sweep that extracted nothing.
 * @param phase The phase to run.
 * @param batchSize Products per pump call.
 * @param counts Shard counts to sweep.
 * @param jsonOut Optional output path.
 * @param shardMode 'roundrobin' or 'contiguous'.
 */
async function runShardSweep( models, phase, batchSize, counts, jsonOut, shardMode ) {

  const rows = []

  for ( const { path: model, allowEmpty } of models ) {

    const name = path.basename( model )
    const byCount = {}

    for ( const count of counts ) {

      const t0 = performance.now()
      const results = await spawnShards( phase, model, batchSize, count, shardMode )
      const wallMs = performance.now() - t0

      // Shard sweeps never reach `verdicts()`, so nothing else here can refuse
      // a child that didn't run. A child whose open failed reports
      // `{failed: 'open'}` with no `geometryMs`, and the aggregation below
      // happily turns that into `Math.max( ..., undefined )` → `geometry=NaNs`
      // beside a zero asset count, and exits 0. A sweep that measured nothing
      // must not print a scaling table.
      const broken = results.filter(
          ( result ) => result.failed !== void 0 || result.geometryMs === void 0 )

      if ( broken.length > 0 ) {
        throw new Error(
            `${name}: ${broken.length} of ${count} shard child(ren) did not ` +
            `complete (${broken.map( ( r ) => r.failed ?? 'no timing' ).join( ', ' )}) ` +
            '— refusing to report a sweep over work that did not happen' )
      }

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
        assetsReplaced: total( 'assetsReplaced' ),
        released: total( 'released' ),
        selfFreed: total( 'selfFreed' ),
        payloads: total( 'payloads' ),
        wasmPeakMBSum: results.reduce( ( sum, r ) => sum + r.wasmPeakMB, 0 ),
        wasmPeakMBMax: Math.max( ...results.map( ( r ) => r.wasmPeakMB ) ),
      }

      // Completing is not the same as doing something. A sharded run on a
      // geometry-producing model that creates no assets means the extraction
      // never fired, and every ratio below it is a ratio of nothing — the same
      // hole the unsharded `pump` verdict closes, which this path never reaches.
      // Checked on the N=1 baseline, because an individual shard at N>1 can
      // legitimately own no products.
      if ( count === 1 && byCount[ count ].assetsCreated === 0 && !allowEmpty ) {
        throw new Error(
            `${name}: the N=1 baseline created 0 geometry assets on a model not ` +
            'declared geometry-free — the extraction never fired, so there is ' +
            'nothing to scale' )
      }

      // Creating assets is not delivering them. `copyout` and `bounded` exist
      // to measure what a CONSUMER pays — the per-batch copy out of the wasm
      // heap — so a regression in `streamNewMeshes_` or its callback that
      // extracts normally while delivering nothing leaves `assetsCreated`
      // healthy, every child completed, and (for `bounded`) every created
      // asset released, so the release check passes too. The sweep would then
      // publish copy and memory timings for copying that never happened.
      // Delivery is the evidence those phases specifically need.
      if ( count === 1 && ( phase === 'copyout' || phase === 'bounded' ) &&
           byCount[ count ].payloads === 0 && !allowEmpty ) {
        throw new Error(
            `${name}: the N=1 baseline delivered 0 instances and 0 payloads on a ` +
            `model not declared geometry-free, despite creating ` +
            `${byCount[ count ].assetsCreated} assets — ${phase} measures the ` +
            'copy-out of delivered geometry, and none was delivered' )
      }

      // `bounded` is defined by its release policy, so a sweep of it that did
      // not release measured a different phase than the one it reports. The
      // sweep never reaches `verdicts()`, and `releaseGeometries` swallows
      // per-geometry failures so a broken free surfaces nowhere else — the
      // aggregate count is the only evidence. Summed across shards, because
      // each child releases only what it created.
      if ( phase === 'bounded' &&
           byCount[ count ].released + byCount[ count ].selfFreed !==
             byCount[ count ].assetsCreated ) {
        throw new Error(
            `${name}: at N=${count}, bounded accounted for ` +
            `${byCount[ count ].released + byCount[ count ].selfFreed} of ` +
            `${byCount[ count ].assetsCreated} geometries the extractor ` +
            `created (${byCount[ count ].released} released, ` +
            `${byCount[ count ].selfFreed} reclaimed by the engine) — the ` +
            'release policy that defines this phase did not run, so its ' +
            'timing and memory rows describe something else' )
      }

      const base = byCount[ counts[ 0 ] ]
      const speedup = base.slowestGeometryMs / slowestGeometryMs

      // Label by what RAN, not by what was requested. With `M3_ASSIGNMENT`
      // set, `shardWorklists` ignores the positional mode entirely and applies
      // the emitted partition, so printing the CLI mode attributed an affinity
      // or claim measurement to `roundrobin`. The children report the strategy
      // they actually used; take it from them.
      const strategies = [ ...new Set(
          results.map( ( r ) => r.sharded?.strategy ).filter(
              ( strategy ) => strategy !== void 0 ) ) ]

      byCount[ count ].strategy = strategies.length > 0 ?
        strategies.join( '+' ) : shardMode

      console.log(
          `${name} ${byCount[ count ].strategy} shards=${count} geometry=${( slowestGeometryMs / 1000 ).toFixed( 1 )}s ` +
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
 * Turn the phase rows into explicit verdicts, so a sweep that measured
 * nothing fails instead of printing agreeable zeros.
 *
 * The digest comparison is the spike's whole correctness argument, and it has
 * a vacuous mode: if no mesh callback ever fires, every payload phase reports
 * `inst=0` with equal digests and the run looks like a clean pass. That is
 * indistinguishable from success by eye, which is exactly how the other
 * harness defects in this branch survived. So:
 *
 *  - `classic` delivering no instances on a geometry-producing model is a
 *    FAILURE, not a silent zero. (A model that genuinely has no geometry is
 *    reported as SKIP — its own row proves it, since classic is the
 *    unmodified whole-model walk.)
 *  - `copyout` must match `classic` exactly. It changes only WHEN extraction
 *    happens, so any divergence is a real regression.
 *  - `bounded` must match `copyout` exactly. Those two run identical
 *    extraction and differ ONLY in that `bounded` releases, so any divergence
 *    means release changed what a consumer receives — a failure, not a
 *    finding. Measured: identical on all 12 corpus models.
 *  - `bounded` vs `classic` is reported without failing, because on a model
 *    where the deferred path itself diverges the `copyout`-vs-`classic`
 *    comparison already reports it, and failing twice for one cause would
 *    read as two. (`supercap.step` is that model, and the cause is the
 *    deferred pump — #532 — not release. An earlier version of this comment
 *    said retain-nothing release was expected to duplicate instances there;
 *    that came from the payload-keyed release replaced in round 11.
 *    Retracted.)
 *
 * @param byPhase Results keyed by phase.
 * @param phases The phases that ran.
 * @param allowEmpty The caller's declaration (`#empty` in the models file)
 * that this model genuinely has no geometry, so a zero is not a broken probe.
 * @return {object[]} `{text, failed}` lines.
 */
function verdicts( byPhase, phases, allowEmpty ) {

  const out = []
  const classic = byPhase.classic
  const copyout = byPhase.copyout
  const bounded = byPhase.bounded

  // FIRST, and independent of `classic`: the comparison that isolates release.
  // `copyout` and `bounded` run identical extraction and differ only in that
  // `bounded` releases, so this is the check the release claim rests on — and
  // `--phases copyout,bounded`, the most direct release-isolation run, has no
  // `classic` row at all.
  // A phase that never opened the model has no `instances` at all, and one
  // that delivered nothing has zero — and `0 === 0` with equal empty digests
  // reads as agreement. Neither can support a comparison, so say so rather
  // than passing quietly. (`allowEmpty` is the caller's declaration that the
  // model genuinely has no geometry.)
  //
  // Every REQUESTED phase is checked, not just the ones a later comparison
  // happens to name. Restricting this to `copyout`/`bounded` left `--phases
  // classic` and `--phases pump` exiting 0 on a failed open: the row printed
  // `failed`, no comparison referenced it, and the guards below returned
  // early. A phase the caller asked for and did not get is a failed run
  // whether or not anything compares it.
  for ( const phase of phases ) {

    const row = byPhase[ phase ]

    if ( row === void 0 ) {
      out.push( {
        text: `FAIL  ${phase} produced no result at all — the child did not report`,
        failed: true,
      } )
      continue
    }

    // `pump` deliberately passes no meshCallback, so it delivers no instances
    // by construction; its purpose is the wasm/timing columns. Judging it on
    // instance count would fail every healthy run — but "no instances by
    // construction" is not "no evidence required". A regression in the demand
    // worklist or in `ExtractGeometryBatch` that made the pump extract nothing
    // leaves `failed` undefined and every count at zero, and a timing probe
    // that never fired would report a healthy-looking run.
    //
    // `assetsCreated` is the evidence: the child wraps `geometry.add`, so a
    // non-zero count means tessellation actually produced assets. Sharded runs
    // are exempt because a shard can legitimately own no products.
    if ( EXTRACT_ONLY_PHASES.has( phase ) || phase === 'pump' ) {

      if ( row.failed !== void 0 ) {
        out.push( {
          text: `FAIL  ${phase} did not complete (${row.failed})`,
          failed: true,
        } )
      } else if ( row.shard === void 0 && !allowEmpty && ( row.assetsCreated ?? 0 ) === 0 ) {
        out.push( {
          text: `FAIL  ${phase} created 0 geometry assets on a model not ` +
            'declared geometry-free — the extraction never fired, so its ' +
            'timing and memory columns measure nothing',
          failed: true,
        } )
      }

      continue
    }

    if ( row.instances === void 0 ) {
      out.push( {
        text: `FAIL  ${phase} did not complete (${row.failed ?? 'no result'}) ` +
          '— nothing to compare',
        failed: true,
      } )
    } else if ( phase === 'classic' ) {

      // Zero instances on `classic` is judged by the dedicated block below,
      // which is the only place that can report SKIP: classic is the
      // unmodified whole-model walk, so its own row is what distinguishes a
      // geometry-free model from a broken probe. Falling through here too
      // would file the same failure twice.
      continue

    } else if ( row.instances === 0 && !allowEmpty ) {
      out.push( {
        text: `FAIL  ${phase} delivered 0 instances on a model not declared ` +
          'geometry-free — extraction produced nothing, so its digest proves nothing',
        failed: true,
      } )
    }
  }

  // Release is a property of `bounded` ALONE, so it is checked whenever a
  // completed `bounded` row exists — not from inside the cross-phase guard
  // below. `--phases bounded` is a supported invocation and has no `copyout`
  // row, so gating this on both phases meant the one filter that runs *only*
  // the release phase was the one that never verified the release.
  //
  // `releaseGeometries` swallows per-geometry failures so a single bad free
  // can't end a measurement; the count is therefore the only evidence release
  // actually happened. Compared against CREATIONS, not copied payloads: the
  // extractor makes natives that are never delivered (void/opening geometry
  // consumed by a boolean), so `released === payloads` can hold while the heap
  // still carries everything built but not handed out.
  // Gated on the row having COMPLETED, not on it having delivered instances.
  // A model can create native intermediates without emitting any placed
  // instance — an `IfcOpeningElement`-only fixture reports `assetsCreated = 1`
  // with `instances = 0` — and an instance-count gate skipped the release check
  // exactly there, so a bounded run could retain the created native and still
  // exit 0. What must hold is "everything created was released", which is
  // meaningful whenever the phase ran at all.
  // The invariant is "nothing the extractor created is still resident", which
  // `released` alone cannot express: the engine reclaims its own temporaries
  // via `deleteTemporaries`, so some created natives are legitimately gone
  // before release runs (91 of 11 357 on MB-Khaya). Those count as accounted
  // for, not as released. A native that is neither freed by us nor already
  // gone is the actual leak, and only that fails.
  if ( bounded !== void 0 && bounded.failed === void 0 &&
       bounded.released + ( bounded.selfFreed ?? 0 ) !== bounded.assetsCreated ) {
    out.push( {
      text: `FAIL  bounded accounted for ` +
        `${bounded.released + ( bounded.selfFreed ?? 0 )} of ` +
        `${bounded.assetsCreated} geometries the extractor created ` +
        `(${bounded.released} released here, ${bounded.selfFreed ?? 0} already ` +
        'freed by the engine) — the remainder is still resident, so this run ' +
        'is not bounded',
      failed: true,
    } )
  }

  const bothDelivered = ( copyout?.instances ?? 0 ) > 0 && ( bounded?.instances ?? 0 ) > 0

  if ( bothDelivered ) {

    const same = bounded.placedDigest === copyout.placedDigest &&
      bounded.payloadDigest === copyout.payloadDigest

    out.push( same ?
      {
        text: `OK    bounded identical to copyout — release changed nothing ` +
          `(${bounded.instances} instances, ${bounded.released} released)`,
        failed: false,
      } :
      {
        text: 'FAIL  bounded differs from copyout: release alone changed delivery ' +
          `(${bounded.instances} instances vs ${copyout.instances}, ` +
          `placed ${bounded.placedDigest} vs ${copyout.placedDigest}, ` +
          `payload ${bounded.payloadDigest} vs ${copyout.payloadDigest})`,
        failed: true,
      } )
  }

  if ( classic?.instances === void 0 || !phases.includes( 'classic' ) ) {
    return out
  }

  if ( classic.instances === 0 ) {

    // A zero here has two causes that look identical from the outside: a model
    // with no geometry, and a probe that stopped firing. Nothing in the run
    // can tell them apart, so the caller declares the geometry-free models
    // (`#empty` in the models file) and everything else fails.
    out.push( allowEmpty ?
      { text: 'SKIP  classic delivered no instances — model declared geometry-free', failed: false } :
      {
        text: 'FAIL  classic delivered no instances on a model not declared ' +
          'geometry-free — the probe is broken, or the model belongs on the ' +
          '#empty list',
        failed: true,
      } )

    return out
  }

  for ( const phase of [ 'copyout', 'bounded' ] ) {

    const row = byPhase[ phase ]

    if ( row?.instances === void 0 ) {
      continue
    }

    if ( row.instances === 0 ) {
      out.push( {
        text: `FAIL  ${phase} delivered 0 instances against classic's ${classic.instances} ` +
          '— the phase produced nothing, so its digest proves nothing',
        failed: true,
      } )
      continue
    }

    const same = row.placedDigest === classic.placedDigest &&
      row.payloadDigest === classic.payloadDigest

    if ( same ) {
      out.push( { text: `OK    ${phase} identical to classic (${row.instances} instances)`, failed: false } )
      continue
    }

    const line =
      `${phase} differs from classic: ${row.instances} instances vs ` +
      `${classic.instances}, placed ${row.placedDigest} vs ${classic.placedDigest}, ` +
      `payload ${row.payloadDigest} vs ${classic.payloadDigest}`

    out.push( phase === 'bounded' ?
      { text: `DIFF  ${line}`, failed: false } :
      { text: `FAIL  ${line}`, failed: true } )
  }

  return out
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

  // `pumpGeometryBatch_` clamps with `Math.max( batchSize, 1 )`, so `--batch 0`
  // runs at 1 while every printed line and the JSON still say 0 — and the whole
  // point of the batch sweep is that the label identifies the configuration
  // that ran. A non-numeric value is worse: `NaN` never advances the demand
  // cursor, so the child loops forever rather than failing.
  if ( !Number.isInteger( batchSize ) || batchSize < 1 ) {
    console.error(
        `--batch must be a positive integer; got ${flag( '--batch' )}` )
    process.exit( 2 )
  }
  const repeats = Number( flag( '--repeats', 1 ) )

  // Fractional values were silently rounded up by the loop (`1.5` ran two
  // children) — a sampling configuration different from the one reported.
  // `Infinity` spawned children forever, and zero/negative/non-numeric left
  // `runs` empty so the later `reduce` threw with nothing useful to say.
  if ( !Number.isInteger( repeats ) || repeats < 1 ) {
    console.error(
        `--repeats must be a positive integer; got ${flag( '--repeats' )}` )
    process.exit( 2 )
  }
  const jsonOut = flag( '--json' )
  const only = flag( '--phases' )
  const phases = only !== void 0 ? only.split( ',' ) : PHASES
  const shards = flag( '--shards' )

  // Validate every requested phase centrally, so a typo cannot reach either
  // exit path. `runChild` derives its behaviour by exclusion — `deferred =
  // phase !== 'classic'`, `copies = phase === 'copyout' || 'bounded'` — so an
  // unrecognised name silently becomes a deferred, non-copying hybrid that
  // resembles no supported phase, runs, and publishes a timing row. That is
  // the mislabelled-experiment failure again (`--shard-mode contigous`,
  // `--strategy cliam`), and the shard path reached it after rejecting only
  // `classic`.
  const unknownPhases = phases.filter(
      ( phase ) => !PHASES.includes( phase ) && !EXTRACT_ONLY_PHASES.has( phase ) )

  if ( unknownPhases.length > 0 ) {
    console.error(
        `unknown phase(s) ${unknownPhases.join( ', ' )} — expected one of ` +
        `${[ ...PHASES, ...EXTRACT_ONLY_PHASES ].join( ', ' )}` )
    process.exit( 2 )
  }

  if ( modelsFile === void 0 ) {
    console.error(
        'usage: m3_pump_spike.mjs --models <file with one path per line> ' +
        '[--batch N] [--repeats N] [--phases a,b] [--json out]' )
    process.exit( 2 )
  }

  // A models-file line may be annotated `<path> #empty` to declare that the
  // model genuinely produces no geometry. Without that, a zero-instance
  // classic run is a broken probe rather than an empty model.
  const models = fs.readFileSync( modelsFile, 'utf8' )
      .split( '\n' )
      .map( ( line ) => line.trim() )
      .filter( ( line ) => line.length > 0 && !line.startsWith( '#' ) )
      .map( ( line ) => ( {
        path: line.replace( /\s*#empty\s*$/, '' ),
        allowEmpty: /\s#empty\s*$/.test( line ),
      } ) )

  // An empty or comment-only manifest yields an empty `models` array, and both
  // exit paths then complete having probed nothing — with `--json`, publishing
  // `[]` as a successful artifact. A generated or mis-pathed corpus must fail
  // rather than pass vacuously.
  if ( models.length === 0 ) {
    console.error(
        `${modelsFile} lists no models — nothing to measure` )
    process.exit( 2 )
  }

  const rows = []
  const failures = []

  if ( shards !== void 0 ) {

    // The phase name is already known-valid (checked above). What remains is
    // that `classic` opens without DEFER_GEOMETRY, so the pump worklists never
    // exist and the shard filter never runs: every child would extract the
    // WHOLE model while the output labelled them shards and computed a
    // speedup from them. Default to the deferred extract phase, and refuse the
    // non-deferred one rather than publishing invalid scaling.
    // `--repeats` is consumed by the per-model path only; the sweep ignores
    // it entirely, so `--shards 4 --repeats 3` ran ONE sweep and published a
    // single-sample timing to a caller who asked for three. Rejected rather
    // than honoured, for the same reason as a phase list: the sweep is a
    // different experiment shape (N shard counts, each a concurrent fan-out),
    // and repeating it is a change to what is measured rather than a knob —
    // the round-16 cross-repeat agreement check is defined over per-phase
    // child rows, which a sweep does not produce.
    if ( repeats !== 1 ) {
      console.error(
          `--repeats is not supported with --shards (got ${repeats}); the sweep ` +
          'measures scaling across shard counts, not repeated samples. Run the ' +
          'sweep more than once if you need repeats.' )
      process.exit( 2 )
    }

    // One sweep runs one phase, and taking `phases[0]` from a list meant
    // `--phases pump,bounded` ran `pump` and reported it while the caller
    // believed they had also measured the release. Reject rather than pick:
    // the sweep is a per-phase experiment, so asking for two is a question
    // this invocation cannot answer, not a preference to be resolved silently.
    if ( only !== void 0 && phases.length > 1 ) {
      console.error(
          `--shards runs one phase per sweep; got ${phases.length} ` +
          `(${phases.join( ', ' )}). Run them as separate invocations.` )
      process.exit( 2 )
    }

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
    // Validate BEFORE normalisation: `--shards 0` sorts ahead of the injected
    // N=1 baseline, so `spawnShards` launches no children, the empty result
    // list slips past the broken-child check, and the sweep prints
    // `geometry=-Infinitys` and `NaNx` ratios against a zero-shard row while
    // exiting 0.
    const invalid = requested.filter(
        ( count ) => !Number.isInteger( count ) || count < 1 )

    if ( invalid.length > 0 ) {
      console.error(
          `--shards must be positive integers; got ${invalid.join( ', ' )}` )
      process.exit( 2 )
    }

    const counts = [ ...new Set( [ 1, ...requested ] ) ].sort( ( a, b ) => a - b )

    if ( counts.length !== requested.length ) {
      console.log( `note: added an N=1 baseline (sweeping ${counts.join( ',' )})` )
    }

    return runShardSweep( models, shardPhase,
        batchSize, counts, jsonOut, shardMode( flag( '--shard-mode', 'roundrobin' ) ) )
  }

  for ( const { path: model, allowEmpty } of models ) {

    const name = path.basename( model )
    const byPhase = {}

    for ( const phase of phases ) {

      const runs = []

      for ( let repeat = 0; repeat < repeats; ++repeat ) {
        runs.push( spawnChild( phase, model, batchSize ) )
      }

      // Correctness is checked on EVERY repeat; only the timing comes from the
      // fastest. Keeping just the minimum meant an intermittent failure — a
      // flaky open, a callback that stopped firing, a release-count mismatch,
      // a digest divergence — was discarded whenever a healthy sibling ran
      // faster, which made `--repeats` least trustworthy for exactly the
      // flakiness repetition exists to expose. Repeats disagreeing with each
      // other is itself a finding: the same phase on the same model must
      // deliver the same geometry every time.
      const reference = runs[ 0 ]
      const divergent = runs.filter( ( run ) =>
        run.failed !== reference.failed ||
        run.instances !== reference.instances ||
        run.payloads !== reference.payloads ||
        run.released !== reference.released ||
        run.selfFreed !== reference.selfFreed ||
        run.assetsCreated !== reference.assetsCreated ||
        run.placedDigest !== reference.placedDigest ||
        run.payloadDigest !== reference.payloadDigest )

      if ( divergent.length > 0 ) {
        failures.push( `${name}: ${phase} was not reproducible across ` +
          `${repeats} repeats — ${divergent.length} run(s) differ from the ` +
          'first in delivery, release or digest; the fastest row would have ' +
          'hidden it' )
      }

      // Min of N for the reported row: wall-clock noise is one-sided, so the
      // minimum is the least-contaminated estimate. Memory is taken from the
      // same run so the row describes one coherent execution.
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

    for ( const line of verdicts( byPhase, phases, allowEmpty ) ) {
      console.log( `  ${line.text}` )

      if ( line.failed ) {
        // `import * as process` gives a frozen namespace, so exitCode cannot
        // be assigned — record and exit explicitly once every model is
        // reported, so a failure never costs the rest of the sweep's output.
        failures.push( `${name}: ${line.text}` )
      }
    }
  }

  if ( jsonOut !== void 0 ) {
    fs.writeFileSync( jsonOut, `${JSON.stringify( rows, null, 2 )}\n` )
  }

  if ( failures.length > 0 ) {
    console.error( `\n${failures.length} model(s) failed the delivery check:` )

    for ( const failure of failures ) {
      console.error( `  ${failure}` )
    }

    process.exit( 1 )
  }
}

await main()
