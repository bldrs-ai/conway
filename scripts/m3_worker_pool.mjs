/**
 * A worker pool for demand-driven geometry extraction — the across-product
 * parallelism axis, running for real rather than simulated by processes.
 *
 * Each worker opens the model, claims a shard with `SetGeometryShard`, and
 * pumps to completion. There is NO scheduling channel between them:
 * placement is a pure function of the product (its representation's mapped
 * source), so N workers independently agree on who owns what, and products
 * sharing geometry land together instead of every shard rebuilding it.
 *
 * **Every worker parses.** The index could be transferred instead — the
 * columns are four typed arrays and `IfcStepModel` takes them directly — but
 * that needs a construct-from-columns entry on the open path, which does not
 * exist yet. Parsing per worker costs N times the parse CPU and N copies of
 * the index in memory, while costing only ONE parse of latency, because they
 * run concurrently. So it is the right shape to measure first: if the
 * geometry win covers it, transfer is an optimisation rather than a
 * prerequisite, and this script is what says which.
 *
 * Correctness is checked, not assumed: the union of the shards' placements
 * must equal what a single unsharded worker delivers. A pool that loses or
 * duplicates instances is not faster, it is wrong.
 *
 * **The sweep runs every worker count in ONE process**, so the kernel's
 * `VmHWM` it reports is a cumulative high-water mark over the whole sweep
 * rather than a per-N peak — see `peakRssMb`.
 *
 *   node scripts/m3_worker_pool.mjs <model> [--workers 1,2,4]
 *
 * D3D needs `--max-old-space-size=12288`; nothing here calls `gc()`, so
 * `--expose-gc` buys nothing and is deliberately not in that line.
 */
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

import { wasmHeapByteLength } from '../compiled/src/core/wasm_heap.js'


const REPO_ROOT = path.resolve( fileURLToPath( new URL( '.', import.meta.url ) ), '..' )
const DEFAULT_WORKERS = [ 1, 2, 4 ]
const BATCH_SIZE = 64
const MS_PER_S = 1000


/**
 * A transform's exact bytes, as a comparable string.
 *
 * Rounding here would make the union check unable to fail: a shard that
 * shifted a component by less than half the last printed digit would
 * serialize identically to the reference and report OK on output that is
 * not the same output. The whole point of this script is detecting that,
 * so the encoding has to be lossless.
 *
 * @param {ArrayLike<number>} transform The flat transformation.
 * @return {string} A lossless encoding of every component.
 */
function transformKey( transform ) {

  const exact = new Float64Array( transform )

  return Buffer.from( exact.buffer, exact.byteOffset, exact.byteLength )
      .toString( 'base64' )
}


/**
 * Payload entries grouped by the geometry ID they encode.
 *
 * An entry is `${id}:${vertexFloats}:${indexCount}:${digest?}`, so a set over
 * whole entries is a set over (geometry, how it came out) pairs, NOT over
 * geometries: one ID built differently by two shards is two members. Every
 * count that is about the model rather than about the encoding has to come
 * through here.
 *
 * @param {string[]} entries Payload entries, any order.
 * @return {Map<string, string[]>} ID to its encodings, in the input's order.
 */
function groupPayloadsById( entries ) {

  const byId = new Map()

  for ( const entry of entries ) {

    const id = entry.slice( 0, entry.indexOf( ':' ) )
    const existing = byId.get( id )

    if ( existing === void 0 ) {
      byId.set( id, [ entry ] )
    } else {
      existing.push( entry )
    }
  }

  return byId
}


/**
 * One worker: open, claim a shard, pump it dry, report what it delivered.
 *
 * Reports per-placement digests rather than a count, so the union check can
 * catch a shard that delivers the right NUMBER of instances at the wrong
 * placements — which is what a mis-shared representation looks like.
 *
 * @param {object} task `{filePath, index, count}`.
 * @return {Promise<object>} What this shard produced.
 */
