#!/usr/bin/env node
/**
 * conway arm of the kernel side-by-side harness: one STEP model in, one JSON
 * row out (last line of stdout), per the row contract in
 * scripts/kernel_compare/README.md and the plan in
 * design/new/kernel-compare-smlib.md.
 *
 * Loads through the normal `ConwayModelLoader.loadModelWithScene` path (the
 * same one scripts/debug/model_report.mjs uses), then walks the scene and
 * sums triangle count, triangle area and bounds over PLACED INSTANCES: every
 * walk entry is one placement of one representation item, so a part used 8
 * times counts 8 times, the way SMLib and OCCT count it.
 *
 * Usage:
 *   node scripts/kernel_compare/conway_measure.mjs <model.step> [--threads mt|st]
 *
 *   --tolerance <mm> and --heal <bool> are accepted (run.mjs passes them to
 *   every arm) and have no effect: conway neither heals nor takes a chord
 *   tolerance. A --tolerance is recorded in `notes`.
 *
 *   --threads mt   ConwayGeomWasmNodeMT (default; what the CLI and Share use)
 *   --threads st   ConwayGeomWasmNode, via FORCE_SINGLE_THREAD=true, which
 *                  conway-geom's loadWasmModule() reads at first initialize()
 *
 * Everything before the last stdout line, and all of stderr, is log.
 * conway's own logging goes to stderr.
 *
 * Measurement notes that apply to every row (each is also written into the
 * row's `notes` where it matters):
 *
 * - Units. conway's AP214 world space is METRES: each walk root carries a
 *   scale transform of metres-per-file-unit (rootUnitScaleTransform,
 *   conway#458), so placed coordinates are multiplied by 1000 here. A root
 *   whose representation declares no length unit gets no scale transform and
 *   stays in raw file units; that is counted and called out in `notes`
 *   because the x1000 is then a guess.
 * - Tolerance. conway does not tessellate to an absolute chord tolerance.
 *   Surfaces refine to 0.1% of each face's own seed-mesh bbox diagonal
 *   (floored at 1e-5 of its representation's extent), B-spline curves to
 *   0.1% of their control-hull diagonal, and circle/ellipse edges take a
 *   fixed 24 samples per arc whatever its angle. `mesh_tolerance_mm` is
 *   therefore null.
 * - Triangles are the REIFIED mesh, the one every consumer renders or
 *   exports: reify welds the native mesh and drops zero-area triangles, and
 *   its index stream addresses its own interleaved float vertex stream (one
 *   vertex per smoothing-group corner, so its count differs from
 *   getVertexCount()). There is no per-triangle accessor, so both streams are
 *   read through fresh wasmHeapView()s built AFTER extraction, per unique
 *   geometry, and copied out on the spot — never a view held across a call
 *   into wasm. To keep float32 from costing precision on models far from
 *   their origin, each geometry is reified about its own local bbox centre
 *   (computed in double via getPoint()) and the centre is added back in
 *   double. The reified buffers are released with clearReification().
 * - Peak RSS covers the scene walk too. `conway_memory.load_peak_rss_bytes`
 *   is the high-water mark read between the load and the walk.
 *
 * Requires a built tree (`yarn build-incremental`) and a Dist/ whose variant
 * for the chosen thread mode matches the conway-geom submodule (checked via
 * scripts/wasmProvenance.cjs; CONWAY_ALLOW_STALE_WASM=1 to measure an old
 * engine on purpose).
 */

import {execFileSync} from 'node:child_process'
import fs from 'node:fs'
import {createRequire} from 'node:module'


const MEASURE_START = performance.now()

const REPO_ROOT = new URL('../../', import.meta.url)

/** Millimetres per metre: conway's AP214 world space is metres. */
const MM_PER_M = 1000

/** Elements in a column-major 4x4. */
const MATRIX_ELEMENTS = 16

/** Bytes per KiB, for maxRSS (reported in KiB on Linux). */
const KIB = 1024

