/**
 * The mechanism test for conway#640, run over what
 * `m3_shard_divergence.mjs` dumped.
 *
 * That script establishes WHICH geometries a sharded load builds differently
 * and profiles them against the whole model. This one asks the question that
 * separates a correlation from a cause: **for each divergent geometry, is the
 * shard that matches the reference the one holding a placer that carries
 * voids, and the shard that differs the one holding only placers that do
 * not?**
 *
 * That is the prediction of a specific mechanism, and nothing else predicts
 * it. `IfcModelGeometry.add` is `meshes_.set(mesh.localID, mesh)` — a
 * last-writer-wins map keyed by REPRESENTATION-ITEM local ID — and
 * `extractRepresentationItem` returns early when that key is already
 * populated. So the content under a shared key is decided by which placing
 * product reaches it first and which reaches it last, and a shard changes
 * both by changing which products exist.
 *
 *   node scripts/m3_shard_divergence_explain.mjs <dir-from-the-probe>
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'


/**
 * Read an NDJSON dump.
 *
 * @param {string} file The path.
 * @return {object[]} The records.
 */
function readRecords( file ) {

  return fs.readFileSync( file, 'utf8' )
      .split( '\n' )
      .filter( ( line ) => line.length > 0 )
      .map( ( line ) => JSON.parse( line ) )
}


/**
 * Run the test and print it.
 *
 * @return {void}
 */
function main() {

  const outDir = process.argv[ 2 ]

  if ( outDir === void 0 ) {
    throw new Error( 'usage: m3_shard_divergence_explain.mjs <dir>' )
  }

  const summary =
    JSON.parse( fs.readFileSync( path.join( outDir, 'divergent.json' ), 'utf8' ) )
  const shardCount = summary.shardCount

  const products = new Map()

  for ( const record of readRecords( path.join( outDir, 'products.ndjson' ) ) ) {
    products.set( record.e, record )
  }

  const reference = new Map()

  for ( const record of readRecords( path.join( outDir, 'geometry.ref.ndjson' ) ) ) {
    reference.set( record.id, record )
  }

  const shards = []

  for ( let index = 0; index < shardCount; ++index ) {

    const byId = new Map()

    for ( const record of
      readRecords( path.join( outDir, `geometry.shard${index}of${shardCount}.ndjson` ) ) ) {

      byId.set( record.id, record )
    }

    shards.push( byId )
  }

  // Per-GEOMETRY rates, which is what the claim is about. The probe's own
  // profile is per-placement: a geometry with one voided placer and one
  // unvoided one reports 50 % there, so a population that is uniformly
  // "shared between a voided and an unvoided product" shows up as roughly
  // half rather than as all of it.
  perGeometryRates( 'ALL reference geometries', [ ...reference.keys() ],
      reference, products, shardCount )
  perGeometryRates( 'DIVERGENT geometries', summary.differing,
      reference, products, shardCount )

  mechanismTest( summary.differing, reference, shards, products, shardCount )
}


/**
 * How many geometries in a population have at least one placer of each kind.
 *
 * @param {string} title The population.
 * @param {number[]} ids Its geometry IDs.
 * @param {Map<number, object>} reference The reference records.
 * @param {Map<number, object>} products The product table.
 * @param {number} shardCount How many shards.
 */
function perGeometryRates( title, ids, reference, products, shardCount ) {

  let anyVoided = 0
  let allVoided = 0
  let mixedVoiding = 0
  let acrossShards = 0
  let mixedVoidingAcrossShards = 0

  for ( const id of ids ) {

    const placers = ( reference.get( id )?.o ?? [] )
        .map( ( expressID ) => products.get( expressID ) )
        .filter( ( product ) => product !== void 0 )

    if ( placers.length === 0 ) {
      continue
    }

    const voided = placers.filter( ( product ) => product.v === 1 )
    const shardsTouched = new Set(
        placers.map( ( product ) => Math.abs( product.k ) % shardCount ) )

    if ( voided.length > 0 ) {
      ++anyVoided
    }

    if ( voided.length === placers.length ) {
      ++allVoided
    }

    const mixed = voided.length > 0 && voided.length < placers.length

    if ( mixed ) {
      ++mixedVoiding
    }

    if ( shardsTouched.size > 1 ) {
      ++acrossShards
    }

    if ( mixed && shardsTouched.size > 1 ) {
      ++mixedVoidingAcrossShards
    }
  }

  const rate = ( value ) => `${value.toLocaleString( 'en-US' )} ` +
    `(${( ( value / ids.length ) * 100 ).toFixed( 1 )} %)`

  console.log( '' )
  console.log( `${title}: ${ids.length.toLocaleString( 'en-US' )} geometries` )
  console.log( `  at least one placer is voided        ${rate( anyVoided )}` )
  console.log( `  every placer is voided               ${rate( allVoided )}` )
  console.log( `  MIXED — some placers voided, some not ${rate( mixedVoiding )}` )
  console.log( `  placers span more than one shard     ${rate( acrossShards )}` )
  console.log( `  mixed voiding AND spanning shards    ${rate( mixedVoidingAcrossShards )}` )
}


