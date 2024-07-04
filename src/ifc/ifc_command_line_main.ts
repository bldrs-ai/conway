import { exit } from 'process'
import IfcStepParser from './ifc_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ParseResult } from '../step/parsing/step_parser'
import EntityTypesIfc from '../ifc/ifc4_gen/entity_types_ifc.gen'
import yargs from 'yargs/yargs'
import fs from 'fs'
import StepEntityBase from '../step/step_entity_base'
import IfcStepModel from './ifc_step_model'
import { IfcGeometryExtraction } from './ifc_geometry_extraction'
import { IfcPropertyExtraction } from './ifc_property_extraction'
import { ConwayGeometry }
  from '../../dependencies/conway-geom/conway_geometry'
import { IfcSceneBuilder } from './ifc_scene_builder'
import GeometryConvertor from '../core/geometry_convertor'
import GeometryAggregator from '../core/geometry_aggregator'
import Logger from '../logging/logger'
import Environment from '../utilities/environment'
import Memory from '../memory/memory'
import { ExtractResult } from '../core/shared_constants'

// create a model ID
const modelID: number = 0

main()

/**
 * Generalised error handling wrapper
 */
function main() {
  Environment.checkEnvironment()
  Logger.initializeWasmCallbacks()
  try {
    doWork()
  } catch (error) {
    console.error('An error occurred:', error)
  }
}

/**
 * Actual execution function.
 */
