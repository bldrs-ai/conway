#!/usr/bin/env node
/**
 * Geometry diagnostics for one model: which entities produced bad output.
 *
 * This is the "why does this model look wrong?" tool. It loads a model
 * through the normal ConwayModelLoader path (so IFC and STEP behave
 * exactly as they do in Share) with probes installed at four levels of
 * the geometry pipeline, and reports the entities whose output is an
 * outlier against the rest of the model:
 *
 *   curve  extractCurve      per-curve point extent      (AP214 + IFC)
 *   loop   getLoop           per-loop extent + point spacing
 *   face   addFaceToGeometry vertices a single face contributed
 *   mesh   scene walk        per-mesh local bounds, attributed to entities
 *   displacement            per-mesh distance from the model's robust centre
 *
 * `mesh` and `displacement` measure different things and neither subsumes
 * the other. `mesh` reads vertices in MESH-LOCAL coordinates, so it catches
 * a part that is internally huge — but on an export that writes geometry
 * directly in site coordinates with identity placements (common for IFC
 * `IfcFacetedBrep`), every honest part's "extent" is really its distance
 * from the file origin, and the stage flags thousands of them. On
 * `Wiesenplatz 7, 4057 Basel.ifc` that was 3,955 rows of which 3 were real
 * (conway#456). `displacement` places each mesh with its transform and
 * scores how far it sits from where the model actually is, which is the
 * question "which parts are flung away from where they belong" — see
 * design/new/model-diagnostics.md §"Extent outliers". On the same model it
 * names 5 of 37,502.
 *
 * The stages are deliberately redundant: they bracket the pipeline, so
 * comparing them localises a defect. A model whose `mesh` stage shows a
 * runaway part but whose `curve` stage is clean has a tessellation or
 * transform bug; one where `curve` is already dirty has a curve/geometry
 * interpretation bug upstream of tessellation. Running them together and
 * reading the narrowest dirty stage is the fast path — that is how the
 * AmazingHand `EDGE_CURVE.same_sense` defect was found (see README.md
 * §"Worked example").
 *
 * ## Two hazards this tool exists to remove
 *
 * 1. **A probe that never fires looks exactly like a clean model.** Every
 *    stage reports its `fired` count, and a silent stage says so instead
 *    of reporting "no outliers". The run exits 2 when a stage named on
 *    --stage was silent, or when every stage was; under the default
 *    all-stages run a single silent stage is routine and does not fail
 *    the process. During the AmazingHand investigation, ad-hoc tracers
 *    twice reported "0 outliers" because they were attached to a seam
 *    the model did not take — hours attributed to the wrong subsystem. A
 *    zero here is only meaningful next to a non-zero `fired`.
 *
 * 2. **Reading wasm memory directly goes stale.** Vertex data is read
 *    through `getPoint()` / `get3d()`, never through a cached `HEAPF32`
 *    view: wasm memory growth during extraction detaches the old buffer
 *    and a held view silently reads zeroes.
 *
 * Usage:
 *   node scripts/debug/model_report.mjs <model> [options]
 *
 *   --stage <list>   comma-separated: curve,loop,face,mesh,displacement
 *                    (default all)
 *   --limit <n>      absolute outlier threshold, in model units
 *   --factor <n>     outlier = value > factor x median (default 8)
 *   --top <n>        rows printed per stage (default 15)
 *   --json           machine-readable output on stdout
 *   --csg-depth <n>  maximum CSG depth (default 20)
 *   --quiet          suppress conway's own log output
 *
 * Examples:
 *   node scripts/debug/model_report.mjs Right_Hand.step
 *   node scripts/debug/model_report.mjs haus.ifc --stage mesh --top 40
 *   node scripts/debug/model_report.mjs part.step --limit 0.25 --json
 *
 * Requires a built tree (`yarn build-incremental`, or `yarn build-codex-MT`
 * if conway-geom changed) — it imports from `compiled/`, not `src/`.
 */

