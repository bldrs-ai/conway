/**
 * M3 affinity spike (issue #394): how should the geometry work be partitioned
 * across a worker pool?
 *
 * The shard sweep in `m3_pump_spike.mjs` showed the across-product axis is
 * real (PSB 2.59x on 4 cores) but that the win is eaten on
 * representation-heavy models by duplicated work: MB-Khaya costs +40 % total
 * CPU under round-robin against PSB's +15 %. Products are only independent
 * when they don't share a *definition* — the IfcMappedItem →
 * IfcRepresentationMap → shape edge that makes "the same door on every floor"
 * one asset and many occurrences.
 *
 * So the partition wants affinity by shared asset. This measures whether that
 * works and how much it is worth, without building a worker pool, in two
 * steps:
 *
 * 1. **Capture** (one real extraction pass, `--capture`). Drives the
 *    production per-product seam directly, with the geometry cache
 *    instrumented, and records for every product: which geometry assets it
 *    CREATED, which it REUSED from an earlier product, and how long its
 *    extraction took. That bipartite product↔asset graph plus the timings is
 *    the ground truth everything else is derived from.
 *
 * 2. **Simulate** (`--simulate`). Replays that graph through candidate
 *    partitions and reports, for each: how many asset extractions it causes
 *    (an asset shared across shards is extracted once per shard), the
 *    resulting duplicated CPU, and the makespan — the slowest shard, which is
 *    what wall-clock actually becomes.
 *
 * Strategies, in increasing order of how much they know:
 *
 *   roundrobin : product index % N. The naive partition; the one measured.
 *   contiguous : equal spans of file order. Exploits the locality that made
 *                contiguous beat round-robin on MB-Khaya (1.52x vs 1.39x).
 *   affinity   : hash the product's PRIMARY asset to a shard, so every
 *                occurrence of one definition lands together. The cheap key —
 *                no closure walk, just what the extraction already touches.
 *   claim      : Pablo's adaptive shape — a worker rips through a run of
 *                products; an asset is CLAIMED by the first worker to touch
 *                it, and a later product whose assets are already claimed is
 *                handed to the claiming worker. Otherwise it goes to the
 *                least-loaded worker. Locality-following, no global plan.
 *
 * The simulation's cost model: each product costs its measured extraction
 * time, except that a product which would have to re-create an asset another
 * shard already made pays that asset's creation cost again. Creation cost is
 * attributed from the measured time of the product that first built it. This
 * is an approximation in one direction only — it cannot invent duplication
 * that the real extractor wouldn't do, because the graph records exactly
 * which assets each product touched.
 *
 * Usage:
 *   node scripts/m3_affinity_spike.mjs --capture <model> --out graph.json
 *   node scripts/m3_affinity_spike.mjs --simulate graph.json [--shards 2,3,4]
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import { performance } from 'node:perf_hooks'

const DEFAULT_SHARD_COUNTS = [ 2, 3, 4, 8 ]

const STRATEGIES = [ 'roundrobin', 'contiguous', 'affinity', 'claim' ]

/**
 * Drive one real extraction pass with the geometry cache instrumented, and
 * record the product↔asset graph.
 *
 * Deliberately bypasses `ExtractGeometryBatch` and calls the per-product seam
 * directly: the batch pump's `streamNewMeshes_` re-walks the whole scene per
 * call, which at the batch size needed for per-product attribution would be
 * quadratic and would swamp the timings being captured.
 *
 * @param filePath The model.
 * @param outPath Where to write the graph.
 */
