import { ConwayGeometry } from '../../dependencies/conway-geom'
import { AP214GeometryExtraction } from '../AP214E3_2010/ap214_geometry_extraction'
import AP214StepParser from '../AP214E3_2010/ap214_step_parser'
import { Model } from '../core/model'
import { ProgressCallback, ProgressTracker } from '../core/progress'
import { ModelInfo, formatModelLine } from '../core/progress_log'
import { Scene } from '../core/scene'
import { ExtractResult } from '../core/shared_constants'
import ModelFormatDetector, { ModelFormatType } from '../format_detection/model_format_detector'
import { IfcGeometryExtraction } from '../ifc/ifc_geometry_extraction'
import { IfcProduct } from '../ifc/ifc4_gen'
import IfcStepParser from '../ifc/ifc_step_parser'
import Logger from '../logging/logger'
import Memory from '../memory/memory'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import { extractModelInfo, parseFileHeader } from './loading_utilities'

const ONE_KB = 1024
const ONE_MB = ONE_KB * ONE_KB

/**
 * Options threading the progress/yield contract (issue #301) through a load.
 */
export interface ModelLoadOptions {

  /**
   * Structured, throttled progress events across the load phases
   * (headerParse / dataParse / geometry) — see core/progress.ts.
   */
  onProgress?: ProgressCallback

  /**
   * When true, the parse and geometry loops periodically await a macrotask
   * so browsers can repaint between progress events and the tab is not
   * flagged as stalled. Costs a few % wall clock; off by default.
   */
  yieldToEventLoop?: boolean

  /** Minimum ms between progress events (default in core/progress.ts). */
  progressIntervalMs?: number