import fs from 'node:fs'
import path from 'node:path'
import {localCentre, placeCentre, robustCentre} from './displacement.mjs'

const REPO_ROOT = new URL('../../', import.meta.url)

/** Default multiple of the median above which a value is called an outlier. */
const DEFAULT_FACTOR = 8

/** Rows printed per stage before truncation. */
const DEFAULT_TOP = 15

/** Point-spacing histogram buckets, in model units, ascending. */
const GAP_BUCKETS = [1e-8, 1e-7, 1e-6, 1e-5]

const ALL_STAGES = ['curve', 'loop', 'face', 'mesh', 'displacement']

const EXIT_PROBE_DEAD = 2
const EXIT_USAGE = 1

/**
 * Where the human-readable report goes.
 *
 * Under --json it moves to stderr so stdout carries nothing but the JSON
 * document and the run can be piped straight into jq.
 */
let say = console.log


/**
 * Parse argv into an options object.
 *
 * @param {string[]} argv Arguments after the node binary and script path
 * @return {object} Parsed options, or {help: true}
 */
function parseArgs(argv) {
  const options = {
    stages: ALL_STAGES,
    stagesExplicit: false,
    limit: undefined,
    factor: DEFAULT_FACTOR,
    top: DEFAULT_TOP,
    json: false,
    csgDepth: 20,
    quiet: false,
    model: undefined,
  }

  // A mistyped numeric option must not degrade into a quiet wrong answer:
  // `--limit x` would otherwise make every `value > NaN` comparison false
  // and report "no outliers" with every probe firing — a false clean
  // result arriving through the argument parser, which is the one failure
  // mode this tool exists to rule out.
  const number = (flag, raw) => {
    const parsed = Number(raw)

    if (!Number.isFinite(parsed)) {
      throw new Error(`${flag} needs a number, got: ${raw ?? '(nothing)'}`)
    }

    return parsed
  }

  for (let i = 0; i < argv.length; ++i) {
    const arg = argv[i]

    switch (arg) {
      case '--stage':
        options.stages = argv[++i].split(',').map((s) => s.trim()).filter(Boolean)
        options.stagesExplicit = true
        break
      case '--limit':
        options.limit = number(arg, argv[++i])
        break
      case '--factor':
        options.factor = number(arg, argv[++i])
        break
      case '--top':
        options.top = number(arg, argv[++i])
        break
      case '--csg-depth':
        options.csgDepth = number(arg, argv[++i])
        break
      case '--json':
        options.json = true
        break
      case '--quiet':
        options.quiet = true
        break
      case '-h':
      case '--help':
        return {help: true}
      default:
        if (arg.startsWith('-')) {
          throw new Error(`unknown option: ${arg}`)
        }
        options.model = arg
    }
  }

  const unknown = options.stages.filter((s) => !ALL_STAGES.includes(s))

  if (unknown.length > 0) {
    throw new Error(`unknown stage(s): ${unknown.join(', ')} (want ${ALL_STAGES.join('|')})`)
  }

  return options
}


/**
 * A stage's accumulated observations.
 *
 * Keeps every magnitude (for the median) but only the largest `capacity`
 * records, so a million-curve model costs an array of doubles rather than
 * a million objects.
 */
class Stage {

  /**
   * @param {string} name Stage name, as passed to --stage
   * @param {number} capacity How many top records to retain
   */
  constructor(name, capacity) {
    this.name = name
    this.capacity = capacity
    this.fired = 0
    this.values = []
    this.top = []
    this.extra = {}
  }

  /**
   * Record one observation.
   *
   * @param {number} value The magnitude this observation is ranked by
   * @param {Function} describe Called only if the record is retained, to
   * avoid building a description object per observation
   */
  record(value, describe) {
    if (!Number.isFinite(value)) {
      return
    }

    this.values.push(value)
    this.sorted = undefined

    const worst = this.top[this.top.length - 1]

    if (this.top.length >= this.capacity && worst !== undefined && value <= worst.value) {
      return
    }

