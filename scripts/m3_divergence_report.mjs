/**
 * Reading and profiling the geometry records the divergence instruments
 * write — shared by `m3_shard_divergence.mjs` (which varies shard
 * membership) and `m3_worklist_permutation.mjs` (which varies worklist
 * order and nothing else).
 *
 * One definition rather than two, because the two instruments exist to be
 * compared with each other: conway#640's question is whether reordering an
 * unsharded worklist moves the SAME geometries sharding moves, and an
 * overlap between two populations counted by two slightly different
 * profilers would not answer it.
 *
 * Side-effect free on purpose — both callers import it, one of them from
 * inside a worker.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'


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
export const KEY_MAPPED = 'mapped'
export const KEY_SHAPE = 'shape'
export const KEY_SELF = 'self'


/**
 * One run's records, as a file the reporting process can re-read without
 * holding them.
 *
 * @param {string} outDir Where the run's files live.
 * @param {string} label The run's name — `ref`, `shard0of4`, `seed1`.
 * @return {string} The geometry NDJSON path for that run.
 */
export function geometryPath( outDir, label ) {
  return path.join( outDir, `geometry.${label}.ndjson` )
}


/**
 * Read one run's geometry records back.
 *
 * @param {string} outDir Where the run wrote.
 * @param {string} label The run.
 * @return {Map<number, object>} id to `{p, o}`.
 */
export function readGeometry( outDir, label ) {

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
 * Read the reference run's product table.
 *
 * @param {string} outDir Where the run wrote.
 * @return {Map<number, object>} express ID to its row.
 */
export function readProducts( outDir ) {

  const products = new Map()
  const text =
    fs.readFileSync( path.join( outDir, 'products.ndjson' ), 'utf8' )

  for ( const line of text.split( '\n' ) ) {

    if ( line.length === 0 ) {
      continue
    }

    const record = JSON.parse( line )

    products.set( record.e, record )
  }

  return products
}


/**
 * How much of a population is void-implicated, counted per GEOMETRY.
 *
 * Separate from {@link profile}, which is per PLACEMENT: a geometry shared
 * between one voided placer and one unvoided one reports 50 % there, so a
 * population that is uniformly "shared between a voided and an unvoided
 * product" shows up as roughly half rather than as all of it. The mechanism
 * claim in conway#640 is about geometries, so it needs this form.
 *
 * @param {string} title What this population is.
 * @param {number[]} ids The geometry IDs in it.
 * @param {Map<number, object>} reference The reference run's records.
 * @param {Map<number, object>} products The product table.
 */
export function perGeometryVoiding( title, ids, reference, products ) {

  let anyVoided = 0
  let allVoided = 0
  let mixedVoiding = 0

  for ( const id of ids ) {

    const placers = ( reference.get( id )?.o ?? [] )
        .map( ( expressID ) => products.get( expressID ) )
        .filter( ( product ) => product !== void 0 )

    if ( placers.length === 0 ) {
      continue
    }

    const voided = placers.filter( ( product ) => product.v === 1 ).length

    if ( voided > 0 ) {
      ++anyVoided
    }

    if ( voided === placers.length ) {
      ++allVoided
    }

    if ( voided > 0 && voided < placers.length ) {
      ++mixedVoiding
    }
  }

  const rate = ( value ) => `${value.toLocaleString( 'en-US' )} ` +
    `(${( ( value / Math.max( ids.length, 1 ) ) * 100 ).toFixed( 1 )} %)`

  console.log( '' )
  console.log( `${title}: ${ids.length.toLocaleString( 'en-US' )} geometries` )
  console.log( `  at least one placer is voided         ${rate( anyVoided )}` )
  console.log( `  every placer is voided                ${rate( allVoided )}` )
  console.log( `  MIXED — some placers voided, some not ${rate( mixedVoiding )}` )
}


/**
 * Describe a population of geometries by the products that place them.
 *
 * Every population is reported as a rate against its own base, because the
 * only claim these instruments can support is a comparison of rates. "The
 * divergent set is 78 % positionally keyed" says nothing on a worklist that
 * is 61 % positionally keyed unless both numbers are printed.
 *
 * @param {string} title What this population is.
 * @param {number[]} ids The geometry IDs in it.
 * @param {Map<number, object>} reference The reference run's records.
 * @param {Map<number, object>} products The product table.
 */
export function profile( title, ids, reference, products ) {

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

      // The key the pump places by, not the product's own — they differ for
      // every aggregate target (codex review, PR #698). A table written
      // before that column existed has only the own key, which is what it
      // recorded, so it degrades to the old meaning rather than to NaN.
      keys.add( product.ek ?? product.k )
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