  /**
   * Fired once, right after the STEP header parses — before the full file
   * parse — with everything the header reveals, so callers can print the
   * model line as early as possible (issue #301 follow-up, log line 3).
   */
  onModelInfo?: ( info: ModelInfo ) => void
}

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
   * @param options Optional progress/yield options for the load.
   * @return {Promise<[Model, Scene]>} A promise to return the loaded model and scene.
   */
  public static async loadModelWithScene(
      data: Uint8Array,
      limitCSGDepth: boolean = true,
      maximumCSGDepth: number = 20,
      modelID: number = 0,
      options?: ModelLoadOptions ): Promise<[Model, Scene]> {

    const allTimeStart = Date.now()

    const onProgress = options?.onProgress
    const tracker = onProgress !== void 0 ?
      new ProgressTracker( onProgress, options?.progressIntervalMs ) : void 0
    const cooperative = options?.yieldToEventLoop === true

    const modelFormat = ModelFormatDetector.detect( new ParsingBuffer( data ) )

    let is203 = false

    switch ( modelFormat ) {

      case ModelFormatType.AP203:

        Logger.info( 'AP203 Step Detected, using AP214 loader' )
        is203 = true
        // falls through

      case ModelFormatType.AP242:

        // Interim: AP242 reuses the AP214 engine for the metadata-1.0
        // product-structure/property subset. See
        // design/new/step-metadata-nist.md §"The AP242 wrinkle".
        if ( modelFormat === ModelFormatType.AP242 ) {
          Logger.info( 'AP242 Step Detected, using AP214 loader (interim)' )
        }
        // falls through

      case ModelFormatType.AP214:

        if (!is203 && modelFormat !== ModelFormatType.AP242) {
          Logger.info( 'AP214 Step Detected' )
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

          tracker?.beginPhase( 'headerParse', 'bytes', data.length )

          const [stepHeader, result0] = parser.parseHeader(bufferInput)

          const headerDataTimeEnd = Date.now()

          Logger.debug( `Header parse time ${headerDataTimeEnd - headerDataTimeStart} ms` )

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

          {
            // Model line as early as possible — header-only (issue #301).
            const modelInfo = extractModelInfo( stepHeader, data.length )

            Logger.info( formatModelLine( modelInfo ) )
            options?.onModelInfo?.( modelInfo )
          }

          tracker?.beginPhase( 'dataParse', 'bytes', data.length )

          const parseTick = tracker !== void 0 ?
            ( cursorBytes: number ) => tracker.update( cursorBytes ) : void 0

          const parseDataTimeStart = Date.now()
          const [result1, model]   = cooperative ?
            await parser.parseDataToModelAsync( bufferInput, parseTick ) :
            parser.parseDataToModel( bufferInput, parseTick )
          const parseDataTimeEnd   = Date.now()

          tracker?.endPhase( data.length )

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

          // AP214 extraction is thunk-tree structured (no flat product loop),
          // so it reports as an indeterminate heartbeat phase for now — the
          // per-item ticks + cooperative yielding exist only on the IFC path.
          tracker?.beginPhase( 'geometry', 'products' )

          // parse + extract data model + geometry data
          const startTime = Date.now()
          const [extractionResult, scene] =
            conwayModel.extractAP214GeometryData()

          const endTime = Date.now()
          const executionTimeInMs = endTime - startTime

          tracker?.endPhase()

          statistics.setGeometryTime(executionTimeInMs)

          statistics.setGeometryMemory(
               
              conwayModel.model.geometry.calculateGeometrySize() / (ONE_MB))

          statistics.setGeometryTypeCounts(conwayModel.geometryTypeCounts)

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

          Logger.debug( 'Loader returning' )

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

          Logger.info( 'IFC Detected' )

          const conwayWasm = new ConwayGeometry()

          if ( !await conwayWasm.initialize() ) {

            throw Error( 'Couldn\'t initialise conway-geom' )
          }

          const statistics = Logger.createStatistics(modelID)

          const parser      = IfcStepParser.Instance
          const bufferInput = new ParsingBuffer( data )

          const headerDataTimeStart = Date.now()

          tracker?.beginPhase( 'headerParse', 'bytes', data.length )

          const [stepHeader, result0] = parser.parseHeader(bufferInput)

          const headerDataTimeEnd = Date.now()

          Logger.debug(`Header parse time ${headerDataTimeEnd - headerDataTimeStart} ms`)

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

          {
            // Model line as early as possible — header-only (issue #301).
            const modelInfo = extractModelInfo( stepHeader, data.length )

            Logger.info( formatModelLine( modelInfo ) )
            options?.onModelInfo?.( modelInfo )
          }

          tracker?.beginPhase( 'dataParse', 'bytes', data.length )

          const parseTick = tracker !== void 0 ?
            ( cursorBytes: number ) => tracker.update( cursorBytes ) : void 0

          const parseDataTimeStart = Date.now()
          const [result1, model] = cooperative ?
            await parser.parseDataToModelAsync(bufferInput, parseTick) :
            parser.parseDataToModel(bufferInput, parseTick)
          const parseDataTimeEnd = Date.now()

          tracker?.endPhase( data.length )

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

          tracker?.beginPhase( 'geometry', 'products' )

          const geometryTick = tracker !== void 0 ?
            ( completed: number, total: number ) => {
              tracker.setPhaseTotal( total )
              tracker.update( completed )
            } : void 0

          // parse + extract data model + geometry data
          const startTime = Date.now()
          const [extractionResult, scene] = cooperative ?
            await conwayModel.extractIFCGeometryDataAsync(geometryTick) :
            conwayModel.extractIFCGeometryData(geometryTick)

          const endTime = Date.now()
          const executionTimeInMs = endTime - startTime

          tracker?.endPhase()

          statistics.setGeometryTime(executionTimeInMs)

          statistics.setGeometryMemory(
               
              conwayModel.model.geometry.calculateGeometrySize() / (ONE_MB))

          const ifcProjectName = conwayModel.getIfcProjectName()

          if (ifcProjectName !== null) {
            statistics.setProjectName(ifcProjectName)
          }

          statistics.setProductCount(model.typeCount(IfcProduct))
          statistics.setGeometryTypeCounts(conwayModel.geometryTypeCounts)

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

          Logger.debug( 'Loader returning' )

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
