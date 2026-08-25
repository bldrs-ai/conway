import { exit } from 'process'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import yargs from 'yargs/yargs'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { wasmHeapByteLength } from '../core/wasm_heap'
import {
  RetainedMemoryMb,
  retainedMemoryMb,
  settleAndSampleMemoryForPerf,
} from '../core/retained_memory'
import Logger from '../logging/logger'
import Environment from '../utilities/environment'
import { ExtractResult } from '../core/shared_constants'
import { CanonicalMeshType } from '../core/canonical_mesh'
import EntityTypesAP214 from './AP214E3_2010_gen/entity_types_ap214.gen'
import { placementDigests } from './ap214_placement_digest'
import { Console } from 'console'


const conwayGeom = new ConwayGeometry()

main()

/**
 * Encapsultes a string in a CSV safe way.
 *
 * @param from
 * @return {string}
 */
function csvSafeString( from: string ): string {

  if ( from.includes( '\n' ) ||
    from.includes( '\r') ||
    from.includes( '"') ||
    from.includes( ',' ) ) {

    return `"${from.replaceAll( '"', '""' )}"`
  }

  return from
}

// Bytes per megabyte for memory-stat formatting in the perf CSV.
// eslint-disable-next-line no-magic-numbers
const BYTES_PER_MB = 1024 * 1024

// Kilobytes per megabyte, for resourceUsage().maxRSS which reports kB.
// eslint-disable-next-line no-magic-numbers
const KB_PER_MB = 1024

// Fixed-point precision for perf MB values.
// eslint-disable-next-line no-magic-numbers
const PERF_MB_PRECISION = 2

/** Placeholder for a column this row has no measurement for. */
const UNMEASURED = 'N/A'

/**
 * This child's value for the `writer` column (conway#555).
 *
 * Distinct from the IFC child's for a reason that is easy to miss: the two
 * run as separate processes and `RegressionCaptureState.memoization` is a
 * process-global, so the IFC child's `FULL` — which keeps CSG temporaries in
 * the map `calculateGeometrySize()` sums — does not apply here. A mixed
 * IFC/STEP corpus therefore aggregates two capture modes into one
 * `geometryMemoryMb` column, which is precisely what this column exists to
 * disclose.
 */
const PERF_WRITER = 'ap214-regression'

/**
 * The memory figures one perf row carries, each captured at the point in the
 * load where it means what its column name says — not at write time. Mirrors
 * the IFC child's copy; see `src/ifc/ifc_regression_main.ts` for why the
 * end-of-load instants have to be captured separately from the retention
 * delta, which is only knowable after the teardown.
 */
interface PerfMemory {

  /** Unsettled `process.memoryUsage()`, at the end of the load. */
  instant: NodeJS.MemoryUsage

  /** Kernel high-water RSS, in kB (`resourceUsage().maxRSS`). */
  peakRssKb: number

  /** Geometry payload conway allocated, in bytes, if geometry was extracted. */
  geometryMemoryBytes?: number

  /** Wasm linear-memory high-water in bytes, if the module came up. */
  wasmHeapBytes?: number

  /**
   * Retention over the cycle, from two settled samples straddling the load.
   * Undefined where the settle could not run, which is written as N/A.
   */
  retained?: RetainedMemoryMb
}

/**
 * Capture the end-of-load memory figures for a perf row.
 *
 * @param geometryMemoryBytes Geometry payload conway allocated, in bytes.
 * @param wasmHeapBytes Wasm linear-memory high-water in bytes.
 * @return {PerfMemory} The captured figures, with retention still unset.
 */
function capturePerfMemory(
    geometryMemoryBytes?: number, wasmHeapBytes?: number ): PerfMemory {

  return {
    instant: process.memoryUsage(),
    peakRssKb: process.resourceUsage().maxRSS,
    geometryMemoryBytes,
    wasmHeapBytes,
  }
}

