import {
  ConwayGeometry,
  GeometryObject,
} from '../../index'
import { Vector3 } from '../../../dependencies/conway-geom'
import { CanonicalMaterial } from '../../index'
import { IfcSceneBuilder } from '../../ifc/ifc_scene_builder'
import IfcStepModel from '../../ifc/ifc_step_model'
import {
  FlatMesh,
  IfcGeometry,
  LoaderError,
  Loadersettings,
  PlacedGeometry,
  RawLineData,
  Vector,
} from './ifc_api'
import { IfcApiModelPassthrough } from './ifc_api_model_passthrough'
import { NodeValueHandle } from './properties_passthrough'
import * as glmatrix from 'gl-matrix'
import { IfcProperties } from './ifc_properties'
import Logger from '../../logging/logger'
import IfcStepParser from '../../ifc/ifc_step_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { ExtractResult } from '../../index'
import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import { ParseResult } from '../../index'
import Memory from '../../memory/memory'
import { FromRawLineData } from './ifc2x4_helper'
import { shimIfcEntityMap, shimIfcEntityReverseMap } from './shim_schema_mapping'
import { EntityTypesIfcCount } from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import { CanonicalMeshType } from '../../index'

/**
 * The proxy for IFC from the shim.
 */
export class IfcApiProxyIfc implements IfcApiModelPassthrough {

  fs?: any = undefined

  model:
    [IfcStepModel,
      IfcSceneBuilder,
      Map<number, [Vector<PlacedGeometry>, FlatMesh]>,
      Map<number, [GeometryObject, CanonicalMaterial, number[]]>,

      Vector<FlatMesh>, glmatrix.mat4]
  conwaywasm: ConwayGeometry
  _isCoordinated: boolean = false
  linearScalingFactor: number = 1
  identity: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

  // Initialize the matrix using an array
  NormalizeMat: glmatrix.mat4 = glmatrix.mat4.fromValues(
      1, 0, 0, 0,  // First column
      0, 0, -1, 0, // Second column
      0, 1, 0, 0,  // Third column
      0, 0, 0, 1,   // Fourth column
  )

  /**
   * Contains all the logic and methods regarding properties, psets, qsets, etc.
   */
  properties = new IfcProperties(this)

  /**
   * Construct wwih a wasm module.
   *
   * @param wasmModule The wasm module.
   */
  // eslint-disable-next-line require-jsdoc
  constructor(
      public readonly modelID: number,
      data: Uint8Array,
      private readonly wasmModule: any,
      private readonly settings?: Loadersettings ) {

    this.conwaywasm = new ConwayGeometry(wasmModule)

    const allTimeStart = Date.now()
    const parser = IfcStepParser.Instance
    const bufferInput = new ParsingBuffer(data)
    const [stepHeader, result0] = parser.parseHeader(bufferInput)

    Logger.createStatistics(modelID)

    const statistics = Logger.getStatistics(modelID)

    switch (result0) {
      case ParseResult.COMPLETE:

        break

      case ParseResult.INCOMPLETE:

        Logger.warning('Parse incomplete but no errors')
        statistics?.setLoadStatus('HEADER PARSE: INCOMPLETE')
        break

      case ParseResult.INVALID_STEP:

        Logger.error('Error: Invalid STEP detected in parse, but no syntax error detected')
        statistics?.setLoadStatus('HEADER PARSE: INVALID_STEP')
        break

      case ParseResult.MISSING_TYPE:

        Logger.warning('Error: missing STEP type, but no syntax error detected')
        statistics?.setLoadStatus('HEADER PARSE: MISSING_TYPE')
        break

      case ParseResult.SYNTAX_ERROR:

        Logger.error(`Error: Syntax error detected on line ${bufferInput.lineCount}`)
        statistics?.setLoadStatus('HEADER PARSE: SYNTAX_ERROR')
        break

      default:
    }

    const parseStartTime = Date.now()
    const model = parser.parseDataToModel(bufferInput)[1]
    const parseEndTime = Date.now()

    if (model === void 0) {
      Logger.error('[OpenModel]: model === undefined')
      statistics?.setLoadStatus('PARSE_FAIL')
      throw new Error( 'Failed to load model' )
    }

    statistics?.setParseTime(parseEndTime - parseStartTime)

    // TODO(nickcastel50): Doing geometry extraction in here for now...
    // parse + extract data model + geometry data
    const conwayGeometry = new IfcGeometryExtraction(this.conwaywasm, model)

    const startTime = Date.now()
    const [extractionResult, scene] =
      conwayGeometry.extractIFCGeometryData()

    const endTime = Date.now()
    const executionTimeInMs = endTime - startTime

    if (extractionResult !== ExtractResult.COMPLETE) {
      Logger.error('[OpenModel]: Error extracting geometry, exiting...')
      statistics?.setLoadStatus('FAIL')
      throw new Error( 'Couldn\'t extract model' )
    }

    // get linear scaling factor
    this.linearScalingFactor = conwayGeometry.getLinearScalingFactor()

    const ifcProjectName = conwayGeometry.getIfcProjectName()

    if (ifcProjectName !== null) {
      statistics?.setProjectName(ifcProjectName)
    }

    // build packed mesh model
    // const packedMeshModel = scene.buildPackedMeshModel()

    const vectorGeometryMap = new Map<number, [Vector<PlacedGeometry>, FlatMesh]>()

    const geometryMap = new Map<number, [GeometryObject, CanonicalMaterial, number[]]>()

    // dummy vars
    const dummyColor = {
      x: 0,
      y: 0,
      z: 0,
      w: 0,
    }

    // Single PlacedGeometry variable
    const singlePlacedGeometry: PlacedGeometry = {
      color: dummyColor,
      geometryExpressID: 0, // replace with actual ID
      flatTransformation: this.identity,
    }

    // eslint-disable-next-line no-array-constructor
    const placedGeometryArray = new Array<PlacedGeometry>()

    // Vector of PlacedGeometry
    const vectorOfPlacedGeometry: Vector<PlacedGeometry> = {
      get(index: number): PlacedGeometry {
        if (index >= placedGeometryArray.length) {
          return singlePlacedGeometry
        }

        return placedGeometryArray[index]
      },
      size(): number {
        return placedGeometryArray.length
      },
      push(parameter: PlacedGeometry): void {
        placedGeometryArray.push(parameter)
      },
    }

    // eslint-disable-next-line no-array-constructor
    const flatMeshArray = new Array<FlatMesh>()
    const flatMeshDummy: FlatMesh = {
      geometries: vectorOfPlacedGeometry,
      expressID: 0, // replace with actual expressID
    }

    // Vector of FlatMesh
    const vectorFlatMesh: Vector<FlatMesh> = {
      get(index: number): FlatMesh {
        if (index >= placedGeometryArray.length) {
          return flatMeshDummy
        }

        return flatMeshArray[index]
      },
      size(): number {
        // Your implementation here
        return flatMeshArray.length
      },
      push(parameter: FlatMesh): void {
        flatMeshArray.push(parameter)
      },
    }

    const coordinationMatrix: glmatrix.mat4 = glmatrix.mat4.create()

    this.model = [
      model,
      scene,
      vectorGeometryMap,
      geometryMap,
      vectorFlatMesh,
      coordinationMatrix,
    ]

    // save settings
    this.settings = settings

    let FILE_NAME = stepHeader.headers.get('FILE_NAME')

    if (FILE_NAME !== void 0) {
      // strip start / end parenthesis
      FILE_NAME = FILE_NAME.substring(1, FILE_NAME.length - 1)
    }

    const ifcVersion = stepHeader.headers.get('FILE_SCHEMA')

    const allTimeEnd = Date.now()

    const allTime = allTimeEnd - allTimeStart

    statistics?.setLoadStatus('OK')
    statistics?.setTotalTime(allTime)

    if (ifcVersion !== void 0) {
      statistics?.setVersion(ifcVersion)
    }

    if (FILE_NAME !== void 0) {
      const fileNameSplit: string[] = this.parseFileHeader(FILE_NAME)

      // eslint-disable-next-line no-magic-numbers
      if (fileNameSplit.length > 5) {
        const preprocessorVersion = fileNameSplit[5]
        const originatingSystem = fileNameSplit[6]

        statistics?.setPreprocessorVersion(preprocessorVersion)
        statistics?.setOriginatingSystem(originatingSystem)
      }
    }

    statistics?.setMemoryStatistics(Memory.checkMemoryUsage())

    statistics?.setGeometryTime(executionTimeInMs)
    // eslint-disable-next-line no-magic-numbers
    statistics?.setGeometryMemory(scene.model.geometry.calculateGeometrySize() / (1024 * 1024))
  }


