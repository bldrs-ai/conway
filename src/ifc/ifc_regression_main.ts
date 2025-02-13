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

/**
 * Display errors and dump errors errors to stderr
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

        // eslint-disable-next-line max-len
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

  const args = // eslint-disable-line no-unused-vars
    yargs(process.argv.slice(SKIP_PARAMS))
        .command('$0 <filename> [output]', 'Query file', (yargs2) => {
          yargs2.option('strict', {
          // eslint-disable-next-line max-len
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

          if (model === void 0) {
            return
          }

          model.nullOnErrors = !strict

          const result = await geometryExtraction(model)

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
                  // eslint-disable-next-line max-len
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
                  // eslint-disable-next-line max-len
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},${operand1},${operand2},TRUE\n`])
              }

              for ( const [item, hash] of curveHashes( model.curves ) ) {

                csvLines.push([item.expressID ?? item.toString(),
                  // eslint-disable-next-line max-len
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},,,\n`])
              }

              for ( const [item, hash] of profileHashes( model.profiles ) ) {

                csvLines.push([item.expressID ?? item.toString(),
                  // eslint-disable-next-line max-len
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},,,\n`])
              }

              for ( const [item, hash] of materialHashes( model.materials ) ) {

                csvLines.push([item.expressID ?? item.toString(),
                  // eslint-disable-next-line max-len
                  `${item.toString()},${Buffer.from(hash).toString( 'hex' )},${EntityTypesIfc[item.type]},,,\n`])
              }

              for ( const [item, hash] of materialHashes( model.voidMaterials ) ) {

                csvLines.push([item.expressID ?? item.toString(),
                  // eslint-disable-next-line max-len
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
