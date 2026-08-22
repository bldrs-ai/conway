import { exit } from 'process'
import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import yargs from 'yargs/yargs'
import fs from 'fs'
import IfcStepModel from './ifc_step_model'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import { ConwayGeometry }
  from '../../dependencies/conway-geom'
import { IfcSceneBuilder } from './ifc_scene_builder'
import Logger from '../logging/logger'
import Environment from '../utilities/environment'
import { ExtractResult } from '../core/shared_constants'
import path from 'path'
import fsPromises from 'fs/promises'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import { IfcBooleanResult } from './ifc4_gen'
import { MemoizationCapture, RegressionCaptureState } from '../core/regression_capture_state'
import { materialHashes } from './ifc_material_cache_node'
import { dumpGeometryOBJs, geometryHashes } from './ifc_model_geometry_node'
import { curveHashes, dumpCurveOBJs } from './ifc_model_curves_node'
import { dumpProfileOBJs, profileHashes } from './ifc_model_profile_node'
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
 * Write a single-row per-file perf CSV at the given path. Memory snapshot is
 * taken at call time; for the OK path this is right after geometry extraction
 * — close to peak. No-op when perfPath is empty.
 *
 * WHICH COLUMNS ARE PEAK AND WHICH ARE INSTANTS — they are not comparable and
 * the difference is large (conway#552):
 *
 *   peakRssMb        PEAK. The kernel's high-water mark for this process
 *                    (`resourceUsage().maxRSS`, kB), i.e. the number that
 *                    decides whether a browser tab or a runner survives the
 *                    load. Free to read and perturbs nothing.
 *   rssMb            INSTANT. One `memoryUsage()` sample at write time. A run
 *                    that transiently hit 5 GB and settled to 1 GB reports
 *                    1 GB here and 5 GB in peakRssMb.
 *   heapUsedMb       INSTANT, and *not* live set: it is live data plus
 *                    whatever garbage GC has not collected yet, so it moves
 *                    with GC timing. Measuring SKYLARK250 this way gives
 *                    2547 MB where the same run's live heap after two forced
 *                    full GCs is 981 MB. A live-heap column would need forced
 *                    GC, which wrecks the timing columns, so it is not here.
 *   heapTotalMb      INSTANT. V8's reserved heap.
 *   externalMb       INSTANT. Off-heap bytes V8 knows about, which heapUsed
 *                    does not include and which are a real part of the
 *                    footprint: on MB-Khaya (31 MB IFC) `readFileSync` alone
 *                    moves this 1.7 -> 33.1 MB while heapUsed does not move.
 *   arrayBuffersMb   INSTANT, and a SUBSET of externalMb — the ArrayBuffer
 *                    share of it, which is where the source buffer and the
 *                    parse structures land (31.5 of that 33.1 MB).
 *   geometryMemoryMb Not a process metric at all: the vertex+index payload
 *                    conway itself allocated for this model, summed by
 *                    `calculateGeometrySize()`. Unlike rss/heap it excludes
 *                    everything the harness happens to be holding.
 *
 * There is deliberately no `heapUsed + external` total. It looks like a
 * portable stand-in for RSS and is not one: on that same model it reads
 * 284 MB against an RSS of 510 MB after geometry, and wasm init alone adds
 * ~65 MB of RSS while moving `external` by under 2 MB. Emscripten's heap is
 * structurally invisible to JS-side accounting, so such a total would be
 * blind to exactly the memory this bench exists to track. peakRssMb is the
 * headline.
 *
 * `rssMb` and `peakRssMb` include the conway-geom WASM heap (mmap'd into the
 * process) and are the load-bearing memory metrics for geometry work.
 * `heapUsedMb` / `heapTotalMb` are V8-only — useful for tracking JS-side
 * allocation pressure but they exclude WASM-side buffers. Expect a large
 * gap between rss and heap on geometry-heavy models.
 *
 * The column list here is shared with the AP214 regression child
 * (`ap214_regression_main.ts`): `aggregatePerfCsvs` in
 * `ifc_regression_batch_main.ts` keeps the header of whichever per-file CSV it
 * reads first and concatenates the rest as rows, so a mixed IFC/STEP corpus
 * mislabels every column if the two writers drift apart.
 *
 * @param perfPath Path to write the CSV to. Empty string disables.
 * @param ifcFile Source IFC file path (basename used as the row key).
 * @param status OK or FAIL.
 * @param parseTimeMs Parse stage duration in ms.
 * @param geometryTimeMs Geometry extraction duration in ms.
 * @param totalTimeMs Sum of parse + geometry in ms.
 * @param geometryMemoryBytes Geometry payload conway allocated, in bytes, or
 * undefined where no geometry was extracted (written as N/A).
 */
async function writePerfCsvIfRequested(
    perfPath: string,
    ifcFile: string,
    status: 'OK' | 'FAIL',
    parseTimeMs: number,
    geometryTimeMs: number,
    totalTimeMs: number,
    geometryMemoryBytes?: number,
): Promise<void> {

  if ( perfPath.length === 0 ) {
    return
  }

  const mem = process.memoryUsage()
  const rssMb = ( mem.rss / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const heapUsedMb = ( mem.heapUsed / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const heapTotalMb = ( mem.heapTotal / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const externalMb = ( mem.external / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const arrayBuffersMb =
    ( mem.arrayBuffers / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  // maxRSS is reported in kilobytes, unlike memoryUsage() which is in bytes.
  const peakRssMb =
    ( process.resourceUsage().maxRSS / KB_PER_MB ).toFixed( PERF_MB_PRECISION )
  const geometryMemoryMb = geometryMemoryBytes !== void 0 ?
    ( geometryMemoryBytes / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION ) :
    UNMEASURED

  const fileName = csvSafeString( path.basename( ifcFile ) )

  const header =
    'file,status,parseTimeMs,geometryTimeMs,totalTimeMs,geometryMemoryMb,' +
    'rssMb,peakRssMb,heapUsedMb,heapTotalMb,externalMb,arrayBuffersMb\n'
  const row =
    `${fileName},${status},${parseTimeMs},${geometryTimeMs},${totalTimeMs},` +
    `${geometryMemoryMb},${rssMb},${peakRssMb},${heapUsedMb},${heapTotalMb},` +
    `${externalMb},${arrayBuffersMb}\n`

  try {
    await fsPromises.writeFile( perfPath, header + row )
  } catch ( e ) {
    // Perf is best-effort; never fail the regression run because of a perf write.
    console.error( `Failed to write perf CSV at ${perfPath}:`, e )
  }
}

/**
 * Display errors and dump errors errors to stderr
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

  const args =  
    yargs(process.argv.slice(SKIP_PARAMS))
        .command('$0 <filename> [output]', 'Query file', (yargs2) => {
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
          yargs2.option('verbose', {

            describe: 'Output the verbose full folder structure',
            type: 'boolean',
            alias: 'v',
            default: false,
          })
          yargs2.option('perf', {

            describe:
              'Write a single-row perf CSV (parse/geometry/total time + memory) at this path',
            type: 'string',
            alias: 'p',
            default: '',
          })

          yargs2.positional('filename', { describe: 'IFC File Paths', type: 'string' })
          yargs2.positional('output', { describe: 'Output path', type: 'string' })

        }, async (argv) => {
          const ifcFile = argv['filename'] as string
          const outputPath =
              argv['output'] as string ??
              path.join( path.dirname( ifcFile ), path.parse( ifcFile ).name )

          let indexIfcBuffer: Buffer | undefined

          const strict = (argv['strict'] as boolean | undefined) ?? false
          const digest = (argv['digest'] as boolean | undefined) ?? false
          const verbose = (argv['verbose'] as boolean | undefined) ?? false
          const perfPath = (argv['perf'] as string | undefined) ?? ''

          try {
            indexIfcBuffer = fs.readFileSync(ifcFile)
          } catch (ex) {
            Logger.error(
                'Couldn\'t read file, check that it is accessible at the specified path.')
            displayErrors(ifcFile)
            exit()
          }

          if (indexIfcBuffer === void 0) {
            Logger.error(
                'Couldn\'t read file, check that it is accessible at the specified path.')
            displayErrors(ifcFile)
            exit()
          }

          const parser = IfcStepParser.Instance
          const bufferInput = new ParsingBuffer(indexIfcBuffer)

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

          const [result1, model] = parser.parseDataToModel( bufferInput)

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
                perfPath, ifcFile, 'FAIL', parseTimeMs, 0, parseTimeMs)
            return
          }

          model.nullOnErrors = !strict

          const geomStartMs = Date.now()
          const result = await geometryExtraction(model)
          const geomEndMs = Date.now()
          const geometryTimeMs = geomEndMs - geomStartMs
          const totalTimeMs = geomEndMs - parseStartMs

          const perfStatus = result === void 0 ? 'FAIL' : 'OK'
          // Sized before anything downstream can release meshes, and only on
          // the OK path: a failed extraction leaves a partial cache whose size
          // is not this model's geometry footprint.
          const geometryMemoryBytes = result !== void 0 ?
            model.geometry.calculateGeometrySize() : void 0
          await writePerfCsvIfRequested(
              perfPath, ifcFile, perfStatus, parseTimeMs, geometryTimeMs, totalTimeMs,
              geometryMemoryBytes)

          // AFTP sizing pass: no-op unless the wasm module was built with
          // CONWAY_ALLOC_TELEMETRY (see conway-geom structures/alloc_telemetry.h).
          conwayGeom.dumpAllocTelemetry(path.basename(ifcFile))

          if ( result === void 0 ) {
            Logger.error( 'Couldn\'t extract geometry')
          } else {

            if ( digest ) {

              const csvLines: [number | string, string][] = []

              const csvPath       = `${outputPath}.csv`
              const csvFileHandle = await fsPromises.open( csvPath, 'w' )

              await csvFileHandle.write( `ID,Hash,Type,Operand 1,Operand2,Void\n` )

              for ( const [item, hash] of geometryHashes( model.geometry ) ) {

                let operand1 = ''
                let operand2 = ''

                if ( item instanceof IfcBooleanResult ) {

                  operand1 = item.FirstOperand.toString()
                  operand2 = item.SecondOperand.toString()

                }

                csvLines.push([item.expressID ?? item.toString(),
                   
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},${operand1},${operand2},FALSE\n`])
              }

              for ( const [item, hash] of geometryHashes( model.voidGeometry ) ) {

                let operand1 = ''
                let operand2 = ''

                if ( item instanceof IfcBooleanResult ) {

                  operand1 = item.FirstOperand.toString()
                  operand2 = item.SecondOperand.toString()

                }

                csvLines.push([item.expressID ?? item.toString(),
                   
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},${operand1},${operand2},TRUE\n`])
              }

              for ( const [item, hash] of curveHashes( model.curves ) ) {

                csvLines.push([item.expressID ?? item.toString(),
                   
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},,,\n`])
              }

              for ( const [item, hash] of profileHashes( model.profiles ) ) {

                csvLines.push([item.expressID ?? item.toString(),
                   
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},,,\n`])
              }

              for ( const [item, hash] of materialHashes( model.materials ) ) {

                csvLines.push([item.expressID ?? item.toString(),
                   
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},,,\n`])
              }

              for ( const [item, hash] of materialHashes( model.voidMaterials ) ) {

                csvLines.push([item.expressID ?? item.toString(),
                   
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},,,\n`])
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

              // Note, we cast to any here because the writeFile supports an iterable
              // but the typescript bindings don't have the option
              await csvFileHandle.writeFile( csvLines.map( ( line ) => line[ 1 ]) as any )

              await csvFileHandle.close()
            }

            if ( verbose ) {

              const objFolder = `${outputPath}_obj`

              dumpGeometryOBJs( model.geometry, objFolder )
              dumpGeometryOBJs( model.voidGeometry, objFolder )
              dumpCurveOBJs( model.curves, objFolder )
              dumpProfileOBJs( model.profiles, objFolder )
            }
          }

          displayErrors(ifcFile)
        })
        .help().argv
}

/**
 * Function to extract Geometry from an IfcStepModel
 *
 * @param model
 */
async function geometryExtraction(model: IfcStepModel):
  Promise<[IfcSceneBuilder, ConwayGeometry] | undefined> {

  const conwaywasm = new ConwayGeometry()
  const initializationStatus = await conwaywasm.initialize()

  if (!initializationStatus) {
    return
  }

  const conwayModel = new IfcGeometryExtraction(conwaywasm, model)

  RegressionCaptureState.memoization = MemoizationCapture.FULL

  // parse + extract data model + geometry data
  const [extractionResult, scene] =
    conwayModel.extractIFCGeometryData()

  if (extractionResult !== ExtractResult.COMPLETE) {
    console.error('Could not extract geometry, exiting...')
    return void 0
  }

  return [scene, conwaywasm]
}
