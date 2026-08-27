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
const wantSelfTest = argv.includes( '--selftest' )
const caps =
  ( flagValue( '--caps', '16,24,32,48,64,96,128' ) ).split( ',' ).map( Number )
const evalInterval = Number( flagValue( '--interval', '4096' ) )
const trigger = Number( flagValue( '--trigger', '8' ) )
const fraction = Number( flagValue( '--fraction', '0.5' ) )
const files =
  argv.filter( ( a, i ) => !a.startsWith( '--' ) && !valueFlags.has( argv[ i - 1 ] ) )

if ( files.length === 0 && !wantSelfTest ) {
  console.error(
      'usage: pager_policy_sim.mjs [--caps 16,32,64] [--interval N] ' +
      '[--trigger N] [--fraction F] [--selftest] <stream.bin>...' )
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
 * Classify each reference in a chunk sequence against a ghost list, using
 * the structure named by `useQueue`.
 *
 * Exists for {@link selfTest} only: it is the smallest thing that exhibits
 * the queue/set desync, so the regression can be a demonstration rather
 * than a comment.
 *
 * @param {number[]} sequence Chunk indices, one reference each.
 * @param {number} cap Residency cap in chunks.
 * @param {boolean} useQueue Use a parallel queue + set (the broken shape)
 * rather than the single insertion-ordered Set.
 * @return {string[]} One of 'hit' / 'capacity' / 'beyond' per reference.
 */
function classifyReferences( sequence, cap, useQueue ) {

  const resident = new Map()
  const ghostSet = new Set()
  const ghostQueue = []
  const classes = []

  const push = ( chunkIndex ) => {

    if ( useQueue ) {

      if ( ghostSet.has( chunkIndex ) ) {
        return
      }

      ghostQueue.push( chunkIndex )
      ghostSet.add( chunkIndex )

      while ( ghostQueue.length > cap ) {
        ghostSet.delete( ghostQueue.shift() )
      }

      return
    }

    ghostSet.add( chunkIndex )

    while ( ghostSet.size > cap ) {

      const oldest = ghostSet.values().next()

      if ( oldest.done === true ) {
        break
      }

      ghostSet.delete( oldest.value )
    }
  }

  for ( const chunkIndex of sequence ) {

    if ( resident.has( chunkIndex ) ) {

      resident.delete( chunkIndex )
      resident.set( chunkIndex, true )
      classes.push( 'hit' )
      continue
    }

    classes.push( ghostSet.delete( chunkIndex ) ? 'capacity' : 'beyond' )
    resident.set( chunkIndex, true )

    if ( resident.size <= cap ) {
      continue
    }

    for ( const candidate of resident.keys() ) {

      if ( resident.size <= cap ) {
        break
      }

      if ( candidate === chunkIndex ) {
        continue
      }

      resident.delete( candidate )
      push( candidate )
    }
  }

  return classes
}

/**
 * Prove the ghost list classifies the desync counter-example correctly, and
 * that the shape this script used to have does not.
 *
 * `0,1,3,2,1,0` at cap 2: the reference to 1 consumes 1's ghost entry, and
 * with a parallel queue the stale `1` is then what the next trim shifts —
 * deleting 0's still-valid membership, so the final 0 reads as a first
 * touch. A cap-2 ghost list demonstrably still holds 0 at that point, so
 * the correct answer is 'capacity'.
 *
 * @return {number} Process exit code.
 */
function selfTest() {

  const sequence = [ 0, 1, 3, 2, 1, 0 ]
  const fixed = classifyReferences( sequence, 2, false )
  const broken = classifyReferences( sequence, 2, true )
  const expectedFixed = 'beyond beyond beyond beyond capacity capacity'
  const expectedBroken = 'beyond beyond beyond beyond capacity beyond'
  let failures = 0

  console.log( `sequence ${sequence.join( ',' )} at cap 2` )
  console.log( `  single Set (this script, and the provider): ${fixed.join( ' ' )}` )
  console.log( `  parallel queue + set (the desync)         : ${broken.join( ' ' )}` )

  if ( fixed.join( ' ' ) !== expectedFixed ) {
    console.error( `FAIL: expected "${expectedFixed}"` )
    ++failures
  }

  if ( broken.join( ' ' ) !== expectedBroken ) {
    console.error(
        'FAIL: the counter-example no longer reproduces the desync — the ' +
        'regression it pins may have moved' )
    ++failures
  }

  console.log( failures === 0 ?
    'selftest OK: the ghost list credits the final 0 as a capacity miss, ' +
    'and the queue+set shape undercounts it' :
    `selftest FAILED (${failures})` )

  return failures === 0 ? 0 : 1
}

if ( wantSelfTest ) {
  process.exit( selfTest() )
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

  /*
   * Recently-evicted chunks, in a SINGLE insertion-ordered Set — the same
   * structure `WindowedStepBufferProvider.ghostChunks_` uses, and it has to
   * stay that way. A parallel queue + set desyncs the moment a ghost hit
   * consumes the set entry and leaves the queue entry behind: the stale
   * entry is what the next trim shifts, so it deletes a *newer* chunk's
   * valid membership and the effective ghost window shrinks below `cap`.
   * Replaying 0,1,3,2,1,0 at cap 2 then misclassifies the final 0 as
   * beyond-the-window when a cap-2 ghost list plainly still holds it —
   * see `--selftest`. The failure direction is an UNDERCOUNT of capacity
   * misses, so it silently biases any threshold derived from this replay.
   */
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

      if ( adaptive && ghostSet.delete( chunkIndex ) ) {
        ++intervalCapacity
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

        if ( adaptive ) {

          ghostSet.add( candidate )

          while ( ghostSet.size > currentCap ) {

            const oldest = ghostSet.values().next()

            if ( oldest.done === true ) {
              break
            }

            ghostSet.delete( oldest.value )
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