/**
 * The decisive test: does the shard that reproduces the reference hold the
 * voided placer, and the shard that diverges hold only unvoided ones?
 *
 * A geometry is counted as CONFIRMING when exactly that holds. Anything else
 * is counted and named rather than folded into a pass rate — a mechanism
 * claim that quietly drops its exceptions is the failure mode this whole
 * investigation exists to avoid.
 *
 * @param {number[]} ids The divergent geometry IDs.
 * @param {Map<number, object>} reference The reference records.
 * @param {Map<number, object>[]} shards Per-shard records.
 * @param {Map<number, object>} products The product table.
 * @param {number} shardCount How many shards.
 */
function mechanismTest( ids, reference, shards, products, shardCount ) {

  let confirming = 0
  let matchingShardHasNoVoided = 0
  let divergingShardHasVoided = 0
  let onlyOneShardBuilt = 0
  let noShardMatches = 0

  for ( const id of ids ) {

    const referencePayload = reference.get( id ).p
    const placers = ( reference.get( id )?.o ?? [] )
        .map( ( expressID ) => products.get( expressID ) )
        .filter( ( product ) => product !== void 0 )

    // Which shard each placer's dispatch key sends it to.
    const voidedShards = new Set()

    for ( const product of placers ) {

      if ( product.v === 1 ) {
        voidedShards.add( Math.abs( product.k ) % shardCount )
      }
    }

    const matching = []
    const diverging = []

    for ( let index = 0; index < shardCount; ++index ) {

      const built = shards[ index ].get( id )

      if ( built === void 0 ) {
        continue
      }

      if ( built.p === referencePayload ) {
        matching.push( index )
      } else {
        diverging.push( index )
      }
    }

    if ( matching.length + diverging.length < 2 ) {
      ++onlyOneShardBuilt
    }

    if ( matching.length === 0 ) {
      ++noShardMatches
    }

    const everyMatchingHasVoided =
      matching.length > 0 && matching.every( ( index ) => voidedShards.has( index ) )
    const noDivergingHasVoided =
      diverging.every( ( index ) => !voidedShards.has( index ) )

    if ( everyMatchingHasVoided && noDivergingHasVoided ) {
      ++confirming
      continue
    }

    if ( matching.length > 0 && !everyMatchingHasVoided ) {
      ++matchingShardHasNoVoided
    }

    if ( !noDivergingHasVoided ) {
      ++divergingShardHasVoided
    }
  }

  console.log( '' )
  console.log( 'MECHANISM TEST — the shard that matches the reference should be the' )
  console.log( 'one holding a voided placer; the shard that diverges should hold none.' )
  console.log( `  divergent geometries tested            ${ids.length.toLocaleString( 'en-US' )}` )
  console.log( `  CONFIRMING the prediction              ${confirming.toLocaleString( 'en-US' )} ` +
    `(${( ( confirming / ids.length ) * 100 ).toFixed( 1 )} %)` )
  console.log( `  matching shard held no voided placer   ${matchingShardHasNoVoided.toLocaleString( 'en-US' )}` )
  console.log( `  diverging shard DID hold a voided placer ${divergingShardHasVoided.toLocaleString( 'en-US' )}` )
  console.log( `  only one shard built it at all         ${onlyOneShardBuilt.toLocaleString( 'en-US' )}` )
  console.log( `  no shard reproduced the reference      ${noShardMatches.toLocaleString( 'en-US' )}` )
}


main()
