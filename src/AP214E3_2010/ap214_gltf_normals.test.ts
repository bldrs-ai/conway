import fs from 'fs'
import nodePath from 'path'
import nodeUrl from 'url'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { ExtractResult } from '../core/shared_constants'
import GeometryAggregator from '../core/geometry_aggregator'
import GeometryConvertor from '../core/geometry_convertor'

/* eslint-disable no-magic-numbers -- GLB header field offsets and glTF
   component-type constants are clearer as the literals the spec names. */

/**
 * The GLB writer used to emit POSITION only, on every primitive. glTF says a
 * primitive without NORMAL is to be flat-shaded, and three.js implements that
 * literally (GLTFLoader sets `material.flatShading = true`), so every conway
 * GLB rendered fully faceted in every glTF consumer — and denser, more correct
 * tessellation made it look WORSE, because the facets got smaller and the
 * shading noise got higher frequency. See
 * https://github.com/bldrs-ai/conway/issues/667.
 *
 * These tests pin the two halves of that fix: NORMAL is present on every
 * primitive, and indices narrow to unsigned short when the primitive's vertex
 * count allows it (which pays for most of the normals' bytes).
 */
const FIXTURE = 'data/create-a-tube.step'

/** glTF accessor componentType for unsigned short. */
const COMPONENT_UNSIGNED_SHORT = 5123

/** glTF accessor componentType for float. */
const COMPONENT_FLOAT = 5126

/** glTF accessor componentType for unsigned int. */
const COMPONENT_UNSIGNED_INT = 5125

/**
 * Where three ships the reference Draco decoder. Used to decode the compressed
 * output rather than trust its manifest — the manifest cannot tell you whether
 * the encoded POSITIONs are in the same frame as the uncompressed ones, and
 * that is exactly where a double-applied position bias hides.
 */
const DRACO_DIR = 'node_modules/three/examples/jsm/libs/draco/'

type Manifest = {
  meshes: {
    primitives: {
      attributes: Record<string, number>,
      indices: number,
      extensions?: {
        KHR_draco_mesh_compression?: {
          bufferView: number,
          attributes: Record<string, number>,
        },
      },
    }[],
  }[],
  accessors: {
    componentType: number,
    count: number,
    type: string,
    min?: number[],
    max?: number[],
  }[],
  bufferViews: {byteOffset?: number, byteLength: number}[],
  nodes?: {translation?: number[]}[],
  extensionsRequired?: string[],
}

let manifest: Manifest

/**
 * The same model written with KHR_draco_mesh_compression. The compressed
 * branch of the writer builds its own draco mesh and its own accessors, so
 * "NORMAL is emitted" has to be pinned there separately — it shipped
 * POSITION-only after the uncompressed branch was fixed.
 */
let dracoManifest: Manifest

/** The compressed GLB itself, kept so its Draco buffer can be decoded. */
let dracoGlb: Uint8Array


/**
 * Pull the JSON chunk out of a GLB container.
 *
 * @param glb The whole GLB file.
 * @return The parsed glTF manifest.
 */
function parseGlbManifest(glb: Uint8Array): Manifest {

  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength)

  expect(String.fromCharCode(...glb.subarray(0, 4))).toBe('glTF')

  // 12-byte header, then length-prefixed chunks; the first is always JSON.
  const jsonLength = view.getUint32(12, true)
  const json = new TextDecoder().decode(glb.subarray(20, 20 + jsonLength))

  return JSON.parse(json)
}


/**
 * The BIN chunk of a GLB, which is where a Draco-compressed primitive's
 * encoded buffer lives.
 *
 * @param glb The whole GLB file.
 * @return The binary chunk.
 */
function glbBinaryChunk(glb: Uint8Array): Uint8Array {

  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength)
  const jsonLength = view.getUint32(12, true)

  // 12-byte header, then each chunk is an 8-byte (length, type) header.
  return glb.subarray(20 + jsonLength + 8)
}


