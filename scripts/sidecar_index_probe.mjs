/**
 * Index-sidecar probe (conway#541) — the acceptance evidence for
 * open-from-index, on real models rather than `data/index.ifc`.
 *
 * Two modes, both run one model at a time because a PSB-class cold parse
 * peaks around 1.2 GB RSS:
 *
 *   --roundtrip (default)
 *     Cold-parse the model, serialise a v2 sidecar off its columns,
 *     restore it, and prove the restored index IS the cold one: every row
 *     of every column, `complexEntries`, and — the part that actually
 *     matters — inline-valued attributes resolving to the same values
 *     through a model opened from the sidecar. Also reports what a v1
 *     sidecar would have dropped, which is the number that decided the
 *     format bump.
 *
 *   --transfer [--workers N]
 *     Price the worker boundary for the two representations of the same
 *     index, because the cost is per-OBJECT, not per-byte: D3D has 3.6×
 *     fewer sidecar bytes than PSB and used to pay 25× the transfer, since
 *     its 720,661 inline entities crossed `postMessage` as structured-cloned
 *     objects. Arm A reproduces that shape; arm B posts the v2 sidecar,
 *     whose inline range is typed-array columns.
 *
 * Usage:
 *   node --max-old-space-size=12000 scripts/sidecar_index_probe.mjs <model.ifc>
 *   node --max-old-space-size=12000 scripts/sidecar_index_probe.mjs <model.ifc> --transfer
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { performance } from 'node:perf_hooks'

const ROOT = path.dirname( path.dirname( fileURLToPath( import.meta.url ) ) )
const COMPILED = path.join( ROOT, 'compiled' )

const DEFAULT_WORKERS = 4


/** A `StepExternalByteStore` over a file descriptor — never JS-resident. */
class FdStore {

  /**
   * @param {string} filePath The file to open.
   */
  constructor( filePath ) {
    this.fd = fs.openSync( filePath, 'r' )
    this.byteLength = fs.fstatSync( this.fd ).size
  }

  /**
   * @param {number} offset Absolute offset.
   * @param {number} length Bytes to read.
   * @return {Promise<Uint8Array>} The bytes.
   */
  async read( offset, length ) {
    const into = new Uint8Array( length )

    fs.readSync( this.fd, into, 0, length, offset )

    return into
  }

  /** Close the descriptor. */
  close() {
    fs.closeSync( this.fd )
  }
}


/**
 * Compare two columnar indexes row for row.
 *
 * @param {object} restored The index that came out of a sidecar.
 * @param {object} original The index a cold parse built.
 * @return {object} `{ ok, reason }`.
 */
function compareColumns( restored, original ) {

  if ( restored.count !== original.count ) {
    return { ok: false, reason: `count ${restored.count} vs ${original.count}` }
  }

  if ( restored.firstInlineElement !== original.firstInlineElement ) {
    return {
      ok: false,
      reason: `firstInlineElement ${restored.firstInlineElement} vs ` +
        `${original.firstInlineElement}`,
    }
  }

  if ( restored.expressIdsSorted !== original.expressIdsSorted ) {
    return { ok: false, reason: 'expressIdsSorted differs' }
  }

  if ( ( restored.complexEntries?.size ?? 0 ) !==
    ( original.complexEntries?.size ?? 0 ) ) {
    return { ok: false, reason: 'complexEntries size differs' }
  }

  if ( restored.expressID.length !== original.firstInlineElement ) {
    return {
      ok: false,
      reason: `expressID column sized ${restored.expressID.length}, expected ` +
        `${original.firstInlineElement} (top-level count, not total rows)`,
    }
  }

  for ( let where = 0; where < original.count; ++where ) {
    if ( restored.address[ where ] !== original.address[ where ] ||
        restored.length[ where ] !== original.length[ where ] ||
        restored.typeID[ where ] !== original.typeID[ where ] ) {
      return { ok: false, reason: `row ${where} differs` }
    }
  }

  for ( let where = 0; where < original.firstInlineElement; ++where ) {
    if ( restored.expressID[ where ] !== original.expressID[ where ] ) {
      return { ok: false, reason: `expressID row ${where} differs` }
    }
  }

  for ( const [ localID, entry ] of original.complexEntries ?? [] ) {
    if ( JSON.stringify( restored.complexEntries?.get( localID ) ) !==
      JSON.stringify( entry ) ) {
      return { ok: false, reason: `complexEntries[${localID}] differs` }
    }
  }

  return { ok: true }
}