/**
 * Write a single-row per-file perf CSV at the given path, matching the
 * column layout of the IFC regression child so the batch aggregator can
 * merge STEP and IFC rows into one perf CSV. No-op when perfPath is empty.
 *
 * `peakRssMb` is the process high-water mark; `rssMb`, `heapUsedMb`,
 * `heapTotalMb`, `externalMb` and `arrayBuffersMb` are single instants
 * sampled at write time, and `geometryMemoryMb` is conway's own vertex+index
 * payload rather than a process metric. `arrayBuffersMb` is a subset of
 * `externalMb`, and neither sees the wasm heap. See the fuller
 * column-by-column note on the IFC child's copy of this function
 * (`src/ifc/ifc_regression_main.ts`), which is the writer these columns have
 * to stay identical to.
 *
 * `retainedRssMb` / `retainedHeapUsedMb` / `retainedExternalMb` are the other
 * half (conway#554): settled-after-teardown minus settled-before-load, so a
 * signed measure of what one cycle left behind, and `N/A` where `global.gc`
 * was not exposed to settle with. No `retainedWasmHeapMb` — the wasm heap is
 * grow-only, so over one cycle it could only restate `peakWasmHeapMb`.
 *
 * `writer` names the pipeline (conway#555) and `totalTimeMs` is the load's
 * wall clock rather than the sum of the two stage columns (conway#562), with
 * that sum kept as `parsePlusGeometryMs`. Both changes are described in full
 * on the IFC child's copy.
 *
 * @param perfPath Path to write the CSV to. Empty string disables.
 * @param stepFile Source STEP file path (basename used as the row key).
 * @param status OK or FAIL.
 * @param parseTimeMs Parse stage duration in ms.
 * @param geometryTimeMs Geometry extraction duration in ms.
 * @param totalTimeMs The load's wall clock — file read through teardown.
 * @param parsePlusGeometryMs The sum of the two stage columns above.
 * @param memory The row's memory figures, captured at the points in the load
 * each is defined at. Defaults to capturing the end-of-load instants here,
 * which is what the FAIL paths want — they have nothing else to report.
 */
