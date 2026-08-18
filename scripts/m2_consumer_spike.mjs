/**
 * M2 consumer spike (issue #393): what does putting semantic consumers on
 * the streaming parse's per-record event path actually cost?
 *
 * The M2 contract is "consumers stay sync + cheap, nothing expensive runs in
 * the event path". This measures whether the *seam itself* honours that, and
 * what the shipped consumers add, against the production columnar streaming
 * parse as baseline. Phases (child process per phase, so heap peaks and JIT
 * state never bleed across measurements):
 *
 *   base      : buildColumnarIndexStreaming with NO onRecordIndexed hook.
 *   hook      : ... with an empty hook. Isolates the cost the seam charges
 *               before any consumer exists — notably the per-record
 *               `input.buffer.subarray(...)` the parser allocates to pass
 *               recordBytes (argument evaluation is skipped entirely when
 *               the hook is undefined, so `base` never pays it).
 *   dispatch  : ... through StreamingRecordDispatcher with one type-set
 *               subscription (IfcRoot) writing express IDs into a growable
 *               Uint32Array — the compact-capture discipline M2 prescribes.
 *   consumers : ... dispatcher + an event-fed type index (Set<number> per
 *               concrete type, as M2 originally specified) + the roots
 *               capture.
 *   columns   : base parse, then the type index built ONCE from the finished
 *               columns via the production StepTypeIndexer.createFromColumns
 *               — the pull-shaped alternative to an event-fed type index.
 *   generations: base parse with a prefix snapshot + createFromColumns every
 *               time the record count doubles — the same index, but queryable
 *               mid-parse. This is what "incremental type index" costs when
 *               it is derived rather than pushed.
 *
 * Records/checksum are reported per phase so a consumer that perturbs the
 * index shows up immediately.
 *
 * Usage:
 *   node scripts/m2_consumer_spike.mjs [--models <file>] [--json <out>]
 *   node scripts/m2_consumer_spike.mjs --child <phase> <path>   # internal
 */
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'

const POOL_BYTES = 1024 * 1024

const PHASES = [ 'base', 'hook', 'dispatch', 'consumers', 'columns', 'generations' ]

/**
 * Snapshot cadence for the `generations` phase: a new prefix index only once
 * the record count has grown this much past the last one, which bounds total
 * snapshot work to GROWTH/(GROWTH-1) x the final index (the same amortisation
 * the preview channel's generations use).
 */
const GENERATION_GROWTH = 2.0

const REPO_ROOT = path.dirname( path.dirname( new URL( import.meta.url ).pathname ) )

/** Sync positioned-read ByteSource over a file descriptor (file never JS-resident). */
class FdByteSource {
  constructor( filePath ) {
    this.fd = fs.openSync( filePath, 'r' )
    this.byteLength = fs.fstatSync( this.fd ).size
  }
  read( offset, length, into, intoOffset ) {
    return fs.readSync( this.fd, into, intoOffset, length, offset )
  }
  close() {
    fs.closeSync( this.fd )
  }
}

/** A growable uint32 capture — what a compact M2 consumer holds per record. */
class Uint32Capture {
  constructor() {
    this.data = new Uint32Array( 1024 )
    this.count = 0
  }
  push( value ) {
    if ( this.count === this.data.length ) {
      const grown = new Uint32Array( this.data.length * 2 )
      grown.set( this.data )
      this.data = grown
    }
    this.data[ this.count++ ] = value
  }
}

async function parserFor( filePath ) {
  if ( filePath.toLowerCase().endsWith( '.ifc' ) ) {
    const { default: IfcStepParser } = await import( '../compiled/src/ifc/ifc_step_parser.js' )
    return IfcStepParser.Instance
  }
  const { default: AP214StepParser } =
    await import( '../compiled/src/AP214E3_2010/ap214_step_parser.js' )
  return AP214StepParser.Instance
}

function retainedMB() {
  // Collect first so the number is the phase's retained working set, not
  // transient garbage awaiting GC.
  globalThis.gc?.()
  const usage = process.memoryUsage()
  return ( usage.heapUsed + usage.arrayBuffers ) / ( 1024 * 1024 )
}

/**
 * Order-sensitive checksum over the finished columns, so any phase that
 * perturbs the index (it must not) is caught rather than assumed away.
 */
function columnsChecksum( columns ) {
  let hash = 2166136261

  for ( let i = 0; i < columns.count; ++i ) {
    hash = Math.imul( hash ^ columns.address[ i ], 16777619 ) >>> 0
    hash = Math.imul( hash ^ columns.length[ i ], 16777619 ) >>> 0
    hash = Math.imul( hash ^ columns.typeID[ i ], 16777619 ) >>> 0
    hash = Math.imul( hash ^ columns.expressID[ i ], 16777619 ) >>> 0
  }

  return hash >>> 0
}