  /**
   *
   * @param input - FILE_HEADER from step header
   * @return {string[]} array of fields in FILE_NAME
   */
  parseFileHeader(input: string): string[] {
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
   * Creates a new model and returns a modelID number (unimplemented)
   *
   * @param settings settings for generating data the model
   * @return {number} model ID
   */
  createModel(settings?: Loadersettings): number {

    Logger.warning('[CreateModel]: Shim - Unimplemented')
    return 0
  }

  /**
   *
   * @param modelID
   * @return {Uint8Array} unimplemented
   */
  exportFileAsIFC(modelID: number): Uint8Array {
    Logger.warning(`[ExportFileAsIFC]: Model ${modelID}: Shim - Unimplemented`)
    const emptyArray = new Uint8Array(1)
    return emptyArray
  }


  /**
   * Opens a model and returns a modelID number
   *
   * @param modelID handle retrieved by OpenModel, model must not be closed
   * @param geometryExpressID containing IFC data (bytes)
   * @return {IfcGeometry}
   */
  getGeometry(geometryExpressID: number): IfcGeometry {
    const result = this.model

    if (result !== void 0) {
      const geometryMap = result[3]

      const mapResult = geometryMap.get(geometryExpressID)

      if (mapResult !== undefined) {

        // eslint-disable-next-line no-unused-vars
        const [geometryObject, _] = mapResult
        if (geometryObject !== void 0) {
          const clone = geometryObject.clone()

          return clone
        } else {
          Logger.error(`[GetGeometry]: Geometry Object not found for expressID: 
          ${geometryExpressID}`)
        }
      }
    } else {
      Logger.error('[GetGeometry]: model === undefined')
    }

    Logger.error('[GetGeometry]: Error - returning dummyGeometry object')
    const dummyGeometry: IfcGeometry = (new (this.wasmModule.IfcGeometry)())
    return dummyGeometry
  }

  /**
   *
   * @param modelID
   * @param expressID
   * @param flatten
   * @return {any} line data
   */
  getLine(expressID: number, flatten: boolean = false) {


    const rawLineData = this.getRawLineData(expressID)

    if (rawLineData.type === -1) {
      Logger.warning(`RawLineData null, expressID: ${expressID}`)
      return
    }

    // Check if the type exists in FromRawLineData mapping
    const typeConverter = FromRawLineData[rawLineData.type]
    if (typeof typeConverter !== 'function') {
      Logger.warning(`No converter function for type ${rawLineData.type}, expressID: ${expressID}`)
      return rawLineData // Return raw data as fallback
    }

    const lineData = typeConverter(rawLineData)
    if (flatten) {

      this.flattenLine(lineData)
    }

    return lineData
  }

  /**
   * Light attribute read: Name / LongName / GlobalId as web-ifc value
   * handles, WITHOUT materialising the entity's full flattened record.
   * Reads go through the typed entity's lazy per-field getters — the
   * first access tokenizes the record's field offsets into the shared
   * vtable, but only these attributes' values are deserialized. Used by
   * the spatial structure's `'names'` mode.
   *
   * @param expressID
   * @return {object} `{ Name?, LongName?, GlobalId? }` string handles
   * (`{type: 1, value}`), each present only when the attribute exists
   * and is non-null on the entity.
   */
  getLineNameAttributes(expressID: number):
    { Name?: NodeValueHandle,
      LongName?: NodeValueHandle,
      GlobalId?: NodeValueHandle } {

    const result: {
      Name?: NodeValueHandle,
      LongName?: NodeValueHandle,
      GlobalId?: NodeValueHandle } = {}

    const entity = this.model[0].getElementByExpressID(expressID) as any

    if (entity === void 0) {
      return result
    }

    // web-ifc tape type 1 = string; ifclib's deref switches on this code.
    const WEB_IFC_STRING_TYPE = 1

    // Absent attributes (e.g. LongName on non-spatial types) read as
    // undefined and are omitted via the typeof check. The catch guards
    // malformed records: field extraction throws on truncated records
    // regardless of the model's nullOnErrors setting.
    for (const attribute of ['Name', 'LongName', 'GlobalId'] as const) {
      try {
        const value = entity[attribute]

        if (typeof value === 'string') {
          result[attribute] = { type: WEB_IFC_STRING_TYPE, value }
        }
      } catch (e) {
        Logger.warning(
            `[getLineNameAttributes]: unreadable ${attribute} for expressID: ${expressID}`)
      }
    }

    return result
  }

  /**
   * Drop this model's materialised entity/descriptor cache (and lazily
   * rebuilt vtable data), returning that memory to the JS heap. Entities
   * and attributes rematerialise transparently on next access, so this is
   * safe to call between UI interactions to keep the property working set
   * bounded to what the active UI has touched.
   */
  releaseEntityCache(): void {
    this.model[0].invalidate(true)
  }

  /**
   *
   * @param modelID
   * @return {Vector<LoaderError>}
   */
  getAndClearErrors(): Vector<LoaderError> {
    Logger.warning('[GetAndClearErrors]: Shim - Unimplemented')
    const wasmErrorsDummy: Vector<LoaderError> = {
      get(index: number): LoaderError {
        // Implementation here
        return { type: '', message: '', expressID: 0, ifcType: 0 }
      },
      size(): number {
        // Implementation here
        return 0
      },
      push(): void {
        // eslint-disable-next-line no-useless-return
        return
      },
    }

    return wasmErrorsDummy
  }

  /**
   *
   * @param modelID
   * @param lineObject
   */
  writeLine(lineObject: any) {
    Logger.warning('[WriteLine]: Shim - Unimplemented')
  }

  /**
   *
   * @param modelID
   * @param line
   */
  flattenLine(line: any): void {
    Logger.warning('[FlattenLine]: Shim - implemented')
    Object.keys(line).forEach((propertyName) => {
      const property = line[propertyName]
      // eslint-disable-next-line no-magic-numbers
      if (property && property.type === 5) {

        line[propertyName] = this.getLine(property.value, true)
        // eslint-disable-next-line no-magic-numbers
      } else if (Array.isArray(property) && property.length > 0 && property[0].type === 5) {
        for (let i = 0; i < property.length; i++) {

          line[propertyName][i] = this.getLine(property[i].value, true)
        }
      }
    })
  }

  /**
   *
   * @param modelID
   * @param expressID
   * @return {RawLineData}
   */
  getRawLineData(expressID: number): RawLineData {

    // eslint-disable-next-line no-unused-vars
    const [model, scene] = this.model

    const element = model.getElementByExpressID(expressID)

    const args: any[] = []

    if (element !== void 0) {
      const lineArguments = element.extractLineArguments()

      const parsingBuffer = new ParsingBuffer(lineArguments)
      if (element.expressID !== void 0) {
        const result_ = IfcStepParser.Instance.extractArguments(parsingBuffer, element.expressID)
        if (result_[1] === ParseResult.COMPLETE) {
          const rawLineData: RawLineData = {
            ID: expressID,
            type: shimIfcEntityReverseMap[element.type],
            arguments: result_[0],
          }

          return rawLineData
        }
      } else {
        Logger.warning('element express ID null')
      }

      const rawLineData: RawLineData = {
        ID: expressID,
        type: shimIfcEntityReverseMap[element.type],
        arguments: args,
      }

      return rawLineData
    } else {
      Logger.warning(`element === undefined, expressID: ${expressID}`)
    }

    const dummyRawLineData: RawLineData = {
      ID: expressID,
      type: -1,
      arguments: ['invalid'],
    }

    return dummyRawLineData
  }

  /**
   *
   * @param modelID
   * @param data
   */
  writeRawLineData(data: RawLineData) {
    Logger.warning('[WriteRawLineData]: Shim - Unimplemented')
  }

  /**
   *
   * @param modelID
   * @param type
   * @return {Vector<number>}
   */
  getLineIDsWithType(type: number): Vector<number> {
    const vectorArray: Array<number> = []
    const expressIDVector: Vector<number> = {
      get(index: number): number {
        // Your implementation here
        if (index >= vectorArray.length) {
          return -1
        }

        return vectorArray[index]
      },
      size(): number {
        // Your implementation here
        return vectorArray.length
      },

      push(parameter: number): void {
        vectorArray.push(parameter)
      },
    }

    // eslint-disable-next-line no-unused-vars
    const [model, _] = this.model
    if (type in shimIfcEntityMap) {
      const value = shimIfcEntityMap[type]
      // Do something with value
      const results = model.typeIDs(value)
      const arr = Array.from(results)

      for (let arrIndex = 0; arrIndex < arr.length; ++arrIndex) {

        if (arr[arrIndex].expressID !== void 0) {
          expressIDVector.push(arr[arrIndex].expressID!)
        } else {
          Logger.warning('[GetLineIDsWithType] No express ID found?')
        }
      }

    } else {
      // Handle case where key does not exist
      Logger.warning(`[GetLineIDsWithType] Type: ${type} does not exist in shimIfcEntityMap`)
    }
    return expressIDVector
  }

  /**
   *
   * @param modelID
   * @return {Vector<number>}
   */
  getAllLines(): Vector<number> {
    const vectorArray: Array<number> = []
    const expressIDVector: Vector<number> = {
      get(index: number): number {
        // Your implementation here
        if (index >= vectorArray.length) {
          return -1
        }

        return vectorArray[index]
      },
      size(): number {
        // Your implementation here
        return vectorArray.length
      },

      push(parameter: number): void {
        vectorArray.push(parameter)
      },
    }

    // eslint-disable-next-line no-unused-vars
    const [model, scene] = this.model
    // TODO(nickcastel50): This is absolutely horrid but I don't know a better way yet.
    // This implementation also kills our lazy loading...
    for (let typeIndex = 0; typeIndex < EntityTypesIfcCount; ++typeIndex) {
      const results = model.typeIDs(typeIndex)
      const arr = Array.from(results)

      for (let arrIndex = 0; arrIndex < arr.length; ++arrIndex) {

        if (arr[arrIndex].expressID !== void 0) {
          expressIDVector.push(arr[arrIndex].expressID!)
        } else {
          Logger.warning('[GetLineIDsWithType] No express ID found?')
        }
      }
    }

    return expressIDVector
  }

  /**
   *
   * @param modelID
   * @param transformationMatrix
   */
  setGeometryTransformation(transformationMatrix: Array<number>) {
    /* if (transformationMatrix.length != 16) {
            Logger.error(`Bad transformation matrix size: ${transformationMatrix.length}`)
            return
        }
        this.wasmModule.setGeometryTransformation(modelID, transformationMatrix)*/

    Logger.warning('[setGeometryTransformation]: Shim - Unimplemented')
  }

  /**
   *
   * @param modelID
   * @return {Array<number>}
   */
  getCoordinationMatrix(): Array<number> {
    // TODO: Add coordination matrix to models map

    /* eslint-disable no-unused-vars */
    const [model,
      scene,
      meshMap,
      geometryMaterialTransformMap,
      vectorFlatMesh, coordinationMatrix] = this.model
    /* eslint-enable no-unused-vars */

    return Array.from(coordinationMatrix)
  }

  /**
   *
   * @param ptr
   * @param size
   * @return {Float32Array}
   */
  getVertexArray(ptr: number, size: number): Float32Array {
    return this.getSubArray(this.wasmModule.HEAPF32, ptr, size) as Float32Array
  }

  /**
   *
   * @param ptr
   * @param size
   * @return {Uint32Array}
   */
  getIndexArray(ptr: number, size: number): Uint32Array {
    return this.getSubArray(this.wasmModule.HEAPU32, ptr, size) as Uint32Array
  }

  /**
   *
   * @param heap
   * @param startPtr
   * @param sizeBytes
   * @return {Float32Array | Uint32Array}
   */
  getSubArray(heap: Float32Array | Uint32Array, startPtr: number, sizeBytes: number):
    Float32Array | Uint32Array {
    // eslint-disable-next-line no-magic-numbers, no-mixed-operators
    return heap.subarray(startPtr / 4, startPtr / 4 + sizeBytes).slice(0)
  }

  /**
   * Closes a model and frees all related memory
   *
   * @param modelID Model handle retrieved by OpenModel, model must not be closed
   */
  closeModel() {
    // Null operation.
  }

  /**
   *
   * @param modelID
   * @param meshCallback
   */
  streamAllMeshes( meshCallback: (mesh: FlatMesh) => void) {

    const [model,
      scene,
      meshMap,
      geometryMaterialTransformMap,
      vectorFlatMesh] = this.model

    let coordinationMatrix = this.model[5]

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of scene.walk()) {

      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY && !geometry.temporary) {
        let material_: CanonicalMaterial | undefined
        if (material === void 0) {
          material_ = {
            name: '',
            // eslint-disable-next-line no-magic-numbers
            baseColor: [0.8, 0.8, 0.8, 1],
            // eslint-disable-next-line no-magic-numbers
            legacyColor: [0.8, 0.8, 0.8, 1],
            doubleSided: true,
            blend: 0,
          }
        } else {
          material_ = material
        }

        let nativePt:Vector3
        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          nativePt = geometry.geometry.getPoint(0)
        }

        // extract center
        const geomCenter: glmatrix.vec3 = glmatrix.vec3.create()
        const center = geometry.geometry.normalize()


        geomCenter[0] = center.x
        geomCenter[1] = center.y
        geomCenter[2] = center.z

        // Create a translation matrix from geom.min
        const translationMatrixGeomMin: glmatrix.mat4 = glmatrix.mat4.create()
        glmatrix.mat4.fromTranslation(translationMatrixGeomMin, geomCenter)

        // create PlacedGeometry
        const expressID = model.getElementByLocalID(geometry.localID)?.expressID as number

        const geometryTransform = nativeTransform?.getValues()
        let newMatrix: glmatrix.mat4 | undefined
        if (geometryTransform !== void 0) {
          newMatrix = glmatrix.mat4.fromValues(
              geometryTransform[0],
              geometryTransform[1],
              geometryTransform[2],
              geometryTransform[3],
              geometryTransform[4],
              geometryTransform[5],
              geometryTransform[6],
              geometryTransform[7],
              geometryTransform[8],
              geometryTransform[9],
              geometryTransform[10],
              geometryTransform[11],
              geometryTransform[12],
              geometryTransform[13],
              geometryTransform[14],
              geometryTransform[15],
          )
        } else {
          // set to identity if no transform found
          newMatrix = glmatrix.mat4.create()
        }

        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          // coordinate the geometry to the origin
          const pt: number[] = [nativePt!.x, nativePt!.y, nativePt!.z]

          // Transform the point by the matrix.
          const transformedPt: glmatrix.vec4 = glmatrix.vec4.create()
          glmatrix.vec4.transformMat4(transformedPt, [pt[0], pt[1], pt[2], 1], newMatrix!)

          // Create the translation matrix.
          coordinationMatrix = glmatrix.mat4.create()

          glmatrix.mat4.fromTranslation(coordinationMatrix,
              [-transformedPt[0], -transformedPt[1], -transformedPt[2]])

          const scaleMatrix = glmatrix.mat4.create()

          // Create a 3D vector for scaling factors
          const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
              this.linearScalingFactor,
              this.linearScalingFactor)

