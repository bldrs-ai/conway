/**
 * Which geometries a shard builds differently, and what those geometries have
 * in common — the diagnosis instrument for conway#640.
 *
 * `scripts/m3_worker_pool.mjs` establishes THAT a sharded load diverges from
 * an unsharded one (ledger §11.5: 181 geometry IDs at N=2, 247 at N=4 on one
 * model, deterministic, nothing lost or invented). It cannot say WHICH, so
 * every hypothesis about the mechanism has had to argue from the count. This
 * script names the IDs and joins them to the model's own structure.
 *
 * Three deliberate differences from the sweep, all of which trade timing
 * fidelity for diagnostic power — this measures correctness, not speed, so
 * there is nothing left to protect:
 *
 *  - **Shards run one at a time.** The sweep runs them concurrently because
 *    it is measuring makespan. Running them sequentially makes the whole
 *    class of concurrency explanations — races, contention, scheduler order,
 *    allocator interleaving — unable to produce the result. If divergence
 *    survives this, it is a pure function of shard MEMBERSHIP.
 *  - **Digests are always on.** The sweep's `NO_PAYLOAD_DIGEST=1` mode makes
 *    the comparison size-for-size, so a geometry with the same vertex and
 *    index counts but different coordinates reads as identical. Under it,
 *    "247 built differently" is a lower bound (ledger §11.5). Here every
 *    payload is hashed, so the count is the count.
 *  - **Every unique geometry is recorded with the products that placed it**,
 *    and the reference run additionally dumps a product table — dispatch key,
 *    how that key resolved, aggregate-target and void membership. The join
 *    between the two is the actual output.
 *
 * Records go to NDJSON files rather than back over `postMessage`: a run holds
 * one entry per unique geometry and one per placement, and the point of
 * running sequentially is not to hold N of those at once.
 *
 *   node --max-old-space-size=12288 scripts/m3_shard_divergence.mjs \
 *       <model> --workers 4 --out <dir>
 *
 * `--workers` is the shard count to compare against the unsharded reference;
 * the reference always runs. Give a large model a generous heap — the same
 * `--max-old-space-size=12288` the sweep documents.
 */
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'

import {
  KEY_MAPPED,
  KEY_SELF,
  KEY_SHAPE,
  geometryPath,
  profile,
  readGeometry,
  readProducts,
} from './m3_divergence_report.mjs'


const REPO_ROOT = path.resolve( fileURLToPath( new URL( '.', import.meta.url ) ), '..' )
const BATCH_SIZE = 64


/**
 * Pump one configuration to completion and record what it built.
 *
 * The shard descriptor is passed rather than derived, so the reference is a
 * genuinely unsharded open (`SetGeometryShard` never called) rather than a
 * shard of one — the engine normalises `count === 1` back to unsharded, but
 * the two reach `ensureDemandWorklists_` by different branches and this
 * script's whole subject is that branch.
 *
 * @param {object} task `{filePath, label, outDir, shard, withProducts}`.
 * @return {Promise<object>} Totals, for the main thread's report.
 */