async function capture( filePath, outPath ) {

  const { IfcAPI, LogLevel } =
    await import( '../compiled/src/compat/web-ifc/ifc_api.js' )

  const api = new IfcAPI()

  await api.Init()
  api.SetLogLevel( LogLevel.LOG_LEVEL_ERROR )

  const bytes = new Uint8Array( fs.readFileSync( filePath ) )
  const modelID = await api.OpenModelStreamed( bytes,
      { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true, DEFER_GEOMETRY: true } )

  if ( modelID < 0 ) {
    throw new Error( `open failed: ${filePath}` )
  }

  const passthrough = api.getPassthrough( modelID )

  passthrough.ensureDemandWorklists_()

  const products = passthrough.demandProducts_ ?? []
  const geometry = passthrough.model[ 0 ].geometry
  const extraction = passthrough.conwayGeometry_

  // Instrument the cache rather than the extractor: `add` is every asset this
  // product built, `getByLocalID` returning a hit is every asset it took from
  // an earlier one. That is exactly the created/reused split a shard boundary
  // would have to reproduce.
  const created = new Set()
  const reused = new Set()
  const originalAdd = geometry.add.bind( geometry )
  const originalGet = geometry.getByLocalID.bind( geometry )

  geometry.add = ( mesh ) => {
    created.add( mesh.localID )
    return originalAdd( mesh )
  }

  geometry.getByLocalID = ( localID ) => {
    const hit = originalGet( localID )

    if ( hit !== void 0 && !created.has( localID ) ) {
      reused.add( localID )
    }

    return hit
  }

  const rows = []
  const t0 = performance.now()

  for ( let index = 0; index < products.length; ++index ) {

    created.clear()
    reused.clear()

    const start = performance.now()

    try {
      extraction.extractProductGeometryByLocalID( products[ index ] )
    } catch {
      // A product that cannot extract still occupies a partition slot; record
      // it with whatever it touched rather than dropping it from the graph.
    }

    rows.push( {
      product: products[ index ],
      ms: performance.now() - start,
      created: [ ...created ],
      reused: [ ...reused ],
    } )

    if ( index > 0 && index % 20000 === 0 ) {
      console.log( `  ${index}/${products.length} products, ` +
        `${( ( performance.now() - t0 ) / 1000 ).toFixed( 1 )}s` )
    }
  }

  const totalMs = performance.now() - t0
  const assets = new Set()

  for ( const row of rows ) {
    for ( const asset of row.created ) {
      assets.add( asset )
    }
  }

  fs.writeFileSync( outPath, `${JSON.stringify( {
    model: filePath,
    products: rows.length,
    assets: assets.size,
    totalMs,
    rows,
  } )}\n` )

  console.log(
      `${path.basename( filePath )}: ${rows.length} products, ` +
      `${assets.size} assets, ${( totalMs / 1000 ).toFixed( 1 )}s extract → ${outPath}` )

  api.CloseModel( modelID )
}

/**
 * Per-asset creation cost, attributed from the product that first built it.
 *
 * A product's measured time covers everything it created, so the time is
 * split evenly across the assets it created. Products that create nothing
 * (pure instancing) contribute a fixed per-product cost instead, which is
 * what a shard pays for them regardless of partition.
 *
 * @param rows The captured graph.
 * @return {object} `{assetCost, ownCost}` — per-asset creation ms, and
 * per-product non-asset ms.
 */
function costModel( rows ) {

  const assetCost = new Map()
  const ownCost = new Map()

  for ( const row of rows ) {

    if ( row.created.length === 0 ) {
      ownCost.set( row.product, row.ms )
      continue
    }

    const share = row.ms / row.created.length

    for ( const asset of row.created ) {
      assetCost.set( asset, share )
    }

    ownCost.set( row.product, 0 )
  }

  return { assetCost, ownCost }
}

/**
 * Assign products to shards by strategy.
 *
 * @param strategy One of STRATEGIES.
 * @param rows The captured graph.
 * @param count Shard count.
 * @param cost The cost model, for load-aware strategies.
 * @return {number[]} Shard index per row.
 */