/** Coordinates per vertex and per triangle. */
const XYZ = 3

/** Triangle corner count. */
const CORNERS = 3

/** conway's relative deflection factor, surfaces and B-spline curves. */
const RELATIVE_DEFLECTION = 1e-3

/** Samples per circle/ellipse arc (CIRCLE_SEGMENTS_MEDIUM). */
const ARC_SAMPLES = 24

const EXIT_USAGE = 1
const EXIT_STALE = 3

/** The loader's default maximum CSG depth, as model_report.mjs passes it. */
const CSG_DEPTH = 20

/**
 * The row being built, so a failure that escapes main() (an async throw out
 * of the wasm glue) still emits it rather than a contract-less fragment.
 */
let currentRow

/**
 * Error messages that mean the process ran out of memory rather than hit a
 * defect: V8 heap/string limits and wasm allocation failure.
 */
const OOM_PATTERN = new RegExp([
  'out of memory',
  'Invalid string length',
  'Array buffer allocation failed',
  'memory access out of bounds',
  'Cannot enlarge memory',
  'Aborted\\(OOM\\)',
  'allocation fail',
  'std::bad_alloc',
].join('|'), 'i')


/**
 * Parse argv.
 *
 * @param {string[]} argv Arguments after the script path
 * @return {{model: string|undefined, threads: string}} Options
 */