async function runWorker( task ) {

  const fs = await import( 'node:fs' )
  const { IfcAPI } = await import( '../compiled/src/compat/web-ifc/ifc_api.js' )

  const noPayloadDigest = process.env.NO_PAYLOAD_DIGEST === '1'
  const api = new IfcAPI()

  await api.Init()

  const bytes = new Uint8Array( fs.readFileSync( task.filePath ) )
  const tOpen = performance.now()

  // No COORDINATE_TO_ORIGIN: the recentre anchor is derived from whichever
  // product a model captures first, so shards would each derive their own
  // and merge subsets shifted by whole grid cells on a model spanning more
  // than one recentre cell. SetGeometryShard refuses the combination; this
  // is the other half of that decision.
  const modelID = await api.OpenModelStreamed( bytes, {
    USE_FAST_BOOLS: true,
    DEFER_GEOMETRY: true,
  } )

  const openMs = performance.now() - tOpen

  if ( task.count > 1 ) {
    api.SetGeometryShard( modelID, { index: task.index, count: task.count } )
  }

  const placements = []

  // Payload digests too, not just placements. Identical express IDs and
  // transforms can sit over different vertex data — a cache-order or
  // master-void regression looks exactly like that — so a placement-only
  // digest would report OK on visibly different geometry. Hashed once per
  // geometry, since instances share it.
  const payloads = new Map()
  // Accumulated over UNIQUE geometries only (the map guards re-entry), so a
  // shard's totals are what it built, not what it instanced.
  const sizes = { vertexFloats: 0, indexCount: 0 }
  // `placed.geometryExpressID` is `getElementByLocalID( ... )?.expressID as
  // number` at four sites in `ifc_api_proxy_ifc.ts`, so it can be undefined.
  // Undefined stringifies to "undefined" in the payload key, which would
  // collapse EVERY such geometry into one bucket per worker — deflating the
  // unique-geometry count and manufacturing a cross-shard difference out of
  // nothing. The residual divergence this script reports is read as evidence
  // for a specific engine hypothesis, so the case is excluded by
  // construction: skipped here, then failed loudly below.
  let unidentifiedGeometries = 0
  const tGeometry = performance.now()
  // The FIRST batch call is where `ensureDemandWorklists_` runs (see
  // `ifc_api_proxy_ifc.ts:extractGeometryBatch`), and demand prep is
  // whole-model work that a shard does not shrink: the product walk over
  // every `IfcProduct`, `aggregateTargetLocalIDs()` scanning every
  // `IfcRelAggregates`, and `computeDispatchKeys` over the resulting
  // worklist. Every worker in the pool does ALL of it, so it is replicated N
  // times inside a window that gets read as geometry — which is a third
  // thing summed shard time can be, alongside rebuilt geometry and
  // contention, and the one that neither `dupWall` nor `dupWork` can see.
  //
  // It is an UPPER bound: the same call also extracts its own batch of
  // BATCH_SIZE products. That overstates prep by one batch of geometry,
  // which is tight wherever prep is the term worth naming.
  let firstBatchMs = 0
  let batches = 0

  for ( ;; ) {

    const tBatch = performance.now()
    const { extracted, remaining } = api.ExtractGeometryBatch(
        modelID, BATCH_SIZE, ( mesh ) => {

          for ( let where = 0; where < mesh.geometries.size(); ++where ) {

            const placed = mesh.geometries.get( where )

            if ( !Number.isInteger( placed.geometryExpressID ) ) {
              ++unidentifiedGeometries
              continue
            }

            // Entity, geometry, colour and transform. Without the entity a
            // placement attributed to the wrong FlatMesh reads identical
            // (picking and metadata differ, geometry does not); without the
            // colour a different material resolving to the same mesh does
            // too.
            placements.push(
                `${mesh.expressID}/${placed.geometryExpressID}` +
                `#${placed.color.x},${placed.color.y},${placed.color.z},${placed.color.w}` +
                `@${transformKey( placed.flatTransformation )}` )

            if ( !payloads.has( placed.geometryExpressID ) ) {

              // GetGeometry hands back an OWNING clone, and embind
              // finalization is nondeterministic — keeping one per geometry
              // for the length of a run inflates both the timings this
              // script reports and the memory it needs to report them.
              const geometry = api.GetGeometry( modelID, placed.geometryExpressID )

              try {

                const vertices = api.GetVertexArray(
                    geometry.GetVertexData(), geometry.GetVertexDataSize() )
                const indices = api.GetIndexArray(
                    geometry.GetIndexData(), geometry.GetIndexDataSize() )

                // The digest is the union check's evidence, and it is also
                // harness cost that a real pool would not pay — charged once
                // per shard that touches a shared geometry, so it rides on
                // exactly the duplication term the efficiency number is
                // trying to measure. NO_PAYLOAD_DIGEST=1 keeps the copy-out
                // (which a consumer does pay) and drops only the hash, to
                // bound how much of a reported loss is the instrument.
                // Sizes travel alongside the digest in BOTH modes, so the
                // run can prove it did the work (vertex/triangle totals
                // against the model's known figures) without depending on
                // which verification mode is on. A timing line alone cannot
                // distinguish a fast run from a skipped one.
                sizes.vertexFloats += vertices.length
                sizes.indexCount += indices.length

                // Sizes ALWAYS, digest optionally. Sizes alone already
                // catch a shard building different topology (which is what
                // D3D turned out to do); the digest additionally catches
                // same-sized geometry with different values.
                const digested = noPayloadDigest ? '' :
                  createHash( 'sha256' )
                      .update( new Uint8Array( vertices.buffer, vertices.byteOffset,
                          vertices.byteLength ) )
                      .update( new Uint8Array( indices.buffer, indices.byteOffset,
                          indices.byteLength ) )
                      .digest( 'hex' )

                payloads.set( placed.geometryExpressID,
                    `${vertices.length}:${indices.length}:${digested}` )

              } finally {
                geometry.delete()
              }
            }
          }
        } )

    if ( batches === 0 ) {
      firstBatchMs = performance.now() - tBatch
    }

    ++batches

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  const geometryMs = performance.now() - tGeometry

  // After the pump, not inside the callback: throwing across the embind
  // boundary is not a supported unwind.
  if ( unidentifiedGeometries > 0 ) {
    throw new Error(
        `shard ${task.index}: ${unidentifiedGeometries} placements carry a ` +
        'non-integer geometryExpressID, so the payload key cannot identify ' +
        'their geometry and every union count below would be wrong' )
  }

  // Per-worker memory, read after the pump and before anything is released.
  //
  // The wasm figure is this worker's OWN linear memory: worker_threads give
  // each thread its own isolate and each `IfcAPI` its own wasm instance, so N
  // of these are N separate heaps, which is exactly the shape production can
  // have (no COEP, so no SharedArrayBuffer). Linear memory is grow-only, so
  // one read after the fact IS its high-water mark — but only if the read
  // sees the current heap. `wasmHeapByteLength` is in the repo precisely
  // because `HEAPU8.length` on its own under-reports by a whole growth step
  // whenever the module's cached views are behind (#485); reading the view
  // directly here would have silently under-reported the peak this run
  // exists to bound. Same call the sibling bench `m3_pump_spike.mjs` makes.
  //
  // The V8 figure is NOT a high-water mark of anything: `used_heap_size` is
  // an instantaneous reading taken at this one point after the pump. It is
  // per-isolate, so it is per-worker, but it is a snapshot next to a peak.
  // Process RSS is neither — the main thread reads VmHWM for the whole
  // process instead.
  const v8 = await import( 'node:v8' )

  return {
    index: task.index,
    openMs,
    geometryMs,
    firstBatchMs,
    vertexFloats: sizes.vertexFloats,
    indexCount: sizes.indexCount,
    wasmHeapBytes: wasmHeapByteLength( api.wasmModule ),
    v8HeapBytes: v8.getHeapStatistics().used_heap_size,
    placements,
    payloads: [ ...payloads ].map( ( [ id, hash ] ) => `${id}:${hash}` ),
  }
}


/**
 * The process's peak resident set, in MB, from the kernel rather than from V8.
 *
 * `process.memoryUsage().rss` is an instant; a pool's peak happens while the
 * workers are alive and is gone by the time the main thread reads anything.
 * `VmHWM` is the kernel's own high-water mark for the whole process, so it
 * survives worker teardown — which is the number the memory question in
 * load-performance-ledger.md §4 actually needs.
 *
 * **It is a SWEEP high-water mark, not a per-N peak, and the caller labels it
 * that way.** `VmHWM` never falls, the whole sweep runs N=1 → 2 → 4 in one
 * process, and the main thread holds the reference union (562,367 placement
 * strings on D3D) and the reference payloads for the entire sweep. So the row
 * printed for N=4 is the peak of a process that has already run N=1 and N=2
 * and is still carrying N=1's output. The direction is pessimistic — the true
 * per-N figure is at or below what is printed — but a per-N number needs one
 * worker count per process invocation.
 *
 * @return {number | undefined} Peak RSS in MB, or undefined where /proc could
 * not be read — never 0, which is a plausible-looking measurement.
 */
async function peakRssMb() {

  const fs = await import( 'node:fs' )
  let status

  // Reported, not swallowed: a bare `catch { return 0 }` here prints a
  // credible `0MB` for an unreadable file, which is the same class of silent
  // failure as the union check that could not report (§11.5).
  try {
    status = fs.readFileSync( '/proc/self/status', 'utf8' )
  } catch ( error ) {
    console.error( `  peak RSS unavailable: /proc/self/status: ${error}` )

    return void 0
  }

  const found = ( /VmHWM:\s+(\d+) kB/ ).exec( status )

  if ( found === null ) {
    console.error( '  peak RSS unavailable: no VmHWM line in /proc/self/status' )

    return void 0
  }

  return Number( found[ 1 ] ) / 1024
}


if ( !isMainThread ) {

  runWorker( workerData )
      .then( ( result ) => parentPort.postMessage( { ok: true, ...result } ) )
      .catch( ( error ) => parentPort.postMessage(
          { ok: false, index: workerData.index, error: String( error ) } ) )

} else {

  const argv = process.argv.slice( 2 )
  const usage = 'usage: m3_worker_pool.mjs <model> [--workers 1,2,4]'

  /**
   * Give up with a usage line rather than measure the wrong thing.
   *
   * @param {string} why What is wrong with the arguments.
   * @return {never} Does not return.
   */
  function refuse( why ) {

    console.error( `${why}\n${usage}` )
    process.exit( 2 )
  }

  // Parsed positionally rather than by "the first argument that is not a
  // flag": that shape reads `--workers 2,4 model.ifc` as a model path of
  // `2,4`. It happens to fail loudly at readFileSync today, so no wrong
  // number was ever produced by it, but the failure names the wrong thing.
  const workersFlag = argv.indexOf( '--workers' )
  // -1 when the flag is absent, NOT `workersFlag + 1` — that is 0, which
  // would filter out argv[0] and reject the one-argument invocation.
  const workersValueAt = workersFlag >= 0 ? workersFlag + 1 : -1
  const positional = argv.filter( ( value, at ) =>
    !value.startsWith( '--' ) && at !== workersValueAt )

  if ( positional.length !== 1 ) {
    refuse( positional.length === 0 ? 'no model given' :
      `expected one model path, got ${positional.length}: ${positional.join( ' ' )}` )
  }

  const [ filePath ] = positional

  if ( workersFlag >= 0 && argv[ workersFlag + 1 ] === void 0 ) {
    refuse( '--workers needs a value' )
  }

  const counts = workersFlag >= 0 ?
    argv[ workersFlag + 1 ].split( ',' ).map( Number ) : DEFAULT_WORKERS

  if ( counts.length === 0 ||
       counts.some( ( count ) => !Number.isInteger( count ) || count < 1 ) ) {
    refuse( `--workers must be positive integers; got ${counts.join( ',' )}` )
  }

  // Always run 1 first: every ratio below is against it, and it is also the
  // reference the union is compared to.
  const sweep = [ ...new Set( [ 1, ...counts ] ) ].sort( ( a, b ) => a - b )

  let referenceDigest
  let referenceWall
  let referenceGeometry
  let referenceUnion
  let referencePayloads
  // The N=1 run's own work counts, for the duplication factors below.
  let referenceFirstBatch
  let referenceWork
  let referenceVertexFloats

  for ( const count of sweep ) {

    const started = performance.now()

    const results = await Promise.all(
        Array.from( { length: count }, ( _, index ) =>
          new Promise( ( resolve, reject ) => {

            const worker = new Worker( fileURLToPath( import.meta.url ), {
              // No execArgv: a worker inherits the parent's V8 flags, which
              // is what gets --max-old-space-size to the shards. (Nothing
              // here calls gc(), so there is no --expose-gc to pass on
              // either — it used to be in the usage line and was inert.)
              workerData: { filePath: path.resolve( REPO_ROOT, filePath ), index, count },
            } )

            worker.on( 'message', ( message ) => {
              worker.terminate()
              message.ok ? resolve( message ) : reject( new Error( message.error ) )
            } )

            worker.on( 'error', reject )
          } ) ) )

    const wallMs = performance.now() - started

    // Order-independent: shards finish in any order, and the union is a
    // multiset. Sorting before hashing is what makes two runs comparable.
    const union = results.flatMap( ( result ) => result.placements ).sort()

    // Payload hashes are per geometry, so shards that both touched one report
    // it twice; dedupe before hashing or the digest would depend on how the
    // partition happened to split shared geometry.
    //
    // Deduping the WHOLE ENTRY only merges shards that AGREE, though. An
    // entry is `${id}:${vertexFloats}:${indexCount}:${digest?}`, so this set
    // is over (geometry, how it came out) pairs: one ID that two shards built
    // differently contributes TWO members. That makes `payloadUnion.length` a
    // count of payload ENCODINGS, not of geometries, and the two are reported
    // separately below — their difference is the divergence signal itself,
    // and calling the encoding count "unique geometries" (which this script
    // used to do) turns a defect report into a claim about the model.
    const payloadUnion =
      [ ...new Set( results.flatMap( ( result ) => result.payloads ) ) ].sort()
    const payloadsById = groupPayloadsById( payloadUnion )

    // One entry per distinct ID, so a divergent geometry counts once rather
    // than twice. `payloadUnion` is sorted, so the encoding kept for an ID is
    // the lexicographically first of its encodings. That choice is ARBITRARY
    // — the point of an ID with several encodings is that there is no right
    // one — and it is made only because it is deterministic, which is what
    // makes two runs comparable. Where the encodings differ, read the
    // divergence counters rather than these totals.
    let vertexFloats = 0
    let triangles = 0

    for ( const encodings of payloadsById.values() ) {

      const parts = encodings[ 0 ].split( ':' )

      vertexFloats += Number( parts[ 1 ] )
      triangles += Number( parts[ 2 ] ) / 3
    }

    const digest = createHash( 'sha256' )
        .update( union.join( '\n' ) )
        .update( '\u0000' )
        .update( payloadUnion.join( '\n' ) )
        .digest( 'hex' )

    if ( referenceDigest === void 0 ) {
      referenceDigest = digest
      referenceWall = wallMs
    }

    const matched = digest === referenceDigest

    if ( referenceUnion === void 0 ) {
      referenceUnion = union
      referencePayloads = payloadUnion
      referenceFirstBatch =
        results.reduce( ( sum, r ) => sum + r.firstBatchMs, 0 )
      referenceWork = results.reduce( ( sum, r ) => sum + r.payloads.length, 0 )
      referenceVertexFloats =
        results.reduce( ( sum, r ) => sum + r.vertexFloats, 0 )
    }

    // Duplicate placements are invisible to missing/extra, which are set
    // differences: a placement TWO shards both delivered is in the reference
    // set and in the sharded set, so the classic partition failure — every
    // shard doing everything — reports "missing 0, extra 0". The multiset
    // length against the set length is what catches it, so it is computed on
    // every run rather than only on a mismatch.
    const shardedSet = new Set( union )
    const duplicatePlacements = union.length - shardedSet.size

    // What a mismatch actually is, not just that there is one.
    //
    // This path had never executed before D3D: `process` here is an ESM
    // NAMESPACE (`import * as process`), whose properties are read-only, so
    // the `process.exitCode = 1` that used to sit above threw a TypeError and
    // took the run down before it printed a single timing — the union check
    // could detect a bad partition but never report one. Assign through
    // globalThis, and print the timings and a decomposition FIRST, so a
    // mismatch is a diagnosis rather than a crash.
    let detail = ''

    if ( !matched ) {

      const referenceSet = new Set( referenceUnion )
      const missing = referenceUnion.filter( ( key ) => !shardedSet.has( key ) )
      const extra = union.filter( ( key ) => !referenceSet.has( key ) )
      const referencePayloadSet = new Set( referencePayloads )
      const payloadSet = new Set( payloadUnion )

      // BOTH directions. Counting only `sharded \ reference` reports 0 for a
      // pool that LOSES geometry — the more serious of the two failures, and
      // the one the D3D numbers turned out to contain.
      const encodingsNotInReference =
        payloadUnion.filter( ( key ) => !referencePayloadSet.has( key ) ).length
      const encodingsNotRebuilt =
        referencePayloads.filter( ( key ) => !payloadSet.has( key ) ).length

      // And by ID, because an ID no shard ever built and an ID that came out
      // DIFFERENT are two different engine bugs — a visibility hole versus a
      // shard-dependent build — and an encoding-level count conflates them.
      const referenceById = groupPayloadsById( referencePayloads )
      let idsOnlyInSharded = 0
      let idsChanged = 0

      for ( const [ id, encodings ] of payloadsById ) {

        const reference = referenceById.get( id )

        if ( reference === void 0 ) {
          ++idsOnlyInSharded
        } else if ( encodings.join( '\u0000' ) !== reference.join( '\u0000' ) ) {
          ++idsChanged
        }
      }

      let idsNotRebuilt = 0

      for ( const id of referenceById.keys() ) {

        if ( !payloadsById.has( id ) ) {
          ++idsNotRebuilt
        }
      }

      detail =
        `\n       placements ${union.length} vs ${referenceUnion.length} ` +
        `(missing ${missing.length}, extra ${extra.length}, ` +
        `duplicated ${duplicatePlacements})` +
        `\n       payload encodings ${payloadUnion.length} vs ` +
        `${referencePayloads.length} (${encodingsNotInReference} not in the ` +
        `reference, ${encodingsNotRebuilt} of the reference's not reproduced)` +
        `\n       geometry IDs ${payloadsById.size} vs ${referenceById.size} ` +
        `(${idsOnlyInSharded} the reference never built, ` +
        `${idsNotRebuilt} no shard reproduced, ${idsChanged} built differently)`
    }

    const verdict = ( matched ?
      'OK   union matches the single-worker load' :
      'FAIL union DIFFERS from the single-worker load (placements or payloads)' ) +
      detail

    const slowestGeometry = Math.max( ...results.map( ( r ) => r.geometryMs ) )
    const slowestOpen = Math.max( ...results.map( ( r ) => r.openMs ) )

    // Three duplication factors, because one of them cannot carry the claim
    // that gets made from it.
    //
    // `dupWall` is summed shard geometry time against the single worker's.
    // It is WALL time (`performance.now()` around each shard's pump), not
    // CPU: no `getrusage`, no per-thread clock. So it answers "how much more
    // shard-time did the partition spend" and CANNOT separate its two causes
    // — each shard doing twice the work, versus each shard running at half
    // speed against the same work under memory-bandwidth or cache contention.
    // Both land as 2.0x. Reading a mechanism off it alone is the error this
    // script previously invited by calling it CPU.
    //
    // `dupWork` and `dupVerts` are immune to that, because they count WORK
    // rather than time: how many geometries the shards built in total, and
    // how many vertex floats those came to, both against the single worker's
    // own totals. The per-shard counters accumulate over unique geometries
    // only (the `payloads` map guards re-entry), so a shard's contribution is
    // what it BUILT, not what it instanced. `dupWork ~= dupWall` means the
    // loss is rebuilt geometry; `dupWork ~= 1` with `dupWall ~= N` means the
    // shards each did their own share and simply ran slower, which is
    // contention and wants a completely different fix.
    const totalGeometry = results.reduce( ( sum, r ) => sum + r.geometryMs, 0 )
    // `dupPrep` is the third term: whole-model demand prep, replicated per
    // worker, and it is duplicated WORK that `dupWork` cannot count because
    // it produces no geometry. It rises with N by construction — N workers,
    // N preps — so on a model where prep is a large share of T1 it caps
    // efficiency on its own, and no partition change touches it.
    const totalFirstBatch =
      results.reduce( ( sum, r ) => sum + r.firstBatchMs, 0 )
    const totalWork = results.reduce( ( sum, r ) => sum + r.payloads.length, 0 )
    const totalVertexFloats =
      results.reduce( ( sum, r ) => sum + r.vertexFloats, 0 )
    const wasmMb = results.map( ( r ) => ( r.wasmHeapBytes / 1048576 ).toFixed( 0 ) )
    const v8Mb = results.map( ( r ) => ( r.v8HeapBytes / 1048576 ).toFixed( 0 ) )

    if ( referenceGeometry === void 0 ) {
      referenceGeometry = slowestGeometry
    }

    // Labelled `sweep` in the output because that is what VmHWM is here: it
    // never falls, every worker count runs in this one process, and the main
    // thread holds the reference union throughout. See `peakRssMb`.
    const sweepPeakRss = await peakRssMb()

    console.log(
        `workers=${count} wall=${( wallMs / MS_PER_S ).toFixed( 1 )}s ` +
        `(${( referenceWall / wallMs ).toFixed( 2 )}x) ` +
        `open=${( slowestOpen / MS_PER_S ).toFixed( 1 )}s ` +
        `geometry=${( slowestGeometry / MS_PER_S ).toFixed( 1 )}s ` +
        `(${( referenceGeometry / slowestGeometry ).toFixed( 2 )}x, ` +
        `eff=${( referenceGeometry / ( slowestGeometry * count ) ).toFixed( 3 )}, ` +
        `dupWall=${( totalGeometry / referenceGeometry ).toFixed( 2 )}x, ` +
        `dupWork=${( totalWork / referenceWork ).toFixed( 2 )}x, ` +
        `dupPrep=${( totalFirstBatch / referenceFirstBatch ).toFixed( 2 )}x, ` +
        `dupVerts=${( totalVertexFloats / referenceVertexFloats ).toFixed( 2 )}x) ` +
        `instances=${union.length} (duplicated ${duplicatePlacements}) ` +
        `per-shard=${results.map( ( r ) => r.placements.length ).join( '/' )} ` +
        `shard-geometry=${results.map( ( r ) =>
          ( r.geometryMs / MS_PER_S ).toFixed( 1 ) ).join( '/' )}s ` +
        `shard-built=${results.map( ( r ) => r.payloads.length ).join( '/' )} ` +
        `shard-prep=${results.map( ( r ) =>
          ( r.firstBatchMs / MS_PER_S ).toFixed( 1 ) ).join( '/' )}s ` +
        `wasm=${wasmMb.join( '/' )}MB v8=${v8Mb.join( '/' )}MB(instant) ` +
        `sweepPeakRss=${sweepPeakRss === void 0 ? 'n/a' :
          `${sweepPeakRss.toFixed( 0 )}MB`}` )

    console.log( `  ${verdict}` )

    // Asserted, not gated. This line exists BECAUSE a timing line cannot
    // distinguish a fast run from a skipped one, so `if ( vertexFloats > 0 )`
    // gave it the one failure mode it must not have: a payload format change
    // makes `Number( parts[ 1 ] )` NaN, `NaN > 0` is false, and the proof
    // line vanishes silently — indistinguishable from running an older build.
    if ( !Number.isFinite( vertexFloats ) || vertexFloats <= 0 ) {
      throw new Error(
          `the payload entries decode to ${vertexFloats} vertex floats, so ` +
          'this run cannot prove it built any geometry; the entry encoding ' +
          'and this reader have diverged' )
    }

    console.log(
        `  geometry built: ${( vertexFloats / 6 ).toLocaleString( 'en-US' )} ` +
        `vertices (at 6 floats each), ` +
        `${triangles.toLocaleString( 'en-US' )} triangles, ` +
        `${payloadsById.size.toLocaleString( 'en-US' )} unique geometries by ` +
        `ID, ${payloadUnion.length.toLocaleString( 'en-US' )} payload ` +
        `encodings` )

    // After the report, never before it: a wrong partition is not a slow
    // result, and anything scripting this must not keep the timings — but a
    // human reading the output needs them to work out WHY it is wrong.
    if ( !matched ) {
      globalThis.process.exitCode = 1
    }
  }
}