          // Scale the matrix
          glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

          glmatrix.mat4.multiply(coordinationMatrix,
              this.NormalizeMat,
              coordinationMatrix)
          glmatrix.mat4.multiply(coordinationMatrix,
              scaleMatrix,
              coordinationMatrix)

          this._isCoordinated = true
        }

        // extract color
        const newTransform = glmatrix.mat4.create()

        // Create a 4x4 identity matrix
        const scaleMatrix = glmatrix.mat4.create()

        // Create a 3D vector for scaling factors
        const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
            this.linearScalingFactor,
            this.linearScalingFactor)

        // Scale the matrix
        glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

        // Perform the matrix multiplications
        if (newMatrix !== void 0) {
          glmatrix.mat4.multiply(newTransform, coordinationMatrix, newMatrix)
          glmatrix.mat4.multiply(newTransform, newTransform, translationMatrixGeomMin)
        } else {
          glmatrix.mat4.multiply(newTransform, coordinationMatrix, newTransform)
          glmatrix.mat4.multiply(newTransform, newTransform, translationMatrixGeomMin)
        }
        const newTransformArr = Array.from(newTransform)
        geometryMaterialTransformMap.set(expressID,
            [geometry.geometry, material_!, newTransformArr])

        if (entity?.localID !== void 0) {
          if (entity?.expressID !== void 0) {
            const mesh = meshMap.get(entity.expressID)
            if (mesh !== void 0) {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              mesh[0].push(singlePlacedGeometry)
              mesh[1].geometries = mesh[0]

              meshMap.set(entity.expressID, [mesh[0], mesh[1]])


            } else {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry_: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              // eslint-disable-next-line no-array-constructor
              const placedGeometryArray_ = new Array<PlacedGeometry>()

              // Vector of PlacedGeometry
              const vectorOfPlacedGeometry_: Vector<PlacedGeometry> = {
                get(index: number): PlacedGeometry {
                  if (index >= placedGeometryArray_.length) {
                    return singlePlacedGeometry_
                  }

                  return placedGeometryArray_[index]
                },
                size(): number {
                  return placedGeometryArray_.length
                },
                push(parameter: PlacedGeometry): void {
                  placedGeometryArray_.push(parameter)
                },
              }

              vectorOfPlacedGeometry_.push(singlePlacedGeometry_)

              const singleFlatMesh: FlatMesh = {
                geometries: vectorOfPlacedGeometry_,
                expressID: entity.expressID,
              }

              meshMap.set(entity.expressID, [vectorOfPlacedGeometry_, singleFlatMesh])
            }
          }
        }
      }
    }

    meshMap.forEach((mesh, productLocalID) => {

      vectorFlatMesh.push(mesh[1])

      meshCallback(mesh[1])
    })
  }

  /**
   *
   * @param modelID
   * @param types
   * @param meshCallback
   */
  streamAllMeshesWithTypes(
      types: Array<number>,
      meshCallback: (mesh: FlatMesh) => void) {
    const [model,
      scene,
      meshMap,
      geometryMaterialTransformMap,
      vectorFlatMesh] = this.model

    let coordinationMatrix = this.model[5]

    const conwayTypesArray: number[] = []
    types.forEach((type) => {
      const value = shimIfcEntityMap[type]
      // Do something with value
      conwayTypesArray.push(value)
    })

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of scene.walk()) {

      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY && !geometry.temporary) {

        let material_: CanonicalMaterial | undefined
        if (material === void 0) {
          material_ = {
            name: '',
            // eslint-disable-next-line no-magic-numbers
            baseColor: [0.8, 0.8, 0.8, 1],
            // eslint-disable-next-line no-magic-numbers
            legacyColor: [0.8, 0.8, 0.8, 1],
            doubleSided: true,
            blend: 0,
          }
        } else {
          material_ = material
        }

        // type check
        const typedElement = model.getElementByLocalID(geometry.localID)

        if (typedElement !== void 0) {
          if (conwayTypesArray.indexOf(typedElement.type.valueOf()) === -1) {
            continue
          }
        }

        let nativePt:Vector3
        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          nativePt = geometry.geometry.getPoint(0)
        }

        // extract center
        const geomCenter: glmatrix.vec3 = glmatrix.vec3.create()
        const center = geometry.geometry.normalize()


        geomCenter[0] = center.x
        geomCenter[1] = center.y
        geomCenter[2] = center.z

        // Create a translation matrix from geom.min
        const translationMatrixGeomMin: glmatrix.mat4 = glmatrix.mat4.create()
        glmatrix.mat4.fromTranslation(translationMatrixGeomMin, geomCenter)

        // create PlacedGeometry
        const expressID = model.getElementByLocalID(geometry.localID)?.expressID as number

        const geometryTransform = nativeTransform?.getValues()
        let newMatrix: glmatrix.mat4 | undefined
        if (geometryTransform !== void 0) {
          newMatrix = glmatrix.mat4.fromValues(
              geometryTransform[0],
              geometryTransform[1],
              geometryTransform[2],
              geometryTransform[3],
              geometryTransform[4],
              geometryTransform[5],
              geometryTransform[6],
              geometryTransform[7],
              geometryTransform[8],
              geometryTransform[9],
              geometryTransform[10],
              geometryTransform[11],
              geometryTransform[12],
              geometryTransform[13],
              geometryTransform[14],
              geometryTransform[15],
          )
        }

        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          // coordinate the geometry to the origin
          // Assuming geom.GetPoint(0) returns a glm::dvec3, i.e., a 3D vector.
          // In TypeScript, you can represent it as number[] or Float64Array.
          Logger.info('Setting up coordinationMatrix')


          // const nativePt = geometry.geometry.GetPoint(0)
          const pt: number[] = [nativePt!.x, nativePt!.y, nativePt!.z]

          // Transform the point by the matrix.
          const transformedPt: glmatrix.vec4 = glmatrix.vec4.create()
          glmatrix.vec4.transformMat4(transformedPt, [pt[0], pt[1], pt[2], 1], newMatrix!)

          // Create the translation matrix.
          coordinationMatrix = glmatrix.mat4.create()

          glmatrix.mat4.fromTranslation(coordinationMatrix,
              [-transformedPt[0], -transformedPt[1], -transformedPt[2]])

          const scaleMatrix = glmatrix.mat4.create()

          // Create a 3D vector for scaling factors
          const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
              this.linearScalingFactor,
              this.linearScalingFactor)

          // Scale the matrix
          glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

          glmatrix.mat4.multiply(coordinationMatrix,
              this.NormalizeMat,
              coordinationMatrix)
          glmatrix.mat4.multiply(coordinationMatrix,
              scaleMatrix,
              coordinationMatrix)

          this._isCoordinated = true
        }

        // extract color
        const newTransform = glmatrix.mat4.create()

        // Create a 4x4 identity matrix
        const scaleMatrix = glmatrix.mat4.create()

        // Create a 3D vector for scaling factors
        const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
            this.linearScalingFactor,
            this.linearScalingFactor)

        // Scale the matrix
        glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

        // Perform the matrix multiplications
        if (newMatrix !== void 0) {
          glmatrix.mat4.multiply(newTransform, coordinationMatrix, newMatrix)
          glmatrix.mat4.multiply(newTransform, newTransform, translationMatrixGeomMin)
        } else {
          glmatrix.mat4.multiply(newTransform, coordinationMatrix, newTransform)
          glmatrix.mat4.multiply(newTransform, newTransform, translationMatrixGeomMin)
        }
        const newTransformArr = Array.from(newTransform)
        geometryMaterialTransformMap.set(expressID,
            [geometry.geometry, material_!, newTransformArr])

        if (entity?.localID !== void 0) {
          if (entity?.expressID !== void 0) {
            const mesh = meshMap.get(entity.expressID)
            if (mesh !== void 0) {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              mesh[0].push(singlePlacedGeometry)
              mesh[1].geometries = mesh[0]

              meshMap.set(entity.expressID, [mesh[0], mesh[1]])


            } else {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry_: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              // eslint-disable-next-line no-array-constructor
              const placedGeometryArray_ = new Array<PlacedGeometry>()

              // Vector of PlacedGeometry
              const vectorOfPlacedGeometry_: Vector<PlacedGeometry> = {
                get(index: number): PlacedGeometry {
                  if (index >= placedGeometryArray_.length) {
                    return singlePlacedGeometry_
                  }

                  return placedGeometryArray_[index]
                },
                size(): number {
                  return placedGeometryArray_.length
                },
                push(parameter: PlacedGeometry): void {
                  placedGeometryArray_.push(parameter)
                },
              }

              vectorOfPlacedGeometry_.push(singlePlacedGeometry_)

              const singleFlatMesh: FlatMesh = {
                geometries: vectorOfPlacedGeometry_,
                expressID: entity.expressID,
              }

              meshMap.set(entity.expressID, [vectorOfPlacedGeometry_, singleFlatMesh])
            }
          }
        }
      }


      meshMap.forEach((mesh, productLocalID) => {

        vectorFlatMesh.push(mesh[1])

        meshCallback(mesh[1])
      })
    }
  }

  /**
   * Load all geometry in a model
   *
   * @return {Vector<FlatMesh>}
   */
  loadAllGeometry(): Vector<FlatMesh> {
    const [model,
      scene,
      meshMap,
      geometryMaterialTransformMap,
      vectorFlatMesh] = this.model

    let coordinationMatrix = this.model[5]

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of scene.walk()) {

      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY && !geometry.temporary) {
        let material_: CanonicalMaterial | undefined
        if (material === void 0) {
          material_ = {
            name: '',
            // eslint-disable-next-line no-magic-numbers
            baseColor: [0.8, 0.8, 0.8, 1],
            // eslint-disable-next-line no-magic-numbers
            legacyColor: [0.8, 0.8, 0.8, 1],
            doubleSided: true,
            blend: 0,
          }
        } else {
          material_ = material
        }

        let nativePt:Vector3
        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          nativePt = geometry.geometry.getPoint(0)
        }

        // extract center
        const geomCenter: glmatrix.vec3 = glmatrix.vec3.create()
        const center = geometry.geometry.normalize()


        geomCenter[0] = center.x
        geomCenter[1] = center.y
        geomCenter[2] = center.z

        // Create a translation matrix from geom.min
        const translationMatrixGeomMin: glmatrix.mat4 = glmatrix.mat4.create()
        glmatrix.mat4.fromTranslation(translationMatrixGeomMin, geomCenter)

        // create PlacedGeometry
        const expressID = model.getElementByLocalID(geometry.localID)?.expressID as number

        const geometryTransform = nativeTransform?.getValues()
        let newMatrix: glmatrix.mat4 | undefined
        if (geometryTransform !== void 0) {
          newMatrix = glmatrix.mat4.fromValues(
              geometryTransform[0],
              geometryTransform[1],
              geometryTransform[2],
              geometryTransform[3],
              geometryTransform[4],
              geometryTransform[5],
              geometryTransform[6],
              geometryTransform[7],
              geometryTransform[8],
              geometryTransform[9],
              geometryTransform[10],
              geometryTransform[11],
              geometryTransform[12],
              geometryTransform[13],
              geometryTransform[14],
              geometryTransform[15],
          )
        }

        if (!this._isCoordinated && this.settings?.COORDINATE_TO_ORIGIN) {
          // coordinate the geometry to the origin
          // Assuming geom.GetPoint(0) returns a glm::dvec3, i.e., a 3D vector.
          // In TypeScript, you can represent it as number[] or Float64Array.
          Logger.info('Setting up coordinationMatrix')


          const pt: number[] = [nativePt!.x, nativePt!.y, nativePt!.z]

          // Transform the point by the matrix.
          const transformedPt: glmatrix.vec4 = glmatrix.vec4.create()
          glmatrix.vec4.transformMat4(transformedPt, [pt[0], pt[1], pt[2], 1], newMatrix!)

          // Create the translation matrix.
          coordinationMatrix = glmatrix.mat4.create()

          glmatrix.mat4.fromTranslation(coordinationMatrix,
              [-transformedPt[0], -transformedPt[1], -transformedPt[2]])

          const scaleMatrix = glmatrix.mat4.create()

          // Create a 3D vector for scaling factors
          const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
              this.linearScalingFactor,
              this.linearScalingFactor)

          // Scale the matrix
          glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

          glmatrix.mat4.multiply(coordinationMatrix,
              this.NormalizeMat,
              coordinationMatrix)
          glmatrix.mat4.multiply(coordinationMatrix,
              scaleMatrix,
              coordinationMatrix)

          this._isCoordinated = true
        }


        // extract color
        const newTransform = glmatrix.mat4.create()

        // Create a 4x4 identity matrix
        const scaleMatrix = glmatrix.mat4.create()

        // Create a 3D vector for scaling factors
        const scaleVec = glmatrix.vec3.fromValues(this.linearScalingFactor,
            this.linearScalingFactor,
            this.linearScalingFactor)

        // Scale the matrix
        glmatrix.mat4.scale(scaleMatrix, scaleMatrix, scaleVec)

        // Perform the matrix multiplications
        if (newMatrix !== void 0) {
          glmatrix.mat4.multiply(newTransform, coordinationMatrix, newMatrix)
          glmatrix.mat4.multiply(newTransform, newTransform, translationMatrixGeomMin)
        } else {
          glmatrix.mat4.multiply(newTransform, coordinationMatrix, newTransform)
          glmatrix.mat4.multiply(newTransform, newTransform, translationMatrixGeomMin)
        }
        const newTransformArr = Array.from(newTransform)
        geometryMaterialTransformMap.set(expressID,
            [geometry.geometry, material_!, newTransformArr])

        if (entity?.localID !== void 0) {
          if (entity?.expressID !== void 0) {
            const mesh = meshMap.get(entity.expressID)
            if (mesh !== void 0) {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              mesh[0].push(singlePlacedGeometry)
              mesh[1].geometries = mesh[0]

              meshMap.set(entity.expressID, [mesh[0], mesh[1]])


            } else {
              // set color
              const color = {
                x: material_!.legacyColor[0],
                y: material_!.legacyColor[1],
                z: material_!.legacyColor[2],
                w: material_!.legacyColor[3],
              }

              // Single PlacedGeometry variable
              const singlePlacedGeometry_: PlacedGeometry = {
                color: color,
                geometryExpressID: expressID,
                flatTransformation: newTransformArr,
              }

              // eslint-disable-next-line no-array-constructor
              const placedGeometryArray_ = new Array<PlacedGeometry>()

              // Vector of PlacedGeometry
              const vectorOfPlacedGeometry_: Vector<PlacedGeometry> = {
                get(index: number): PlacedGeometry {
                  if (index >= placedGeometryArray_.length) {
                    return singlePlacedGeometry_
                  }

                  return placedGeometryArray_[index]
                },
                size(): number {
                  return placedGeometryArray_.length
                },
                push(parameter: PlacedGeometry): void {
                  placedGeometryArray_.push(parameter)
                },
              }

              vectorOfPlacedGeometry_.push(singlePlacedGeometry_)

              const singleFlatMesh: FlatMesh = {
                geometries: vectorOfPlacedGeometry_,
                expressID: entity.expressID,
              }

              meshMap.set(entity.expressID, [vectorOfPlacedGeometry_, singleFlatMesh])
            }
          }
        }
      }

      meshMap.forEach((mesh, productLocalID) => {

        vectorFlatMesh.push(mesh[1])
      })

      return vectorFlatMesh
    }

    // dummy vars
    const dummyColor = {
      x: 0,
      y: 0,
      z: 0,
      w: 0,
    }

    // Single PlacedGeometry variable
    const singlePlacedGeometry: PlacedGeometry = {
      color: dummyColor,
      geometryExpressID: 0, // replace with actual ID
      flatTransformation: this.identity,
    }

    // eslint-disable-next-line no-array-constructor
    const placedGeometryArray = new Array<PlacedGeometry>()

    // Vector of PlacedGeometry
    const vectorOfPlacedGeometry: Vector<PlacedGeometry> = {
      get(index: number): PlacedGeometry {
        if (index >= placedGeometryArray.length) {
          return singlePlacedGeometry
        }

        return placedGeometryArray[index]
      },
      size(): number {
        return placedGeometryArray.length
      },
      push(parameter: PlacedGeometry): void {
        placedGeometryArray.push(parameter)
      },
    }

    // eslint-disable-next-line no-array-constructor
    const flatMeshArray = new Array<FlatMesh>()
    const flatMeshDummy: FlatMesh = {
      geometries: vectorOfPlacedGeometry,
      expressID: 0, // replace with actual expressID
    }

    // Vector of FlatMesh
    const vectorOfFlatMesh: Vector<FlatMesh> = {
      get(index: number): FlatMesh {
        if (index >= placedGeometryArray.length) {
          return flatMeshDummy
        }

        return flatMeshArray[index]
      },
      size(): number {
        // Your implementation here
        return flatMeshArray.length
      },
      push(parameter: FlatMesh): void {
        flatMeshArray.push(parameter)
      },
    }
    return vectorOfFlatMesh
  }

  /**
   * Load geometry for a single element
   *
   * @param expressID express ID of flat mesh
   * @return {FlatMesh}
   */
  getFlatMesh(expressID: number): FlatMesh {

    // eslint-disable-next-line no-unused-vars
    const [model, scene, meshMap] = this.model

    if (meshMap.size <= 0) {

      this.loadAllGeometry()
    }

    const mesh = meshMap.get(expressID)

    if (mesh !== void 0) {
      return mesh[1]
    }

    // Single PlacedGeometry variable
    const dummyColor = {
      x: 0,
      y: 0,
      z: 0,
      w: 0,
    }
    const singlePlacedGeometry: PlacedGeometry = {
      color: dummyColor,
      geometryExpressID: 0, // replace with actual ID
      flatTransformation: [/* your array of numbers here */],
    }

    // Vector of PlacedGeometry
    const vectorOfPlacedGeometry: Vector<PlacedGeometry> = {
      get(index: number): PlacedGeometry {
        // Your implementation here
        return singlePlacedGeometry // Dummy return, replace with actual implementation
      },
      size(): number {
        // Your implementation here
        return 1 // Dummy return, replace with actual implementation
      },
      push(): void {
        // eslint-disable-next-line no-useless-return
        return
      },
    }

    const flatMeshDummy: FlatMesh = {
      geometries: vectorOfPlacedGeometry,
      expressID: 0, // replace with actual expressID
    }

    return flatMeshDummy
  }

  /**
   * Creates a map between element ExpressIDs and GlobalIDs.
   * Each element has two entries, (ExpressID -> GlobalID) and (GlobalID -> ExpressID).
   *
   * @param modelID handle retrieved by OpenModel
   */
  createGuidToExpressIdMapping(): void {
    /* const map = new Map<string | number, string | number>()

        for (let x = 0; x < IfcElements.length; x++) {

            const type = IfcElements[x]
            const lines = this.GetLineIDsWithType(modelID, type)
            const size = lines.size()

            for (let y = 0; y < size; y++) {

                const expressID = lines.get(y)
                const info = this.GetLine(modelID, expressID)
                const globalID = info.GlobalId.value

                map.set(expressID, globalID)
                map.set(globalID, expressID)
            }
        }

        this.ifcGuidMap.push(modelID, map)*/

    Logger.warning(`[CreateIfcGuidToExpressIdMapping]: Model ${this.modelID}: Shim - Unimplemented`)
  }
}