function assign( strategy, rows, count, cost ) {

  if ( strategy === 'roundrobin' ) {
    return rows.map( ( _, index ) => index % count )
  }

  if ( strategy === 'contiguous' ) {
    const span = Math.ceil( rows.length / count )
    return rows.map( ( _, index ) => Math.min( Math.floor( index / span ), count - 1 ) )
  }

  // Placement must consider EVERY asset a product touches, not just the ones
  // it creates. A product that creates three private assets and reuses one
  // shared definition is exactly the case that matters, and voting on the
  // created set alone ignores the only edge that can duplicate work.
  const assetsOf = ( row ) => [ ...row.created, ...row.reused ]

  if ( strategy === 'affinity' ) {
    // Primary asset = the lowest-numbered asset the product touches: a stable
    // identity for the definition that doesn't depend on visit order, so every
    // occurrence of one definition hashes to the same shard.
    return rows.map( ( row, index ) => {
      const assets = assetsOf( row )
      return assets.length === 0 ?
        index % count : Math.min( ...assets ) % count
    } )
  }

  // claim: first worker to touch an asset owns it; a product whose assets are
  // already owned follows them. Ties (a product spanning two owners) go to the
  // owner of the most of its assets, then to the lighter shard.
  const owner = new Map()
  const load = new Array( count ).fill( 0 )
  const out = []

  for ( const row of rows ) {

    const assets = assetsOf( row )
    const votes = new Map()

    for ( const asset of assets ) {

      const held = owner.get( asset )

      if ( held !== void 0 ) {
        votes.set( held, ( votes.get( held ) ?? 0 ) + 1 )
      }
    }

    let shard

    if ( votes.size > 0 ) {
      shard = [ ...votes.entries() ].sort(
          ( a, b ) => ( b[ 1 ] - a[ 1 ] ) || ( load[ a[ 0 ] ] - load[ b[ 0 ] ] ) )[ 0 ][ 0 ]
    } else {
      shard = load.indexOf( Math.min( ...load ) )
    }

    for ( const asset of assets ) {
      if ( !owner.has( asset ) ) {
        owner.set( asset, shard )
      }
    }

    load[ shard ] += row.ms
    out.push( shard )
  }

  return out
}

/**
 * Cost one assignment: an asset is extracted once per shard that needs it, so
 * duplication is what the partition adds over the ideal single-pass total.
 *
 * @param rows The captured graph.
 * @param shardOf Shard index per row.
 * @param count Shard count.
 * @param cost The cost model.
 * @return {object} Totals and makespan.
 */
function evaluate( rows, shardOf, count, cost ) {

  const shardAssets = Array.from( { length: count }, () => new Set() )
  const shardMs = new Array( count ).fill( 0 )
  const shardProducts = new Array( count ).fill( 0 )

  for ( let index = 0; index < rows.length; ++index ) {

    const row = rows[ index ]
    const shard = shardOf[ index ]

    ++shardProducts[ shard ]
    shardMs[ shard ] += cost.ownCost.get( row.product ) ?? 0

    // Every asset this product needs must exist in ITS shard: created there,
    // or re-created because the shard that made it is a different one.
    for ( const asset of [ ...row.created, ...row.reused ] ) {

      if ( shardAssets[ shard ].has( asset ) ) {
        continue
      }

      shardAssets[ shard ].add( asset )
      shardMs[ shard ] += cost.assetCost.get( asset ) ?? 0
    }
  }

  const extractions = shardAssets.reduce( ( sum, set ) => sum + set.size, 0 )
  const totalMs = shardMs.reduce( ( sum, ms ) => sum + ms, 0 )
  const makespan = Math.max( ...shardMs )

  return { extractions, totalMs, makespan, shardMs, shardProducts }
}

/**
 * Replay the captured graph through every strategy at every shard count.
 *
 * @param graphPath The captured graph.
 * @param counts Shard counts to sweep.
 */