    this.top.push({value, ...describe()})
    this.top.sort((a, b) => b.value - a.value)
    this.top.length = Math.min(this.top.length, this.capacity)
  }

  /**
   * The observation at a given quantile, or 0 if nothing was observed.
   *
   * The median (0.5) is the baseline outliers are measured against: mean
   * rather than median would let a handful of runaway entities drag the
   * baseline up far enough to hide themselves. p90 is reported alongside
   * it purely so a reader can see how wide the honest spread is before
   * deciding whether a flagged row is a defect or just the big part.
   *
   * @param {number} quantile In [0, 1]
   * @return {number} The magnitude at that quantile
   */
  quantile(quantile) {
    if (this.values.length === 0) {
      return 0
    }

    // Invalidated by record(); every observation is in before anything is
    // reported today, but a caller that interleaved the two would otherwise
    // get a stale baseline with no sign that anything was wrong.
    this.sorted ??= [...this.values].sort((a, b) => a - b)

    return this.sorted[Math.min(this.sorted.length - 1,
        Math.floor(this.sorted.length * quantile))]
  }

  /**
   * How many observations exceed a threshold.
   *
   * Counted over every observation, not over the retained `top` records:
   * `top` is capped, so counting there would silently cap the reported
   * blast radius of a defect at `capacity` — understating a model with
   * hundreds of runaway faces as if it had sixty.
   *
   * @param {number} threshold The outlier threshold
   * @return {number} The number of observations strictly above it
   */
  countAbove(threshold) {
    let count = 0

    for (const value of this.values) {
      if (value > threshold) {
        count += 1
      }
    }

    return count
  }
}


/**
 * Largest absolute coordinate over a curve's points.
 *
 * Magnitude rather than a proper bounding box: the failure being looked
 * for is geometry flung away from the origin, and one number per entity
 * keeps the comparison across thousands of entities readable.
 *
 * @param {object} curve A conway-geom CurveObject
 * @return {number} The largest |x|, |y| or |z| over its 3D points
 */
function curveExtent(curve) {
  const count = curve.getPointsSize()
  let extent = 0

  for (let i = 0; i < count; ++i) {
    const point = curve.get3d(i)

    extent = Math.max(extent, Math.abs(point.x), Math.abs(point.y), Math.abs(point.z))
  }

  return extent
}


/**
 * Point-spacing statistics for one loop.
 *
 * Near-coincident consecutive points are what drive the constrained
 * Delaunay triangulation into self-intersecting-constraint territory, so
 * a loop whose minimum gap is orders of magnitude below its own extent is
 * a tessellation-failure candidate even when its coordinates look sane.
 *
 * @param {object} curve A conway-geom CurveObject holding the loop
 * @return {object} {points, extent, minGap, gaps, wrapDuplicate}
 */
function loopSpacing(curve) {
  const count = curve.getPointsSize()
  const gaps = new Array(GAP_BUCKETS.length + 1).fill(0)
  let extent = 0
  let minGap = Infinity
  let previous
  let first

  for (let i = 0; i < count; ++i) {
    const point = curve.get3d(i)

    extent = Math.max(extent, Math.abs(point.x), Math.abs(point.y), Math.abs(point.z))

    if (i === 0) {
      first = {x: point.x, y: point.y, z: point.z}
    } else {
      const gap = Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z)

      minGap = Math.min(minGap, gap)

      const bucket = GAP_BUCKETS.findIndex((edge) => gap < edge)

      gaps[bucket < 0 ? GAP_BUCKETS.length : bucket] += 1
    }

    previous = {x: point.x, y: point.y, z: point.z}
  }

  // A loop that repeats its start point as its last point double-counts a
  // vertex in the triangulation; harmless in some paths, a degeneracy in
  // others, and worth seeing either way.
  const wrapDuplicate = count > 2 && first !== undefined &&
    Math.hypot(previous.x - first.x, previous.y - first.y, previous.z - first.z) < GAP_BUCKETS[0]

  return {points: count, extent, minGap: count > 1 ? minGap : 0, gaps, wrapDuplicate}
}


