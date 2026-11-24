/**
 * Box calibration: what N-way parallelism this machine can give back at all.
 *
 * An efficiency reported without one of these is uninterpretable — a
 * contended box has previously inverted a verdict outright — so run it
 * immediately before *and* after anything being measured, not once a session.
 *
 * **Two kernels, because one of them is blind to the thing it gets used to
 * rule out.**
 *
 * - `spin` is register-bound: integer ops on a handful of live values, no
 *   array, no allocation, no call, no memory traffic. Whatever it returns at
 *   N is the best an N-way split of *pure compute* can do here. Same shape as
 *   the M2 calibration (0.995 at N=2, 0.969 at N=4 on its box).
 * - `stream` reads a working set sized against **this box's** last-level
 *   cache, N times over, so it is bound by DRAM bandwidth and by nothing
 *   else. It exists because `spin` **cannot detect a memory-bandwidth
 *   ceiling** — by construction it never touches memory — so a high `spin`
 *   efficiency does not license "nothing about this box explains the
 *   deficit". Only the `stream` row speaks to that, and on a workload that
 *   streams geometry buffers it is the more relevant of the two.
 *
 * **The working set is derived, not assumed.** An earlier version fixed it at
 * 256 MiB and justified that with "every consumer-class last-level cache is
 * one to two orders of magnitude below this". That is false on the box these
 * numbers were taken on: sysfs reports a 260 MiB L3 shared across all four
 * CPUs, so the buffer sat 1.6 % UNDER the cache it claimed to be two orders
 * of magnitude above. (It was DRAM-bound anyway — see the ledger — but by
 * measurement, not by the stated margin, and a justification that is false
 * where it is checked is worth nothing where it is not.) So the size now
 * comes from `/sys/devices/system/cpu/cpu0/cache`, the ratio is printed on
 * every run, and a run that cannot reach the ratio refuses rather than
 * reporting a cache-resident number as a bandwidth ceiling.
 *
 * Separate PROCESSES, not threads, so nothing is shared but the silicon and
 * the memory system.
 *
 *   node scripts/spin_calibrate.mjs [--workers 1,2,4] [--runs 3]
 *                                   [--kernel spin,stream] [--stream-mib 1024]
 *
 * `--stream-mib` is how the plateau gets checked: sweep it (64, 256, 1024,
 * ...) and read the GB/s column. A size that is genuinely past the cache
 * reports the same bandwidth as one twice its size; one that is not reports
 * more.
 */
import { fork } from 'node:child_process'
import * as fs from 'node:fs'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'


const ITERATIONS = 3_000_000_000
const DEFAULT_WORKERS = [ 1, 2, 4 ]
const DEFAULT_RUNS = 3
const KERNELS = [ 'spin', 'stream' ]
const BYTES_PER_MIB = 1024 * 1024
// How far past the last-level cache the working set has to sit before the
// stream row means anything. Four is not a derivation, it is a margin: at 4x
// the LLC at most a quarter of the working set can be resident, so at least
// three bytes in four come from DRAM on every pass even under a perfect
// replacement policy. Below it the row is refused rather than
// reported, because a partly-cache-resident number reads as a HIGHER ceiling
// and would be used to rule out the very thing it failed to measure.
const STREAM_LLC_RATIO = 4
// The floor, for a box whose sysfs cache tree cannot be read at all. Sized
// against the largest LLC in circulation rather than against any particular
// box.
const STREAM_MIN_BYTES = 1024 * BYTES_PER_MIB
// Never take more than this share of what the kernel reports as available,
// across all N children together: the point is bandwidth, not footprint, and
// a run that swaps measures the disk.
const STREAM_MEMORY_SHARE = 0.5
// Bytes each child should touch in total, which sets the pass count once the
// working set is known: roughly ten seconds of a single-process run on a box
// in the 5-10 GB/s class. Long enough that scheduling artifacts cannot move
// the ratio, and the same order as the spin's window so the two kernels are
// read side by side rather than at different timescales.
const STREAM_TARGET_TOUCHED = 60 * 1024 * BYTES_PER_MIB
const BYTES_PER_F64 = 8
const NS_PER_MS = 1e6
const MS_PER_S = 1000
const BYTES_PER_GB = 1e9