/**
 * Read every rendering style's inline-valued colour attributes out of a
 * model. These are the population a v1 sidecar silently dropped: with an
 * empty inline map they resolve to `null` under the default `nullOnErrors`
 * rather than throwing, so the model loads and looks approximately right.
 *
 * @param {object} model The model to read.
 * @param {object} gen The generated IFC schema namespace.
 * @return {Promise<string>} A stable digest of every resolved value.
 */
async function inlineAttributeSignature( model, gen ) {

  const parts = []

  for ( const rendering of model.types( gen.IfcSurfaceStyleRendering ) ) {

    await model.ensureResidentByLocalID( rendering.localID )

    const fields = [
      rendering.DiffuseColour,
      rendering.TransmissionColour,
      rendering.DiffuseTransmissionColour,
      rendering.ReflectionColour,
      rendering.SpecularColour,
    ]

    parts.push( `${rendering.expressID}:` + fields.map( ( value ) => {

      if ( value === null || value === void 0 ) {
        return 'null'
      }

      // A ratio measure is the inline case; a colour is an ordinary #ref
      // and would survive v1, so the two must be distinguishable here.
      return typeof value.Value === 'number' ?
        `m${value.Value}` : `r${value.expressID}`
    } ).join( ',' ) )
  }

  return parts.join( '|' )
}


/**
 * Round-trip a model through a v2 sidecar and report the comparison.
 *
 * @param {string} filePath The model.
 */
async function runRoundtrip( filePath ) {

  const { openIfcModelFromIndex, openStreamedIfcModelFromStore } =
    await import( path.join( COMPILED, 'src/ifc/ifc_stream_open.js' ) )
  const { serializeIndexSidecarFromColumns, deserializeIndexSidecarToColumns } =
    await import( path.join( COMPILED, 'src/step/parsing/index_sidecar.js' ) )
  const { HashingByteSource } =
    await import( path.join( COMPILED, 'src/step/parsing/source_hash.js' ) )
  const { StoreByteSource } =
    await import( path.join( COMPILED, 'src/step/parsing/byte_source.js' ) )
  const gen = await import( path.join( COMPILED, 'src/ifc/ifc4_gen/index.js' ) )

  const store = new FdStore( filePath )

  // The hash the coordinator would fold into its own parse. Taken here as a
  // standalone pass so the probe can report it; in production it rides the
  // parse's windows and costs no extra I/O.
  const hashStart = performance.now()
  const sourceHash =
    await new HashingByteSource( new StoreByteSource( store ) ).finishAsync()
  const hashMs = performance.now() - hashStart

  const coldStart = performance.now()
  const cold = await openStreamedIfcModelFromStore( store )
  const coldMs = performance.now() - coldStart

  const columns = cold.columns
  const inlineRows = columns.count - columns.firstInlineElement

  const serializeStart = performance.now()
  const sidecar =
    serializeIndexSidecarFromColumns( columns, store.byteLength, sourceHash )
  const serializeMs = performance.now() - serializeStart

  const restoreStart = performance.now()
  const restored = deserializeIndexSidecarToColumns( sidecar )
  const restoreMs = performance.now() - restoreStart

  const columnsMatch = compareColumns( restored.columns, columns )

  const openStart = performance.now()
  const opened = await openIfcModelFromIndex( new FdStore( filePath ), sidecar )
  const openMs = performance.now() - openStart

  const coldSignature = await inlineAttributeSignature( cold.model, gen )
  const indexSignature = await inlineAttributeSignature( opened.model, gen )

  // Inline address → localID parity across the whole inline range, which is
  // what `StepEntityBase.extractReference` walks to resolve an inline value.
  let inlineLookupMismatches = 0

  for ( let row = columns.firstInlineElement; row < columns.count; ++row ) {

    const address = columns.address[ row ]

    if ( opened.model.getInlineElementByAddress( address )?.localID !==
      cold.model.getInlineElementByAddress( address )?.localID ) {
      ++inlineLookupMismatches
    }
  }

  const coldRoots = [ ...cold.model.expressIDsOfTypes( gen.IfcRoot ) ]
  const indexRoots = [ ...opened.model.expressIDsOfTypes( gen.IfcRoot ) ]

  console.log( JSON.stringify( {
    model: path.basename( filePath ),
    bytes: store.byteLength,
    count: columns.count,
    firstInlineElement: columns.firstInlineElement,
    inlineRows,
    inlinePercent: +( ( inlineRows / columns.count ) * 100 ).toFixed( 3 ),
    complexEntries: columns.complexEntries?.size ?? 0,
    sidecarBytes: sidecar.byteLength,
    // What the same index would have cost in v1 — top-level rows only, at
    // 20 B/row (f64 address). Smaller AND wrong; that is the whole point.
    v1SidecarBytes: 24 + columns.firstInlineElement * 20,
    columnsIdentical: columnsMatch.ok,
    columnsReason: columnsMatch.reason ?? null,
    headerSchema: opened.header.headers.get( 'FILE_SCHEMA' ) !== void 0,
    rootsIdentical: coldRoots.length === indexRoots.length &&
      coldRoots.every( ( id, at ) => id === indexRoots[ at ] ),
    inlineLookupMismatches,
    inlineAttributesIdentical: coldSignature === indexSignature,
    inlineAttributeSites: coldSignature.length === 0 ?
      0 : coldSignature.split( '|' ).length,
    sourceHash,
    hashMs: +hashMs.toFixed( 1 ),
    coldParseMs: +coldMs.toFixed( 1 ),
    serializeMs: +serializeMs.toFixed( 1 ),
    deserializeMs: +restoreMs.toFixed( 1 ),
    openFromIndexMs: +openMs.toFixed( 1 ),
  }, null, 2 ) )
}