/**
 * Decode one Draco-compressed primitive's POSITION attribute.
 *
 * @param glb The compressed GLB.
 * @param manifestIn Its already-parsed manifest.
 * @param primitiveIndex Which primitive, in mesh-flattened order.
 * @return One [x, y, z] per decoded point.
 */
async function decodeDracoPositions(
    glb: Uint8Array,
    manifestIn: Manifest,
    primitiveIndex: number): Promise<number[][]> {

  // three's decoder is an emscripten UMD bundle living inside a package marked
  // "type": "module", so require() reads it as ESM and hands back nothing.
  // Evaluating it in a CommonJS-shaped wrapper is what makes it loadable here.
  const source = fs.readFileSync(`${DRACO_DIR}draco_decoder.js`, 'utf8')
  const shim: {exports: unknown} = {exports: {}}

  // The bundle asks for a couple of node builtins at load time. This module is
  // ESM, so there is no ambient `require` to hand it — these three are all it
  // wants, and the wasm comes in as a binary below rather than being read from
  // disk by the bundle itself.
  const shimRequire = (name: string): unknown => {

    switch (name) {
      case 'fs': return fs
      case 'path': return nodePath
      case 'url': return nodeUrl
      default: throw new Error(`draco decoder asked for an unexpected module: ${name}`)
    }
  }

  // eslint-disable-next-line no-new-func -- see above; the input is a checked-in
  // vendored file, not anything user-supplied.
  new Function('module', 'exports', '__filename', '__dirname', 'require', source)(
      shim, shim.exports, `${DRACO_DIR}draco_decoder.js`, DRACO_DIR, shimRequire)

  const factory = shim.exports as (options: object) => void

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- emscripten module
  const draco: any = await new Promise((resolve) => {
    factory({
      wasmBinary: fs.readFileSync(`${DRACO_DIR}draco_decoder.wasm`),
      onModuleLoaded: (loaded: unknown) => resolve(loaded),
    })
  })

  const primitive = manifestIn.meshes.flatMap((mesh) => mesh.primitives)[primitiveIndex]
  const extension = primitive.extensions!.KHR_draco_mesh_compression!
  const bufferView = manifestIn.bufferViews[extension.bufferView]
  const binary = glbBinaryChunk(glb)
  const offset = bufferView.byteOffset ?? 0
  const encoded = binary.subarray(offset, offset + bufferView.byteLength)

  const buffer = new draco.DecoderBuffer()

  buffer.Init(new Int8Array(encoded), encoded.length)

  const decoder = new draco.Decoder()
  const mesh = new draco.Mesh()

  expect(decoder.DecodeBufferToMesh(buffer, mesh).ok()).toBe(true)

  const attribute = decoder.GetAttributeByUniqueId(mesh, extension.attributes.POSITION)
  const values = new draco.DracoFloat32Array()

  decoder.GetAttributeFloatForAllPoints(mesh, attribute, values)

  const points: number[][] = []

  for (let point = 0; point < mesh.num_points(); ++point) {
    points.push([
      values.GetValue(point * 3),
      values.GetValue(point * 3 + 1),
      values.GetValue(point * 3 + 2)])
  }

  return points
}


beforeAll(async () => {

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer(fs.readFileSync(FIXTURE))

  expect(parser.parseHeader(buffer)[1]).toBe(ParseResult.COMPLETE)

  const [, model] = parser.parseDataToModel(buffer)

  expect(model).not.toBe(void 0)

  const conwayGeometry = new ConwayGeometry()

  expect(await conwayGeometry.initialize()).toBe(true)

  const [result, scene] =
    new AP214GeometryExtraction(conwayGeometry, model!).extractAP214GeometryData()

  expect(result).toBe(ExtractResult.COMPLETE)

  const aggregator = new GeometryAggregator(conwayGeometry, {maxGeometrySize: 128})

  aggregator.append(scene)

  const aggregated = aggregator.aggregateNative()

  expect(aggregated.geometry.size()).toBeGreaterThan(0)

  const convertor = new GeometryConvertor(conwayGeometry)

  /**
   * Write the aggregated geometry out as a GLB and parse its manifest.
   *
   * @param outputDraco Whether to take the KHR_draco_mesh_compression branch.
   * @return The parsed glTF manifest.
   */
  function writeManifest(outputDraco: boolean): {manifest: Manifest, glb: Uint8Array} {

    const chunks =
      Array.from(convertor.toGltfs(
          aggregated, true, outputDraco, 'conway-667-normals-test'))

    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].success).toBe(true)

    const buffers = chunks[0].buffers!

    expect(buffers.size()).toBeGreaterThan(0)

    // The native vector is not a typed array; getUint8Array makes a zero-copy
    // view of it, the same way the CLI does before writing the file.
    const glb: Uint8Array =
      (conwayGeometry as unknown as {
        wasmModule: { getUint8Array(buffer: unknown): Uint8Array }
      }).wasmModule.getUint8Array(buffers.get(0))

    return {manifest: parseGlbManifest(glb), glb: glb.slice()}
  }

  const plain = writeManifest(false)
  const compressed = writeManifest(true)

  manifest = plain.manifest
  dracoManifest = compressed.manifest
  dracoGlb = compressed.glb
})


