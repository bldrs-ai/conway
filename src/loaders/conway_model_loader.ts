import { ConwayGeometry } from '../../dependencies/conway-geom'
import { AP214GeometryExtraction } from '../AP214E3_2010/ap214_geometry_extraction'
import AP214StepParser from '../AP214E3_2010/ap214_step_parser'
import { Model } from '../core/model'
import { Scene } from '../core/scene'
import { ExtractResult } from '../core/shared_constants'
import ModelFormatDetector, { ModelFormatType } from '../format_detection/model_format_detector'
import { IfcGeometryExtraction } from '../ifc/ifc_geometry_extraction'
import IfcStepParser from '../ifc/ifc_step_parser'
import Logger from '../logging/logger'
import Memory from '../memory/memory'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { parseFileHeader } from './loading_utilities'

const ONE_KB = 1024
const ONE_MB = ONE_KB * ONE_KB

/**
 * Static class for loading a model from a Uint 8 array...
 *
 * note this is only the initial model parse, no geometry extraction has been performed.
 */
export class ConwayModelLoader {

  /**
   * Load a model using the format detector
   *
   * @param data The buffer to load from.
   * @param limitCSGDepth Whether to limit CSG depth during geometry extraction.
   * @param maximumCSGDepth The maximum CSG depth allowed during geometry extraction.
   * @param modelID The model id to use for statistics (or 0 if none is provided)
   * @return {Promise<[Model, Scene]>} A promise to return the loaded model and scene.
   */
  public static async loadModelWithScene(
      data: Uint8Array,
      limitCSGDepth: boolean = true,
      maximumCSGDepth: number = 20,
      modelID: number = 0 ): Promise<[Model, Scene]> {

    const allTimeStart = Date.now()

    const modelFormat = ModelFormatDetector.detect( new ParsingBuffer( data ) )

    let is203 = false

    switch ( modelFormat ) {

      case ModelFormatType.AP203:

        console.log( 'AP203 Step Detected, using AP214 loader' )
        is203 = true
        // Fallthru

      case ModelFormatType.AP214:

        if (!is203) {
          console.log( 'AP214 Step Detected' )
        }

        try {
          const conwayWasm = new ConwayGeometry()

          if ( !await conwayWasm.initialize() ) {

            throw Error( 'Couldn\'t initialise conway-geom' )
          }

          const statistics = Logger.createStatistics( modelID )

          const parser      = AP214StepParser.Instance
          const bufferInput = new ParsingBuffer( data )

          const headerDataTimeStart = Date.now()

          const [stepHeader, result0] = parser.parseHeader(bufferInput)

          const headerDataTimeEnd = Date.now()

          Logger.info( `Header parse time ${headerDataTimeEnd - headerDataTimeStart} ms` )

          switch (result0) {
            case ParseResult.COMPLETE:

              break

            case ParseResult.INCOMPLETE:

              Logger.warning( 'Parse incomplete but no errors' )
              break

            case ParseResult.INVALID_STEP:

              Logger.error( 'Invalid STEP detected in parse, but no syntax error detected' )
              break

            case ParseResult.MISSING_TYPE:

              Logger.error( 'Missing STEP type, but no syntax error detected' )
              break

            case ParseResult.SYNTAX_ERROR:

              Logger.error( `Syntax error detected on line ${bufferInput.lineCount}` )
              break

            default:
          }

          const parseDataTimeStart = Date.now()
          const [result1, model]   = parser.parseDataToModel( bufferInput )
          const parseDataTimeEnd   = Date.now()

          switch (result1) {
            case ParseResult.COMPLETE:

              break

            case ParseResult.INCOMPLETE:

              Logger.warning( 'Parse incomplete but no errors' )
              break

            case ParseResult.INVALID_STEP:

              Logger.error( 'Invalid STEP detected in parse, but no syntax error detected' )
              break

            case ParseResult.MISSING_TYPE:

              Logger.error( 'Missing STEP type, but no syntax error detected' )
              break

            case ParseResult.SYNTAX_ERROR:

              Logger.error( `Syntax error detected on line ${bufferInput.lineCount}` )
              break

            default:
          }

          if ( model === void 0 ) {

            throw Error( 'Unable to parse model' )
          }

          const conwayModel = new AP214GeometryExtraction(conwayWasm, model)

          // parse + extract data model + geometry data
          const startTime = Date.now()
          const [extractionResult, scene] =
            conwayModel.extractAP214GeometryData()

          const endTime = Date.now()
          const executionTimeInMs = endTime - startTime

          statistics.setGeometryTime(executionTimeInMs)

          statistics.setGeometryMemory(
               
              conwayModel.model.geometry.calculateGeometrySize() / (ONE_MB))

          model.invalidate(true)

          if (extractionResult !== ExtractResult.COMPLETE) {

            throw Error( 'Geometry extraction failed' )
          }

          const allTimeEnd = Date.now()

          const allTime = allTimeEnd - allTimeStart

          if (statistics !== void 0) {
            const dataParseTime = parseDataTimeEnd - parseDataTimeStart

            statistics.setLoadStatus('OK')
            statistics.setParseTime(dataParseTime)
            statistics.setTotalTime(allTime)

            let FILE_NAME = stepHeader.headers.get('FILE_NAME')

            if (FILE_NAME !== void 0) {
              // strip start / end parenthesis
              FILE_NAME = FILE_NAME.substring(1, FILE_NAME.length - 1)
            }
            const ifcVersion = stepHeader.headers.get('FILE_SCHEMA')

            if (ifcVersion !== void 0) {
              statistics.setVersion(ifcVersion)
            }

            if (FILE_NAME !== void 0) {
              const fileNameSplit: string[] = parseFileHeader(FILE_NAME)


               
              if (fileNameSplit.length > 6) {
                const preprocessorVersion = fileNameSplit[5]
                const originatingSystem = fileNameSplit[6]

                statistics.setPreprocessorVersion(preprocessorVersion)
                statistics.setOriginatingSystem(originatingSystem)
              }
            }

            statistics.setMemoryStatistics(Memory.checkMemoryUsage())
          }

          Logger.displayLogs()
          Logger.printStatistics(modelID)

          console.log( 'Loader returning' )

          return [model, scene]

        } catch ( e ) {

          if ( e instanceof Error ) {
             
            Logger.error( `Error loading AP214 model in passthrough factory ${modelID}:\n${e.message}\n\n${e.stack}`)
          } else {

            Logger.error( `Unknown error loading AP214 model in passthrough factory ${modelID}` )
          }

          throw e
        }

      case ModelFormatType.IFC:

        try {

          console.log( 'IFC Detected' )

          const conwayWasm = new ConwayGeometry()

          if ( !await conwayWasm.initialize() ) {

            throw Error( 'Couldn\'t initialise conway-geom' )
          }

          const statistics = Logger.createStatistics(modelID)

          const parser      = IfcStepParser.Instance
          const bufferInput = new ParsingBuffer( data )

          const headerDataTimeStart = Date.now()

          const [stepHeader, result0] = parser.parseHeader(bufferInput)

          const headerDataTimeEnd = Date.now()

          Logger.info(`Header parse time ${headerDataTimeEnd - headerDataTimeStart} ms`)

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

          const parseDataTimeStart = Date.now()
          const [result1, model] = parser.parseDataToModel(bufferInput)
          const parseDataTimeEnd = Date.now()

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

          if ( model === void 0 ) {

            throw Error( 'Unable to parse model' )
          }

          const conwayModel = new IfcGeometryExtraction(
            conwayWasm,
            model,
            limitCSGDepth,
            maximumCSGDepth)

          // parse + extract data model + geometry data
          const startTime = Date.now()
          const [extractionResult, scene] =
            conwayModel.extractIFCGeometryData()

          const endTime = Date.now()
          const executionTimeInMs = endTime - startTime

          statistics.setGeometryTime(executionTimeInMs)

          statistics.setGeometryMemory(
               
              conwayModel.model.geometry.calculateGeometrySize() / (ONE_MB))

          const ifcProjectName = conwayModel.getIfcProjectName()

          if (ifcProjectName !== null) {
            statistics.setProjectName(ifcProjectName)
          }

          model.invalidate(true)

          if (extractionResult !== ExtractResult.COMPLETE) {

            throw Error( 'Geometry extraction failed' )
          }

          const allTimeEnd = Date.now()

          const allTime = allTimeEnd - allTimeStart

          if (statistics !== void 0) {
            const dataParseTime = parseDataTimeEnd - parseDataTimeStart

            statistics.setLoadStatus('OK')
            statistics.setParseTime(dataParseTime)
            statistics.setTotalTime(allTime)

            let FILE_NAME = stepHeader.headers.get('FILE_NAME')

            if (FILE_NAME !== void 0) {
              // strip start / end parenthesis
              FILE_NAME = FILE_NAME.substring(1, FILE_NAME.length - 1)
            }
            const ifcVersion = stepHeader.headers.get('FILE_SCHEMA')

            if (ifcVersion !== void 0) {
              statistics.setVersion(ifcVersion)
            }

            if (FILE_NAME !== void 0) {
              const fileNameSplit: string[] = parseFileHeader(FILE_NAME)


               
              if (fileNameSplit.length > 6) {
                const preprocessorVersion = fileNameSplit[5]
                const originatingSystem = fileNameSplit[6]

                statistics.setPreprocessorVersion(preprocessorVersion)
                statistics.setOriginatingSystem(originatingSystem)
              }
            }

            statistics.setMemoryStatistics(Memory.checkMemoryUsage())
          }

          Logger.displayLogs()
          Logger.printStatistics(modelID)

          console.log( 'Loader returning' )

          return [model, scene]

        } catch ( e ) {

          if ( e instanceof Error ) {

             
            Logger.error( `Error loading IFC model in passthrough factory ${modelID}:\n${e.message}\n\n${e.stack}`)
          } else {

            Logger.error( `Unknown error loading IFC model in passthrough factory ${modelID}` )
          }

          throw e
        }

      default:

        Logger.error( 'No type detected when constructing model')
        throw Error( 'Unsupported type' )
    }
  }
}
