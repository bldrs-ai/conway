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
 *   node --expose-gc scripts/m3_worker_pool.mjs <model> [--workers 1,2,4]
 */
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'


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
  const tGeometry = performance.now()

  for ( ;; ) {

    const { extracted, remaining } = api.ExtractGeometryBatch(
        modelID, BATCH_SIZE, ( mesh ) => {

          for ( let where = 0; where < mesh.geometries.size(); ++where ) {

            const placed = mesh.geometries.get( where )

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

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  const geometryMs = performance.now() - tGeometry

  // Per-worker memory, read after the pump and before anything is released.
  //
  // `HEAPU8.byteLength` is this worker's OWN linear memory: worker_threads
  // give each thread its own isolate and each `IfcAPI` its own wasm instance,
  // so N of these are N separate heaps, which is exactly the shape production
  // can have (no COEP, so no SharedArrayBuffer). It is grow-only, so one read
  // after the fact IS the high-water mark. The V8 number is per-isolate for
  // the same reason. Process RSS is NOT per-worker — the main thread reads
  // VmHWM for the whole process instead.
  const v8 = await import( 'node:v8' )

  return {
    index: task.index,
    openMs,
    geometryMs,
    vertexFloats: sizes.vertexFloats,
    indexCount: sizes.indexCount,
    wasmHeapBytes: api.wasmModule?.HEAPU8?.byteLength ?? 0,
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
 * @return {number} Peak RSS in MB, or 0 where /proc is not available.
 */
async function peakRssMb() {

  try {

    const fs = await import( 'node:fs' )
    const status = fs.readFileSync( '/proc/self/status', 'utf8' )
    const found = ( /VmHWM:\s+(\d+) kB/ ).exec( status )

    return found === null ? 0 : Number( found[ 1 ] ) / 1024

  } catch {
    return 0
  }
}


if ( !isMainThread ) {

  runWorker( workerData )
      .then( ( result ) => parentPort.postMessage( { ok: true, ...result } ) )
      .catch( ( error ) => parentPort.postMessage(
          { ok: false, index: workerData.index, error: String( error ) } ) )

} else {

  const argv = process.argv.slice( 2 )
  const filePath = argv.find( ( value ) => !value.startsWith( '--' ) )

  if ( filePath === void 0 ) {
    console.error(
        'usage: m3_worker_pool.mjs <model> [--workers 1,2,4]' )
    process.exit( 2 )
  }

  const workersFlag = argv.indexOf( '--workers' )
  const counts = workersFlag >= 0 ?
    argv[ workersFlag + 1 ].split( ',' ).map( Number ) : DEFAULT_WORKERS

  if ( counts.some( ( count ) => !Number.isInteger( count ) || count < 1 ) ) {
    console.error( `--workers must be positive integers; got ${counts.join( ',' )}` )
    process.exit( 2 )
  }

  // Always run 1 first: every ratio below is against it, and it is also the
  // reference the union is compared to.
  const sweep = [ ...new Set( [ 1, ...counts ] ) ].sort( ( a, b ) => a - b )

  let referenceDigest
  let referenceWall
  let referenceGeometry
  let referenceUnion
  let referencePayloads

  for ( const count of sweep ) {

    const started = performance.now()

    const results = await Promise.all(
        Array.from( { length: count }, ( _, index ) =>
          new Promise( ( resolve, reject ) => {

            const worker = new Worker( fileURLToPath( import.meta.url ), {
              // No execArgv: a worker inherits the parent's V8 flags, and
              // passing --expose-gc explicitly is rejected as an invalid
              // worker flag.
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
    const payloadUnion =
      [ ...new Set( results.flatMap( ( result ) => result.payloads ) ) ].sort()

    // Deduped across shards: a geometry two shards both built is one
    // geometry in the model. `payloadUnion` is already the deduped set and
    // both modes encode the sizes in it, so read them back from there rather
    // than summing the per-shard counters (which would double-count exactly
    // the duplication being measured).
    let vertexFloats = 0
    let triangles = 0

    for ( const entry of payloadUnion ) {

      // `${geometryExpressID}:${vertexFloats}:${indexCount}:${digest?}`
      const parts = entry.split( ':' )

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
    }

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
      const shardedSet = new Set( union )
      const missing = referenceUnion.filter( ( key ) => !shardedSet.has( key ) )
      const extra = union.filter( ( key ) => !referenceSet.has( key ) )
      const referencePayloadSet = new Set( referencePayloads )
      const payloadsDiffer =
        payloadUnion.filter( ( key ) => !referencePayloadSet.has( key ) ).length

      detail =
        `\n       placements ${union.length} vs ${referenceUnion.length} ` +
        `(missing ${missing.length}, extra ${extra.length}); ` +
        `payload entries not in the reference: ${payloadsDiffer}`
    }

    const verdict = ( matched ?
      'OK   union matches the single-worker load' :
      'FAIL union DIFFERS from the single-worker load (placements or payloads)' ) +
      detail

    const slowestGeometry = Math.max( ...results.map( ( r ) => r.geometryMs ) )
    const slowestOpen = Math.max( ...results.map( ( r ) => r.openMs ) )
    // Summed shard CPU against the single-worker time is the DUPLICATION
    // factor: what the partition costs in total work, separately from what
    // imbalance costs in wall clock. The two degrade efficiency for different
    // reasons and want different fixes, so they are reported apart.
    const totalGeometry = results.reduce( ( sum, r ) => sum + r.geometryMs, 0 )
    const wasmMb = results.map( ( r ) => ( r.wasmHeapBytes / 1048576 ).toFixed( 0 ) )
    const v8Mb = results.map( ( r ) => ( r.v8HeapBytes / 1048576 ).toFixed( 0 ) )

    if ( referenceGeometry === void 0 ) {
      referenceGeometry = slowestGeometry
    }

    console.log(
        `workers=${count} wall=${( wallMs / MS_PER_S ).toFixed( 1 )}s ` +
        `(${( referenceWall / wallMs ).toFixed( 2 )}x) ` +
        `open=${( slowestOpen / MS_PER_S ).toFixed( 1 )}s ` +
        `geometry=${( slowestGeometry / MS_PER_S ).toFixed( 1 )}s ` +
        `(${( referenceGeometry / slowestGeometry ).toFixed( 2 )}x, ` +
        `eff=${( referenceGeometry / ( slowestGeometry * count ) ).toFixed( 3 )}, ` +
        `dup=${( totalGeometry / referenceGeometry ).toFixed( 2 )}x) ` +
        `instances=${union.length} ` +
        `per-shard=${results.map( ( r ) => r.placements.length ).join( '/' )} ` +
        `shard-geometry=${results.map( ( r ) =>
          ( r.geometryMs / MS_PER_S ).toFixed( 1 ) ).join( '/' )}s ` +
        `wasm=${wasmMb.join( '/' )}MB v8=${v8Mb.join( '/' )}MB ` +
        `peakRss=${( await peakRssMb() ).toFixed( 0 )}MB` )

    console.log( `  ${verdict}` )

    if ( vertexFloats > 0 ) {
      console.log(
          `  geometry built: ${( vertexFloats / 6 ).toLocaleString( 'en-US' )} ` +
          `vertices (at 6 floats each), ` +
          `${triangles.toLocaleString( 'en-US' )} triangles, ` +
          `${payloadUnion.length.toLocaleString( 'en-US' )} unique geometries` )
    }

    // After the report, never before it: a wrong partition is not a slow
    // result, and anything scripting this must not keep the timings — but a
    // human reading the output needs them to work out WHY it is wrong.
    if ( !matched ) {
      globalThis.process.exitCode = 1
    }
  }
}
