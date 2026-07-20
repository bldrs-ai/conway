/**
 * Corpus sweep for the streaming parse/index/sidecar plane (M0/M1a/M4).
 *
 * For each model, in a child process per phase (so memory peaks are
 * isolated):
 *
 *   resident : read whole file, parseHeader + parseDataBlock  → index,
 *              peak heap. The baseline.
 *   stream   : fd ByteSource + buildIndexStreaming (1 MB pool) → index,
 *              peak heap. The source is NEVER resident in JS.
 *   verify   : both in one process; asserts the streamed top-level index is
 *              byte-identical to the resident one, then round-trips the
 *              index sidecar (serialize → deserialize → compare + hash
 *              handshake).
 *
 * Usage:
 *   node scripts/stream_corpus_sweep.mjs                # run the sweep
 *   node scripts/stream_corpus_sweep.mjs --child <phase> <path>   # internal
 */
import { execFileSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'

const POOL_BYTES = 1024 * 1024

const CORPUS = [
  '/home/user/models/Arty_Z7.stp',
  '/home/user/test-models-content/ifc/Schependomlaan.ifc',
  'data/index.ifc',
  'data/as1-oc-214.stp',
  'data/ap214-mapped-item-test.step',
  'data/a-gear-with-3-inch-diameter-and-20-curved-teeth.step',
]

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

async function parserFor( filePath ) {
  if ( filePath.endsWith( '.ifc' ) ) {
    const { default: IfcStepParser } = await import( '../compiled/src/ifc/ifc_step_parser.js' )
    return IfcStepParser.Instance
  }
  const { default: AP214StepParser } = await import( '../compiled/src/AP214E3_2010/ap214_step_parser.js' )
  return AP214StepParser.Instance
}

function peakHeapMB() {
  // Collect before measuring so the number is the phase's *retained* heap
  // (its true working set), not transient garbage awaiting GC.
  globalThis.gc?.()
  const usage = process.memoryUsage()
  return ( usage.heapUsed + usage.arrayBuffers ) / ( 1024 * 1024 )
}

async function residentIndex( filePath ) {
  const { default: ParsingBuffer } = await import( '../compiled/src/parsing/parsing_buffer.js' )
  const parser = await parserFor( filePath )
  const bytes = new Uint8Array( fs.readFileSync( filePath ) )
  const input = new ParsingBuffer( bytes )
  parser.parseHeader( input )
  const t0 = performance.now()
  const [ index, result ] = parser.parseDataBlock( input )
  return { elements: index.elements, result, ms: performance.now() - t0, bytes }
}

async function streamedIndex( filePath ) {
  const { buildIndexStreaming } = await import( '../compiled/src/step/parsing/streaming_index_builder.js' )
  const parser = await parserFor( filePath )
  const source = new FdByteSource( filePath )
  const t0 = performance.now()
  const r = buildIndexStreaming( source, parser, POOL_BYTES )
  const ms = performance.now() - t0
  source.close()
  return { ...r, ms }
}

async function columnarIndex( filePath ) {
  const { buildColumnarIndexStreaming } = await import( '../compiled/src/step/parsing/streaming_index_builder.js' )
  const parser = await parserFor( filePath )
  const source = new FdByteSource( filePath )
  const t0 = performance.now()
  const r = buildColumnarIndexStreaming( source, parser, POOL_BYTES )
  const ms = performance.now() - t0
  source.close()
  return { ...r, ms }
}

async function runChild( phase, filePath ) {
  if ( phase === 'resident' ) {
    const r = await residentIndex( filePath )
    console.log( JSON.stringify( {
      records: r.elements.length, result: r.result, ms: r.ms, peakMB: peakHeapMB(),
    } ) )
    return
  }

  if ( phase === 'stream' ) {
    const r = await streamedIndex( filePath )
    console.log( JSON.stringify( {
      records: r.elements.length, result: r.result, ms: r.ms,
      slides: r.stats.slides, windowBytes: r.stats.windowBytes,
      maxRecordLen: r.stats.maxRecordLen, peakMB: peakHeapMB(),
    } ) )
    return
  }

  if ( phase === 'columnar' ) {
    const r = await columnarIndex( filePath )
    console.log( JSON.stringify( {
      records: r.columns.firstInlineElement, rows: r.columns.count,
      result: r.result, ms: r.ms, peakMB: peakHeapMB(),
    } ) )
    return
  }

  // verify: byte-identical index (object-streamed AND columnar) + sidecar
  // round-trip.
  const resident = await residentIndex( filePath )
  const streamed = await streamedIndex( filePath )
  const columnar = await columnarIndex( filePath )

  let identical = resident.elements.length === streamed.elements.length
  let columnsIdentical = resident.elements.length === columnar.columns.firstInlineElement
  let firstDiff = -1

  if ( identical ) {
    for ( let i = 0; i < resident.elements.length; ++i ) {
      const a = resident.elements[ i ]
      const b = streamed.elements[ i ]
      if ( a.address !== b.address || a.length !== b.length ||
          a.typeID !== b.typeID || a.expressID !== b.expressID ) {
        identical = false
        firstDiff = i
        break
      }
    }
  }

  if ( columnsIdentical ) {
    const c = columnar.columns
    for ( let i = 0; i < resident.elements.length; ++i ) {
      const a = resident.elements[ i ]
      if ( a.address !== c.address[ i ] || a.length !== c.length[ i ] ||
          ( a.typeID ?? -1 ) !== c.typeID[ i ] || a.expressID !== c.expressID[ i ] ) {
        columnsIdentical = false
        break
      }
    }
  }

  const { serializeIndexSidecar, deserializeIndexSidecar, hashSource, sidecarMatchesSource } =
    await import( '../compiled/src/step/parsing/index_sidecar.js' )

  const hash = hashSource( resident.bytes )
  const blob = serializeIndexSidecar( streamed.elements, resident.bytes.byteLength, hash )
  const decoded = deserializeIndexSidecar( blob )

  let sidecarOK = decoded.elements.length === streamed.elements.length &&
    sidecarMatchesSource( decoded, resident.bytes.byteLength, hash )

  if ( sidecarOK ) {
    for ( let i = 0; i < decoded.elements.length; ++i ) {
      const a = streamed.elements[ i ]
      const b = decoded.elements[ i ]
      if ( a.address !== b.address || a.length !== b.length ||
          ( a.typeID ?? -1 ) !== ( b.typeID ?? -1 ) || a.expressID !== b.expressID ) {
        sidecarOK = false
        break
      }
    }
  }

  // Handshake must also refuse a mutated source.
  const mutated = resident.bytes.slice( 0, Math.min( resident.bytes.length, 1 << 20 ) )
  mutated[ Math.floor( mutated.length / 2 ) ] ^= 0xFF
  const rejects = !sidecarMatchesSource( decoded, mutated.byteLength, hashSource( mutated ) )

  console.log( JSON.stringify( {
    records: resident.elements.length, identical, columnsIdentical, firstDiff,
    sidecarBytes: blob.byteLength, sidecarOK, handshakeRejects: rejects,
  } ) )
}

function spawnChild( phase, filePath ) {
  const out = execFileSync( process.execPath, [
    '--expose-gc', process.argv[ 1 ], '--child', phase, filePath,
  ], { encoding: 'utf8', maxBuffer: 1 << 24, cwd: path.dirname( path.dirname( new URL( import.meta.url ).pathname ) ) } )
  const lines = out.trim().split( '\n' )
  return JSON.parse( lines[ lines.length - 1 ] )
}

async function main() {
  if ( process.argv[ 2 ] === '--child' ) {
    await runChild( process.argv[ 3 ], process.argv[ 4 ] )
    return
  }

  const rows = []

  for ( const model of CORPUS ) {
    const full = path.isAbsolute( model ) ? model : path.resolve( model )
    if ( !fs.existsSync( full ) ) {
      console.error( `skip (missing): ${model}` )
      continue
    }
    const sizeMB = fs.statSync( full ).size / ( 1024 * 1024 )
    process.stderr.write( `sweeping ${path.basename( model )} (${sizeMB.toFixed( 1 )} MB)...\n` )

    const resident = spawnChild( 'resident', full )
    const stream = spawnChild( 'stream', full )
    const columnar = spawnChild( 'columnar', full )
    const verify = spawnChild( 'verify', full )

    rows.push( {
      model: path.basename( model ),
      sizeMB: sizeMB.toFixed( 1 ),
      records: resident.records,
      residentMs: resident.ms.toFixed( 0 ),
      streamMs: stream.ms.toFixed( 0 ),
      columnarMs: columnar.ms.toFixed( 0 ),
      residentPeakMB: resident.peakMB.toFixed( 1 ),
      streamPeakMB: stream.peakMB.toFixed( 1 ),
      columnarPeakMB: columnar.peakMB.toFixed( 1 ),
      identical: verify.identical,
      columnsOK: verify.columnsIdentical,
      sidecarOK: verify.sidecarOK && verify.handshakeRejects,
    } )
  }

  console.table( rows )

  const bad = rows.filter( ( r ) => !r.identical || !r.columnsOK || !r.sidecarOK )
  if ( bad.length > 0 ) {
    console.error( `FAIL: ${bad.map( ( r ) => r.model ).join( ', ' )}` )
    process.exit( 1 )
  }
  console.error(
      'All models: byte-identical streamed + columnar index, sidecar round-trip OK' )
}

main().catch( ( e ) => {
  console.error( e )
  process.exit( 1 )
} )