/* -------------------------------------------------------------------------
 * Transfer arms
 * ---------------------------------------------------------------------- */

if ( !isMainThread && workerData?.kind === 'transfer' ) {

  const { deserializeIndexSidecarToColumns } =
    await import( path.join( COMPILED, 'src/step/parsing/index_sidecar.js' ) )

  parentPort.on( 'message', ( message ) => {

    if ( message.kind === 'sidecar' ) {

      // Materialise the columns, because a worker that only received bytes
      // has not yet paid what it takes to have an index.
      const restored = deserializeIndexSidecarToColumns( message.sidecar )

      parentPort.postMessage( { kind: 'ready', rows: restored.columns.count } )
      return
    }

    if ( message.kind !== 'objects' ) {
      throw new Error( `unexpected message ${message.kind}` )
    }

    parentPort.postMessage( {
      kind: 'ready',
      rows: message.address.length + message.inline.length,
    } )
  } )

  parentPort.postMessage( { kind: 'warm' } )
}


/**
 * Spawn a worker and wait for it to finish importing.
 *
 * @return {Promise<object>} A warm worker.
 */
function spawnWorker() {

  return new Promise( ( resolve, reject ) => {

    const worker = new Worker(
        fileURLToPath( import.meta.url ), { workerData: { kind: 'transfer' } } )

    worker.once( 'message', ( message ) => {
      if ( message.kind === 'warm' ) {
        resolve( worker )
      } else {
        reject( new Error( `unexpected first message ${message.kind}` ) )
      }
    } )

    worker.once( 'error', reject )
  } )
}


/**
 * Post one payload to every worker and time until all report ready.
 *
 * @param {object[]} workers The warm workers.
 * @param {Function} makePayload Builds `[ message, transferList ]` per worker.
 * @return {Promise<number>} Milliseconds until the last worker is ready.
 */
async function timeFanOut( workers, makePayload ) {

  const start = performance.now()

  const done = workers.map( ( worker ) => new Promise( ( resolve, reject ) => {
    worker.once( 'message', resolve )
    worker.once( 'error', reject )
  } ) )

  for ( const worker of workers ) {
    const [ message, transfer ] = makePayload()

    worker.postMessage( message, transfer )
  }

  await Promise.all( done )

  return performance.now() - start
}