function doWork() {
  const allTimeStart = Date.now()
  const SKIP_PARAMS = 2

  const args = // eslint-disable-line no-unused-vars
    yargs(process.argv.slice(SKIP_PARAMS))
        .command('$0 <filename>', 'Query file', (yargs2) => {
          yargs2.option('express_ids', {
            describe: 'A list of express IDs',
            type: 'number',
            array: true,
            alias: 'e',
          })
          yargs2.option('types', {
            describe: 'A list of express IDs',
            type: 'string',
            array: true, alias: 't',
          })
          yargs2.option('fields', {
            describe: 'A list of fields to extract',
            type: 'string',
            array: true,
            alias: 'f',
          })
          yargs2.option('geometry', {
            describe: 'Output Geometry in OBJ + GLTF + GLB formats',
            type: 'boolean',
            alias: 'g',
          })
          yargs2.option('properties', {
            describe: 'Output PropertySets',
            type: 'boolean',
            alias: 'p',
          })
          yargs2.option('maxchunk', {
          // eslint-disable-next-line max-len
            describe: 'Maximum chunk size in megabytes (note, this is the allocation size, not the output size)',
            type: 'number',
            alias: 'm',
            default: 128,
          })
          yargs2.option('strict', {
          // eslint-disable-next-line max-len
            describe: 'Makes parser/reference errors on nullable fields return null instead of an error',
            type: 'boolean',
            alias: 's',
            default: false,
          })
          yargs2.option('spaces', {
            describe: 'Output Spaces within Rel-Aggregates',
            type: 'boolean',
            alias: 'r',
          })

          yargs2.positional('filename', { describe: 'IFC File Paths', type: 'string' })
        }, async (argv) => {
          const ifcFile = argv['filename'] as string

          let indexIfcBuffer: Buffer | undefined

          const expressIDs = (argv['express_ids'] as number[] | undefined)
          const types = (argv['types'] as string[] | undefined)?.map((value) => {
            return EntityTypesIfc[value.toLocaleUpperCase() as keyof typeof EntityTypesIfc]
          }).filter((value) => value !== void 0)
          const fields = (argv['fields'] as string[] | undefined) ??
          ['expressID', 'type', 'localID']
          const geometry = (argv['geometry'] as boolean | undefined)

          const outputProperties = (argv['properties'] as boolean | undefined)
          const strict = (argv['strict'] as boolean | undefined) ?? false
          const includeSpace = (argv['spaces'] as boolean | undefined)

          try {
            indexIfcBuffer = fs.readFileSync(ifcFile)
          } catch (ex) {
            Logger.error(
                'Couldn\'t read file, check that it is accessible at the specified path.')
            exit()
          }

          if (indexIfcBuffer === void 0) {
            Logger.error(
                'Couldn\'t read file, check that it is accessible at the specified path.')
            exit()
          }

          // create a statistics object
          Logger.createStatistics(modelID)

          const parser = IfcStepParser.Instance
          const bufferInput = new ParsingBuffer(indexIfcBuffer)

          const headerDataTimeStart = Date.now()


          const [stepHeader, result0] = parser.parseHeader(bufferInput)

          const headerDataTimeEnd = Date.now()

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

          if (model === void 0) {
            return
          }

          model.nullOnErrors = !strict

          if (geometry) {
          // Get the filename with extension
            const fileNameWithExtension = ifcFile.split('/').pop()!
            // Get the filename without extension
            const fileName = fileNameWithExtension.split('.')[0]
            const result = await geometryExtraction(model)
            if (result !== void 0) {
              const scene = result[0]
              const conwaywasm = result[1]

              if (outputProperties) {
                propertyExtraction(model)
              }

              const DEFAULT_CHUNK = 128
              const MEGABYTE_SHIFT = 20
              const maxChunk = (argv['maxchunk'] as number | undefined) ?? DEFAULT_CHUNK
              const maxGeometrySize = maxChunk << MEGABYTE_SHIFT

              serializeGeometry(scene, conwaywasm, fileName, maxGeometrySize, includeSpace)
            }


          } else {

            console.log('\n')

            console.log(fields.reduce((previous, current, currentIndex) => {
              return `${previous}${(currentIndex === 0) ? '|' : ''}${current}|`
            }, ''))

            console.log(fields.reduce((previous, current, currentIndex) => {
              return `${previous}${(currentIndex === 0) ? '|' : ''}---|`
            }, ''))

            let rowCount = 0

            const elements =
            (expressIDs?.map((value) => model?.getElementByExpressID(value))?.filter(
                (value) => value !== void 0 && (types === void 0 ||
                types.includes(value.type))) ??
              (types !== void 0 ? model.typeIDs(...types) : void 0) ??
              model) as StepEntityBase<EntityTypesIfc>[] |
            IterableIterator<StepEntityBase<EntityTypesIfc>>

            for (const element of elements) {
              const elementTypeID = EntityTypesIfc[element.type]

              console.log(
                  fields.reduce((previous, current, currentIndex) => {
                    let result

                    try {
                      if (current === 'type') {
                        result = elementTypeID
                      } else {
                        result = ((element as { [key: string]: any })[current])

                        if (result === null) {
                          result = 'null'
                        } else if (result === void 0) {
                          result = '   '
                        } else if (current === 'expressID') {
                          result = `#${result}`
                        }
                      }
                    } catch (ex) {
                      result = 'err'
                    }

                    return `${previous}${(currentIndex === 0) ? '|' : ''}${result}|`
                  }, ''))

              ++rowCount
            }

            console.log('\n')
            Logger.info(`Row Count: ${rowCount}`)
            Logger.info(`Header parse time ${headerDataTimeEnd - headerDataTimeStart} ms`)
          }

          if (!geometry) {
            if (outputProperties) {
              propertyExtraction(model!)
            }
          }

          const allTimeEnd = Date.now()

          const allTime = allTimeEnd - allTimeStart

          const statistics = Logger.getStatistics(modelID)

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
        })
        .help().argv
}

/**
 *
 * @param input - FILE_HEADER from step header
 * @return {string[]} array of fields in FILE_NAME
 */
function parseFileHeader(input: string): string[] {
  const result: string[] = []
  let currentSegment = ''
  let parenthesesCount = 0

  for (const char of input) {
    if (char === '(') {
      parenthesesCount++
    } else if (char === ')') {
      parenthesesCount--
    }

    if (char === ',' && parenthesesCount === 0) {
      result.push(currentSegment.trim())
      currentSegment = ''
    } else {
      currentSegment += char
    }
  }

  // Add the last segment if it's not empty
  if (currentSegment.trim() !== '') {
    result.push(currentSegment.trim())
  }

  return result
}


