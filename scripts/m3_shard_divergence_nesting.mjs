/**
 * The set-nesting test for conway#640 — does a geometry's content depend only
 * on WHICH products are in the shard, in a way that composes?
 *
 * The partition nests exactly. `shardOfDispatchKey` is `|key| % count`, so
 * the products of shard 0 of 2 are precisely the products of shard 0 of 4
 * together with those of shard 2 of 4, and the unsharded reference is
 * shard 0 of 2 together with shard 1 of 2. That gives two decompositions of
 * one product set into two halves, with no engine change and no new run.
 *
 * The test that buys: if the content cached under a shared representation
 * item is decided by ONE of the products that write it — the last writer of
 * a last-writer-wins map, which is what `IfcModelGeometry.add` is — then a
 * union's payload must equal one of its two halves' payloads. That writer
 * lives in one half or the other, and its own half preserves the relative
 * order it had in the union.
 *
 * A union whose payload matches NEITHER half is therefore evidence against
 * "one writer decides" and for something that composes across products —
 * accumulation, or a shared input that more products perturb.
 *
 * Both are reported, because the split between them is the finding.
 *
 *   node scripts/m3_shard_divergence_nesting.mjs <n2-dir> <n4-dir>
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'


/**
 * Read one run's geometry payloads.
 *
 * @param {string} dir The probe's output directory.
 * @param {string} label The run.
 * @return {Map<number, string>} Geometry ID to payload.
 */
function readPayloads( dir, label ) {

  const byId = new Map()
  const file = path.join( dir, `geometry.${label}.ndjson` )

  for ( const line of fs.readFileSync( file, 'utf8' ).split( '\n' ) ) {

    if ( line.length === 0 ) {
      continue
    }

    const record = JSON.parse( line )

    byId.set( record.id, record.p )
  }

  return byId
}


/**
 * One decomposition: a union against the two halves that partition it.
 *
 * @param {string} title What is being decomposed.
 * @param {Map<number, string>} union The whole set's payloads.
 * @param {Map<number, string>} left One half.
 * @param {Map<number, string>} right The other.
 */
function decompose( title, union, left, right ) {

  let bothBuilt = 0
  let matchesOne = 0
  let matchesNeither = 0
  let onlyOneHalfBuilt = 0
  let matchesTheOneHalf = 0
  const violations = []

  for ( const [ id, payload ] of union ) {

    const a = left.get( id )
    const b = right.get( id )

    if ( a === void 0 && b === void 0 ) {
      continue
    }

    if ( a === void 0 || b === void 0 ) {

      ++onlyOneHalfBuilt

      if ( payload === ( a ?? b ) ) {
        ++matchesTheOneHalf
      } else {
        violations.push( id )
      }

      continue
    }

    ++bothBuilt

    if ( payload === a || payload === b ) {
      ++matchesOne
    } else {
      ++matchesNeither
      violations.push( id )
    }
  }

  console.log( '' )
  console.log( title )
  console.log( `  both halves built it            ${bothBuilt.toLocaleString( 'en-US' )}` )
  console.log( `    union payload matches a half  ${matchesOne.toLocaleString( 'en-US' )}` )
  console.log( `    union payload matches NEITHER ${matchesNeither.toLocaleString( 'en-US' )}` )
  console.log( `  only one half built it          ${onlyOneHalfBuilt.toLocaleString( 'en-US' )}` )
  console.log( `    union payload matches it      ${matchesTheOneHalf.toLocaleString( 'en-US' )}` )
  console.log( `    union payload differs         ${( onlyOneHalfBuilt - matchesTheOneHalf ).toLocaleString( 'en-US' )}` )
  console.log( `  TOTAL violations of "one writer decides" ${violations.length.toLocaleString( 'en-US' )}` )

  return violations
}


/**
 * Run both decompositions.
 *
 * @return {void}
 */
function main() {

  const [ n2Dir, n4Dir ] = process.argv.slice( 2 )

  if ( n2Dir === void 0 || n4Dir === void 0 ) {
    throw new Error( 'usage: m3_shard_divergence_nesting.mjs <n2-dir> <n4-dir>' )
  }

  const reference = readPayloads( n2Dir, 'ref' )
  const shard0of2 = readPayloads( n2Dir, 'shard0of2' )
  const shard1of2 = readPayloads( n2Dir, 'shard1of2' )
  const shard0of4 = readPayloads( n4Dir, 'shard0of4' )
  const shard1of4 = readPayloads( n4Dir, 'shard1of4' )
  const shard2of4 = readPayloads( n4Dir, 'shard2of4' )
  const shard3of4 = readPayloads( n4Dir, 'shard3of4' )

  console.log(
      'Nesting: |key| % 2 == 0 is exactly |key| % 4 in {0,2}, so each line ' +
      'below\ndecomposes one product set into the two halves that partition it.' )

  decompose( 'reference  =  shard 0 of 2  +  shard 1 of 2',
      reference, shard0of2, shard1of2 )
  decompose( 'shard 0 of 2  =  shard 0 of 4  +  shard 2 of 4',
      shard0of2, shard0of4, shard2of4 )
  decompose( 'shard 1 of 2  =  shard 1 of 4  +  shard 3 of 4',
      shard1of2, shard1of4, shard3of4 )
}


main()
