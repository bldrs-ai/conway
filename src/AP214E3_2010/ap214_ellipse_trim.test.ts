import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { advanced_face } from './AP214E3_2010_gen'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'


let extraction: AP214GeometryExtraction
let model: AP214StepModel

/**
 * Parse the fixture and set up geometry extraction.
 *
 * @return {Promise<boolean>} True if initialization succeeded.
 */
async function initialize(): Promise<boolean> {
  const parser = AP214StepParser.Instance
  const buffer: Buffer = fs.readFileSync('data/issue-45-trimmed-ellipse-face.step')
  const bufferInput = new ParsingBuffer(buffer)

  if (parser.parseHeader(bufferInput)[1] !== ParseResult.COMPLETE) {
    return false
  }

  const conwayGeometry = new ConwayGeometry()

  if (!(await conwayGeometry.initialize())) {
    return false
  }

  const [, parsedModel] = parser.parseDataToModel(bufferInput)

  if (parsedModel === void 0) {
    return false
  }

  model = parsedModel
  extraction = new AP214GeometryExtraction(conwayGeometry, model)

  return extraction.isInitialized()
}

describe('AP214 trimmed ellipse edge (bldrs-ai/test-models#45)', () => {

  beforeAll(async () => {
    expect(await initialize()).toBe(true)
  })

  // The fixture is a single planar face from the RX1 servo gearbox whose
  // outer bound has an edge on an ellipse with semi-axes 1441.06 x 25.15,
  // trimmed by cartesian vertices to a ~0.4 degree parametric arc spanning
  // z in [46, 52]. Trim angles computed as polar (rather than parametric)
  // angles walk the arc across the far side of the ellipse, dragging the
  // tessellation out to z ~ -265.
  test('tessellated face stays within the trimmed arc bounds', () => {

    const faces = Array.from(model.types(advanced_face))

    expect(faces.length).toBe(1)

    const face = faces[0]

    extraction.extractFaces([face], face.localID)

    const mesh = model.geometry.getByLocalID(face.localID)

    expect(mesh).toBeDefined()

    const geometry = mesh!.geometry
    const vertexCount = geometry.getVertexCount()

    expect(vertexCount).toBeGreaterThan(0)

    let minZ = Infinity
    let maxZ = -Infinity
    let maxAbs = 0

    for (let vertex = 0; vertex < vertexCount; ++vertex) {
      const point = geometry.getPoint(vertex)

      minZ = Math.min(minZ, point.z)
      maxZ = Math.max(maxZ, point.z)
      maxAbs = Math.max(maxAbs, Math.abs(point.x), Math.abs(point.y), Math.abs(point.z))
    }

    // Face geometry lives in z [46, 52], x/y within ~25 of the origin —
    // allow slack for tessellation, but nothing may run off toward the
    // ellipse's far side.
    const upperZ = 53
    const lowerZ = 45
    const maxExtent = 60

    expect(minZ).toBeGreaterThan(lowerZ)
    expect(maxZ).toBeLessThan(upperZ)
    expect(maxAbs).toBeLessThan(maxExtent)
  })
})
