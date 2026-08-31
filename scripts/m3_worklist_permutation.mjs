/**
 * Does reordering an UNSHARDED worklist change the geometry? — the closing
 * experiment for conway#640.
 *
 * `m3_shard_divergence.mjs` establishes that a sharded load builds a small,
 * sharply-profiled population of one model's geometries differently from an
 * unsharded one, and localises the mechanism to an order-dependent,
 * last-writer-wins write into the representation-item-keyed geometry cache.
 * That localisation has one gap, stated in #640 as the thing it had not
 * done: every run that showed divergence also changed shard MEMBERSHIP, so
 * "order decides the content" and "membership decides the content" fit the
 * same evidence.
 *
 * This closes it. Every run here is unsharded — `SetGeometryShard` is never
 * called, N is one, the worklist holds every product and every
 * rel-aggregates entry — and the only thing that differs between runs is the
 * ORDER those worklists are walked in, applied by the engine's
 * `CONWAY_PERMUTE_WORKLIST` lever after the worklists are built. Same
 * process shape as the sharded instrument: one worker at a time, run to
 * completion, so nothing concurrent can produce the result; payload digests
 * always on, so "built differently" is a hash comparison rather than a size
 * comparison.
 *
 * If a permuted run diverges from the identity run, order-dependence is
 * demonstrated with no sharding in the picture. If it does not, the
 * localisation is wrong and shard membership matters beyond the order it
 * imposes.
 *
 *   node --max-old-space-size=12288 scripts/m3_worklist_permutation.mjs \
 *       <model> --seeds 1,2,3 --out <dir> [--compare <divergent.json>...]
 *
 * `--report-only` re-reports over an `--out` directory a previous invocation
 * filled, without re-running the loads. The records are the expensive part
 * (a minute per run on a 224 MB model); the join over them is not, and a
 * report that can be re-run is a report whose numbers can be re-derived
 * without spending an hour to change a column.
 *
 * `--compare` takes the `divergent.json` a sharded run wrote, and reports
 * how far the two populations overlap — the second half of the question,
 * since "reordering changes SOMETHING" would be a much weaker result than
 * "reordering changes the geometries sharding changes".
 *
 * The per-run records are produced by `m3_shard_divergence.mjs`'s own worker
 * body, spawned as a worker from here, so both instruments write the same
 * NDJSON from the same extraction path.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Worker } from 'node:worker_threads'

import {
  perGeometryVoiding,
  profile,
  readGeometry,
  readProducts,
} from './m3_divergence_report.mjs'


const REPO_ROOT = path.resolve( fileURLToPath( new URL( '.', import.meta.url ) ), '..' )
const RUNNER = path.join( REPO_ROOT, 'scripts', 'm3_shard_divergence.mjs' )
const HEAP_MB = 12288

/* The engine's lever. Set per worker rather than per process: a run's whole
 * identity is which seed it walked under, and inheriting a stale one from
 * the parent environment is the one mistake that would make every number
 * here meaningless. */
const PERMUTE_ENV = 'CONWAY_PERMUTE_WORKLIST'


await main()


/**
 * Run the identity order, then each seed, then report.
 *
 * @return {Promise<void>} When the report is written.
 */