/**
 * Largest absolute coordinate over a half-open range of a geometry's vertices.
 *
 * @param {object} geometry A conway-geom GeometryObject
 * @param {number} from First vertex index, inclusive
 * @param {number} to Last vertex index, exclusive
 * @return {number} The largest |x|, |y| or |z| over those vertices
 */
function vertexExtent(geometry, from, to) {
  let extent = 0

  for (let i = from; i < to; ++i) {
    const point = geometry.getPoint(i)

    extent = Math.max(extent, Math.abs(point.x), Math.abs(point.y), Math.abs(point.z))
  }

  return extent
}


/**
 * Describe an entity for a report row.
 *
 * @param {object|undefined} entity A conway Entity, or undefined
 * @return {object} {expressID, entity} with undefined fields elided
 */
function describeEntity(entity) {
  return {
    expressID: entity?.expressID,
    entity: entity?.constructor?.name,
  }
}


/**
 * Wrap a prototype method, leaving the original callable through `next`.
 *
 * @param {Function|undefined} Klass The class whose prototype to patch
 * @param {string} method The method name
 * @param {Function} wrap Receives (next, args, self) and returns the result
 * @return {boolean} True if the method existed and was patched
 */
function patch(Klass, method, wrap) {
  const original = Klass?.prototype?.[method]

  if (typeof original !== 'function') {
    return false
  }

  Klass.prototype[method] = function(...args) {
    return wrap((...forwarded) => original.apply(this, forwarded), args, this)
  }

  return true
}


/**
 * Install the curve probe on both schema extractors.
 *
 * Curves are memoized per entity, so extractCurve is called far more
 * often than there are distinct curves; observations are deduplicated by
 * express ID to keep the median honest.
 *
 * @param {Stage} stage The stage to record into
 * @param {object} classes {AP214GeometryExtraction, IfcGeometryExtraction}
 * @return {number} How many extractor classes were patched
 */
function installCurveProbe(stage, classes) {
  const seen = new Set()
  let patched = 0

  const wrap = (next, args) => {
    const curve = next(...args)

    stage.fired += 1

    const from = args[0]

    if (curve === undefined || typeof curve.getPointsSize !== 'function' ||
        seen.has(from?.expressID)) {
      return curve
    }

    seen.add(from?.expressID)

    const trims = args[3]

    stage.record(curveExtent(curve), () => ({
      ...describeEntity(from),
      points: curve.getPointsSize(),
      trimmed: trims?.exist === true,
    }))

    return curve
  }

  for (const Klass of [classes.AP214GeometryExtraction, classes.IfcGeometryExtraction]) {
    patched += patch(Klass, 'extractCurve', wrap) ? 1 : 0
  }

  return patched
}


/**
 * Install the loop probe on the shared conway-geom wrapper.
 *
 * `getLoop` is below the schema layer, so one probe covers IFC and STEP.
 *
 * @param {Stage} stage The stage to record into
 * @param {Function} ConwayGeometry The conway-geom wrapper class
 * @return {number} How many methods were patched
 */
function installLoopProbe(stage, ConwayGeometry) {
  stage.extra.gaps = new Array(GAP_BUCKETS.length + 1).fill(0)
  stage.extra.wrapDuplicates = 0
  stage.extra.degenerate = 0

  return patch(ConwayGeometry, 'getLoop', (next, args) => {
    const curve = next(...args)

    stage.fired += 1

    if (curve === undefined || typeof curve.getPointsSize !== 'function') {
      return curve
    }

    const spacing = loopSpacing(curve)

    for (let i = 0; i < spacing.gaps.length; ++i) {
      stage.extra.gaps[i] += spacing.gaps[i]
    }

    if (spacing.wrapDuplicate) {
      stage.extra.wrapDuplicates += 1
    }

    if (spacing.points < 3) {
      stage.extra.degenerate += 1
    }

    // Ranked by extent, not by gap: a loop is worth looking at first when
    // it is in the wrong place, and the gap columns then say whether it is
    // also a triangulation risk.
    stage.record(spacing.extent, () => ({
      points: spacing.points,
      minGap: spacing.minGap,
      wrapDuplicate: spacing.wrapDuplicate,
    }))

    return curve
  }) ? 1 : 0
}