/**
 * The register-bound kernel: no array, no allocation, no call. Two
 * accumulators so the chain is not latency-bound on a single dependency.
 *
 * @return {number} A value that cannot be constant-folded away.
 */
function spin() {

  let a = 1
  let b = 2

  for ( let i = 0; i < ITERATIONS; ++i ) {
    a = ( a * 31 + i ) | 0
    b = ( b ^ ( a >>> 3 ) ) | 0
  }

  return ( a + b ) | 0
}


/**
 * The bandwidth-bound kernel: sequential reads over a buffer that cannot be
 * cached, repeated until the run is long enough to be timed the same way the
 * spin is.
 *
 * The buffer is allocated and faulted in by the caller BEFORE the start
 * barrier, so first-touch page faults and the zeroing the kernel does for
 * them are outside the timed window. What is inside it is reads.
 *
 * @param {Float64Array} buffer The working set, already faulted in.
 * @param {number} passes How many times to read it.
 * @return {number} A value that cannot be constant-folded away.
 */
function stream( buffer, passes ) {

  let sum = 0

  for ( let pass = 0; pass < passes; ++pass ) {

    for ( let at = 0; at < buffer.length; ++at ) {
      sum += buffer[ at ]
    }
  }

  return sum
}


/**
 * The next message from a child, with the child's death counted as an answer.
 *
 * Every wait here has to be able to fail. A child that dies without sending
 * leaves a bare `on( 'message' )` promise pending forever, and the sweep then
 * hangs having printed nothing — the failure mode that looks like a slow
 * measurement and is not one.
 *
 * @param {import('node:child_process').ChildProcess} child The spinner.
 * @param {string} what What is being waited on, for the failure message.
 * @return {Promise<object>} The message the child sent.
 */
function nextMessage( child, what ) {

  return new Promise( ( resolve, reject ) => {

    // Already gone before this listener attached — between one wait and the
    // next, say — in which case no future 'exit' will fire and waiting for
    // one is waiting forever.
    if ( child.exitCode !== null || child.signalCode !== null ) {

      reject( new Error(
          `spin child was already dead (code ${child.exitCode}, ` +
          `signal ${child.signalCode}) when ${what} was awaited` ) )

      return
    }

    /**
     * Drop every listener this wait added, whichever way it ended.
     *
     * @return {void}
     */
    function cleanup() {

      child.off( 'message', onMessage )
      child.off( 'error', onError )
      child.off( 'exit', onExit )
    }

    /**
     * @param {object} message What the child sent.
     * @return {void}
     */
    function onMessage( message ) {

      cleanup()
      resolve( message )
    }

    /**
     * @param {Error} error The child's failure.
     * @return {void}
     */
    function onError( error ) {

      cleanup()
      reject( error )
    }

    /**
     * @param {number | null} code Exit status.
     * @param {string | null} signal Killing signal, if any.
     * @return {void}
     */
    function onExit( code, signal ) {

      cleanup()
      reject( new Error(
          `spin child exited (code ${code}, signal ${signal}) before ` +
          `sending ${what}` ) )
    }

    child.on( 'message', onMessage )
    child.on( 'error', onError )
    child.on( 'exit', onExit )
  } )
}


/**
 * @param {number[]} values Samples.
 * @return {number} The median.
 */
function median( values ) {

  const sorted = [ ...values ].sort( ( a, b ) => a - b )
  const middle = sorted.length >> 1

  return sorted.length % 2 ? sorted[ middle ] :
    ( sorted[ middle - 1 ] + sorted[ middle ] ) / 2
}


/**
 * The largest cache this CPU reports, in bytes.
 *
 * Read from sysfs rather than assumed, because the assumption was wrong: the
 * box the ledger's numbers come from reports a 260 MiB L3 shared across all
 * four CPUs, an order of magnitude past what "consumer-class last-level
 * cache" was taken to mean. A virtualised box may well be reporting the
 * HOST's whole shared cache rather than the share this guest can use, which
 * makes this an over-estimate — and over-estimating the cache is the safe
 * direction, since it only ever grows the working set.
 *
 * @return {number | undefined} Bytes, or undefined where sysfs said nothing.
 */
