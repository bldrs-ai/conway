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


const REPO_ROOT = path.resolve( fileURLToPath( new URL( '.', import.meta.url ) ), '..' )
const BATCH_SIZE = 64


/**
 * How a product's dispatch key resolved — the three outcomes
 * `geometryDispatchKey` can produce, kept apart because they place a product
 * for completely different reasons.
 *
 * `mapped` is the intended one: the key is a shared `MappingSource`, so every
 * instance of that block hashes to one shard. `shape` still co-locates
 * products sharing a whole representation. `self` is the total-function
 * fallback — the product's own local ID — which places it POSITIONALLY, by
 * where it happens to sit in the file, and is the outcome 60.7 % of one
 * model's worklist takes (ledger §10).
 */
const KEY_MAPPED = 'mapped'
const KEY_SHAPE = 'shape'
const KEY_SELF = 'self'


/**
 * One run's records, as a file this process can re-read without holding them.
 *
 * @param {string} outDir Where the run's files live.
 * @param {string} label The run's name — `ref`, or `shard0of4`.
 * @return {string} The geometry NDJSON path for that run.
 */
function geometryPath( outDir, label ) {
  return path.join( outDir, `geometry.${label}.ndjson` )
}


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

  const lines = []
  let described = 0

  for ( const product of model.types( gen.IfcProduct ) ) {

    const localID = product.localID
    const key = dispatch.geometryDispatchKey( model, localID )

    lines.push( JSON.stringify( {
      e: product.expressID,
      l: localID,
      k: key,
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

    const worker = new Worker( fileURLToPath( import.meta.url ), {
      workerData: task,
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
 * Read one run's geometry records back.
 *
 * @param {string} outDir Where the run wrote.
 * @param {string} label The run.
 * @return {Map<number, object>} id to `{p, o}`.
 */
function readGeometry( outDir, label ) {

  const byId = new Map()
  const text = fs.readFileSync( geometryPath( outDir, label ), 'utf8' )

  for ( const line of text.split( '\n' ) ) {

    if ( line.length === 0 ) {
      continue
    }

    const record = JSON.parse( line )

    byId.set( record.id, record )
  }

  return byId
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

  const products = new Map()
  const productsText =
    fs.readFileSync( path.join( outDir, 'products.ndjson' ), 'utf8' )

  for ( const line of productsText.split( '\n' ) ) {

    if ( line.length === 0 ) {
      continue
    }

    const record = JSON.parse( line )

    products.set( record.e, record )
  }

  const differing = []
  const missing = []
  const invented = []
  const builtByCount = new Map()

  const sharded = new Map()

  for ( const shardGeometry of shards ) {

    for ( const [ id, record ] of shardGeometry ) {

      builtByCount.set( id, ( builtByCount.get( id ) ?? 0 ) + 1 )

      const existing = sharded.get( id )

      if ( existing === void 0 ) {
        sharded.set( id, record )
      } else if ( existing.p !== record.p ) {
        // Two shards built one geometry two different ways. That is a
        // separate fact from "differs from the reference" and is counted as
        // such below.
        existing.split = true
      }
    }
  }

  for ( const [ id, record ] of reference ) {

    const built = sharded.get( id )

    if ( built === void 0 ) {
      missing.push( id )
      continue
    }

    if ( built.p !== record.p ) {
      differing.push( id )
    }
  }

  for ( const id of sharded.keys() ) {

    if ( !reference.has( id ) ) {
      invented.push( id )
    }
  }

  const splits = [ ...sharded.values() ].filter( ( record ) => record.split === true )

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


/**
 * Describe a population of geometries by the products that place them.
 *
 * @param {string} title What this population is.
 * @param {number[]} ids The geometry IDs in it.
 * @param {Map<number, object>} reference The reference run's records.
 * @param {Map<number, object>} products The product table.
 */
function profile( title, ids, reference, products ) {

  const counts = {
    geometries: ids.length,
    owners: 0,
    ownersResolved: 0,
    [ KEY_MAPPED ]: 0,
    [ KEY_SHAPE ]: 0,
    [ KEY_SELF ]: 0,
    aggregateTarget: 0,
    voided: 0,
    opening: 0,
    multiOwner: 0,
    ownersAcrossKeys: 0,
  }

  for ( const id of ids ) {

    const owners = reference.get( id )?.o ?? []
    const keys = new Set()

    if ( owners.length > 1 ) {
      ++counts.multiOwner
    }

    for ( const expressID of owners ) {

      ++counts.owners

      const product = products.get( expressID )

      if ( product === void 0 ) {
        continue
      }

      ++counts.ownersResolved
      ++counts[ product.r ]
      counts.aggregateTarget += product.a
      counts.voided += product.v
      counts.opening += product.x
      keys.add( product.k )
    }

    if ( keys.size > 1 ) {
      ++counts.ownersAcrossKeys
    }
  }

  const rate = ( value ) => counts.ownersResolved === 0 ? 'n/a' :
    `${( ( value / counts.ownersResolved ) * 100 ).toFixed( 1 )} %`

  console.log( '' )
  console.log( `${title}: ${counts.geometries.toLocaleString( 'en-US' )} geometries, ` +
    `${counts.owners.toLocaleString( 'en-US' )} placements ` +
    `(${counts.ownersResolved.toLocaleString( 'en-US' )} resolved to a product)` )
  console.log( `  key mapped   ${rate( counts[ KEY_MAPPED ] )}` )
  console.log( `  key shape    ${rate( counts[ KEY_SHAPE ] )}` )
  console.log( `  key self     ${rate( counts[ KEY_SELF ] )}` )
  console.log( `  aggregate target ${rate( counts.aggregateTarget )}` )
  console.log( `  voided element   ${rate( counts.voided )}` )
  console.log( `  opening element  ${rate( counts.opening )}` )
  console.log( `  geometries with >1 placing entity  ${counts.multiOwner.toLocaleString( 'en-US' )}` )
  console.log( `  geometries whose placers disagree on the dispatch key ` +
    `${counts.ownersAcrossKeys.toLocaleString( 'en-US' )}` )
}