/**
 * Install the face probe on the shared conway-geom wrapper.
 *
 * Measures the vertices a single face contributed, by vertex count delta
 * around the call. That only works when faces are added immediately —
 * AP214's staged-face path defers the work to a later batch, where the
 * delta is zero — so the caller sets CONWAY_DISABLE_STAGED_FACES=1 before
 * the load (see `main`).
 *
 * @param {Stage} stage The stage to record into
 * @param {Function} ConwayGeometry The conway-geom wrapper class
 * @return {number} How many methods were patched
 */
function installFaceProbe(stage, ConwayGeometry) {
  let patched = 0

  const wrap = (next, args) => {
    const geometry = args[1]
    const before = geometry?.getVertexCount?.() ?? 0
    const result = next(...args)

    stage.fired += 1

    const after = geometry?.getVertexCount?.() ?? 0

    if (after > before) {
      stage.record(vertexExtent(geometry, before, after), () => ({
        vertices: after - before,
      }))
    }

    return result
  }

  for (const method of ['addFaceToGeometry', 'addFaceToGeometrySimple']) {
    patched += patch(ConwayGeometry, method, wrap) ? 1 : 0
  }

  return patched
}


/**
 * Walk the built scene and record per-mesh local bounds.
 *
 * Runs after the load rather than as a probe, and is the only stage that
 * can name the product a defect belongs to — the earlier stages see
 * curves and faces, not parts.
 *
 * @param {Stage} stage The stage to record into
 * @param {object} model The loaded Model
 * @param {object} scene The built Scene
 */
function collectMeshes(stage, model, scene) {
  if (typeof scene?.walk !== 'function') {
    return
  }

  const seen = new Set()

  for (const walked of scene.walk()) {
    const mesh = walked[2]
    const geometry = mesh?.geometry

    if (typeof geometry?.getVertexCount !== 'function' || seen.has(mesh.localID)) {
      continue
    }

    seen.add(mesh.localID)
    stage.fired += 1

    const count = geometry.getVertexCount()

    if (count === 0) {
      continue
    }

    stage.record(vertexExtent(geometry, 0, count), () => ({
      ...describeEntity(model.getElementByLocalID?.(mesh.localID)),
      vertices: count,
      triangles: geometry.getTriangleCount?.(),
    }))
  }
}


/**
 * Record every mesh's distance from the model's robust centre.
 *
 * Two passes, because the metric is relative to the model: the centre is not
 * known until every mesh has been placed. The robust centre is the
 * component-wise median of mesh centres — a median rather than a mean
 * precisely because the outliers being hunted would drag a mean toward
 * themselves and shrink their own scores.
 *
 * Feeds raw distance into the ordinary Stage machinery, so the existing
 * `factor x median` threshold applies unchanged: on the model in conway#456
 * the median distance is 38.6 and the three sky-arcing slivers sit at
 * 950-1377, which clears an 8x threshold by a wide margin.
 *
 * One caveat that comes with reusing that threshold: distances here can be
 * exactly zero, unlike an extent. A model where more than half the meshes
 * sit at the robust centre — many identical items placed at one origin —
 * gives median 0, hence threshold 0, hence every other mesh flagged. The
 * report shows median 0 when that happens, and `--limit` is the escape.
 *
 * @param {Stage} stage The stage to record into
 * @param {object} model The loaded model, for entity attribution
 * @param {object} scene The walkable scene
 */
