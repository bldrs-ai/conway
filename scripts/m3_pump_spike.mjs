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
 * or none (`pump`), and hashes them into a digest so the M3 exit criterion —
 * *M3 changes when work happens, not what it produces* — is checked rather
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
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import { performance } from 'node:perf_hooks'

const PHASES = [ 'classic', 'pump', 'copyout', 'bounded' ]

const DEFAULT_BATCH = 64
const BYTES_PER_MB = 1024 * 1024

const REPO_ROOT = path.dirname( path.dirname( new URL( import.meta.url ).pathname ) )

/** Node heap ceiling for the children — PSB-class models need the headroom. */
const CHILD_MAX_OLD_SPACE_MB = 12288

/**
 * FNV-1a over the geometry a phase actually delivers. Fed the placement and
 * the payload bytes, so a phase that drops an instance, reorders placement,
 * or serves different vertices diverges — the "same output, different
 * timing" invariant M3 is held to.
 */
class Digest {

  constructor() {
    this.hash = 2166136261
    this.instances = 0
    this.payloads = 0
    this.payloadBytes = 0
  }

  /**
   * Mix one 32-bit value in.
   *
   * @param value Any number; non-integers are mixed through their float bits.
   */
  mix( value ) {
    this.hash = Math.imul( this.hash ^ ( value | 0 ), 16777619 ) >>> 0
  }

  /**
   * Mix a float, quantised so f32/f64 round-trips through the two paths
   * (native dmat4 vs copied floats) don't produce spurious divergence.
   *
   * @param value The float to mix.
   */
  mixFloat( value ) {
    this.mix( Math.round( value * 1024 ) )
  }

  /**
   * Mix one placed instance.
   *
   * @param expressID The product's express ID.
   * @param geometryExpressID The geometry's express ID.
   * @param transform The 16-element placement.
   */
  placed( expressID, geometryExpressID, transform ) {
    ++this.instances
    this.mix( expressID )
    this.mix( geometryExpressID )

    for ( const component of transform ) {
      this.mixFloat( component )
    }
  }

  /**
   * Mix one geometry payload (mixed once per geometry, as it is emitted).
   *
   * @param vertices Interleaved position+normal floats.
   * @param indices Triangle indices.
   */
  payload( vertices, indices ) {
    ++this.payloads
    this.payloadBytes += vertices.byteLength + indices.byteLength
    this.mix( vertices.length )
    this.mix( indices.length )

    // Sample rather than hash every float: a full hash of PSB's ~2 GB of
    // vertex data would dominate the measurement it is there to validate.
    // Stride 97 (prime, > any vertex stride) so the sample can't alias to
    // one component of the interleaved layout.
    for ( let i = 0; i < vertices.length; i += 97 ) {
      this.mixFloat( vertices[ i ] )
    }

    for ( let i = 0; i < indices.length; i += 97 ) {
      this.mix( indices[ i ] )
    }
  }
}

/** Retained JS working set, after a collect so transient garbage isn't counted. */
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
 * @return {number[]} Geometry express IDs copied by this call.
 */
function copyBatchPayloads( api, modelID, meshes, seen, digest ) {

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

      const geometry = api.GetGeometry( modelID, placed.geometryExpressID )
      const vertices = api.GetVertexArray(
          geometry.GetVertexData(), geometry.GetVertexDataSize() ).slice()
      const indices = api.GetIndexArray(
          geometry.GetIndexData(), geometry.GetIndexDataSize() ).slice()

      digest.payload( vertices, indices )
      copied.push( placed.geometryExpressID )
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
 * Run one phase against one model in this (child) process.
 *
 * @param phase One of PHASES.
 * @param filePath The model.
 * @param batchSize Products per pump call.
 */
async function runChild( phase, filePath, batchSize ) {

  const { IfcAPI, LogLevel } =
    await import( '../compiled/src/compat/web-ifc/ifc_api.js' )
  const { wasmHeapByteLength } =
    await import( '../compiled/src/core/wasm_heap.js' )

  const api = new IfcAPI()

  await api.Init()
  api.SetLogLevel( LogLevel.LOG_LEVEL_ERROR )

  const digest = new Digest()
  const seen = new Set()
  const deferred = phase !== 'classic'
  const copies = phase === 'copyout' || phase === 'bounded'

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

  let wasmPeakMB = wasmMB( api, wasmHeapByteLength )
  const wasmAfterOpenMB = wasmPeakMB
  let batches = 0
  let released = 0
  let copyMs = 0

  const tGeometry = performance.now()

  if ( !deferred ) {

    // Classic: one whole-model walk. Payloads are copied inside the callback
    // so the copy cost lands in the same place it does on the pump paths.
    const meshes = []

    api.StreamAllMeshes( modelID, ( mesh ) => {
      meshes.push( mesh )
    } )

    const tCopy = performance.now()

    copyBatchPayloads( api, modelID, meshes, seen, digest )
    copyMs += performance.now() - tCopy

    wasmPeakMB = Math.max( wasmPeakMB, wasmMB( api, wasmHeapByteLength ) )

  } else {

    for ( ;; ) {

      const batchMeshes = []
      const { extracted, remaining } =
        api.ExtractGeometryBatch( modelID, batchSize, ( mesh ) => {
          batchMeshes.push( mesh )
        } )

      ++batches

      if ( copies ) {

        const tCopy = performance.now()
        const copied = copyBatchPayloads( api, modelID, batchMeshes, seen, digest )

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

  console.log( JSON.stringify( {
    phase,
    openMs,
    geometryMs,
    copyMs,
    totalMs: openMs + geometryMs,
    batches,
    released,
    wasmAfterOpenMB,
    wasmPeakMB,
    wasmEndMB: wasmMB( api, wasmHeapByteLength ),
    retainedMB: retainedMB(),
    rssMB: process.memoryUsage().rss / BYTES_PER_MB,
    instances: digest.instances,
    payloads: digest.payloads,
    payloadMB: digest.payloadBytes / BYTES_PER_MB,
    digest: digest.hash >>> 0,
  } ) )
}

/**
 * Spawn one phase in its own process.
 *
 * @param phase One of PHASES.
 * @param filePath The model.
 * @param batchSize Products per pump call.
 * @return {object} The child's JSON result.
 */
function spawnChild( phase, filePath, batchSize ) {

  const out = execFileSync( process.execPath, [
    '--expose-gc', `--max-old-space-size=${CHILD_MAX_OLD_SPACE_MB}`,
    process.argv[ 1 ], '--child', phase, filePath, String( batchSize ),
  ], { encoding: 'utf8', maxBuffer: 1 << 26, cwd: REPO_ROOT } )

  return JSON.parse( out.trim().split( '\n' ).at( -1 ) )
}

/**
 * Sweep phases over models.
 */
function main() {

  const argv = process.argv.slice( 2 )

  if ( argv[ 0 ] === '--child' ) {
    return runChild( argv[ 1 ], argv[ 2 ], Number( argv[ 3 ] ) )
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
        `wasm=${row.wasmPeakMB.toFixed( 0 )}MB inst=${row.instances} digest=${row.digest}`
    }

    console.log( `${name}\n  ${phases.map( cell ).join( '\n  ' )}` )
  }

  if ( jsonOut !== void 0 ) {
    fs.writeFileSync( jsonOut, `${JSON.stringify( rows, null, 2 )}\n` )
  }
}

await main()