async function runWorker( task ) {

  const { IfcAPI } = await import( '../compiled/src/compat/web-ifc/ifc_api.js' )

  const api = new IfcAPI()

  await api.Init()

  const bytes = new Uint8Array( fs.readFileSync( task.filePath ) )

  // Same open settings as the sweep, including the deliberate absence of
  // COORDINATE_TO_ORIGIN: the recentre anchor is derived from whichever
  // product a model captures first, so shards would each derive their own.
  const modelID = await api.OpenModelStreamed( bytes, {
    USE_FAST_BOOLS: true,
    DEFER_GEOMETRY: true,
  } )

  if ( task.shard !== void 0 ) {
    api.SetGeometryShard( modelID, task.shard )
  }

  // id -> `${vertexFloats}:${indexCount}:${sha256}`, one entry per unique
  // geometry this run built.
  const payloads = new Map()
  // id -> the entity express IDs that placed it. A geometry placed by
  // products in different shards is the case every mechanism hypothesis
  // turns on, so the owners travel with the payload rather than being
  // inferred from a count.
  const owners = new Map()

  let placements = 0
  let unidentified = 0

  for ( ;; ) {

    const { extracted, remaining } = api.ExtractGeometryBatch(
        modelID, BATCH_SIZE, ( mesh ) => {

          for ( let where = 0; where < mesh.geometries.size(); ++where ) {

            const placed = mesh.geometries.get( where )
            const id = placed.geometryExpressID

            // Same exclusion the sweep makes, and for the same reason: an
            // undefined ID collapses every such geometry into one bucket and
            // manufactures a cross-run difference out of nothing.
            if ( !Number.isInteger( id ) ) {
              ++unidentified
              continue
            }

            ++placements

            const seen = owners.get( id )

            if ( seen === void 0 ) {
              owners.set( id, [ mesh.expressID ] )
            } else if ( seen[ seen.length - 1 ] !== mesh.expressID ) {
              seen.push( mesh.expressID )
            }

            if ( payloads.has( id ) ) {
              continue
            }

            // GetGeometry hands back an owning clone and embind finalization
            // is nondeterministic, so it is released inside the loop rather
            // than held for the run.
            const geometry = api.GetGeometry( modelID, id )

            try {

              const vertices = api.GetVertexArray(
                  geometry.GetVertexData(), geometry.GetVertexDataSize() )
              const indices = api.GetIndexArray(
                  geometry.GetIndexData(), geometry.GetIndexDataSize() )

              const digest = createHash( 'sha256' )
                  .update( new Uint8Array( vertices.buffer, vertices.byteOffset,
                      vertices.byteLength ) )
                  .update( new Uint8Array( indices.buffer, indices.byteOffset,
                      indices.byteLength ) )
                  .digest( 'hex' )

              payloads.set( id, `${vertices.length}:${indices.length}:${digest}` )

            } finally {
              geometry.delete()
            }
          }
        } )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  if ( unidentified > 0 ) {
    throw new Error(
        `${task.label}: ${unidentified} placements carry a non-integer ` +
        'geometryExpressID, so no count below would identify a geometry' )
  }

  const lines = []

  for ( const [ id, payload ] of payloads ) {
    lines.push( JSON.stringify( { id, p: payload, o: owners.get( id ) } ) )
  }

  fs.writeFileSync( geometryPath( task.outDir, task.label ), `${lines.join( '\n' )}\n` )

  const totals = {
    label: task.label,
    geometries: payloads.size,
    placements,
  }

  if ( task.withProducts ) {
    totals.products = dumpProductTable( api, modelID, task.outDir )
  }

  return totals
}


/**
 * The model's own structure, for the join the report performs.
 *
 * One row per `IfcProduct`: its express ID (which is what a placement names),
 * its dispatch key, how that key resolved, and the two structural memberships
 * the standing hypotheses turn on — whether the pump reaches it only through
 * the rel-aggregates pass, and whether it is voided by an
 * `IfcRelVoidsElement`.
 *
 * **Read from the reference run only, and that is not a limitation.** Every
 * one of these is a property of the FILE, not of a shard: the dispatch walk
 * is total over attribute failures precisely so that every worker takes the
 * same fallback (`geometry_dispatch.ts`), and the aggregate-target and void
 * relationships are attributes. A sharded worker computing them would
 * produce the same table over a filtered worklist.
 *
 * @param {object} api The opened `IfcAPI`.
 * @param {number} modelID The open model.
 * @param {string} outDir Where to write the table.
 * @return {number} How many products were described.
 */
function dumpProductTable( api, modelID, outDir ) {

  const gen = requireIfcGen()
  const dispatch = requireDispatch()
  const passthrough = api.models.get( modelID )
  const model = passthrough.model[ 0 ]

  // The set the per-product pass deliberately skips: these products are
  // extracted ONLY by the rel-aggregates pass, with the relating object's
  // master rel-voids (`collectDemandCandidates_`). Reached through the
  // private field because there is no public accessor; it is the same set
  // `ensureDemandWorklists_` reads.
  const aggregateTargets = passthrough.conwayGeometry_.aggregateTargetLocalIDs()

  const voidedElements = new Set()
  const openingElements = new Set()

  for ( const relation of model.types( gen.IfcRelVoidsElement ) ) {

    const element = readOrUndefined( () => relation.RelatingBuildingElement )
    const opening = readOrUndefined( () => relation.RelatedOpeningElement )

    if ( element !== void 0 ) {
      voidedElements.add( element.localID )
    }

    if ( opening !== void 0 ) {
      openingElements.add( opening.localID )
    }
  }

  // The keys the PUMP actually places a product by, which for an aggregate
  // target are not the product's own. `adoptShardedWorklists_` shards the
  // rel-aggregates worklist by the RELATING OBJECT's key, and an aggregate
  // target is extracted only by that pass — so on a model where 96.6 % of
  // placements are aggregate targets, keying the analysis on `product.k`
  // attributes almost every placer to the wrong shard (codex review, PR
  // #698). One level, matching the pump: the aggregates worklist keys on the
  // relating object directly, not on the root of a nest.
  //
  // A SET per product, not one key: the pump keeps every IfcRelAggregates
  // that names a product and shards each independently, so a product related
  // by two aggregates whose relating objects land in different shards is
  // built in both. Collapsing that to a scalar attributed every occurrence
  // to whichever relationship was walked last (codex review, PR #698).
  const effectiveKeys = new Map()

  for ( const relAggregate of model.types( gen.IfcRelAggregates ) ) {

    const relatingLocalID =
      dispatch.relatingLocalIDOf( model, relAggregate.localID )
    const key = dispatch.geometryDispatchKey( model, relatingLocalID )

    for ( const related of
      readOrUndefined( () => relAggregate.RelatedObjects ) ?? [] ) {

      const existing = effectiveKeys.get( related.localID )

      if ( existing === void 0 ) {
        effectiveKeys.set( related.localID, new Set( [ key ] ) )
      } else {
        existing.add( key )
      }
    }
  }

  const lines = []
  let described = 0

  for ( const product of model.types( gen.IfcProduct ) ) {

    const localID = product.localID
    const key = dispatch.geometryDispatchKey( model, localID )

    lines.push( JSON.stringify( {
      e: product.expressID,
      l: localID,
      k: key,
      // A product the aggregates pass does not own is placed by its own
      // key, which is the whole list for it.
      ek: aggregateTargets.has( localID ) ?
        [ ...( effectiveKeys.get( localID ) ?? [ key ] ) ] : [ key ],
      r: keyResolution( gen, product, localID, key ),
      a: aggregateTargets.has( localID ) ? 1 : 0,
      v: voidedElements.has( localID ) ? 1 : 0,
      x: openingElements.has( localID ) ? 1 : 0,
    } ) )

    ++described
  }

  fs.writeFileSync(
      path.join( outDir, 'products.ndjson' ), `${lines.join( '\n' )}\n` )

  return described
}


/**
 * Which of `geometryDispatchKey`'s three outcomes a product took.
 *
 * Re-walks the same attributes rather than inferring from the key's value: a
 * shape representation's local ID could in principle equal the product's own,
 * and a diagnosis that mistook the positional fallback for a real placement
 * would be reporting the opposite of what happened.
 *
 * @param {object} gen The generated IFC classes.
 * @param {object} product The product.
 * @param {number} localID Its local ID.
 * @param {number} key The key the engine computed for it.
 * @return {string} `mapped`, `shape` or `self`.
 */
function keyResolution( gen, product, localID, key ) {

  const definition = readOrUndefined( () => product.Representation )

  if ( !( definition instanceof gen.IfcProductDefinitionShape ) ) {
    return KEY_SELF
  }

  const representations = readOrUndefined( () => definition.Representations )

  for ( const representation of representations ?? [] ) {

    for ( const item of readOrUndefined( () => representation.Items ) ?? [] ) {

      if ( item instanceof gen.IfcMappedItem ) {
        return KEY_MAPPED
      }
    }
  }

  return key === localID ? KEY_SELF : KEY_SHAPE
}


/**
 * Read an attribute, treating an unresolvable one as absent.
 *
 * @param {Function} read The access.
 * @return {*} The value, or undefined.
 */
function readOrUndefined( read ) {

  try {
    return read()
  } catch {
    return void 0
  }
}


/** @return {object} The generated IFC4 classes. */
function requireIfcGen() {
  return globalThis.__conwayIfcGen
}


/** @return {object} The dispatch module. */
function requireDispatch() {
  return globalThis.__conwayDispatch
}


if ( !isMainThread ) {

  // Through the barrel, not by module path. The generated classes are
  // mutually circular (`IfcAnnotation` extends `IfcProduct`, and the type
  // registry pulls the whole graph), so importing four of them directly
  // gives `Cannot access 'IfcProduct' before initialization` — the barrel is
  // what orders the graph.
  const gen = await import( '../compiled/src/ifc/ifc4_gen/index.js' )
  const dispatch = await import( '../compiled/src/ifc/geometry_dispatch.js' )

  globalThis.__conwayIfcGen = gen
  globalThis.__conwayDispatch = dispatch

  runWorker( workerData ).then(
      ( totals ) => parentPort.postMessage( { ok: true, totals } ),
      ( error ) => parentPort.postMessage(
          { ok: false, message: error?.stack ?? String( error ) } ) )

} else {

  await main()
}


/**
 * Run the reference, then each shard, then report.
 *
 * @return {Promise<void>} When the report is written.
 */
async function main() {

  const argv = process.argv.slice( 2 )
  const filePath = argv.find( ( argument ) => !argument.startsWith( '--' ) )

  if ( filePath === void 0 ) {
    throw new Error( 'usage: m3_shard_divergence.mjs <model> [--workers N] [--out DIR]' )
  }

  const shardCount = Number( optionOf( argv, '--workers' ) ?? 4 )
  const outDir = optionOf( argv, '--out' ) ??
    path.join( REPO_ROOT, 'scratch', 'shard-divergence' )

  fs.mkdirSync( outDir, { recursive: true } )

  const runs = [ {
    filePath,
    label: 'ref',
    outDir,
    shard: void 0,
    withProducts: true,
  } ]

  for ( let index = 0; index < shardCount; ++index ) {
    runs.push( {
      filePath,
      label: `shard${index}of${shardCount}`,
      outDir,
      shard: { index, count: shardCount },
      withProducts: false,
    } )
  }

  // Sequential, and this is the control that matters: N shards that never
  // run at the same time cannot diverge because of anything concurrent.
  for ( const run of runs ) {

    const started = Date.now()
    const totals = await runOne( run )

    console.log(
        `${totals.label}: ${totals.geometries.toLocaleString( 'en-US' )} ` +
        `geometries, ${totals.placements.toLocaleString( 'en-US' )} placements` +
        `${totals.products === void 0 ? '' :
          `, ${totals.products.toLocaleString( 'en-US' )} products`}` +
        ` (${( ( Date.now() - started ) / 1000 ).toFixed( 1 )} s)` )
  }

  report( outDir, shardCount )
}


/**
 * One configuration, in its own worker so its wasm instance and heap go away
 * with it.
 *
 * @param {object} task What to run.
 * @return {Promise<object>} That run's totals.
 */
function runOne( task ) {

  return new Promise( ( resolve, reject ) => {

    // The permutation lever is stripped, not inherited. This probe's whole
    // claim is that divergence is a pure function of shard MEMBERSHIP, and a
    // CONWAY_PERMUTE_WORKLIST left exported in the shell — realistic now
    // that the sibling probe drives it — would shuffle the reference and
    // every shard and quietly invalidate that (codex review, PR #698).
    const environment = { ...process.env }

    delete environment[ 'CONWAY_PERMUTE_WORKLIST' ]

    const worker = new Worker( fileURLToPath( import.meta.url ), {
      workerData: task,
      env: environment,
      resourceLimits: { maxOldGenerationSizeMb: 12288 },
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
 * The join: which geometries came out differently, and what those geometries
 * have in common that the rest do not.
 *
 * Every population is reported as a rate against its own base, because the
 * only claim this script can support is a comparison of rates. "The divergent
 * set is 78 % positionally keyed" says nothing on a worklist that is 61 %
 * positionally keyed unless both numbers are printed.
 *
 * @param {string} outDir Where the runs wrote.
 * @param {number} shardCount How many shards ran.
 */
function report( outDir, shardCount ) {

  const reference = readGeometry( outDir, 'ref' )
  const shards = []

  for ( let index = 0; index < shardCount; ++index ) {
    shards.push( readGeometry( outDir, `shard${index}of${shardCount}` ) )
  }

  const products = readProducts( outDir )

  const differing = []
  const missing = []
  const invented = []
  const builtByCount = new Map()

  // EVERY payload any shard produced for an ID, not one of them. Retaining
  // the first shard's record and marking later disagreements as `split` made
  // `differing` depend on which shard happened to be retained: an ID whose
  // shard-0 payload matched the reference while shard 1's differed was
  // counted only as a split, while the reverse ordering was counted as a
  // divergence — so the headline count was an undercount by an amount
  // decided by shard index (codex review, PR #698).
  const sharded = new Map()

  for ( const shardGeometry of shards ) {

    for ( const [ id, record ] of shardGeometry ) {

      builtByCount.set( id, ( builtByCount.get( id ) ?? 0 ) + 1 )

      const existing = sharded.get( id )

      if ( existing === void 0 ) {
        sharded.set( id, { payloads: new Set( [ record.p ] ), o: record.o } )
      } else {
        existing.payloads.add( record.p )
      }
    }
  }

  for ( const [ id, record ] of reference ) {

    const built = sharded.get( id )

    if ( built === void 0 ) {
      missing.push( id )
      continue
    }

    // Divergent when ANY shard that built it disagrees with the reference.
    if ( [ ...built.payloads ].some( ( payload ) => payload !== record.p ) ) {
      differing.push( id )
    }
  }

  for ( const id of sharded.keys() ) {

    if ( !reference.has( id ) ) {
      invented.push( id )
    }
  }

  // Two shards built one geometry two different ways — a separate fact from
  // "differs from the reference", and still reported as such.
  const splits =
    [ ...sharded.values() ].filter( ( record ) => record.payloads.size > 1 )

  console.log( '' )
  console.log( `reference geometries      ${reference.size.toLocaleString( 'en-US' )}` )
  console.log( `sharded union geometries  ${sharded.size.toLocaleString( 'en-US' )}` )
  console.log( `IDs no shard built        ${missing.length}` )
  console.log( `IDs no reference built    ${invented.length}` )
  console.log( `IDs built differently     ${differing.length}` )
  console.log( `IDs two shards disagree   ${splits.length}` )

  const rebuilt = [ ...builtByCount.values() ].filter( ( count ) => count > 1 ).length

  console.log( `IDs more than one shard built ${rebuilt.toLocaleString( 'en-US' )}` )

  profile( 'ALL reference geometries', [ ...reference.keys() ], reference, products )
  profile( 'DIVERGENT geometries', differing, reference, products )

  fs.writeFileSync(
      path.join( outDir, 'divergent.json' ),
      `${JSON.stringify( {
        shardCount,
        referenceGeometries: reference.size,
        differing,
        missing,
        invented,
        splits: splits.length,
        rebuilt,
      }, void 0, 2 )}\n` )
}