async function hookFor( phase, filePath ) {
  if ( phase === 'base' ) {
    return { hook: void 0, report: () => ( {} ) }
  }

  if ( phase === 'hook' ) {
    let seen = 0
    return { hook: () => { ++seen }, report: () => ( { seen } ) }
  }

  const isIfc = filePath.toLowerCase().endsWith( '.ifc' )
  const { StreamingRecordDispatcher } =
    await import( '../compiled/src/step/parsing/streaming_record_dispatcher.js' )
  const dispatcher = new StreamingRecordDispatcher()

  // Roots for IFC; AP214 has no IfcRoot, so subscribe to `product` — the
  // schema's identity-bearing root — keeping the two families comparable.
  const rootType = isIfc ?
    ( await import( '../compiled/src/ifc/ifc4_gen/index.js' ) ).IfcRoot :
    ( await import(
        '../compiled/src/AP214E3_2010/AP214E3_2010_gen/index.js' ) ).product

  const roots = new Uint32Capture()

  dispatcher.on( [ rootType ], ( localID, expressID ) => {
    roots.push( expressID )
  } )

  if ( phase === 'dispatch' ) {
    return {
      hook: dispatcher.onRecordIndexed,
      report: () => ( { roots: roots.count } ),
    }
  }

  // The event-fed, Set-per-type index M2 originally specified. Kept inline
  // rather than imported: conway removed it after this spike (it cost +88 %
  // parse and +254 MB on PSB and still missed the complex records' mapped
  // classes), and the comparison has to stay runnable without it.
  const byType = new Map()

  dispatcher.onAnyRecord( ( localID, expressID, typeID ) => {
    if ( typeID === void 0 ) {
      return
    }

    let ids = byType.get( typeID )

    if ( ids === void 0 ) {
      ids = new Set()
      byType.set( typeID, ids )
    }

    ids.add( expressID )
  } )

  return {
    hook: dispatcher.onRecordIndexed,
    report: () => ( { roots: roots.count, types: byType.size } ),
  }
}

/**
 * The production type indexer for this file's schema — the same instance kind
 * `IfcStepModel` builds its `typeIndex` with, so a prefix-derived index is
 * membership-identical to the finished model's by construction (including the
 * multi-mapping subtypes an event-fed index cannot see).
 */
async function typeIndexerFor( filePath ) {
  const { StepTypeIndexer } =
    await import( '../compiled/src/step/indexing/step_type_indexer.js' )

  if ( filePath.toLowerCase().endsWith( '.ifc' ) ) {
    const { EntityTypesIfcCount } =
      await import( '../compiled/src/ifc/ifc4_gen/entity_types_ifc.gen.js' )
    return new StepTypeIndexer( EntityTypesIfcCount )
  }

  const { EntityTypesAP214Count } = await import(
      '../compiled/src/AP214E3_2010/AP214E3_2010_gen/entity_types_ap214.gen.js' )
  return new StepTypeIndexer( EntityTypesAP214Count )
}

/** Phases that derive the type index from columns rather than from events. */
async function runDerivedChild( phase, filePath ) {
  const { buildIndexStreaming } =
    await import( '../compiled/src/step/parsing/streaming_index_builder.js' )
  const { ColumnarIndexSink } =
    await import( '../compiled/src/step/parsing/columnar_index.js' )
  const parser = await parserFor( filePath )
  const indexer = await typeIndexerFor( filePath )
  const sink = new ColumnarIndexSink()
  const source = new FdByteSource( filePath )

  let generations = 0
  let generationMs = 0
  let nextGenerationAt = 1024
  let lastIndex

  // The derived-incremental cadence: rebuild over a prefix snapshot whenever
  // the record count has grown by GENERATION_GROWTH. Everything expensive
  // happens here, between records — never per record.
  const hook = phase === 'generations' ?
    ( localID ) => {
      if ( localID < nextGenerationAt ) {
        return
      }
      nextGenerationAt = Math.ceil( localID * GENERATION_GROWTH )
      const t = performance.now()
      lastIndex = indexer.createFromColumns( sink.snapshot() )
      generationMs += performance.now() - t
      ++generations
    } :
    void 0

  const t0 = performance.now()
  const result = buildIndexStreaming( source, parser, POOL_BYTES, hook, sink )
  const parseMs = performance.now() - t0

  const columns = sink.finalize()

  const tIndex = performance.now()
  lastIndex = indexer.createFromColumns( columns )
  const finalIndexMs = performance.now() - tIndex

  source.close()

  console.log( JSON.stringify( {
    phase,
    ms: parseMs + generationMs + finalIndexMs,
    parseMs,
    indexMs: generationMs + finalIndexMs,
    generations,
    types: [ ...lastIndex.types() ].length,
    records: columns.firstInlineElement,
    rows: columns.count,
    checksum: columnsChecksum( columns ),
    result: result.result,
    retainedMB: retainedMB(),
    rssMB: process.memoryUsage().rss / ( 1024 * 1024 ),
  } ) )
}

