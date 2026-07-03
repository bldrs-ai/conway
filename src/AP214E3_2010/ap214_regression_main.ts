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
import Logger from '../logging/logger'
import Environment from '../utilities/environment'
import { ExtractResult } from '../core/shared_constants'
import { CanonicalMeshType } from '../core/canonical_mesh'
import EntityTypesAP214 from './AP214E3_2010_gen/entity_types_ap214.gen'
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

// Fixed-point precision for perf MB values.
// eslint-disable-next-line no-magic-numbers
const PERF_MB_PRECISION = 2

/**
 * Write a single-row per-file perf CSV at the given path, matching the
 * column layout of the IFC regression child so the batch aggregator can
 * merge STEP and IFC rows into one perf CSV. No-op when perfPath is empty.
 *
 * @param perfPath Path to write the CSV to. Empty string disables.
 * @param stepFile Source STEP file path (basename used as the row key).
 * @param status OK or FAIL.
 * @param parseTimeMs Parse stage duration in ms.
 * @param geometryTimeMs Geometry extraction duration in ms.
 * @param totalTimeMs Sum of parse + geometry in ms.
 */
async function writePerfCsvIfRequested(
    perfPath: string,
    stepFile: string,
    status: 'OK' | 'FAIL',
    parseTimeMs: number,
    geometryTimeMs: number,
    totalTimeMs: number,
): Promise<void> {

  if ( perfPath.length === 0 ) {
    return
  }

  const mem = process.memoryUsage()
  const rssMb = ( mem.rss / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const heapUsedMb = ( mem.heapUsed / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )
  const heapTotalMb = ( mem.heapTotal / BYTES_PER_MB ).toFixed( PERF_MB_PRECISION )

  const fileName = csvSafeString( path.basename( stepFile ) )

  const header =
    'file,status,parseTimeMs,geometryTimeMs,totalTimeMs,rssMb,heapUsedMb,heapTotalMb\n'
  const row =
    `${fileName},${status},${parseTimeMs},${geometryTimeMs},${totalTimeMs},` +
    `${rssMb},${heapUsedMb},${heapTotalMb}\n`

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
              perfPath, stepFile, 'FAIL', parseTimeMs, 0, parseTimeMs)
          displayErrors(stepFile)
          return
        }

        model.nullOnErrors = !strict

        const geomStartMs = Date.now()
        const extraction = geometryExtraction(model)
        const geomEndMs = Date.now()
        const geometryTimeMs = geomEndMs - geomStartMs
        const totalTimeMs = geomEndMs - parseStartMs

        const perfStatus = extraction === void 0 ? 'FAIL' : 'OK'
        await writePerfCsvIfRequested(
            perfPath, stepFile, perfStatus, parseTimeMs, geometryTimeMs, totalTimeMs)

        if ( extraction === void 0 ) {
          Logger.error( 'Couldn\'t extract geometry')
        } else if ( digest ) {

          // Digest layout matches the IFC regression digest
          // (ID,Hash,Type,Operand 1,Operand2,Void) so the same diff/bless
          // tooling applies. STEP digests cover final meshes and memoized
          // curves; AP214 has no void/CSG-operand columns to fill.
          const csvLines: [number | string, string][] = []

          const csvPath       = `${outputPath}.csv`
          const csvFileHandle = await fsPromises.open( csvPath, 'w' )

          await csvFileHandle.write( `ID,Hash,Type,Operand 1,Operand2,Void\n` )

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

            csvLines.push([rowID, `${rowID},${hash},${typeName},,,FALSE\n`])
          }

          for ( const [curveItem, objContents] of model.curves.objs() ) {

            const hash =
              crypto.createHash( 'sha1' ).update( objContents ).digest( 'hex' )

            const rowID = curveItem.expressID ?? curveItem.toString()

            csvLines.push([rowID,
              `${rowID},${hash},${EntityTypesAP214[curveItem.type]},,,\n`])
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