function collectDisplacement(stage, model, scene) {
  if (typeof scene?.walk !== 'function') {
    return
  }

  const placed = []
  const localCentres = new Map()
  let walkedMeshes = 0

  for (const walked of scene.walk()) {
    const mesh = walked[2]
    const geometry = mesh?.geometry

    if (typeof geometry?.getVertexCount !== 'function') {
      continue
    }

    // NO dedup by localID, unlike collectMeshes. That stage measures local
    // bounds, which are identical for every placement of a shared geometry,
    // so deduping is free there. Here the placement IS the measurement:
    // extractMappedItem (IFC) and the AP214 occurrence stack emit one walk
    // entry per instance, and skipping the repeats would hide a flung-away
    // instance of an otherwise well-placed window or fastener — and compute
    // the robust centre from an unrepresentative sample besides.
    ++walkedMeshes

    const count = geometry.getVertexCount()

    if (count === 0) {
      continue
    }

    // Local bounds are placement-invariant, so they are read once per
    // geometry however many times it is instanced. Without this, dropping
    // the dedup above would multiply the getPoint() wasm crossings by the
    // instance count on exactly the large models this tool is for.
    if (!localCentres.has(mesh.localID)) {
      localCentres.set(mesh.localID, localCentre(geometry, count))
    }

    const local = localCentres.get(mesh.localID)

    if (local === undefined) {
      continue
    }

    const centre = placeCentre(local, walked[0])

    if (centre === undefined) {
      continue
    }

    // walked[4] is the owning product; mesh.localID names the shared
    // representation item. With every placement now scored separately, the
    // latter would print the same expressID on all N rows of an instanced
    // geometry — and naming the product is what this stage is for.
    placed.push({element: walked[4], centre, vertices: count})
  }

  // Meshes WALKED, not meshes placed. `fired` answers "did this probe see
  // anything", so counting only successes would report a model whose every
  // placement was unusable as a dead probe — and would make fired identical
  // to measured, hiding the skipped ones.
  stage.fired = walkedMeshes

  if (placed.length === 0) {
    return
  }

  const centre = robustCentre(placed.map((each) => each.centre))

  for (const each of placed) {
    const offset = [0, 1, 2].map((axis) => each.centre[axis] - centre[axis])

    stage.record(Math.hypot(offset[0], offset[1], offset[2]), () => ({
      ...describeEntity(each.element),
      vertices: each.vertices,
      centre: each.centre.map((value) => Number(value.toFixed(1))),
    }))
  }
}


/**
 * Format a number for a report column.
 *
 * @param {number} value The value
 * @return {string} Fixed notation for human-scale values, exponential otherwise
 */
function fmt(value) {
  if (value === 0) {
    return '0'
  }

  return Math.abs(value) >= 1e-4 && Math.abs(value) < 1e6 ?
    value.toFixed(4) :
    value.toExponential(2)
}


/**
 * Print one stage's findings.
 *
 * @param {Stage} stage The stage
 * @param {object} options Parsed CLI options
 * @return {object} A summary suitable for --json
 */