async function runChild( phase, filePath ) {
  if ( phase === 'columns' || phase === 'generations' ) {
    return runDerivedChild( phase, filePath )
  }

  const { buildColumnarIndexStreaming } =
    await import( '../compiled/src/step/parsing/streaming_index_builder.js' )
  const parser = await parserFor( filePath )
  const { hook, report } = await hookFor( phase, filePath )
  const source = new FdByteSource( filePath )

  const t0 = performance.now()
  const result = buildColumnarIndexStreaming( source, parser, POOL_BYTES, hook )
  const ms = performance.now() - t0

  source.close()

  console.log( JSON.stringify( {
    phase,
    ms,
    records: result.columns.firstInlineElement,
    rows: result.columns.count,
    checksum: columnsChecksum( result.columns ),
    result: result.result,
    retainedMB: retainedMB(),
    rssMB: process.memoryUsage().rss / ( 1024 * 1024 ),
    ...report(),
  } ) )
}

function spawnChild( phase, filePath ) {
  const out = execFileSync( process.execPath, [
    '--expose-gc', process.argv[ 1 ], '--child', phase, filePath,
  ], { encoding: 'utf8', maxBuffer: 1 << 24, cwd: REPO_ROOT } )

  return JSON.parse( out.trim().split( '\n' ).at( -1 ) )
}

function main() {
  const argv = process.argv.slice( 2 )

  if ( argv[ 0 ] === '--child' ) {
    return runChild( argv[ 1 ], argv[ 2 ] )
  }

  const modelsArg = argv.indexOf( '--models' )
  const jsonArg = argv.indexOf( '--json' )
  const repeatsArg = argv.indexOf( '--repeats' )
  const repeats = repeatsArg >= 0 ? Number( argv[ repeatsArg + 1 ] ) : 3

  if ( modelsArg < 0 ) {
    console.error( 'usage: m2_consumer_spike.mjs --models <file with one path per line>' )
    process.exit( 2 )
  }

  const models = fs.readFileSync( argv[ modelsArg + 1 ], 'utf8' )
      .split( '\n' )
      .map( ( line ) => line.trim() )
      .filter( ( line ) => line.length > 0 && !line.startsWith( '#' ) )

  const rows = []

  for ( const model of models ) {
    const name = path.basename( model )
    const byPhase = {}

    for ( const phase of PHASES ) {
      // Min of N runs: wall-clock noise is one-sided (scheduler, page cache,
      // GC), so the minimum is the least-contaminated estimate of the cost.
      const runs = []

      for ( let repeat = 0; repeat < repeats; ++repeat ) {
        runs.push( spawnChild( phase, model ) )
      }

      const best = runs.reduce( ( a, b ) => ( a.ms <= b.ms ? a : b ) )

      byPhase[ phase ] = { ...best, runsMs: runs.map( ( r ) => r.ms ) }
    }

    const base = byPhase.base
    const checksums = new Set( PHASES.map( ( p ) => byPhase[ p ].checksum ) )

    rows.push( { name, model, byPhase, identical: checksums.size === 1 } )

    const pct = ( phase ) =>
      `${( ( byPhase[ phase ].ms / base.ms - 1 ) * 100 ).toFixed( 1 )}%`

    console.log(
        `${name}  records=${base.records}  base=${base.ms.toFixed( 0 )}ms ` +
        `hook=${byPhase.hook.ms.toFixed( 0 )}ms (${pct( 'hook' )}) ` +
        `dispatch=${byPhase.dispatch.ms.toFixed( 0 )}ms (${pct( 'dispatch' )}) ` +
        `consumers=${byPhase.consumers.ms.toFixed( 0 )}ms (${pct( 'consumers' )}) ` +
        `columns=${byPhase.columns.ms.toFixed( 0 )}ms (${pct( 'columns' )}) ` +
        `generations=${byPhase.generations.ms.toFixed( 0 )}ms (${pct( 'generations' )})  ` +
        `mem base=${base.retainedMB.toFixed( 0 )}MB ` +
        `consumers=${byPhase.consumers.retainedMB.toFixed( 0 )}MB ` +
        `generations=${byPhase.generations.retainedMB.toFixed( 0 )}MB  ` +
        `identical=${checksums.size === 1}` )
  }

  if ( jsonArg >= 0 ) {
    fs.writeFileSync( argv[ jsonArg + 1 ], `${JSON.stringify( rows, null, 2 )}\n` )
  }
}

await main()