function largestCacheBytes() {

  const root = '/sys/devices/system/cpu/cpu0/cache'
  let entries

  try {
    entries = fs.readdirSync( root )
  } catch {
    return undefined
  }

  let largest = 0

  for ( const entry of entries ) {

    if ( !entry.startsWith( 'index' ) ) {
      continue
    }

    let size

    try {
      size = fs.readFileSync( `${root}/${entry}/size`, 'utf8' ).trim()
    } catch {
      continue
    }

    // `size` is a suffixed integer: `32K`, `2048K`, `266240K`, sometimes `M`.
    const found = ( /^(\d+)([KM]?)$/ ).exec( size )

    if ( found === null ) {
      continue
    }

    const scale = found[ 2 ] === 'M' ? 1024 * 1024 : found[ 2 ] === 'K' ? 1024 : 1

    largest = Math.max( largest, Number( found[ 1 ] ) * scale )
  }

  return largest > 0 ? largest : undefined
}


/**
 * What the kernel says is available, in bytes.
 *
 * `MemAvailable` rather than `MemFree`: reclaimable page cache is available
 * to a fresh allocation, and sizing against `MemFree` on a box with a warm
 * cache would refuse runs that fit comfortably.
 *
 * @return {number | undefined} Bytes, or undefined where /proc said nothing.
 */
function availableMemoryBytes() {

  let meminfo

  try {
    meminfo = fs.readFileSync( '/proc/meminfo', 'utf8' )
  } catch {
    return undefined
  }

  const found = ( /MemAvailable:\s+(\d+) kB/ ).exec( meminfo )

  return found === null ? undefined : Number( found[ 1 ] ) * 1024
}