async function main() {

  const argv = process.argv.slice( 2 )
  const filePath = argv.find( ( argument ) => !argument.startsWith( '--' ) )

  if ( filePath === void 0 ) {
    throw new Error(
        'usage: m3_worklist_permutation.mjs <model> [--seeds 1,2,3] ' +
        '[--out DIR] [--compare divergent.json]...' )
  }

  const seeds = ( optionOf( argv, '--seeds' ) ?? '1,2,3' )
      .split( ',' )
      .map( ( seed ) => seed.trim() )
      .filter( ( seed ) => seed.length > 0 )

  // A seed the engine will not accept is the worst possible input here: the
  // run would be labelled `seedyes`, walk the identity order, and report
  // zero divergences as a clean experimental result — the "a probe that
  // never fires looks exactly like a clean model" trap, stated in AGENTS.md
  // (codex review, PR #698). worklistPermutationSeed accepts a finite
  // number and nothing else, so this rejects exactly what it would ignore.
  for ( const seed of seeds ) {

    if ( !Number.isFinite( Number( seed ) ) ) {

      throw new Error(
          `seed '${seed}' is not a number, so the engine's lever would ` +
          'ignore it and the run would silently be an identity run' )
    }
  }

  const outDir = optionOf( argv, '--out' ) ??
    path.join( REPO_ROOT, 'scratch', 'worklist-permutation' )

  const compare = optionsOf( argv, '--compare' )

  fs.mkdirSync( outDir, { recursive: true } )

  // The identity run carries the product table, exactly as the sharded
  // instrument's reference does: every column in it is a property of the
  // file rather than of a walk order, so one dump describes every run.
  const runs = [ { label: 'identity', seed: void 0, withProducts: true } ]

  for ( const seed of seeds ) {
    runs.push( { label: `seed${seed}`, seed, withProducts: false } )
  }

  for ( const run of argv.includes( '--report-only' ) ? [] : runs ) {

    const started = Date.now()

    const totals = await runOne( {
      filePath,
      label: run.label,
      outDir,
      // Never set: the whole experiment is that no shard exists here.
      shard: void 0,
      withProducts: run.withProducts,
    }, run.seed )

    console.log(
        `${totals.label}: ${totals.geometries.toLocaleString( 'en-US' )} ` +
        `geometries, ${totals.placements.toLocaleString( 'en-US' )} placements` +
        `${totals.products === void 0 ? '' :
          `, ${totals.products.toLocaleString( 'en-US' )} products`}` +
        ` (${( ( Date.now() - started ) / 1000 ).toFixed( 1 )} s)` )
  }

  report( outDir, seeds, compare )
}


/**
 * One configuration, in its own worker so its wasm instance and heap go away
 * with it — and with its own environment, which is what carries the seed.
 *
 * @param {object} task `{filePath, label, outDir, shard, withProducts}`.
 * @param {string|undefined} seed The permutation seed, or undefined for the
 * model's own order.
 * @return {Promise<object>} That run's totals.
 */
function runOne( task, seed ) {

  // Copied and then edited, so the worker inherits the proxy, PATH and the
  // rest — but never a seed this process was started with.
  const environment = { ...process.env }

  delete environment[ PERMUTE_ENV ]

  if ( seed !== void 0 ) {
    environment[ PERMUTE_ENV ] = seed
  }

  return new Promise( ( resolve, reject ) => {

    const worker = new Worker( RUNNER, {
      workerData: task,
      env: environment,
      resourceLimits: { maxOldGenerationSizeMb: HEAP_MB },
    } )

    let settled

    worker.on( 'message', ( message ) => {
      settled = message
    } )

    worker.on( 'error', reject )

    worker.on( 'exit', ( code ) => {

      if ( settled === void 0 ) {
        reject( new Error( `${task.label}: worker exited ${code} with no result` ) )
        return
      }

      if ( !settled.ok ) {
        reject( new Error( `${task.label}: ${settled.message}` ) )
        return
      }

      resolve( settled.totals )
    } )
  } )
}


/**
 * @param {string[]} argv The arguments.
 * @param {string} name The option.
 * @return {string|undefined} Its value.
 */
function optionOf( argv, name ) {

  const at = argv.indexOf( name )

  return at < 0 ? void 0 : argv[ at + 1 ]
}


/**
 * Every occurrence of a repeatable option.
 *
 * @param {string[]} argv The arguments.
 * @param {string} name The option.
 * @return {string[]} Its values, in order.
 */
function optionsOf( argv, name ) {

  const values = []

  for ( let where = 0; where < argv.length; ++where ) {

    if ( argv[ where ] === name && argv[ where + 1 ] !== void 0 ) {
      values.push( argv[ where + 1 ] )
    }
  }

  return values
}


/**
 * What changed under pure reorder, and whether it is the same population
 * sharding moved.
 *
 * @param {string} outDir Where the runs wrote.
 * @param {string[]} seeds The seeds that ran.
 * @param {string[]} compare Paths to sharded runs' `divergent.json`.
 */