async function writePerfCsvIfRequested(
    perfPath: string,
    stepFile: string,
    status: 'OK' | 'FAIL',
    parseTimeMs: number,
    geometryTimeMs: number,
    totalTimeMs: number,
    parsePlusGeometryMs: number,
    memory: PerfMemory = capturePerfMemory(),
): Promise<void> {

  if ( perfPath.length === 0 ) {
    return
  }

  const mem = memory.instant
  const rssMb = ( mem.rss / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const heapUsedMb = ( mem.heapUsed / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const heapTotalMb = ( mem.heapTotal / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const externalMb = ( mem.external / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const arrayBuffersMb =
    ( mem.arrayBuffers / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  // maxRSS is reported in kilobytes, unlike memoryUsage() which is in bytes.
  const peakRssMb =
    ( memory.peakRssKb / KB_PER_MB ).toFixed( PERF_MB_PRECISION )
  const geometryMemoryMb = memory.geometryMemoryBytes !== void 0 ?
    ( memory.geometryMemoryBytes / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION ) :
    UNMEASURED
  const peakWasmHeapMb = memory.wasmHeapBytes !== void 0 ?
    ( memory.wasmHeapBytes / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION ) :
    UNMEASURED
  const retained = memory.retained
  const retainedRssMb = retained !== void 0 ?
    retained.rssMb.toFixed( PERF_MB_PRECISION ) : UNMEASURED
  const retainedHeapUsedMb = retained !== void 0 ?
    retained.heapUsedMb.toFixed( PERF_MB_PRECISION ) : UNMEASURED
  const retainedExternalMb = retained !== void 0 ?
    retained.externalMb.toFixed( PERF_MB_PRECISION ) : UNMEASURED

  const fileName = csvSafeString( path.basename( stepFile ) )

  const header =
    'file,status,writer,parseTimeMs,geometryTimeMs,totalTimeMs,' +
    'parsePlusGeometryMs,geometryMemoryMb,' +
    'peakWasmHeapMb,rssMb,peakRssMb,heapUsedMb,heapTotalMb,externalMb,' +
    'arrayBuffersMb,retainedRssMb,retainedHeapUsedMb,retainedExternalMb\n'
  const row =
    `${fileName},${status},${PERF_WRITER},${parseTimeMs},${geometryTimeMs},` +
    `${totalTimeMs},${parsePlusGeometryMs},` +
    `${geometryMemoryMb},${peakWasmHeapMb},${rssMb},${peakRssMb},` +
    `${heapUsedMb},${heapTotalMb},${externalMb},${arrayBuffersMb},` +
    `${retainedRssMb},${retainedHeapUsedMb},${retainedExternalMb}\n`

  try {
    await fsPromises.writeFile( perfPath, header + row )
  } catch ( e ) {
    // Perf is best-effort; never fail the regression run because of a perf write.
    console.error( `Failed to write perf CSV at ${perfPath}:`, e )
  }
}

/**
 * Display errors and dump errors to stderr in the batch runner's
 * `message,count,expressids,file` CSV format.
 *
 * @param filePath
 */
function displayErrors( filePath: string ) {

  const fileName = csvSafeString( path.basename( filePath ) )

  if ( Logger.getLogs().length > 0 ) {
    Logger.displayLogs()

    const errors = Logger.getErrors()

    if ( errors.length > 0 ) {
      const errConsole = new Console( process.stderr )

      errConsole.log( 'message,count,expressids,file' )

      for ( const error of errors ) {

        errConsole.log( `${csvSafeString(error.message)},${error.count},${csvSafeString( Array.from(error.expressIDs.keys()).join(' ') ) },${fileName}`)
      }
    }
  }
}

/**
 * Generalised error handling wrapper
 */
async function main() {

  try {

    await conwayGeom.initialize()

    Environment.checkEnvironment()
    Logger.initializeWasmCallbacks()

    doWork()
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

/**
 * Actual execution function.
 */
function doWork() {
  const SKIP_PARAMS = 2

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const args = yargs(process.argv.slice(SKIP_PARAMS))
      .command('$0 <filename> [output]', 'Digest a STEP (AP214) file', (yargs2) => {
        yargs2.option('strict', {

          describe: 'Makes parser/reference errors on nullable fields return null instead of an error',
          type: 'boolean',
          alias: 's',
          default: false,
        })
        yargs2.option('digest', {

          describe: 'Output a digest ',
          type: 'boolean',
          alias: 'd',
          default: false,
        })
        yargs2.option('perf', {

          describe:
            'Write a single-row perf CSV (parse/geometry/total time + memory) at this path',
          type: 'string',
          alias: 'p',
          default: '',
        })

        yargs2.positional('filename', { describe: 'STEP (AP214) File Path', type: 'string' })
        yargs2.positional('output', { describe: 'Output path', type: 'string' })

      }, async (argv) => {
        const stepFile = argv['filename'] as string
        const outputPath =
            argv['output'] as string ??
            path.join( path.dirname( stepFile ), path.parse( stepFile ).name )

        let stepBuffer: Buffer | undefined

        const strict = (argv['strict'] as boolean | undefined) ?? false
        const digest = (argv['digest'] as boolean | undefined) ?? false
        const perfPath = (argv['perf'] as string | undefined) ?? ''

        // Settled pre-load baseline for the retention columns (conway#554).
        // Here rather than at process start: `main()` has already brought
        // conway-geom up, so the wasm module's fixed cost sits below the
        // baseline instead of being charged to every model as the same
        // constant. Before `readFileSync` because the source buffer is part of
        // what a load must give back, and outside the timed region because
        // `parseStartMs` has not been taken yet.
        //
        // `...ForPerf` skips the settle when no perf row is coming, for the
        // reason recorded on that function: the batch passes `--expose-gc` to
        // every child, not just the ones given `--perf`.
        const memoryBaseline = await settleAndSampleMemoryForPerf( perfPath )

        // Where `totalTimeMs` starts (conway#562): after the settle, so the
        // retention samples stay outside every timed column, and before the
        // file read, which is real load cost no stage clock could see.
        const loadStartMs = Date.now()

        try {
          stepBuffer = fs.readFileSync(stepFile)
        } catch {
          Logger.error(
              'Couldn\'t read file, check that it is accessible at the specified path.')
          displayErrors(stepFile)
          exit()
        }

        if (stepBuffer === void 0) {
          Logger.error(
              'Couldn\'t read file, check that it is accessible at the specified path.')
          displayErrors(stepFile)
          exit()
        }

        const parser = AP214StepParser.Instance
        const bufferInput = new ParsingBuffer(stepBuffer)

        const parseStartMs = Date.now()

        const result0 = parser.parseHeader(bufferInput)[ 1 ]

        switch (result0) {
          case ParseResult.COMPLETE:

            break

          case ParseResult.INCOMPLETE:

            Logger.warning('Parse incomplete but no errors')
            break

          case ParseResult.INVALID_STEP:

            Logger.error('Invalid STEP detected in parse, but no syntax error detected')
            break

          case ParseResult.MISSING_TYPE:

            Logger.error('Missing STEP type, but no syntax error detected')
            break

          case ParseResult.SYNTAX_ERROR:

            Logger.error(`Syntax error detected on line ${bufferInput.lineCount}`)
            break

          default:
        }

        const [result1, model] = parser.parseDataToModel(bufferInput)

        switch (result1) {
          case ParseResult.COMPLETE:

            break

          case ParseResult.INCOMPLETE:

            Logger.warning('Parse incomplete but no errors')
            break

          case ParseResult.INVALID_STEP:

            Logger.error('Invalid STEP detected in parse, but no syntax error detected')
            break

          case ParseResult.MISSING_TYPE:

            Logger.error('Missing STEP type, but no syntax error detected')
            break

          case ParseResult.SYNTAX_ERROR:

            Logger.error(`Syntax error detected on line ${bufferInput.lineCount}`)
            break

          default:
        }

        const parseEndMs = Date.now()
        const parseTimeMs = parseEndMs - parseStartMs

        if (model === void 0) {
          await writePerfCsvIfRequested(
              perfPath, stepFile, 'FAIL', parseTimeMs, 0,
              Date.now() - loadStartMs, parseTimeMs)
          displayErrors(stepFile)
          return
        }

        model.nullOnErrors = !strict

        const geomStartMs = Date.now()
        const extraction = geometryExtraction(model)
        const geomEndMs = Date.now()
        const geometryTimeMs = geomEndMs - geomStartMs

        // The sum `totalTimeMs` used to hold — an identity by construction,
        // since `geomStartMs` is taken on the line after `parseEndMs`.
        const parsePlusGeometryMs = geomEndMs - parseStartMs

        const perfStatus = extraction === void 0 ? 'FAIL' : 'OK'
        // Sized before anything downstream can release meshes, and only on
        // the OK path: a failed extraction leaves a partial cache whose size
        // is not this model's geometry footprint.
        const geometryMemoryBytes = extraction !== void 0 ?
          model.geometry.calculateGeometrySize() : void 0
        // The heap is grow-only, so this is the run's high-water mark even
        // though it is read once, after the fact. conwayGeom is the engine
        // every extraction in this process runs against.
        const wasmModule = conwayGeom.wasmModule
        const wasmHeapBytes = wasmModule !== void 0 ?
          wasmHeapByteLength( wasmModule ) : void 0
        // Instants captured here, where they have always been captured, so
        // the teardown below cannot change what rssMb/heapUsedMb/externalMb
        // mean.
        const memory = capturePerfMemory( geometryMemoryBytes, wasmHeapBytes )

        // Teardown, then the settled retained sample. This path had no
        // explicit release before conway#554 — see the matching comment in
        // the IFC child, which records that finding in full.
        // Not gated on `perfPath` — the digest runs after it, and one path to
        // the blessed output beats saving the work. The settle below IS
        // gated; see `memoryBaseline` above.
        model.invalidate( true )

        // Closes on the teardown, before the retained settle.
        const totalTimeMs = Date.now() - loadStartMs

        memory.retained = retainedMemoryMb(
            memoryBaseline, await settleAndSampleMemoryForPerf( perfPath ) )

        await writePerfCsvIfRequested(
            perfPath, stepFile, perfStatus, parseTimeMs, geometryTimeMs,
            totalTimeMs, parsePlusGeometryMs, memory)

        // AFTP sizing pass: no-op unless the wasm module was built with
        // CONWAY_ALLOC_TELEMETRY (see conway-geom structures/alloc_telemetry.h).
        conwayGeom.dumpAllocTelemetry(path.basename(stepFile))

        if ( extraction === void 0 ) {
          Logger.error( 'Couldn\'t extract geometry')
        } else if ( digest ) {

          // Digest layout matches the IFC regression digest
          // (ID,Hash,Type,Operand 1,Operand2,Void) so the same diff/bless
          // tooling applies. STEP digests cover final meshes and memoized
          // curves; AP214 has no void/CSG-operand columns to fill.
          //
          // `Placement` is the one AP214-only column (conway#583), appended
          // rather than folded into `Hash` so the two axes stay separable: a
          // row that moves only in `Placement` is geometry that tessellated
          // identically and landed somewhere else, which the six shared
          // columns are structurally blind to. See
          // design/new/step-regression.md §"The placement column" for why
          // STEP needs the second axis and IFC does not have one yet, and
          // ap214_placement_digest.ts for what goes into the value.
          const csvLines: [number | string, string][] = []

          // Keyed by mesh local id, which is what the mesh rows below are
          // keyed by too. Computed from the scene rather than the geometry
          // store: the same definition can be placed many times, and the
          // multiset of those placements is the value.
          const placements = placementDigests( extraction.scene )

          const csvPath       = `${outputPath}.csv`
          const csvFileHandle = await fsPromises.open( csvPath, 'w' )

          await csvFileHandle.write(
              `ID,Hash,Type,Operand 1,Operand2,Void,Placement\n` )

          for ( const mesh of model.geometry ) {

            if ( mesh.type !== CanonicalMeshType.BUFFER_GEOMETRY ) {
              continue
            }

            const objContents = mesh.geometry.dumpToOBJ( '' )
            const hash =
              crypto.createHash( 'sha1' ).update( objContents ).digest( 'hex' )

            const element = model.getElementByLocalID( mesh.localID )
            const rowID = element?.expressID ?? mesh.localID
            const typeName =
              element !== void 0 ? EntityTypesAP214[element.type] : ''

            // Empty for a definition the scene never placed; every placed
            // definition has a hash, so identity placement and no placement
            // stay distinguishable.
            const placement = placements.get( mesh.localID ) ?? ''

            csvLines.push(
                [rowID, `${rowID},${hash},${typeName},,,FALSE,${placement}\n`])
          }

          for ( const [curveItem, objContents] of model.curves.objs() ) {

            const hash =
              crypto.createHash( 'sha1' ).update( objContents ).digest( 'hex' )

            const rowID = curveItem.expressID ?? curveItem.toString()

            // Curves are memoized per definition and never enter the scene
            // graph, so they have no placement to report.
            csvLines.push([rowID,
              `${rowID},${hash},${EntityTypesAP214[curveItem.type]},,,,\n`])
          }

          csvLines.sort( ( a, b ) => {

            const a0 = a[0]
            const b0 = b[0]

            if ( typeof a0 === 'number' ) {

              if ( typeof b0 === 'number' ) {
                return a0 - b0
              }

              return -1
            }

            if ( typeof b0 === 'number' ) {

              return 1
            }

            return a0.localeCompare( b0 )
          } )

          // Note, we cast to any here because the writeFile supports an
          // iterable but the typescript bindings don't have the option
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await csvFileHandle.writeFile( csvLines.map( ( line ) => line[ 1 ]) as any )

          await csvFileHandle.close()
        }

        displayErrors(stepFile)
      })
      .help().argv
}

/**
 * Function to extract geometry from an AP214StepModel.
 *
 * @param model
 * @return {AP214GeometryExtraction | undefined} The extraction, or undefined
 * on failure.
 */
function geometryExtraction(model: AP214StepModel): AP214GeometryExtraction | undefined {

  const conwayModel = new AP214GeometryExtraction(conwayGeom, model)

  const [extractionResult] = conwayModel.extractAP214GeometryData(false)

  if (extractionResult !== ExtractResult.COMPLETE) {
    console.error('Could not extract geometry, exiting...')
    return void 0
  }

  return conwayModel
}