describe('AP214 GLB attributes', () => {

  test('every primitive carries a NORMAL accessor', () => {

    const primitives = manifest.meshes.flatMap((mesh) => mesh.primitives)

    expect(primitives.length).toBeGreaterThan(0)

    for (const primitive of primitives) {

      expect(primitive.attributes.POSITION).not.toBe(void 0)
      expect(primitive.attributes.NORMAL).not.toBe(void 0)

      const position = manifest.accessors[primitive.attributes.POSITION]
      const normal = manifest.accessors[primitive.attributes.NORMAL]

      // Same count as POSITION, or the attributes do not line up per vertex.
      expect(normal.count).toBe(position.count)
      expect(normal.type).toBe('VEC3')
      expect(normal.componentType).toBe(COMPONENT_FLOAT)
    }
  })

  test('indices narrow to unsigned short when the vertex count allows', () => {

    const primitives = manifest.meshes.flatMap((mesh) => mesh.primitives)

    for (const primitive of primitives) {

      const position = manifest.accessors[primitive.attributes.POSITION]
      const indices = manifest.accessors[primitive.indices]

      // The rule, not the fixture's own size: a primitive within the unsigned
      // short range must use it, and one beyond it must not. The bound is
      // 65535 vertices rather than 65536 so index 65535 is never emitted —
      // that value is primitive-restart on some drivers.
      expect(indices.componentType).toBe(
          position.count <= 65535 ? COMPONENT_UNSIGNED_SHORT : COMPONENT_UNSIGNED_INT)
    }
  })
})


describe('AP214 GLB attributes, draco-compressed', () => {

  test('the compressed branch is actually taken', () => {

    expect(dracoManifest.extensionsRequired)
        .toContain('KHR_draco_mesh_compression')

    const primitives = dracoManifest.meshes.flatMap((mesh) => mesh.primitives)

    expect(primitives.length).toBeGreaterThan(0)

    for (const primitive of primitives) {

      expect(primitive.extensions?.KHR_draco_mesh_compression)
          .not.toBe(void 0)
    }
  })

  test('every compressed primitive carries a NORMAL, in both places', () => {

    const primitives = dracoManifest.meshes.flatMap((mesh) => mesh.primitives)

    for (const primitive of primitives) {

      // Two declarations, and a decoder needs both: the primitive attribute
      // names the accessor that describes the decompressed data, and the
      // extension's own attribute map says which draco attribute id supplies
      // it. Only POSITION was declared in either before this was fixed.
      expect(primitive.attributes.NORMAL).not.toBe(void 0)

      const dracoAttributes =
        primitive.extensions!.KHR_draco_mesh_compression!.attributes

      expect(dracoAttributes.POSITION).not.toBe(void 0)
      expect(dracoAttributes.NORMAL).not.toBe(void 0)
      expect(dracoAttributes.NORMAL).not.toBe(dracoAttributes.POSITION)

      const position = dracoManifest.accessors[primitive.attributes.POSITION]
      const normal = dracoManifest.accessors[primitive.attributes.NORMAL]

      expect(normal.count).toBe(position.count)
      expect(normal.type).toBe('VEC3')
      expect(normal.componentType).toBe(COMPONENT_FLOAT)
    }
  })
})