function reportStage(stage, options) {
  const median = stage.quantile(0.5)
  const p90 = stage.quantile(0.9)
  const threshold = options.limit ?? median * options.factor
  const outlierCount = stage.countAbove(threshold)
  const rows = stage.top.filter((row) => row.value > threshold)

  say(`\n## ${stage.name}`)

  if (stage.fired === 0) {
    say('  PROBE NEVER FIRED — this stage says nothing about the model.')
    say('  Expected when the model uses no geometry of this kind (an IFC of')
    say('  extrusions and polygonal face sets reaches neither loop nor face);')
    say('  a defect when it does. Do not read this as "clean".')

    return {name: stage.name, fired: 0, dead: true}
  }

  say(
      `  ${stage.fired} calls, ${stage.values.length} measured, ` +
      `median ${fmt(median)}, p90 ${fmt(p90)}, threshold ${fmt(threshold)}` +
      `${options.limit === undefined ? ` (${options.factor}x median)` : ' (--limit)'}`)

  if (stage.name === 'loop') {
    const labels = GAP_BUCKETS.map((edge) => `<${edge.toExponential(0)}`).concat('rest')

    say(`  point gaps: ${
      labels.map((label, i) => `${label} ${stage.extra.gaps[i]}`).join(', ')}`)
    say(
        `  wrap-duplicate loops: ${stage.extra.wrapDuplicates}, ` +
        `under 3 points: ${stage.extra.degenerate}`)
  }

  if (outlierCount === 0) {
    say('  no outliers')
  }

  for (const row of rows.slice(0, options.top)) {
    const {value, ...rest} = row
    const detail = Object.entries(rest)
      .filter(([, v]) => v !== undefined && v !== false)
      .map(([k, v]) => `${k}=${typeof v === 'number' && !Number.isInteger(v) ? fmt(v) : v}`)
      .join(' ')

    say(`  ${fmt(value).padStart(12)}  ${detail}`)
  }

  const shown = Math.min(rows.length, options.top)

  if (outlierCount > shown) {
    say(`  ... ${outlierCount - shown} more above threshold` +
      // Beyond `capacity` the rows themselves were never retained, so
      // --top cannot show them; only the count is recoverable. Say which
      // limit is biting rather than letting the reader assume --top.
      `${outlierCount > stage.capacity ? ' (only the count survives past ' +
        `${stage.capacity} retained rows — raise --top to retain more)` : ''}`)
  }

  return {
    name: stage.name,
    fired: stage.fired,
    measured: stage.values.length,
    median,
    p90,
    threshold,
    outlierCount,
    outliers: rows.slice(0, options.top),
    extra: stage.extra,
  }
}


/**
 * Load the model and report.
 *
 * @return {Promise<number>} Process exit code
 */