function report( outDir, seeds, compare ) {

  const identity = readGeometry( outDir, 'identity' )
  const products = readProducts( outDir )

  const perSeed = new Map()
  const union = new Set()

  console.log( '' )
  console.log( `identity geometries       ${identity.size.toLocaleString( 'en-US' )}` )

  for ( const seed of seeds ) {

    const permuted = readGeometry( outDir, `seed${seed}` )

    const differing = []
    const missing = []
    const invented = []

    for ( const [ id, record ] of identity ) {

      const built = permuted.get( id )

      if ( built === void 0 ) {
        missing.push( id )
      } else if ( built.p !== record.p ) {
        differing.push( id )
      }
    }

    for ( const id of permuted.keys() ) {

      if ( !identity.has( id ) ) {
        invented.push( id )
      }
    }

    perSeed.set( seed, { differing, missing, invented, size: permuted.size } )

    for ( const id of differing ) {
      union.add( id )
    }

    console.log(
        `seed ${seed}: ${permuted.size.toLocaleString( 'en-US' )} geometries, ` +
        `${missing.length} not built, ${invented.length} not in identity, ` +
        `${differing.length.toLocaleString( 'en-US' )} built differently` )
  }

  console.log(
      `union over ${seeds.length} seeds: ` +
      `${union.size.toLocaleString( 'en-US' )} geometries built differently ` +
      'by at least one permutation' )

  // Only the identity run's records name the placers, and it is the run
  // every other one is compared against, so it is the right base for the
  // profile — the same choice the sharded instrument makes.
  profile( 'ALL identity geometries', [ ...identity.keys() ], identity, products )
  profile( 'PERMUTATION-DIVERGENT geometries', [ ...union ], identity, products )

  // Per geometry as well as per placement, because the mechanism claim is
  // about geometries and the two forms differ by a factor on exactly the
  // shared-between-a-voided-and-an-unvoided-placer population this is about.
  perGeometryVoiding(
      'ALL identity geometries', [ ...identity.keys() ], identity, products )
  perGeometryVoiding(
      'PERMUTATION-DIVERGENT geometries', [ ...union ], identity, products )

  const overlaps = []

  for ( const where of compare ) {

    const shardedRun = JSON.parse( fs.readFileSync( where, 'utf8' ) )
    const sharded = new Set( shardedRun.differing ?? [] )

    let shared = 0

    for ( const id of union ) {

      if ( sharded.has( id ) ) {
        ++shared
      }
    }

    const overlap = {
      source: path.basename( path.dirname( where ) ),
      shardCount: shardedRun.shardCount,
      shardedDivergent: sharded.size,
      permutationDivergent: union.size,
      shared,
    }

    overlaps.push( overlap )

    console.log( '' )
    console.log(
        `overlap with N=${overlap.shardCount} (${overlap.source}): ` +
        `${shared.toLocaleString( 'en-US' )} of ` +
        `${sharded.size.toLocaleString( 'en-US' )} sharded-divergent IDs are ` +
        'also permutation-divergent ' +
        `(${( ( shared / Math.max( sharded.size, 1 ) ) * 100 ).toFixed( 1 )} %), ` +
        `and ${shared.toLocaleString( 'en-US' )} of ` +
        `${union.size.toLocaleString( 'en-US' )} permutation-divergent IDs are ` +
        'also sharded-divergent ' +
        `(${( ( shared / Math.max( union.size, 1 ) ) * 100 ).toFixed( 1 )} %)` )

    profile(
        `SHARDED-DIVERGENT geometries (N=${overlap.shardCount})`,
        [ ...sharded ], identity, products )
    perGeometryVoiding(
        `SHARDED-DIVERGENT geometries (N=${overlap.shardCount})`,
        [ ...sharded ], identity, products )
  }

  fs.writeFileSync(
      path.join( outDir, 'permutation.json' ),
      `${JSON.stringify( {
        identityGeometries: identity.size,
        seeds: Object.fromEntries( [ ...perSeed ].map( ( [ seed, result ] ) => [
          seed,
          {
            geometries: result.size,
            differing: result.differing,
            missing: result.missing,
            invented: result.invented,
          },
        ] ) ),
        union: [ ...union ],
        overlaps,
      }, void 0, 2 )}\n` )
}
