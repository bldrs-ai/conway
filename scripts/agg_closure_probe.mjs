/**
 * Where an aggregate target's paging closure actually lives (issue #616).
 *
 * `scripts/agg_pager_trace.mjs` establishes that the rel-aggregate pass
 * re-reads a D3D-shaped file 220x and that its chunk hit rate is 99.6 % —
 * so the amplification is not "the walk misses everything", it is "a small
 * fraction of a very large number of requests misses, and each miss is a
 * whole 4 MiB chunk". This script answers the next question: **which
 * records is the walk reaching for, and where in the file do they sit.**
 *
 * For a sample of aggregate targets spread across the file it pages one
 * product's extraction closure with a fresh `seen` set — exactly what
 * `AggregateExtractPager.ensureForStep` does for a one-target relationship,
 * which is D3D's median case — and reports the closure's records by chunk,
 * naming the entity types that live outside the product's own chunk.
 *
 * Usage:
 *   node --max-old-space-size=8192 scripts/agg_closure_probe.mjs \
 *     [--samples 60] [--json out.json] <model.ifc>
 */
import * as fs from 'node:fs'
import * as process from 'node:process'
import { performance } from 'node:perf_hooks'

const BYTES_PER_MB = 1024 * 1024
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

const samples = Number( flagValue( '--samples', '60' ) )
const jsonOut = flagValue( '--json', void 0 )
const valueFlags = new Set( [ '--samples', '--json' ] )
const filePath =
  argv.find( ( a, i ) => !a.startsWith( '--' ) && !valueFlags.has( argv[ i - 1 ] ) )

if ( filePath === void 0 ) {
  console.error(
      'usage: agg_closure_probe.mjs [--samples N] [--json out.json] <model.ifc>' )
  process.exit( 2 )
}

const { IfcAPI, LogLevel } =
  await import( '../compiled/src/compat/web-ifc/ifc_api.js' )
const { default: EntityTypesIfc } =
  await import( '../compiled/src/ifc/ifc4_gen/entity_types_ifc.gen.js' )

/** Reverse map from the numeric type ID to its IFC type name. */
const typeName = new Map()

for ( const [ name, id ] of Object.entries( EntityTypesIfc ) ) {
  if ( typeof id === 'number' ) {
    typeName.set( id, name )
  }
}

/** Byte store over a file descriptor, counting reads. */
class CountingFileStore {

  /**
   * Open the file.
   *
   * @param {string} path File path.
   */
  constructor( path ) {
    this.fd = fs.openSync( path, 'r' )
    this.byteLength = fs.fstatSync( this.fd ).size
    this.reads = 0
    this.bytes = 0
  }

  /**
   * Read a byte range.
   *
   * @param {number} offset Byte offset.
   * @param {number} length Byte count.
   * @return {Promise<Uint8Array>} The bytes read.
   */
  async read( offset, length ) {
    const buf = Buffer.allocUnsafe( length )
    const got = fs.readSync( this.fd, buf, 0, length, offset )

    this.reads++
    this.bytes += got

    return new Uint8Array( buf.buffer, buf.byteOffset, got )
  }

  /** Close the descriptor. */
  close() {
    fs.closeSync( this.fd )
  }
}

const api = new IfcAPI()

await api.Init()
api.SetLogLevel( LogLevel.LOG_LEVEL_ERROR )

const store = new CountingFileStore( filePath )
const t0 = performance.now()
const modelID = await api.OpenModelStream( store, {
  COORDINATE_TO_ORIGIN: true,
  USE_FAST_BOOLS: true,
  DEFER_GEOMETRY: true,
} )

if ( modelID < 0 ) {
  console.error( 'open failed' )
  process.exit( 1 )
}

console.log( `open ${( ( performance.now() - t0 ) / 1000 ).toFixed( 1 )} s` )

// One budget-1 batch populates demandProducts_/demandAggregates_ through the
// production worklist build; nothing else exposes them.
await api.ExtractGeometryBatchAsync( modelID, 1, () => { /* no meshes */ } )

const passthrough = api.getPassthrough( modelID )
const extraction = passthrough.conwayGeometry_
const model = extraction.model
const provider = model.bufferProvider_
const chunkBytes = provider.chunkBytes_
const aggregates = passthrough.demandAggregates_ ?? []

console.log( `${aggregates.length} IfcRelAggregates, chunk ` +
  `${( chunkBytes / BYTES_PER_MB ).toFixed( 0 )} MiB, ` +
  `cap ${provider.maxResidentChunks_}` )

const rows = []
const farTypeCounts = new Map()
const farChunkCounts = new Map()

const stride = Math.max( 1, Math.floor( aggregates.length / samples ) )