if ( process.env.SPIN_CHILD === '1' ) {

  // `import * as process` is an ESM NAMESPACE, and `node:process` exports
  // only a subset of the process object by name: `argv`, `env`, `exit`,
  // `exitCode` and `hrtime` are there, **`on` and `send` are not**. Reaching
  // for either through the namespace is a `TypeError` at the first IPC call,
  // in the child, whose stderr is easy to miss behind the parent's own
  // failure. Same trap as the `process.exitCode = 1` that hid `m3_worker_pool`'s
  // union-check failures for three releases (ledger §11.5) — so the IPC side
  // goes through the real object explicitly.
  const runtime = globalThis.process
  const kernel = process.env.SPIN_KERNEL

  // Sized by the parent, which is where the cache is read and the refusal
  // lives; a child that sized its own buffer could disagree with the number
  // the parent printed.
  const streamBytes = Number( process.env.SPIN_STREAM_BYTES )
  const streamPasses = Number( process.env.SPIN_STREAM_PASSES )

  // Allocated and faulted in BEFORE announcing readiness, so neither the
  // allocation nor its page faults land inside anyone's timed window.
  const buffer = kernel === 'stream' ?
    new Float64Array( streamBytes / BYTES_PER_F64 ).fill( 1 ) : undefined

  // The other half of the start barrier: the child does not start its own
  // clock, the parent starts every clock at once. See `once`.
  runtime.on( 'message', () => {

    const started = process.hrtime.bigint()
    const value =
      kernel === 'stream' ? stream( buffer, streamPasses ) : spin()
    const elapsedMs = Number( process.hrtime.bigint() - started ) / NS_PER_MS

    // Callback form. `process.send` is asynchronous over the IPC channel and
    // an immediate `process.exit` can drop the message — which would leave a
    // result that was computed and then thrown away, and a parent waiting for
    // it.
    runtime.send( { elapsedMs, value }, () => process.exit( 0 ) )
  } )

  runtime.send( { ready: true } )

} else {

  const argv = process.argv.slice( 2 )
  const usage =
    'usage: spin_calibrate.mjs [--workers 1,2,4] [--runs 3] ' +
    '[--kernel spin,stream] [--stream-mib 1024]'

  /**
   * Give up before the sweep rather than during it.
   *
   * Every argument is validated up front because the failures here are
   * end-loaded: `median( table[ 1 ] )` used to throw a `TypeError` AFTER a
   * full multi-minute sweep whenever `--workers` did not happen to include 1,
   * losing the whole measurement to an argument check.
   *
   * @param {string} why What is wrong.
   * @return {never} Does not return.
   */
  function refuse( why ) {

    console.error( `${why}\n${usage}` )
    process.exit( 2 )
  }

  /**
   * The value after a flag, refused rather than `undefined` when the flag is
   * the last argument — `--workers` at the end used to throw on
   * `undefined.split`.
   *
   * @param {string} flag The flag, with its dashes.
   * @return {string | undefined} Its value, or undefined if absent.
   */
  function valueOf( flag ) {

    const at = argv.indexOf( flag )

    if ( at < 0 ) {
      return undefined
    }

    if ( argv[ at + 1 ] === undefined || argv[ at + 1 ].startsWith( '--' ) ) {
      refuse( `${flag} needs a value` )
    }

    return argv[ at + 1 ]
  }

  const workersValue = valueOf( '--workers' )
  const requested = workersValue === undefined ?
    DEFAULT_WORKERS : workersValue.split( ',' ).map( Number )

  if ( requested.length === 0 ||
       requested.some( ( count ) => !Number.isInteger( count ) || count < 1 ) ) {
    refuse( `--workers must be positive integers; got ${workersValue}` )
  }

  const runsValue = valueOf( '--runs' )
  const runs = runsValue === undefined ? DEFAULT_RUNS : Number( runsValue )

  if ( !Number.isInteger( runs ) || runs < 1 ) {
    refuse( `--runs must be a positive integer; got ${runsValue}` )
  }

  const kernelValue = valueOf( '--kernel' )
  const kernels = kernelValue === undefined ?
    KERNELS : kernelValue.split( ',' )

  if ( kernels.length === 0 ||
       kernels.some( ( kernel ) => !KERNELS.includes( kernel ) ) ) {
    refuse( `--kernel must be one or more of ${KERNELS.join( ',' )}; ` +
      `got ${kernelValue}` )
  }

  // Always run 1, whatever was asked for: every efficiency below is a ratio
  // against it. Same rule as `m3_worker_pool.mjs`, which has always forced it.
  const counts = [ ...new Set( [ 1, ...requested ] ) ].sort( ( a, b ) => a - b )
  const self = fileURLToPath( import.meta.url )

  const streamMibValue = valueOf( '--stream-mib' )
  const cacheBytes = largestCacheBytes()
  const availableBytes = availableMemoryBytes()

  if ( streamMibValue !== undefined &&
       ( !Number.isInteger( Number( streamMibValue ) ) ||
         Number( streamMibValue ) < 1 ) ) {
    refuse( `--stream-mib must be a positive integer; got ${streamMibValue}` )
  }

  // Derived, not assumed: whichever is larger of the floor and the cache
  // margin. An override says exactly what it says, which is how the plateau
  // is checked — including deliberately BELOW the cache, to see the number go
  // up and know the instrument is honest.
  const streamBytes = streamMibValue !== undefined ?
    Number( streamMibValue ) * BYTES_PER_MIB :
    Math.max( STREAM_MIN_BYTES,
        Math.ceil( STREAM_LLC_RATIO * ( cacheBytes ?? 0 ) ) )
  const streamPasses =
    Math.max( 8, Math.round( STREAM_TARGET_TOUCHED / streamBytes ) )
  const cacheRatio =
    cacheBytes === undefined ? undefined : streamBytes / cacheBytes
  const widest = Math.max( ...counts )

  if ( kernels.includes( 'stream' ) ) {

    console.log(
        `stream: working set ${( streamBytes / BYTES_PER_MIB ).toFixed( 0 )}` +
        `MiB/process x ${streamPasses} passes; largest reported cache ` +
        `${cacheBytes === undefined ? 'unknown' :
          `${( cacheBytes / BYTES_PER_MIB ).toFixed( 0 )}MiB`}` +
        `${cacheRatio === undefined ? '' : ` (${cacheRatio.toFixed( 1 )}x)`}` +
        `${streamMibValue === undefined ? '' : ', size overridden'}` )

    // Refused, not warned about. The stream row's entire job is to be the
    // one number that can rule a memory-bandwidth ceiling in or out, and a
    // cache-resident working set reports a HIGHER ceiling than the box has —
    // so it fails in the direction that gets it believed. An explicit
    // --stream-mib is allowed through with a warning, because sweeping the
    // size deliberately below the cache is how the plateau gets checked.
    if ( cacheRatio !== undefined && cacheRatio < STREAM_LLC_RATIO ) {

      const complaint =
        `stream working set is ${cacheRatio.toFixed( 1 )}x the reported ` +
        `${( cacheBytes / BYTES_PER_MIB ).toFixed( 0 )}MiB cache, under the ` +
        `${STREAM_LLC_RATIO}x this row needs to be DRAM-bound`

      if ( streamMibValue === undefined ) {
        refuse( complaint )
      }

      console.warn( `  WARNING: ${complaint} — this row is not a ` +
        'bandwidth ceiling, it is a cache measurement' )
    }

    if ( availableBytes !== undefined &&
         widest * streamBytes > STREAM_MEMORY_SHARE * availableBytes ) {

      refuse(
          `stream needs ${( widest * streamBytes / BYTES_PER_MIB )
              .toFixed( 0 )}MiB live at N=${widest}, over ` +
          `${( 100 * STREAM_MEMORY_SHARE ).toFixed( 0 )} % of the ` +
          `${( availableBytes / BYTES_PER_MIB ).toFixed( 0 )}MiB the kernel ` +
          'reports available; a run that swaps measures the disk. Lower ' +
          '--workers, or --stream-mib with the cache caveat that carries' )
    }
  }

  /**
   * One configuration: N children spun up together, wall = slowest child.
   *
   * **The start barrier is the point.** Without it each child starts its own
   * clock when its own Node boot finishes, and the boots are staggered by
   * tens of milliseconds each: at N=4 the first child spins uncontended for
   * the whole fork-and-boot skew, and the last one finishes uncontended for
   * the same reason. Both ends under-contend, so the ceiling comes out
   * OPTIMISTIC by roughly that fraction — a 200 ms skew over a 21 s spin is
   * ~1 %, which is the same order as the deficits this calibration gets read
   * against. So: fork them all, wait for every one to report ready, and only
   * then say go.
   *
   * @param {number} count How many concurrent children.
   * @param {string} kernel Which kernel they run.
   * @return {Promise<number>} The slowest child's own elapsed ms.
   */
  async function once( count, kernel ) {

    const children = Array.from( { length: count }, () => fork( self, [], {
      env: {
        ...process.env,
        SPIN_CHILD: '1',
        SPIN_KERNEL: kernel,
        SPIN_STREAM_BYTES: String( streamBytes ),
        SPIN_STREAM_PASSES: String( streamPasses ),
      },
    } ) )

    try {

      await Promise.all(
          children.map( ( child ) => nextMessage( child, 'ready' ) ) )

      // Subscribed BEFORE the go, so no child can answer into a gap.
      const finished =
        children.map( ( child ) => nextMessage( child, 'its result' ) )

      for ( const child of children ) {
        child.send( { go: true } )
      }

      const elapsed = await Promise.all( finished )

      return Math.max( ...elapsed.map( ( message ) => message.elapsedMs ) )

    } finally {

      // Survivors are killed on every exit path, not just the happy one. A
      // rejection used to leave the remaining children reparented and still
      // running flat out, which contaminates any immediate re-run — exactly
      // the contended-box case that has already inverted one verdict.
      for ( const child of children ) {

        if ( child.exitCode === null && child.signalCode === null ) {
          child.kill( 'SIGKILL' )
        }
      }
    }
  }

  for ( const kernel of kernels ) {

    const table = {}

    for ( const count of counts ) {

      table[ count ] = []

      for ( let run = 0; run < runs; ++run ) {
        table[ count ].push( await once( count, kernel ) )
      }
    }

    const base = median( table[ 1 ] )

    for ( const count of counts ) {

      const samples = table[ count ].map( ( ms ) => ms.toFixed( 0 ) ).join( '/' )
      const efficiency = base / median( table[ count ] )

      // Per-process bandwidth, printed so "is this DRAM-bound" is answerable
      // from the output rather than from a comment: a working set genuinely
      // past the cache reads the same GB/s as one twice its size, and one
      // that is not reads faster. Aggregate across N is this x N.
      const readGbPerS = kernel === 'stream' ?
        ` ${( streamBytes * streamPasses /
          ( median( table[ count ] ) / MS_PER_S ) / BYTES_PER_GB )
            .toFixed( 2 )}GB/s/process` : ''

      console.log(
          `kernel=${kernel} N=${count} ` +
          `median=${median( table[ count ] ).toFixed( 0 )}ms ` +
          `runs=[${samples}] efficiency=${efficiency.toFixed( 3 )}` +
          readGbPerS )
    }
  }
}
