/**
 * Replay a recorded pager request stream through candidate residency
 * policies (issue #616).
 *
 * The diagnosis on #616 established the one property that makes this script
 * valid: the `WindowedStepBufferProvider` request stream is **independent of
 * the window** — 4,484,984 requests with identical per-phase counts at every
 * chunk/cap combination tested, while the number of store reads moved by
 * 235x. The pump asks for the same ranges in the same order no matter what
 * is resident, so one instrumented load captures the whole reference string
 * and any LRU policy's *load count* can be computed from it offline, exactly.
 *
 * That turns policy selection from "run a 3-minute D3D load per candidate"
 * into a sub-second replay, which is what makes it possible to pick a trigger
 * threshold from measurement rather than taste.
 *
 * Capture a stream with:
 *   node scripts/agg_pager_trace.mjs --dump-stream d3d.bin model.ifc
 *
 * Then replay it:
 *   node scripts/pager_policy_sim.mjs d3d.bin
 *   node scripts/pager_policy_sim.mjs --caps 16,32,64 --grid d3d.bin psb.bin
 *
 * What it does NOT model, and why that is acceptable here:
 *
 *  - **Concurrency.** The real provider runs many `ensureResident` calls
 *    concurrently; a chunk another call already has in flight costs no read
 *    ("inflight" in the tracer), and every in-flight call's range is pinned
 *    against eviction. The replay is sequential, so it pins only the span it
 *    is serving. Sequential replay therefore evicts slightly *more* eagerly
 *    than reality and attributes a de-duplicated load to the first caller —
 *    it is a lower bound on retention, i.e. pessimistic, not flattering.
 *    Calibrate before trusting it: the fixed-cap-16 row must land near the
 *    load count the tracer measured in vivo (D3D 11,751, PSB 475).
 *  - **Time.** Loads are counted, not timed. Wall clock has to come from a
 *    real run.
 */
import * as fs from 'node:fs'
import * as process from 'node:process'

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

const valueFlags = new Set( [ '--caps', '--interval', '--trigger', '--fraction' ] )
const caps =
  ( flagValue( '--caps', '16,24,32,48,64,96,128' ) ).split( ',' ).map( Number )
const evalInterval = Number( flagValue( '--interval', '4096' ) )
const trigger = Number( flagValue( '--trigger', '8' ) )
const fraction = Number( flagValue( '--fraction', '0.5' ) )
const files =
  argv.filter( ( a, i ) => !a.startsWith( '--' ) && !valueFlags.has( argv[ i - 1 ] ) )

if ( files.length === 0 ) {
  console.error(
      'usage: pager_policy_sim.mjs [--caps 16,32,64] [--interval N] ' +
      '[--trigger N] [--fraction F] <stream.bin>...' )
  process.exit( 2 )
}

/**
 * Load a recorded stream as `[ firstChunk, lastChunk ]` pairs.
 *
 * @param {string} path Path to a `--dump-stream` file.
 * @return {Int32Array} The flat pair array.
 */
function readStream( path ) {

  const raw = fs.readFileSync( path )

  return new Int32Array( raw.buffer, raw.byteOffset, raw.byteLength / 4 )
}

/**
 * Replay a stream through an LRU window.
 *
 * `adaptive` switches on the candidate policy: a ghost list of the last
 * `cap` evictions classifies each load, and a measurement interval whose
 * capacity misses clear both thresholds doubles the cap, up to `maxCap`.
 *
 * @param {Int32Array} spans Flat `[ first, last ]` pairs.
 * @param {number} cap Starting residency cap in chunks.
 * @param {object} options `{ adaptive, maxCap }`.
 * @return {object} `{ loads, requests, finalCap, growths, peakCap }`.
 */
function replay( spans, cap, options = {} ) {

  const adaptive = options.adaptive === true
  const maxCap = options.maxCap ?? cap

  /** Resident chunks; Map insertion order doubles as LRU order. */
  const resident = new Map()
  const ghostQueue = []
  const ghostSet = new Set()

  let currentCap = cap
  let loads = 0
  let requests = 0
  let growths = 0
  let intervalRequests = 0
  let intervalMisses = 0
  let intervalCapacity = 0

  for ( let where = 0; where < spans.length; where += 2 ) {

    const first = spans[ where ]
    const last = spans[ where + 1 ]

    for ( let chunkIndex = first; chunkIndex <= last; ++chunkIndex ) {

      ++requests
      ++intervalRequests

      if ( resident.has( chunkIndex ) ) {

        resident.delete( chunkIndex )
        resident.set( chunkIndex, true )
        continue
      }

      ++loads
      ++intervalMisses
      resident.set( chunkIndex, true )

      if ( adaptive && ghostSet.has( chunkIndex ) ) {
        ++intervalCapacity
        ghostSet.delete( chunkIndex )
      }
    }

    if ( adaptive && intervalRequests >= evalInterval ) {

      if ( currentCap < maxCap &&
           intervalCapacity >= trigger &&
           intervalCapacity >= fraction * intervalMisses ) {

        currentCap = Math.min( maxCap, currentCap * 2 )
        ++growths
      }

      intervalRequests = 0
      intervalMisses = 0
      intervalCapacity = 0
    }

    if ( resident.size > currentCap ) {

      for ( const candidate of resident.keys() ) {

        if ( resident.size <= currentCap ) {
          break
        }

        // The span being served is pinned, exactly as `ensureResident` pins
        // its own range against eviction by an overlapping call.
        if ( candidate >= first && candidate <= last ) {
          continue
        }

        resident.delete( candidate )

        if ( adaptive && !ghostSet.has( candidate ) ) {

          ghostQueue.push( candidate )
          ghostSet.add( candidate )

          while ( ghostQueue.length > currentCap ) {
            ghostSet.delete( ghostQueue.shift() )
          }
        }
      }
    }
  }

  return { loads, requests, finalCap: currentCap, growths, peakCap: currentCap }
}

for ( const file of files ) {

  const spans = readStream( file )
  const highest = Math.max( ...caps )

  console.log( `\n=== ${file} — ${spans.length / 2} spans` )
  console.log( 'policy                       loads   vs cap16' )

  const baseline = replay( spans, caps[ 0 ] ).loads

  for ( const cap of caps ) {

    const result = replay( spans, cap )

    console.log( `fixed cap ${String( cap ).padStart( 4 )}          ` +
      `${String( result.loads ).padStart( 10 )}   ` +
      `${( result.loads / Math.max( baseline, 1 ) ).toFixed( 3 )}x` )
  }

  const adaptiveRun =
    replay( spans, caps[ 0 ], { adaptive: true, maxCap: highest } )

  console.log( `adaptive ${caps[ 0 ]}..${highest}        ` +
    `${String( adaptiveRun.loads ).padStart( 10 )}   ` +
    `${( adaptiveRun.loads / Math.max( baseline, 1 ) ).toFixed( 3 )}x  ` +
    `(${adaptiveRun.growths} growths, final cap ${adaptiveRun.finalCap})` )
}
