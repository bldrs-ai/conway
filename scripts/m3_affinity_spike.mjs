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

const STRATEGIES = [ 'roundrobin', 'contiguous', 'affinity', 'claim', 'dispatch' ]

/**
 * Validate shard counts, or exit.
 *
 * `assign` builds `Array.from( {length: count} )` and indexes by `% count`, so
 * a non-integer silently produces a partition of a different width than the
 * one every printed line and the emitted `assignment.json` are labelled with —
 * `2.5` allocates two shards and calls the result N=2.5 — or, with enough
 * products, indexes a shard that was never allocated and crashes. Zero,
 * negative, `NaN` and `Infinity` are all unusable in their own ways.
 *
 * @param counts The caller's `--shards` values.
 * @return {number[]} The same counts, once known to be usable.
 */
function shardCounts( counts ) {

  const invalid = counts.filter(
      ( count ) => !Number.isInteger( count ) || count < 1 )

  if ( invalid.length > 0 ) {
    console.error(
        `--shards must be positive integers; got ${invalid.join( ', ' )}` )
    process.exit( 2 )
  }

  return counts
}

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

  // Both stores: extraction puts opening and boolean-operand meshes in
  // `voidGeometry`, and a capture watching only `geometry` records a graph
  // missing every asset that lives there — the same blind spot the pump
  // spike had before it was fixed.
  const stores = [ passthrough.model[ 0 ].geometry, passthrough.model[ 0 ].voidGeometry ]
    .filter( ( store ) => store !== void 0 )

  const geometry = stores[ 0 ]
  const aggregates = passthrough.demandAggregates_ ?? []
  const extraction = passthrough.conwayGeometry_

  // Instrument the cache rather than the extractor: `add` is every asset this
  // product built, `getByLocalID` returning a hit is every asset it took from
  // an earlier one. That is exactly the created/reused split a shard boundary
  // would have to reproduce.
  const created = new Set()
  const reused = new Set()

  for ( const store of stores ) {

    const originalAdd = store.add.bind( store )
    const originalGet = store.getByLocalID.bind( store )

    // Keyed per store: local IDs are store-relative, so a bare ID would
    // conflate an opening with an unrelated body and make two products look
    // like they share an asset when they share nothing.
    const key = ( localID ) => ( localID * 2 ) + ( store.isVoid ? 1 : 0 )

    store.add = ( mesh ) => {
      created.add( key( mesh.localID ) )
      return originalAdd( mesh )
    }

    store.getByLocalID = ( localID ) => {

      const hit = originalGet( localID )

      if ( hit !== void 0 && !created.has( key( localID ) ) ) {
        reused.add( key( localID ) )
      }

      return hit
    }
  }

  const rows = []
  let failures = 0
  const t0 = performance.now()

  for ( let index = 0; index < products.length; ++index ) {

    created.clear()
    reused.clear()

    const start = performance.now()

    let failed = false

    try {
      extraction.extractProductGeometryByLocalID( products[ index ] )
    } catch {
      // Record the failure rather than writing an ordinary-looking row: the
      // row's assets and duration describe a partial extraction, and a
      // partition scored or emitted from it would be built on work the real
      // pump never completed. `--simulate` and `--emit` refuse such a graph.
      failed = true
      ++failures
    }

    rows.push( {
      product: products[ index ],
      ms: performance.now() - start,
      created: [ ...created ],
      reused: [ ...reused ],

      // What a LIVE scheduler could know before extracting — see
      // dispatchKeyOf. Captured beside the oracle's created/reused sets
      // precisely so the two can be compared.
      dispatchKey: dispatchKeyOf( passthrough.model[ 0 ], products[ index ] ),
      ...( failed ? { failed: true } : {} ),
    } )

    if ( index > 0 && index % 20000 === 0 ) {
      console.log( `  ${index}/${products.length} products, ` +
        `${( ( performance.now() - t0 ) / 1000 ).toFixed( 1 )}s` )
    }
  }

  // The second pass, which this script used to skip entirely. On
  // assembly-heavy models it is not a detail: D3D captured 1 592 assets
  // against the 59 098 a real extraction creates — 2.7 % — because its
  // geometry lives almost wholly under IfcElementAssembly aggregates, and a
  // graph that blind makes every placement strategy look identical.
  //
  // Captured as rows like any other work unit, flagged so a partition can
  // tell them apart: the pump shards aggregates separately from products.
  for ( let index = 0; index < aggregates.length; ++index ) {

    created.clear()
    reused.clear()

    const start = performance.now()

    let failed = false

    try {
      extraction.extractRelAggregateGeometry( aggregates[ index ] )
    } catch {
      failed = true
      ++failures
    }

    // demandAggregates_ holds ENTITIES, not local IDs, unlike
    // demandProducts_. Serialising one directly makes the graph unwritable
    // (circular structure), and using it as a key would compare by identity.
    const aggregateLocalID =
      aggregates[ index ]?.localID ?? aggregates[ index ]

    rows.push( {
      product: aggregateLocalID,
      aggregate: true,
      ms: performance.now() - start,
      created: [ ...created ],
      reused: [ ...reused ],
      dispatchKey: dispatchKeyOf( passthrough.model[ 0 ], aggregateLocalID ),
      ...( failed ? { failed: true } : {} ),
    } )
  }

  const totalMs = performance.now() - t0
  const assets = new Set()

  for ( const row of rows ) {
    for ( const asset of row.created ) {
      assets.add( asset )
    }
  }

  // Absolute, resolved against the CAPTURE's cwd — the sweep's shard children
  // run from the repo root, so a relative path recorded here would later
  // resolve against a different directory and the guard would reject the model
  // for not being itself (or, worse, accept a different file of the same name).
  fs.writeFileSync( outPath, `${JSON.stringify( {
    model: path.resolve( filePath ),
    products: rows.length,
    assets: assets.size,
    failures,
    totalMs,
    rows,
  } )}\n` )

  console.log(
      `${path.basename( filePath )}: ${rows.length} products, ` +
      `${assets.size} assets, ${( totalMs / 1000 ).toFixed( 1 )}s extract → ${outPath}` )

  api.CloseModel( modelID )

  // Non-zero, not just a printed warning. `--simulate` and `--emit` refuse an
  // incomplete graph, but that only helps if one of them runs next; a capture
  // step in a script or CI job reads the exit status, and a graph the script
  // itself says cannot represent completed work must not be reported as a
  // successful capture.
  if ( failures > 0 ) {
    console.error(
        `${failures} of ${rows.length} products failed to extract — this graph ` +
        'describes work the real pump would not have completed, and --simulate ' +
        'and --emit will refuse it' )
    process.exit( 1 )
  }
}

