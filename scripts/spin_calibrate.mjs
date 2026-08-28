/**
 * Box calibration: a register-bound pure-CPU spin loop across N processes.
 *
 * The point is a ceiling that owes nothing to memory bandwidth, allocation or
 * I/O: whatever this returns at N is the best any N-way split on this box can
 * do, and an efficiency reported without it is uninterpretable. Same shape as
 * the M2 calibration (0.995 at N=2, 0.969 at N=4 on an idle box).
 *
 * Separate PROCESSES, not threads, so nothing is shared but the silicon.
 *
 *   node spin_calibrate.mjs [--workers 1,2,4] [--runs 3]
 */
import { fork } from 'node:child_process'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'


const ITERATIONS = 3_000_000_000


/**
 * The kernel: integer ops on a handful of live values, no array, no
 * allocation, no call. Two accumulators so the chain is not latency-bound on
 * a single dependency.
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


if ( process.env.SPIN_CHILD === '1' ) {

  const started = process.hrtime.bigint()
  const value = spin()
  const elapsedMs = Number( process.hrtime.bigint() - started ) / 1e6

  process.send( { elapsedMs, value } )
  process.exit( 0 )

} else {

  const argv = process.argv.slice( 2 )
  const workersFlag = argv.indexOf( '--workers' )
  const counts = workersFlag >= 0 ?
    argv[ workersFlag + 1 ].split( ',' ).map( Number ) : [ 1, 2, 4 ]
  const runsFlag = argv.indexOf( '--runs' )
  const runs = runsFlag >= 0 ? Number( argv[ runsFlag + 1 ] ) : 3

  const self = fileURLToPath( import.meta.url )

  /**
   * One configuration: N children spun up together, wall = slowest child.
   *
   * @param {number} count How many concurrent spinners.
   * @return {Promise<number>} The slowest child's own elapsed ms.
   */
  async function once( count ) {

    const results = await Promise.all(
        Array.from( { length: count }, () => new Promise( ( resolve, reject ) => {

          const child = fork( self, [], { env: { ...process.env, SPIN_CHILD: '1' } } )

          child.on( 'message', ( message ) => resolve( message.elapsedMs ) )
          child.on( 'error', reject )
        } ) ) )

    return Math.max( ...results )
  }

  const table = {}

  for ( const count of counts ) {

    table[ count ] = []

    for ( let run = 0; run < runs; ++run ) {
      table[ count ].push( await once( count ) )
    }
  }

  const base = median( table[ 1 ] )

  for ( const count of counts ) {

    const samples = table[ count ].map( ( ms ) => ms.toFixed( 0 ) ).join( '/' )
    const efficiency = base / median( table[ count ] )

    console.log(
        `N=${count} median=${median( table[ count ] ).toFixed( 0 )}ms ` +
        `runs=[${samples}] efficiency=${efficiency.toFixed( 3 )}` )
  }
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