describe('AP214 GLB positions, compressed against uncompressed', () => {

  test('the two writers place the geometry in the same frame', () => {

    // Both branches share one `positions` array that is rebased by the chunk's
    // first placed point, and the node translation adds that offset back once.
    // The Draco encoder used to subtract it a SECOND time, which displaced the
    // whole compressed primitive by -bias while its accessor bounds described
    // the shifted frame — self-consistent, and wrong against every uncompressed
    // file. Comparing declared bounds catches exactly that.
    const plainPrimitives = manifest.meshes.flatMap((mesh) => mesh.primitives)
    const dracoPrimitives = dracoManifest.meshes.flatMap((mesh) => mesh.primitives)

    expect(dracoPrimitives.length).toBe(plainPrimitives.length)

    const plainBounds = manifest.accessors[plainPrimitives[0].attributes.POSITION]
    const dracoBounds = dracoManifest.accessors[dracoPrimitives[0].attributes.POSITION]

    expect(dracoBounds.min).not.toBe(void 0)

    for (let axis = 0; axis < 3; ++axis) {
      expect(dracoBounds.min![axis]).toBeCloseTo(plainBounds.min![axis], 3)
      expect(dracoBounds.max![axis]).toBeCloseTo(plainBounds.max![axis], 3)
    }

    // And the node offsets agree, so the bounds above are compared in the
    // same world frame rather than two frames that happen to match.
    const plainTranslation = manifest.nodes?.[0]?.translation ?? [0, 0, 0]
    const dracoTranslation = dracoManifest.nodes?.[0]?.translation ?? [0, 0, 0]

    for (let axis = 0; axis < 3; ++axis) {
      expect(dracoTranslation[axis]).toBeCloseTo(plainTranslation[axis], 3)
    }
  })

  test('the decoded positions sit exactly where the accessor says', async () => {

    // The manifest test above compares two declarations. This one decodes what
    // was actually encoded, which is the only way to catch a shift that the
    // bounds were adjusted to match — and the double-applied bias was exactly
    // that: encoder and bounds agreed with each other and with nothing else.
    const points = await decodeDracoPositions(dracoGlb, dracoManifest, 0)

    expect(points.length).toBeGreaterThan(0)

    const primitive = dracoManifest.meshes.flatMap((mesh) => mesh.primitives)[0]
    const bounds = dracoManifest.accessors[primitive.attributes.POSITION]

    const decodedMin = [Infinity, Infinity, Infinity]
    const decodedMax = [-Infinity, -Infinity, -Infinity]

    for (const point of points) {
      for (let axis = 0; axis < 3; ++axis) {
        decodedMin[axis] = Math.min(decodedMin[axis], point[axis])
        decodedMax[axis] = Math.max(decodedMax[axis], point[axis])
      }
    }

    // Draco quantizes POSITION to 14 bits over the attribute's range, so a
    // decoded extreme can miss the declared one by a step. Anything larger is
    // a frame error, not rounding.
    const span = Math.max(
        ...[0, 1, 2].map((axis) => bounds.max![axis] - bounds.min![axis]))
    const tolerance = (span / 16384) + 1e-6

    for (let axis = 0; axis < 3; ++axis) {
      expect(Math.abs(decodedMin[axis] - bounds.min![axis])).toBeLessThan(tolerance)
      expect(Math.abs(decodedMax[axis] - bounds.max![axis])).toBeLessThan(tolerance)
    }

    // What makes the check above able to fail: the chunk IS rebased, so a
    // second subtraction has something to shift by. If a future fixture is
    // authored exactly on the origin this asserts loudly rather than passing
    // vacuously — the bias must also be big enough to clear the tolerance.
    const translation = dracoManifest.nodes?.[0]?.translation ?? [0, 0, 0]
    const bias = Math.hypot(translation[0], translation[1], translation[2])

    expect(bias).toBeGreaterThan(tolerance * 10)
  }, 60000)
})