/**
 * Measure the worker-boundary cost of both index representations.
 *
 * @param {string} filePath The model.
 * @param {number} workerCount How many workers to fan out to.
 */
async function runTransfer( filePath, workerCount ) {

  const { openStreamedIfcModelFromStore } =
    await import( path.join( COMPILED, 'src/ifc/ifc_stream_open.js' ) )
  const { serializeIndexSidecarFromColumns } =
    await import( path.join( COMPILED, 'src/step/parsing/index_sidecar.js' ) )

  const store = new FdStore( filePath )
  const { columns } = await openStreamedIfcModelFromStore( store )

  const sidecar = serializeIndexSidecarFromColumns( columns, store.byteLength, 0 )

  // Arm A: the shape the sharded-index spike measured and the shape a v1
  // index-plus-inline-objects hand-off would have. The typed columns move as
  // buffers (cheap); the inline range crosses as one object per row, and
  // structured clone costs per object.
  const inlineObjects = []

  for ( let row = columns.firstInlineElement; row < columns.count; ++row ) {
    inlineObjects.push( {
      address: columns.address[ row ],
      length: columns.length[ row ],
      typeID: columns.typeID[ row ],
    } )
  }

  const workers = []

  for ( let where = 0; where < workerCount; ++where ) {
    workers.push( await spawnWorker() )
  }

  // One untimed round first: the first postMessage on a fresh worker pays
  // for the channel, not for the payload. Deliberately the `objects` arm
  // with empty columns — a truncated sidecar would throw inside the worker,
  // and a worker that throws never replies, which reads as a hang rather
  // than as an error.
  await timeFanOut( workers, () => [ {
    kind: 'objects',
    address: new Uint32Array( 0 ),
    length: new Uint32Array( 0 ),
    typeID: new Int32Array( 0 ),
    expressID: new Uint32Array( 0 ),
    inline: [],
  }, [] ] )

  const objectsMs = await timeFanOut( workers, () => {

    // The columns go in the TRANSFER LIST — they are buffers and they move
    // zero-copy, which is what the sharded-index spike measured and what
    // makes the per-byte intuition hold for them. `inline` cannot: it is one
    // object per inline row, and structured clone charges per object. Arm A
    // is that split, so the difference from arm B is the representation of
    // the inline range and nothing else.
    const address = columns.address.slice( 0, columns.firstInlineElement )
    const length = columns.length.slice( 0, columns.firstInlineElement )
    const typeID = columns.typeID.slice( 0, columns.firstInlineElement )
    const expressID = columns.expressID.slice()

    return [
      { kind: 'objects', address, length, typeID, expressID, inline: inlineObjects },
      [ address.buffer, length.buffer, typeID.buffer, expressID.buffer ],
    ]
  } )

  const sidecarMs = await timeFanOut( workers, () => {
    const copy = sidecar.slice()

    return [ { kind: 'sidecar', sidecar: copy }, [ copy.buffer ] ]
  } )

  for ( const worker of workers ) {
    await worker.terminate()
  }

  console.log( JSON.stringify( {
    model: path.basename( filePath ),
    workers: workerCount,
    count: columns.count,
    inlineRows: columns.count - columns.firstInlineElement,
    sidecarBytes: sidecar.byteLength,
    objectsArmMs: +objectsMs.toFixed( 1 ),
    sidecarArmMs: +sidecarMs.toFixed( 1 ),
  }, null, 2 ) )
}


/** Entry point. */
async function main() {

  if ( !isMainThread ) {
    return
  }

  const args = process.argv.slice( 2 )
  const filePath = args.find( ( arg ) => !arg.startsWith( '--' ) )

  if ( filePath === void 0 ) {
    console.error(
        'usage: node scripts/sidecar_index_probe.mjs <model.ifc> ' +
        '[--transfer] [--workers N]' )
    process.exitCode = 1
    return
  }

  if ( args.includes( '--transfer' ) ) {

    const at = args.indexOf( '--workers' )

    await runTransfer(
        filePath,
        at >= 0 ? Number( args[ at + 1 ] ) : DEFAULT_WORKERS )
    return
  }

  await runRoundtrip( filePath )
}

await main()