/**
 * Serialize the geometry.
 */
function serializeGeometry(
    scene: IfcSceneBuilder,
    conwaywasm: ConwayGeometry,
    fileNameNoExtension: string,
    maxGeometrySize: number,
    includeSpaces?: boolean  ) {
  const geometryAggregator =
    new GeometryAggregator(
        conwaywasm, { maxGeometrySize: maxGeometrySize, outputSpaces: includeSpaces } )

  geometryAggregator.append(scene)

  const aggregatedGeometry = geometryAggregator.aggregateNative()

  if (aggregatedGeometry.geometry.size() === 0) {
    Logger.warning('No Geometry Found')
    return
  }

  const convertor = new GeometryConvertor(conwaywasm)

  const startTimeGlb = Date.now()
  const glbResults =
    convertor.toGltfs(
        aggregatedGeometry,
        true,
        false,
        `${fileNameNoExtension}_test`)

  for (const glbResult of glbResults) {
    if (glbResult.success) {

      if (glbResult.buffers.size() !== glbResult.bufferUris.size()) {
        Logger.error('Buffer size != Buffer URI size!\n')
        return
      }

      for (let uriIndex = 0; uriIndex < glbResult.bufferUris.size(); uriIndex++) {
        const uri = glbResult.bufferUris.get(uriIndex)

        // Create a (zero copy!) memory view from the native vector
        const managedBuffer: Uint8Array =
          conwaywasm.wasmModule.getUint8Array(glbResult.buffers.get(uriIndex))

        try {
          fs.writeFileSync(uri, managedBuffer)
        } catch (err) {
          Logger.error(`Error writing to file: ${err}`)
        }
      }
    } else {
      Logger.error('GLB generation unsuccessful')
    }

    glbResult.bufferUris?.delete()
    glbResult.buffers?.delete()
  }

  const endTimeGlb = Date.now()
  const executionTimeInMsGlb = endTimeGlb - startTimeGlb

  // draco test
  const startTimeGlbDraco = Date.now()
  const glbDracoResults =
    convertor.toGltfs(
        aggregatedGeometry,
        true,
        true,
        `${fileNameNoExtension}_test_draco`)

  for (const glbDracoResult of glbDracoResults) {

    if (glbDracoResult.success) {

      if (glbDracoResult.buffers.size() !== glbDracoResult.bufferUris.size()) {
        Logger.error('Buffer size != Buffer URI size!\n')
        return
      }

      for (let uriIndex = 0; uriIndex < glbDracoResult.bufferUris.size(); uriIndex++) {
        const uri = glbDracoResult.bufferUris.get(uriIndex)

        // Create a (zero copy!) memory view from the native vector
        const managedBuffer: Uint8Array =
          conwaywasm.wasmModule.getUint8Array(glbDracoResult.buffers.get(uriIndex))

        try {
          fs.writeFileSync(uri, managedBuffer)
        } catch (err) {
          Logger.error(`Error writing to file: ${err}`)
        }
      }
    } else {
      console.error('GLB Draco generation unsuccessful')
    }

    glbDracoResult.bufferUris?.delete()
    glbDracoResult.buffers?.delete()
  }

  const endTimeGlbDraco = Date.now()
  const executionTimeInMsGlbDraco = endTimeGlbDraco - startTimeGlbDraco

  const startTimeGltf = Date.now()
  const gltfResults =
    convertor.toGltfs(
        aggregatedGeometry,
        false,
        false,
        `${fileNameNoExtension}`)

  for (const gltfResult of gltfResults) {

    if (gltfResult.success) {

      if (gltfResult.buffers.size() !== gltfResult.bufferUris.size()) {
        Logger.error('Buffer size !== Buffer URI size!\n')
        return
      }

      for (let uriIndex = 0; uriIndex < gltfResult.bufferUris.size(); uriIndex++) {
        const uri = gltfResult.bufferUris.get(uriIndex)

        // Create a memory view from the native vector
        const managedBuffer: Uint8Array =
          conwaywasm.wasmModule.
              getUint8Array(gltfResult.buffers.get(uriIndex))

        try {
          fs.writeFileSync(uri, managedBuffer)
        } catch (err) {
          Logger.error(`Error writing to file: ${err}`)
        }
      }
    } else {
      Logger.error('GLTF generation unsuccessful')
    }

    gltfResult.bufferUris?.delete()
    gltfResult.buffers?.delete()
  }

  const endTimeGltf = Date.now()
  const executionTimeInMsGltf = endTimeGltf - startTimeGltf

  const startTimeGltfDraco = Date.now()
  const gltfResultsDraco =
    convertor.toGltfs(
        aggregatedGeometry,
        false,
        true,
        `${fileNameNoExtension}_draco`)

  for (const gltfResultDraco of gltfResultsDraco) {

    if (gltfResultDraco.success) {

      if (gltfResultDraco.buffers.size() !== gltfResultDraco.bufferUris.size()) {
        Logger.error('Buffer size !== Buffer URI size!\n')
        return
      }

      for (let uriIndex = 0; uriIndex < gltfResultDraco.bufferUris.size(); uriIndex++) {
        const uri = gltfResultDraco.bufferUris.get(uriIndex)

        // Create a memory view from the native vector
        const managedBuffer: Uint8Array =
          conwaywasm.wasmModule.
              getUint8Array(gltfResultDraco.buffers.get(uriIndex))

        try {
          fs.writeFileSync(uri, managedBuffer)
        } catch (err) {
          Logger.error(`Error writing to file: ${err}`)
        }
      }
    } else {
      Logger.error('Draco GLTF generation unsuccessful')
    }

    gltfResultDraco.bufferUris?.delete()
    gltfResultDraco.buffers?.delete()
  }

  const endTimeGltfDraco = Date.now()
  const executionTimeInMsGltfDraco = endTimeGltfDraco - startTimeGltfDraco

  // clean up
  aggregatedGeometry.geometry.delete()
  aggregatedGeometry.materials.delete()

  Logger.info(`There were ${aggregatedGeometry.chunks.length} geometry chunks`)
  Logger.info(`GLB Generation took ${executionTimeInMsGlb} milliseconds to execute.`)
  Logger.info(`GLTF Generation took ${executionTimeInMsGltf} milliseconds to execute.`)
  Logger.info(`GLB Draco Generation took ${executionTimeInMsGlbDraco} milliseconds to execute.`)
  Logger.info(`GLTF Draco Generation took ${executionTimeInMsGltfDraco} milliseconds to execute.`)
}

/**
 * Function to extract PropertySets from an IfcStepModel
 */
function propertyExtraction(model: IfcStepModel) {

  IfcPropertyExtraction.extractIFCProperties(model, true)
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

  // parse + extract data model + geometry data
  const startTime = Date.now()
  const [extractionResult, scene] =
    conwayModel.extractIFCGeometryData()
  const endTime = Date.now()
  const executionTimeInMs = endTime - startTime

  const statistics = Logger.getStatistics(0)
  statistics?.setGeometryTime(executionTimeInMs)


  // eslint-disable-next-line no-magic-numbers
  statistics?.setGeometryMemory(conwayModel.model.geometry.calculateGeometrySize() / (1024 * 1024))


  const ifcProjectName = conwayModel.getIfcProjectName()

  if (ifcProjectName !== null) {
    statistics?.setProjectName(ifcProjectName)
  }

  model.invalidate(true)

  if (extractionResult !== ExtractResult.COMPLETE) {
    console.error('Could not extract geometry, exiting...')
    return void 0
  }

  return [scene, conwaywasm]
}
