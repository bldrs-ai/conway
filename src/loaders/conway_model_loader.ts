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

/**
 * Static class for loading a model from a Uint 8 array...
 *
 * note this is only the initial model parse, no geometry extraction has been performed.
 */
export class ConwayModelLoader {

  /**
   * Load a model using the format detector
   *
   * @param modelID
   * @param data
   * @param wasmModule
   * @param settings
   * @return {Model | undefined}
   */
  public static async loadModelWithScene(
      data: Uint8Array,
      modelID: number = 0 ): Promise<[Model, Scene]> {

    const allTimeStart = Date.now()

    const modelFormat = ModelFormatDetector.detect( new ParsingBuffer( data ) )

    switch ( modelFormat ) {

      case ModelFormatType.AP214:

        try {

          console.log( 'AP214 Step Detected' )

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
              // eslint-disable-next-line no-magic-numbers
              conwayModel.model.geometry.calculateGeometrySize() / (1024 * 1024))

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


              // eslint-disable-next-line no-magic-numbers
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

            // eslint-disable-next-line max-len
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

          const conwayModel = new IfcGeometryExtraction(conwayWasm, model)

          // parse + extract data model + geometry data
          const startTime = Date.now()
          const [extractionResult, scene] =
            conwayModel.extractIFCGeometryData()

          const endTime = Date.now()
          const executionTimeInMs = endTime - startTime

          statistics.setGeometryTime(executionTimeInMs)

          statistics.setGeometryMemory(
              // eslint-disable-next-line no-magic-numbers
              conwayModel.model.geometry.calculateGeometrySize() / (1024 * 1024))

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


              // eslint-disable-next-line no-magic-numbers
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

            // eslint-disable-next-line max-len
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