function simulate( graphPath, counts ) {

  const graph = JSON.parse( fs.readFileSync( graphPath, 'utf8' ) )
  const rows = graph.rows
  const cost = costModel( rows )

  const idealAssets = new Set()
  let idealMs = 0

  for ( const row of rows ) {
    idealMs += row.ms

    for ( const asset of row.created ) {
      idealAssets.add( asset )
    }
  }

  // How much sharing is there at all? Without this the strategy comparison
  // has no scale: a model where nothing is shared cannot show duplication.
  const users = new Map()

  for ( const row of rows ) {
    for ( const asset of [ ...row.created, ...row.reused ] ) {
      users.set( asset, ( users.get( asset ) ?? 0 ) + 1 )
    }
  }

  const shared = [ ...users.values() ].filter( ( n ) => n > 1 )
  const instances = [ ...users.values() ].reduce( ( sum, n ) => sum + n, 0 )

  console.log(
      `${path.basename( graph.model )}: ${rows.length} products, ` +
      `${idealAssets.size} assets, ${instances} asset-uses, ` +
      `${shared.length} shared assets (${( 100 * shared.length / users.size ).toFixed( 1 )}%), ` +
      `max users ${Math.max( ...users.values() )}, ` +
      `serial extract ${( idealMs / 1000 ).toFixed( 1 )}s` )

  for ( const count of counts ) {

    const line = []

    for ( const strategy of STRATEGIES ) {

      const shardOf = assign( strategy, rows, count, cost )
      const result = evaluate( rows, shardOf, count, cost )
      const duplication = 100 * ( result.totalMs / idealMs - 1 )
      const speedup = idealMs / result.makespan

      line.push(
          `${strategy}=${speedup.toFixed( 2 )}x/+${duplication.toFixed( 0 )}%` )
    }

    console.log( `  N=${count}  ${line.join( '  ' )}` )
  }
}

/**
 * Write one strategy's partition out as per-shard product lists, so the real
 * extractor can be run against it and the simulation checked rather than
 * believed.
 *
 * @param graphPath The captured graph.
 * @param count Shard count.
 * @param strategy One of STRATEGIES.
 * @param outPath Where to write the assignment.
 */
function emitAssignment( graphPath, count, strategy, outPath ) {

  const graph = JSON.parse( fs.readFileSync( graphPath, 'utf8' ) )
  const rows = graph.rows
  const shardOf = assign( strategy, rows, count, costModel( rows ) )
  const shards = Array.from( { length: count }, () => [] )

  for ( let index = 0; index < rows.length; ++index ) {
    shards[ shardOf[ index ] ].push( rows[ index ].product )
  }

  fs.writeFileSync( outPath, `${JSON.stringify( { model: graph.model, strategy, shards } )}\n` )

  console.log(
      `${strategy} N=${count}: ${shards.map( ( s ) => s.length ).join( '/' )} products → ${outPath}` )
}

/**
 * Entry point.
 */
async function main() {

  const argv = process.argv.slice( 2 )
  const flag = ( name, fallback ) => {
    const index = argv.indexOf( name )
    return index >= 0 ? argv[ index + 1 ] : fallback
  }

  const captureModel = flag( '--capture' )

  if ( captureModel !== void 0 ) {
    return capture( captureModel, flag( '--out', 'graph.json' ) )
  }

  const emitFor = flag( '--emit' )

  if ( emitFor !== void 0 ) {
    return emitAssignment( emitFor, Number( flag( '--shards', '4' ) ),
        flag( '--strategy', 'claim' ), flag( '--out', 'assignment.json' ) )
  }

  const graphPath = flag( '--simulate' )

  if ( graphPath === void 0 ) {
    console.error(
        'usage: m3_affinity_spike.mjs --capture <model> --out graph.json\n' +
        '       m3_affinity_spike.mjs --simulate graph.json [--shards 2,3,4]' )
    process.exit( 2 )
  }

  const counts = flag( '--shards' ) !== void 0 ?
    flag( '--shards' ).split( ',' ).map( Number ) : DEFAULT_SHARD_COUNTS

  simulate( graphPath, counts )
}

await main()