/**
 * Reject a capture that contains failed extractions.
 *
 * A partition scored or emitted from partial rows would be a partition of
 * work that never happened, and the numbers would look ordinary.
 *
 * @param graph The captured graph.
 */
function rejectIfIncomplete( graph ) {

  const failed = graph.failures ?? graph.rows.filter( ( row ) => row.failed ).length

  if ( failed > 0 ) {
    console.error(
        `capture has ${failed} failed extraction(s) of ${graph.rows.length} ` +
        'products; re-capture before simulating or emitting from it' )
    process.exit( 1 )
  }

  // "No failed rows" is not "this capture saw anything". A header-only model
  // captures zero products and zero assets, and every downstream number is then
  // computed from an empty set: duplication `NaN%`, `max users -Infinity`,
  // `NaNx` speedups for all four strategies, and an empty assignment from
  // --emit — all at exit 0. A partition probe that never fired cannot be
  // evidence for a partition.
  const assets = graph.assets ?? 0

  if ( graph.rows.length === 0 || assets === 0 ) {
    console.error(
        `capture has ${graph.rows.length} product(s) and ${assets} asset(s) — ` +
        'nothing was extracted, so there is no partition to simulate or emit' )
    process.exit( 1 )
  }
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
 * The identity a live scheduler could use to place a product, read from the
 * index WITHOUT extracting it.
 *
 * This is the question the affinity result leaves open. `affinity` and
 * `claim` place products using the assets they turn out to touch — knowledge
 * that exists only after extraction, i.e. an oracle. A real worker decides
 * before it starts, so its key must come from attributes:
 *
 *   IfcProduct.Representation -> IfcProductDefinitionShape.Representations[]
 *     -> IfcShapeRepresentation.Items[] -> IfcMappedItem.MappingSource
 *       -> IfcRepresentationMap
 *
 * Pointer-chasing over columns M2 already builds, so it costs nothing next
 * to tessellation. What it CANNOT see is sharing below the representation:
 * a profile swept along different directrices, boolean operands, void
 * geometry. Whether that matters is exactly what comparing this key against
 * the oracle measures.
 *
 * Falls back to the shape representation's own local ID, then to the product
 * itself (unique, so placement degrades to positional for that product).
 *
 * **Validated on MB-Khaya, inconclusive on D3D, and the difference is this
 * script's coverage rather than the key's.** MB-Khaya: 7 193 assets at N=4
 * against a 7 193 serial baseline, matching both oracles exactly. D3D: every
 * strategy lands within 0.8 % of round-robin, which reads like a negative
 * result until you check what the capture saw — 1 592 assets against the
 * 59 098 the real extraction creates, i.e. 2.7 %. Three strategies placing
 * from a graph that blind agree because none of them has information, not
 * because placement cannot help. On MB-Khaya the capture sees 75 %.
 *
 * So D3D says nothing about the key either way until the capture covers the
 * rel-aggregates pass (see the caveats in the design doc), which on that
 * model evidently produces most of the geometry.
 *
 * @param model The IFC model.
 * @param productLocalID The product.
 * @return {number} A placement key.
 */
function dispatchKeyOf( model, productLocalID ) {

  try {

    const product = model.getElementByLocalID( productLocalID )
    const definition = product?.Representation

    if ( definition === void 0 || definition === null ) {
      return productLocalID
    }

    for ( const representation of definition.Representations ?? [] ) {

      for ( const item of representation?.Items ?? [] ) {

        const source = item?.MappingSource

        if ( source?.localID !== void 0 ) {
          return source.localID
        }
      }

      if ( representation?.localID !== void 0 ) {
        return representation.localID
      }
    }

    return productLocalID

  } catch {

    return productLocalID
  }
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

  // `claim` is the fall-through below, so an unrecognised value would emit a
  // claim partition while the emitted assignment and every printed line
  // attributed it to the name the caller typed — `--strategy cliam` producing
  // real numbers for an algorithm that never ran. Refuse instead.
  if ( !STRATEGIES.includes( strategy ) ) {
    throw new Error(
        `unknown strategy '${strategy}' — expected one of ${STRATEGIES.join( ', ' )}` )
  }

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

  if ( strategy === 'dispatch' ) {
    // The online candidate: placement from the pre-extraction key alone. Its
    // distance from affinity/claim IS the cost of not having an oracle.
    return rows.map( ( row, index ) => ( row.dispatchKey ?? index ) % count )
  }

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

  rejectIfIncomplete( graph )

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

  rejectIfIncomplete( graph )

  const rows = graph.rows
  const shardOf = assign( strategy, rows, count, costModel( rows ) )
  const shards = Array.from( { length: count }, () => [] )

  // Products and aggregates are separate worklists in the pump, drained by
  // separate cursors, so they are emitted separately. Placing only products
  // would leave the pass that creates most of an assembly model's geometry
  // spread positionally — which is how D3D came to look unshardable.
  const aggregateShards = Array.from( { length: count }, () => [] )

  for ( let index = 0; index < rows.length; ++index ) {

    const target = rows[ index ].aggregate ? aggregateShards : shards

    target[ shardOf[ index ] ].push( rows[ index ].product )
  }

  fs.writeFileSync( outPath,
      `${JSON.stringify( {
        model: graph.model, strategy, count, shards, aggregateShards,
      } )}\n` )

  console.log(
      `${strategy} N=${count}: ${shards.map( ( s ) => s.length ).join( '/' )} products, ` +
      `${aggregateShards.map( ( s ) => s.length ).join( '/' )} aggregates → ${outPath}` )
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

  // Reject flags this script doesn't know rather than ignoring them. `--count 2`
  // (the pump spike's spelling of `--shards`) silently emitted the default
  // 4-way assignment, which the sweep then refused as "cut for 4, running 2" —
  // a confusing failure two commands downstream of the typo. Same reason the
  // pump spike validates its own flags before measuring anything.
  const KNOWN_FLAGS = new Set( [
    '--capture', '--emit', '--simulate', '--out', '--strategy', '--shards' ] )

  // Every flag here takes an operand. A recognised flag with none —
  // `--emit graph.json --shards` — leaves the flag reading `undefined` and
  // falls through to its default, which is the same silent
  // wrong-configuration failure as an ignored flag, one step later.
  for ( let index = 0; index < argv.length; ++index ) {

    const token = argv[ index ]

    if ( !token.startsWith( '--' ) ) {
      continue
    }

    if ( !KNOWN_FLAGS.has( token ) ) {
      console.error(
          `unknown flag ${token} (known: ${[ ...KNOWN_FLAGS ].join( ', ' )})` )
      process.exit( 2 )
    }

    const value = argv[ index + 1 ]

    if ( value === void 0 || value.startsWith( '--' ) ) {
      console.error( `${token} requires a value` )
      process.exit( 2 )
    }
  }

  const captureModel = flag( '--capture' )

  if ( captureModel !== void 0 ) {
    return capture( captureModel, flag( '--out', 'graph.json' ) )
  }

  const emitFor = flag( '--emit' )

  if ( emitFor !== void 0 ) {
    return emitAssignment( emitFor,
        shardCounts( [ Number( flag( '--shards', '4' ) ) ] )[ 0 ],
        flag( '--strategy', 'claim' ), flag( '--out', 'assignment.json' ) )
  }

  const graphPath = flag( '--simulate' )

  if ( graphPath === void 0 ) {
    console.error(
        'usage: m3_affinity_spike.mjs --capture <model> [--out graph.json]\n' +
        '       m3_affinity_spike.mjs --simulate graph.json [--shards 2,3,4]\n' +
        '       m3_affinity_spike.mjs --emit graph.json [--strategy claim] ' +
        '[--shards 4] [--out assignment.json]' )
    process.exit( 2 )
  }

  const counts = flag( '--shards' ) !== void 0 ?
    shardCounts( flag( '--shards' ).split( ',' ).map( Number ) ) :
    DEFAULT_SHARD_COUNTS

  simulate( graphPath, counts )
}

await main()