async function main() {
  let options

  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(`${error.message}\n`)
    console.error('run with --help for usage')

    return EXIT_USAGE
  }

  // Usage text is the file's own header comment: one copy, so the flags
  // documented and the flags parsed cannot drift apart.
  if (options.help || options.model === undefined) {
    const header = fs.readFileSync(new URL(import.meta.url), 'utf8')
      .split('\n */')[0]
      .split('\n')
      .slice(2)
      .map((line) => line.replace(/^\s*\* ?/, ''))

    console.error(header.join('\n'))

    return options.help ? 0 : EXIT_USAGE
  }

  say = options.json ? console.error : console.log

  // Must be set before the extraction object is constructed, which happens
  // inside the load: AP214 reads it once, at construction.
  if (options.stages.includes('face')) {
    process.env.CONWAY_DISABLE_STAGED_FACES = '1'
  }

  const compiled = (rel) => import(new URL(`compiled/${rel}`, REPO_ROOT).href)

  const [
    {ConwayGeometry},
    {AP214GeometryExtraction},
    {IfcGeometryExtraction},
    {ConwayModelLoader},
    {default: Logger},
    {default: Environment},
  ] = await Promise.all([
    compiled('dependencies/conway-geom/index.js'),
    compiled('src/AP214E3_2010/ap214_geometry_extraction.js'),
    compiled('src/ifc/ifc_geometry_extraction.js'),
    compiled('src/loaders/conway_model_loader.js'),
    compiled('src/logging/logger.js'),
    compiled('src/utilities/environment.js'),
  ])

  Environment.checkEnvironment()
  Logger.initializeWasmCallbacks()

  // Conway's own warnings and errors are a diagnostic in their own right —
  // "Error extracting fill area style color" was one of five defects the
  // AmazingHand model surfaced — but they repeat per entity, so they are
  // counted by message rather than echoed.
  const messages = new Map()

  Logger.setSink((level, message) => {
    if (level === 'warning' || level === 'error') {
      const key = `${level}: ${message.split('\n')[0].slice(0, 120)}`

      messages.set(key, (messages.get(key) ?? 0) + 1)
    }

    if (!options.quiet) {
      console.error(message)
    }
  })

  const stages = new Map(
      options.stages.map((name) => [name, new Stage(name, Math.max(options.top * 4, 40))]))

  const probesInstalled = {
    curve: stages.has('curve') ?
      installCurveProbe(stages.get('curve'), {AP214GeometryExtraction, IfcGeometryExtraction}) : 0,
    loop: stages.has('loop') ? installLoopProbe(stages.get('loop'), ConwayGeometry) : 0,
    face: stages.has('face') ? installFaceProbe(stages.get('face'), ConwayGeometry) : 0,
  }

  for (const [name, count] of Object.entries(probesInstalled)) {
    if (stages.has(name) && count === 0) {
      console.error(
          `\nFATAL: could not install the '${name}' probe — the method it wraps no longer ` +
          'exists. Fix scripts/debug/model_report.mjs before trusting any result.')

      return EXIT_PROBE_DEAD
    }
  }

  const data = new Uint8Array(fs.readFileSync(options.model))
  const started = Date.now()
  const [model, scene] = await ConwayModelLoader.loadModelWithScene(data, true, options.csgDepth, 0)
  const elapsed = Date.now() - started

  if (stages.has('mesh')) {
    collectMeshes(stages.get('mesh'), model, scene)
  }

  let displacementError

  if (stages.has('displacement')) {
    try {
      collectDisplacement(stages.get('displacement'), model, scene)
    } catch (err) {
      // One stage's programming error must not discard the curve/loop/face/
      // mesh reports this run already collected — they are usually the ones
      // being read.
      //
      // Printed HERE rather than stashed on stage.extra. A throw leaves
      // `fired` at 0, so reportStage takes its dead branch and prints
      // "PROBE NEVER FIRED ... Expected when the model uses no geometry of
      // this kind" — which reads as an explanation rather than a failure,
      // and drops `extra` from --json entirely. That is precisely the
      // false-clean reading the guard in placeCentre exists to prevent, so
      // it cannot be left to a channel the reporter might not show.
      displacementError = String(err?.message ?? err)
    }
  }

  say(`\n# ${path.basename(options.model)}`)
  say(
      `  ${(data.length / 1024 / 1024).toFixed(2)} MB, loaded in ${elapsed} ms, ` +
      `${options.stages.join(',')}`)

  const reports = [...stages.values()].map((stage) => reportStage(stage, options))

  if (displacementError !== undefined) {
    say(
        `\n## displacement\n  STAGE FAILED — ${displacementError}\n` +
        '  This stage measured nothing because it threw, NOT because the\n' +
        '  model is clean. The other stages above are unaffected.')
  }

  if (messages.size > 0) {
    const ranked = [...messages].sort((a, b) => b[1] - a[1])
    const total = ranked.reduce((sum, [, count]) => sum + count, 0)

    say(`\n## conway diagnostics (${total} messages, ${messages.size} distinct)`)

    for (const [message, count] of ranked.slice(0, options.top)) {
      say(`  ${String(count).padStart(6)}x  ${message}`)
    }

    if (ranked.length > options.top) {
      say(`  ... ${ranked.length - options.top} more distinct messages`)
    }
  }

  const dead = reports.filter((report) => report.dead)

  if (options.json) {
    console.log(`\n${JSON.stringify({model: options.model, elapsed, reports,
      diagnostics: Object.fromEntries(messages)}, null, 1)}`)
  }

  // Non-zero only when the run learned nothing it was asked to learn: a
  // stage named on --stage that produced no observations, or a default run
  // where every stage was silent. Under the default all-stages run a silent
  // stage is routine (see reportStage), and failing the process for it would
  // train the reader to ignore the exit code.
  if (dead.length > 0 && (options.stagesExplicit || dead.length === reports.length)) {
    say(
        `\nExiting ${EXIT_PROBE_DEAD}: ${dead.map((d) => d.name).join(', ')} never fired. ` +
        'A stage that never fired is not a clean result.')

    return EXIT_PROBE_DEAD
  }

  return 0
}

process.exitCode = await main()