function parseArgs(argv) {
  const options = {model: undefined, threads: 'mt', tolerance: undefined}

  for (let i = 0; i < argv.length; ++i) {
    const arg = argv[i]

    if (arg === '--threads') {
      options.threads = argv[++i]

      if (options.threads !== 'mt' && options.threads !== 'st') {
        throw new Error(`--threads wants mt|st, got: ${options.threads ?? '(nothing)'}`)
      }
    } else if (arg === '--heal') {
      // Accepted for a uniform runner command line; conway never heals.
      ++i
    } else if (arg === '--tolerance') {
      // run.mjs passes this to every arm. conway has no chord-tolerance knob,
      // so it is recorded in notes and otherwise ignored.
      options.tolerance = argv[++i]
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}`)
    } else {
      options.model = arg
    }
  }

  if (options.model === undefined) {
    throw new Error('usage: conway_measure.mjs <model.step> [--threads mt|st]')
  }

  return options
}


/**
 * `git rev-parse HEAD` of this checkout, or null.
 *
 * @return {string|null} The sha
 */
function gitSha() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: new URL('.', REPO_ROOT).pathname,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}


/**
 * OS threads in this process (Linux), as evidence of which glue loaded: the
 * MT glue spawns its pthread pool at initialize().
 *
 * @return {number|null} Thread count, or null off Linux
 */
function osThreads() {
  try {
    return fs.readdirSync('/proc/self/task').length
  } catch {
    return null
  }
}


/**
 * Round to a fixed number of decimals, keeping null.
 *
 * @param {number|null|undefined} value The value
 * @param {number} digits Decimals
 * @return {number|null} Rounded value
 */
function round(value, digits = 3) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null
  }

  const scale = 10 ** digits

  return Math.round(value * scale) / scale
}


/**
 * Wrap a method on an object (own or inherited) with a timer.
 *
 * @param {object} target The object or prototype to patch
 * @param {string} method Method name
 * @param {function(number): void} record Receives elapsed ms per call
 * @return {boolean} Whether the method existed
 */
function time(target, method, record) {
  const original = target?.[method]

  if (typeof original !== 'function') {
    return false
  }

  target[method] = function(...args) {
    const started = performance.now()

    try {
      return original.apply(this, args)
    } finally {
      record(performance.now() - started)
    }
  }

  return true
}


/**
 * Read one geometry's reified triangles into JS, in its local frame.
 *
 * @param {object} geometry conway-geom GeometryObject
 * @param {object} wasmModule The module owning its heap
 * @param {Function} wasmHeapView compiled/src/core/wasm_heap.js export
 * @return {{positions: Float64Array, indices: Uint32Array}|{problem: string}}
 *   The local mesh, or why it could not be read
 */
function readMesh(geometry, wasmModule, wasmHeapView) {
  const nativeCount = geometry.getVertexCount()

  if (nativeCount === 0) {
    return {positions: new Float64Array(0), indices: new Uint32Array(0)}
  }

  // Local bbox centre in double, as the reification offset.
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]

  for (let i = 0; i < nativeCount; ++i) {
    const point = geometry.getPoint(i)
    const coords = [point.x, point.y, point.z]

    for (let axis = 0; axis < XYZ; ++axis) {
      min[axis] = Math.min(min[axis], coords[axis])
      max[axis] = Math.max(max[axis], coords[axis])
    }
  }

  const centre = [0, 1, 2].map((axis) => (min[axis] + max[axis]) / 2)

  if (!centre.every(Number.isFinite)) {
    return {problem: 'non-finite native vertex'}
  }

  try {
    geometry.reify({x: centre[0], y: centre[1], z: centre[2]})

    // Pointer and size first, then each view built and copied with no call
    // into wasm in between: a pthread may have grown the heap since the last
    // main-thread glue call, which wasmHeapView reconciles against.
    const indexPointer = geometry.GetIndexData()
    const indexCount = geometry.GetIndexDataSize()
    const vertexPointer = geometry.GetVertexData()
    const floatCount = geometry.GetVertexDataSize()

    if (indexCount % CORNERS !== 0 || floatCount % (2 * XYZ) !== 0) {
      return {problem: `reified stream sizes ${indexCount} indices / ${floatCount} floats`}
    }

    const indices = indexCount === 0 ?
      new Uint32Array(0) :
      wasmHeapView(wasmModule, Uint32Array, indexPointer, indexCount).slice()
    const stream = floatCount === 0 ?
      new Float32Array(0) :
      wasmHeapView(wasmModule, Float32Array, vertexPointer, floatCount).slice()

    // Interleaved [px, py, pz, nx, ny, nz]; keep positions, restore centre.
    const vertexCount = floatCount / (2 * XYZ)
    const positions = new Float64Array(vertexCount * XYZ)

    for (let i = 0; i < vertexCount; ++i) {
      for (let axis = 0; axis < XYZ; ++axis) {
        positions[(i * XYZ) + axis] = stream[(i * 2 * XYZ) + axis] + centre[axis]
      }
    }

    return {positions, indices}
  } finally {
    geometry.clearReification?.()
  }
}


/**
 * Accumulate one placed instance of a local mesh into the totals.
 *
 * Transforms every vertex, so the area is the area of the TRANSFORMED
 * triangle (correct under non-uniform scale and shear) and the bounds are
 * exact for rotated placements, not a box around a rotated box. Bounds are
 * taken over vertices some triangle uses: an unreferenced vertex is not
 * geometry anyone sees.
 *
 * @param {object} totals Running totals (mutated)
 * @param {{positions: Float64Array, indices: Uint32Array}} mesh Local mesh
 * @param {ReadonlyArray<number>|undefined} transform Column-major 4x4 or
 *   undefined for identity
 * @param {Float64Array} scratch Reusable buffer of at least positions.length
 * @return {{triangles: number, area: number, diagonal: number}} This
 *   instance's triangle count, area and bbox diagonal (world units)
 */
function accumulateInstance(totals, mesh, transform, scratch) {
  const {positions, indices} = mesh
  const limit = positions.length
  const m = transform ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

  for (let i = 0; i < limit; i += XYZ) {
    const x = positions[i]
    const y = positions[i + 1]
    const z = positions[i + 2]

    scratch[i] = (m[0] * x) + (m[4] * y) + (m[8] * z) + m[12]
    scratch[i + 1] = (m[1] * x) + (m[5] * y) + (m[9] * z) + m[13]
    scratch[i + 2] = (m[2] * x) + (m[6] * y) + (m[10] * z) + m[14]
  }

  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  let area2 = 0
  let triangles = 0

  for (let t = 0; t < indices.length; t += CORNERS) {
    const a = indices[t] * XYZ
    const b = indices[t + 1] * XYZ
    const c = indices[t + 2] * XYZ

    if (a + 2 >= limit || b + 2 >= limit || c + 2 >= limit) {
      totals.badIndices += 1
      continue
    }

    const ux = scratch[b] - scratch[a]
    const uy = scratch[b + 1] - scratch[a + 1]
    const uz = scratch[b + 2] - scratch[a + 2]
    const vx = scratch[c] - scratch[a]
    const vy = scratch[c + 1] - scratch[a + 1]
    const vz = scratch[c + 2] - scratch[a + 2]

    const cx = (uy * vz) - (uz * vy)
    const cy = (uz * vx) - (ux * vz)
    const cz = (ux * vy) - (uy * vx)

    area2 += Math.sqrt((cx * cx) + (cy * cy) + (cz * cz))
    triangles += 1

    for (let corner = 0; corner < CORNERS; ++corner) {
      const base = indices[t + corner] * XYZ

      for (let axis = 0; axis < XYZ; ++axis) {
        const value = scratch[base + axis]

        if (value < min[axis]) {
          min[axis] = value
        }

        if (value > max[axis]) {
          max[axis] = value
        }
      }
    }
  }

  const area = area2 / 2

  totals.area += area
  totals.triangles += triangles

  if (triangles === 0) {
    return {triangles, area, diagonal: 0}
  }

  for (let axis = 0; axis < XYZ; ++axis) {
    totals.min[axis] = Math.min(totals.min[axis], min[axis])
    totals.max[axis] = Math.max(totals.max[axis], max[axis])
  }

  return {
    triangles,
    area,
    diagonal: Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]),
  }
}


/**
 * Determinant of a column-major 4x4's linear part.
 *
 * @param {ReadonlyArray<number>} m The matrix
 * @return {number} det
 */
function linearDeterminant(m) {
  return (m[0] * ((m[5] * m[10]) - (m[9] * m[6]))) -
    (m[4] * ((m[1] * m[10]) - (m[9] * m[2]))) +
    (m[8] * ((m[1] * m[6]) - (m[5] * m[2])))
}


/**
 * Walk the scene and sum over placed instances, one unique geometry at a
 * time so at most one local mesh is held in JS at once.
 *
 * @param {object} scene The loaded AP214 scene
 * @param {object} wasmModule The module owning the geometry heap
 * @param {Function} wasmHeapView Heap view constructor
 * @return {object} Totals and instance census
 */
function measureScene(scene, wasmModule, wasmHeapView) {
  const byGeometry = new Map()
  let walked = 0
  let identityPlacements = 0
  let mirrored = 0

  for (const entry of scene.walk()) {
    const transform = entry[0]
    const mesh = entry[2]

    if (transform !== undefined &&
        (typeof transform.length !== 'number' || transform.length < MATRIX_ELEMENTS)) {
      throw new Error('walk tuple [0] is not a 4x4 transform — check the walk tuple index')
    }

    ++walked

    if (transform === undefined) {
      ++identityPlacements
    } else if (linearDeterminant(transform) < 0) {
      ++mirrored
    }

    let group = byGeometry.get(mesh.localID)

    if (group === undefined) {
      group = {geometry: mesh.geometry, transforms: []}
      byGeometry.set(mesh.localID, group)
    }

    group.transforms.push(transform)
  }

  const totals = {
    area: 0,
    triangles: 0,
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
    badIndices: 0,
  }

  let bodies = 0
  let duplicates = 0
  let duplicateArea = 0
  const diagonals = []
  let uniqueWithTriangles = 0
  let unreadable = 0
  const problems = new Set()
  let scratch = new Float64Array(0)

  for (const group of byGeometry.values()) {
    const geometry = group.geometry

    if (typeof geometry?.getVertexCount !== 'function') {
      unreadable += group.transforms.length
      problems.add('mesh without a GeometryObject')
      continue
    }

    const mesh = readMesh(geometry, wasmModule, wasmHeapView)

    if (mesh.problem !== undefined) {
      unreadable += group.transforms.length
      problems.add(mesh.problem)
      continue
    }

    if (mesh.indices.length === 0) {
      continue
    }

    ++uniqueWithTriangles

    if (scratch.length < mesh.positions.length) {
      scratch = new Float64Array(mesh.positions.length)
    }

    // A second placement of the same item under an identical transform is
    // coincident geometry, counted twice. It is a conway defect when it
    // happens (one item reached through two representations), and it stays
    // in the totals because the totals are what conway produced; this count
    // and its area let a reader subtract it.
    const placements = new Set()

    for (const transform of group.transforms) {
      const instance = accumulateInstance(totals, mesh, transform, scratch)
      const key = transform === undefined ? 'identity' : Array.prototype.join.call(transform, ',')
      const coincident = placements.has(key)

      placements.add(key)

      if (instance.triangles > 0) {
        ++bodies
        diagonals.push(instance.diagonal)
      }

      if (coincident) {
        ++duplicates
        duplicateArea += instance.area
      }
    }
  }

  diagonals.sort((x, y) => x - y)

  return {
    totals,
    bodies,
    duplicates,
    duplicateArea,
    medianBodyDiagonal: diagonals.length > 0 ? diagonals[Math.floor((diagonals.length - 1) / 2)] : null,
    walked,
    uniqueGeometries: byGeometry.size,
    uniqueWithTriangles,
    identityPlacements,
    mirrored,
    unreadable,
    problems: [...problems],
  }
}


/**
 * Classify a thrown error into the contract's taxonomy.
 *
 * @param {unknown} error What was thrown
 * @return {'oom'|'error'} Status
 */
function classify(error) {
  const text = `${error?.name ?? ''}: ${error?.message ?? error}`

  return OOM_PATTERN.test(text) ? 'oom' : 'error'
}


/**
 * Write the row as the last stdout line, then exit.
 *
 * @param {object} row The row
 * @param {number} code Exit code
 */
function emit(row, code) {
  row.total_ms = round(performance.now() - MEASURE_START, 1)
  row.peak_rss_bytes = process.resourceUsage().maxRSS * KIB

  // Exit explicitly: the MT glue's pthread pool is never terminated, so the
  // process would otherwise outlive the measurement.
  process.stdout.write(`${JSON.stringify(row)}\n`, () => process.exit(code))
}


/**
 * Measure one model.
 */
async function main() {
  let options

  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(error.message)
    process.exit(EXIT_USAGE)
  }

  const target = options.threads === 'st' ? 'ConwayGeomWasmNode' : 'ConwayGeomWasmNodeMT'

  // Read by pThreadsAllowed() inside the first ConwayGeometry.initialize(),
  // which happens inside the load: setting it here is early enough.
  if (options.threads === 'st') {
    process.env.FORCE_SINGLE_THREAD = 'true'
  } else {
    delete process.env.FORCE_SINGLE_THREAD
  }

  const row = {
    arm: 'conway',
    variant: options.threads,
    model: options.model,
    size_bytes: null,
    status: 'error',
    error: null,
    read_ms: null,
    geometry_ms: null,
    measure_ms: null,
    total_ms: null,
    peak_rss_bytes: null,
    bodies: null,
    faces: null,
    triangles: null,
    mesh_area_mm2: null,
    exact_area_mm2: null,
    exact_volume_mm3: null,
    closed_valid_bodies: null,
    invalid_bodies: null,
    bbox_extent_mm: null,
    mesh_tolerance_mm: null,
    versions: {conway: gitSha(), node: process.version},
    notes: [],
  }

  currentRow = row

  if (options.tolerance !== undefined) {
    row.notes.push(`--tolerance ${options.tolerance} ignored: conway has no chord-tolerance setting`)
  }

  // conway's logging and printStatistics go through console.log; the row
  // contract wants stdout clean apart from the last line.
  console.log = console.error

  try {
    row.size_bytes = fs.statSync(options.model).size
  } catch (error) {
    row.error = String(error.message).split('\n')[0]
    emit(row, 0)

    return
  }

  const require = createRequire(import.meta.url)
  const {inspect} = require('../wasmProvenance.cjs')
  const provenance = inspect({targets: [target]})

  for (const warning of provenance.warnings) {
    console.error(`[conway_measure] note: ${warning}`)
  }

  if (provenance.status !== 'ok') {
    const blocking = provenance.fatal && process.env.CONWAY_ALLOW_STALE_WASM !== '1'

    console.error(`[conway_measure] ${blocking ? 'ERROR' : 'WARNING'}: ${provenance.message}`)

    if (blocking) {
      row.error = `wasm provenance: ${provenance.message.split('\n')[0]}`
      row.notes.push(`refused to measure: ${target} does not match the conway-geom submodule`)
      emit(row, EXIT_STALE)

      return
    }

    row.notes.push(`wasm provenance ${provenance.status}: ${provenance.message.split('\n')[0]}`)
  }

  const compiled = (rel) => import(new URL(`compiled/${rel}`, REPO_ROOT).href)

  const phases = {
    file_read_ms: null,
    header_parse_ms: 0,
    data_parse_ms: 0,
    geometry_ms: 0,
    load_other_ms: null,
    walk_ms: null,
  }

  const fired = {header: 0, data: 0, geometry: 0}
  const unitRoots = new Map()
  let rootsWithoutUnit = 0
  let rootScaleProbeFired = 0

  try {
    const [
      conwayGeom,
      {AP214GeometryExtraction},
      {default: AP214StepParser},
      {ConwayModelLoader},
      {default: Logger},
      {default: Environment},
      {wasmHeapView},
    ] = await Promise.all([
      compiled('dependencies/conway-geom/index.js'),
      compiled('src/AP214E3_2010/ap214_geometry_extraction.js'),
      compiled('src/AP214E3_2010/ap214_step_parser.js'),
      compiled('src/loaders/conway_model_loader.js'),
      compiled('src/logging/logger.js'),
      compiled('src/utilities/environment.js'),
      compiled('src/core/wasm_heap.js'),
    ])

    Environment.checkEnvironment()
    Logger.initializeWasmCallbacks()
    Logger.setSink((level, message) => console.error(message))

    // Phase timers on the loader's own boundaries: the parser singleton the
    // loader uses, and the geometry call it times for its statistics.
    const parser = AP214StepParser.Instance

    time(parser, 'parseHeader', (ms) => {
      phases.header_parse_ms += ms
      ++fired.header
    })
    time(parser, 'parseDataToModel', (ms) => {
      phases.data_parse_ms += ms
      ++fired.data
    })
    time(AP214GeometryExtraction.prototype, 'extractAP214GeometryData', (ms) => {
      phases.geometry_ms += ms
      ++fired.geometry
    })

    // Unit probe: what each walk root's scale transform was built from.
    // convertToMetres is recursive (conversion_based_unit), so only the
    // outermost call inside rootUnitScaleTransform is recorded.
    const extraction = AP214GeometryExtraction.prototype
    const originalRootScale = extraction.rootUnitScaleTransform
    const originalToMetres = extraction.convertToMetres
    let depth = -1

    extraction.rootUnitScaleTransform = function(...args) {
      depth = 0
      ++rootScaleProbeFired

      try {
        const result = originalRootScale.apply(this, args)

        if (result === undefined) {
          ++rootsWithoutUnit
        }

        return result
      } finally {
        depth = -1
      }
    }

    extraction.convertToMetres = function(...args) {
      if (depth < 0) {
        return originalToMetres.apply(this, args)
      }

      const outer = depth === 0

      ++depth

      try {
        const metres = originalToMetres.apply(this, args)

        if (outer) {
          const key = metres === undefined ? 'unknown' : String(metres)

          unitRoots.set(key, (unitRoots.get(key) ?? 0) + 1)
        }

        return metres
      } finally {
        --depth
      }
    }

    const readStart = performance.now()
    const data = new Uint8Array(fs.readFileSync(options.model))

    phases.file_read_ms = performance.now() - readStart

    const loadStart = performance.now()
    const [model, scene] = await ConwayModelLoader.loadModelWithScene(data, true, CSG_DEPTH, 0)
    const loadMs = performance.now() - loadStart

    const loadPeakRss = process.resourceUsage().maxRSS * KIB

    if (fired.data === 0 || fired.geometry === 0) {
      // A timer that never fired would report 0 ms as if measured.
      throw new Error(`phase timers did not fire (parse ${fired.data}, geometry ${fired.geometry}): ` +
        'the loader no longer calls the methods this script wraps')
    }

    phases.load_other_ms = loadMs - phases.header_parse_ms - phases.data_parse_ms - phases.geometry_ms

    row.read_ms = round(phases.file_read_ms + phases.header_parse_ms + phases.data_parse_ms, 1)
    row.geometry_ms = round(phases.geometry_ms, 1)

    const wasmType = conwayGeom.wasmType
    const wasmModule = scene.conwayGeometry?.wasmModule
    const sharedMemory = wasmModule?.HEAPU8?.buffer instanceof SharedArrayBuffer

    row.conway_wasm = {
      glue: `ConwayGeomWasm${wasmType}.js`,
      shared_memory: sharedMemory,
      os_threads: osThreads(),
    }

    if ((options.threads === 'mt') !== (wasmType === 'NodeMT')) {
      throw new Error(`asked for --threads ${options.threads} but conway-geom loaded ${wasmType}`)
    }

    const walkStart = performance.now()
    const census = measureScene(scene, wasmModule, wasmHeapView)

    phases.walk_ms = performance.now() - walkStart

    const {totals} = census

    row.bodies = census.bodies
    row.triangles = totals.triangles

    const statistics = Logger.getStatistics(0)

    row.conway_memory = {
      wasm_heap_peak_mb: round(statistics?.getWasmHeapPeak?.(), 1),
      geometry_memory_mb: round(statistics?.getGeometryMemory?.(), 3),
      memory_statistics: statistics?.getMemoryStatistics?.() ?? null,
      load_peak_rss_bytes: loadPeakRss,
    }

    row.conway_phases = Object.fromEntries(
        Object.entries(phases).map(([key, value]) => [key, round(value, 1)]))

    row.conway_instances = {
      walked: census.walked,
      unique_geometries: census.uniqueGeometries,
      unique_with_triangles: census.uniqueWithTriangles,
      identity_placements: census.identityPlacements,
      mirrored: census.mirrored,
      unreadable: census.unreadable,
      coincident_duplicates: census.duplicates,
      coincident_duplicate_area_mm2: round(census.duplicateArea * MM_PER_M * MM_PER_M, 3),
    }

    // conway has no absolute chord tolerance (see the header); this is the
    // nearest absolute figure for setting another kernel's mesh tolerance,
    // and an UPPER bound: conway's target is 0.1% of each FACE's diagonal,
    // and faces are smaller than the bodies they belong to.
    row.conway_tessellation = {
      relative_deflection: RELATIVE_DEFLECTION,
      arc_samples: ARC_SAMPLES,
      median_body_diagonal_mm: round(census.medianBodyDiagonal * MM_PER_M, 4),
      tolerance_upper_bound_mm: round(census.medianBodyDiagonal * MM_PER_M * RELATIVE_DEFLECTION, 6),
    }

    if (totals.triangles > 0) {
      row.mesh_area_mm2 = round(totals.area * MM_PER_M * MM_PER_M, 3)
      row.bbox_extent_mm = [0, 1, 2].map(
          (axis) => round((totals.max[axis] - totals.min[axis]) * MM_PER_M, 4))
      row.status = 'ok'
    } else {
      row.status = 'empty'
    }

    const units = [...unitRoots].map(([metres, count]) => `${metres} m/unit x${count}`).join(', ')

    row.notes.push(
        `units: world space is metres (walk-root scale = metres per file unit); x${MM_PER_M} ` +
        `applied to lengths, x${MM_PER_M * MM_PER_M} to area. Root unit scales: ${units || 'none recorded'}`)

    if (rootScaleProbeFired === 0) {
      row.notes.push('unit probe never fired: root unit scale unknown, x1000 assumes metres')
    }

    if (rootsWithoutUnit > 0) {
      row.notes.push(
          `${rootsWithoutUnit} walk root(s) declare no length unit: their geometry is in raw file ` +
          'units and the x1000 is only right if the file unit is metres')
    }

    row.notes.push(
        'mesh_tolerance_mm null: conway has no absolute chord tolerance. Surfaces refine to ' +
        `${RELATIVE_DEFLECTION} x each face's bbox diagonal (floored at 1e-5 x its representation extent), ` +
        `B-spline curves to ${RELATIVE_DEFLECTION} x control-hull diagonal, circle/ellipse arcs take a ` +
        `fixed ${ARC_SAMPLES} samples per arc`)

    row.notes.push('bodies = placed instances (walk entries, one per representation item placement) ' +
      'with >= 1 triangle; faces/exact_*: not measurable by conway')

    if (census.identityPlacements > 0) {
      row.notes.push(
          `${census.identityPlacements} instance(s) have no placement transform, so no unit scale ` +
          'either: they are in raw file units, and the x1000 is only right for a metre file')
    }

    if (census.duplicates > 0) {
      row.notes.push(
          `${census.duplicates} coincident duplicate placement(s) (same item, identical transform) are ` +
          `INCLUDED in bodies/triangles/mesh_area_mm2; they contribute ` +
          `${row.conway_instances.coincident_duplicate_area_mm2} mm2 (conway defect, not model content)`)
    }

    if (census.mirrored > 0) {
      row.notes.push(`${census.mirrored} placed instance(s) have a mirroring (det < 0) placement`)
    }

    if (census.unreadable > 0) {
      row.notes.push(`${census.unreadable} instance(s) not measured: ${census.problems.join('; ')}`)
    }

    if (totals.badIndices > 0) {
      row.notes.push(`${totals.badIndices} triangle(s) with out-of-range indices skipped`)
    }

    if (row.conway_memory.memory_statistics === null) {
      delete row.conway_memory.memory_statistics
    }

    // Referenced so the model outlives the walk; the walk reads through it.
    void model
  } catch (error) {
    row.status = classify(error)
    row.error = String(error?.message ?? error).split('\n')[0]
    console.error(error?.stack ?? error)
  }

  emit(row, 0)
}


/**
 * Last-resort handler: classify, emit the row so far, exit non-zero.
 *
 * @param {unknown} error What escaped
 */
function onEscaped(error) {
  console.error(error?.stack ?? error)

  if (currentRow === undefined) {
    process.exit(1)
  }

  currentRow.status = classify(error)
  currentRow.error = String(error?.message ?? error).split('\n')[0]
  currentRow.notes.push('failure escaped the measurement (uncaught); partial fields may be null')
  emit(currentRow, 1)
}

process.on('uncaughtException', onEscaped)
process.on('unhandledRejection', onEscaped)

await main()