for ( let where = 0; where < aggregates.length; where += stride ) {

  const relAggregate = aggregates[ where ]

  await model.ensureResidentByLocalID( relAggregate.localID )

  const products = extraction.relatedAggregateProductLocalIDs( relAggregate )

  if ( products === void 0 || products.length === 0 ) {
    continue
  }

  const productLocalID = products[ 0 ]
  const seen = new Set()
  const leafSpans = []

  await extraction.ensureResidentForProductExtract( productLocalID, seen, leafSpans )

  const productChunk = Math.floor( model.address_[ productLocalID ] / chunkBytes )
  const chunks = new Set()
  const byChunk = new Map()

  for ( const localID of seen ) {

    const chunk = Math.floor( model.address_[ localID ] / chunkBytes )

    chunks.add( chunk )
    byChunk.set( chunk, ( byChunk.get( chunk ) ?? 0 ) + 1 )

    if ( chunk !== productChunk ) {

      const name = typeName.get( model.typeIDOf( localID ) ) ?? 'UNKNOWN'

      farTypeCounts.set( name, ( farTypeCounts.get( name ) ?? 0 ) + 1 )
      farChunkCounts.set( chunk, ( farChunkCounts.get( chunk ) ?? 0 ) + 1 )
    }
  }

  for ( const span of leafSpans ) {
    const first = Math.floor( span.address / chunkBytes )
    const last = Math.floor( ( span.address + span.length - 1 ) / chunkBytes )

    for ( let c = first; c <= last; ++c ) {
      chunks.add( c )
    }
  }

  const sortedChunks = [ ...chunks ].sort( ( a, b ) => a - b )

  rows.push( {
    rel: where,
    productLocalID,
    productChunk,
    records: seen.size,
    chunks: sortedChunks,
    spanChunks: sortedChunks[ sortedChunks.length - 1 ] - sortedChunks[ 0 ],
  } )

  model.releaseSourceViews( seen )
  model.unpinLocalIDs( seen )

  for ( const span of leafSpans ) {
    model.unpinAddressRange( span.address, span.length )
  }
}

console.log( `\nsampled ${rows.length} aggregate targets` )

const recordCounts = rows.map( ( r ) => r.records ).sort( ( a, b ) => a - b )
const chunkCounts = rows.map( ( r ) => r.chunks.length ).sort( ( a, b ) => a - b )
const spans = rows.map( ( r ) => r.spanChunks ).sort( ( a, b ) => a - b )

/**
 * Nearest-rank percentile of a sorted numeric array.
 *
 * @param {number[]} values Sorted values.
 * @param {number} fraction 0..1.
 * @return {number} The percentile.
 */
function pct( values, fraction ) {
  return values[ Math.min( values.length - 1,
      Math.floor( fraction * values.length ) ) ] ?? 0
}

console.log( `closure records per target: p50 ${pct( recordCounts, 0.5 )}, ` +
  `p90 ${pct( recordCounts, 0.9 )}, max ${recordCounts[ recordCounts.length - 1 ]}` )
console.log( `distinct chunks per target: p50 ${pct( chunkCounts, 0.5 )}, ` +
  `p90 ${pct( chunkCounts, 0.9 )}, max ${chunkCounts[ chunkCounts.length - 1 ]}` )
console.log( `chunk span per target (first..last): p50 ${pct( spans, 0.5 )}, ` +
  `p90 ${pct( spans, 0.9 )}, max ${spans[ spans.length - 1 ]}` )

console.log( '\nrecords outside the product\'s own chunk, by type (top 15):' )

for ( const [ name, count ] of
  [ ...farTypeCounts.entries() ].sort( ( a, b ) => b[ 1 ] - a[ 1 ] ).slice( 0, 15 ) ) {
  console.log( `  ${name.padEnd( 40 )} ${count}` )
}

console.log( '\nchunks holding those records (top 15):' )

for ( const [ chunk, count ] of
  [ ...farChunkCounts.entries() ].sort( ( a, b ) => b[ 1 ] - a[ 1 ] ).slice( 0, 15 ) ) {
  console.log( `  chunk ${String( chunk ).padStart( 3 )} ` +
    `(${( chunk * chunkBytes / BYTES_PER_MB ).toFixed( 0 )} MB) : ${count}` )
}

console.log( '\nsample rows (rel, productChunk -> chunks touched):' )

for ( const row of rows.slice( 0, 20 ) ) {
  console.log( `  rel ${String( row.rel ).padStart( 6 )} ` +
    `chunk ${String( row.productChunk ).padStart( 3 )} ` +
    `records ${String( row.records ).padStart( 5 )} -> ` +
    `[${row.chunks.join( ',' )}]` )
}

if ( jsonOut !== void 0 ) {
  fs.writeFileSync( jsonOut, JSON.stringify( {
    file: filePath,
    chunkBytes,
    rows,
    farTypeCounts: [ ...farTypeCounts.entries() ],
    farChunkCounts: [ ...farChunkCounts.entries() ],
  }, void 0, 1 ) )
  console.log( `\njson: ${jsonOut}` )
}

store.close()
