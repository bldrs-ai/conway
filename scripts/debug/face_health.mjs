#!/usr/bin/env node
/**
 * Per-FACE triangulation health for one solid: which of a face's own trim-loop
 * points reached its emitted geometry.
 *
 * For each ADVANCED_FACE of the named solid this extracts the face alone into
 * a fresh IfcGeometry, welds its vertices by position, and compares the welded
 * mesh's OPEN (unpaired directed) edges against the face's own trim loops as
 * the extractor handed them to native.
 *
 * A correctly triangulated trimmed face has exactly one open boundary: its
 * loop polylines, each segment traversed once. Any open edge that is NOT a
 * consecutive pair of some loop is a SPURIOUS boundary - a dropped region, a
 * fold, or an overlap.
 *
 * ## Why this is not model_report.mjs
 *
 * `model_report.mjs` is an OUTLIER detector: it scores each entity against the
 * rest of the model, so a face that emits plausible geometry, of a plausible
 * size, in the right place, from a QUARTER of its own boundary reads as clean.
 * That is exactly the shape mapbox::earcut produces when it cannot bridge a
 * hole - `findHoleBridge` returns null, `eliminateHole` links nothing, and the
 * ring is dropped with no error logged anywhere.
 *
 * `mapped=` is the column that makes that visible, and the only one that does:
 * a dropped ring contributes no index at all, so not one of its points appears
 * in the output. Measured on `ADVANCED_FACE #19218` of `Right_Hand.step` while
 * bldrs-ai/test-models#65 was still open, three of its four rings dropped:
 *
 *     #19218 BSPLINE bounds=4 ... t=190 open=67 spurious=3 mapped=65/256
 *
 * Note `spurious` is 3 there. The dropped rings do not show up as spurious
 * boundary, because the face emits no edge along them to be spurious ABOUT -
 * which is why the ratio, not the edge census, is the signal to read first.
 * After the fix that face reads `t=3180 open=255 spurious=3 mapped=256/256`.
 *
 * Two of the three wrong diagnoses in that investigation came from trusting a
 * clean outlier report over a face that was missing most of itself. Reach for
 * this when a solid is visibly wrong - open shell, negative signed volume, a
 * hole where a surface should be - and the outlier stages are quiet.
 *
 * ## Probe validation
 *
 * The run prints the count of faces seen and refuses to report if none of the
 * named solid was reached, so a mistyped express ID reads as a failure rather
 * than as a clean solid. `loopSeg` is the loop segment count the `open` column
 * is being judged against, so a probe that failed to capture the loops at all
 * reads as `mapped=0/N`, not as a face with nothing spurious.
 *
 * Vertex data is copied out of the wasm heap with `.slice()` the moment the
 * face is reified and the heap views are re-read per face: a held `HEAPF32`
 * view detaches when the heap grows and then silently reads zeroes.
 *
 * ### THE ISOLATION FOLLOWS addOrStageFace, NOT THE GEOMETRY ARGUMENT
 *
 * `extractAdvancedFace` does not always tessellate into the geometry it is
 * passed. A face carrying its own STYLED_ITEM goes down a branch that builds a
 * FRESH `IfcGeometry` and registers it as a canonical mesh of its own
 * (ap214_geometry_extraction.ts, the `styledItemLocalID !== void 0` arm), and
 * the caller's buffer is never touched. Handing that path an isolation
 * geometry and then reading it back therefore reports an EMPTY face - `v=0
 * t=0 mapped=0/N` - which is this probe's own signature for a dropped ring.
 * Measured before this was fixed, 254 of solid `#3`'s 257 faces in
 * `data/nema-23-76mm.step` read that way, every one of them healthy. A probe
 * that cries "dropped ring" on a styled face is worse than no probe, because
 * the whole reason to reach for this one is that the outlier stages are quiet.
 *
 * So the redirect is installed one level down, on `addOrStageFace`, which both
 * branches funnel through: the real target is remembered, the tessellation is
 * routed into the isolation geometry, and the isolation geometry is appended
 * back into whichever buffer the extractor had chosen. Found by review on
 * bldrs-ai/conway#711.
 *
 * ### THE WELD BUCKET IS FLOAT32-SIZED, NOT A FIXED 1e-6
 *
 * Emitted vertices are `HEAPF32` - float32 - while the trim-loop points are
 * the doubles the extractor handed to native, so the same point differs
 * between the two by up to half a float32 ULP. A FIXED 1e-6 bucket is
 * therefore only wide enough for SMALL coordinates. On a millimetre-authored
 * model with coordinates around 76, half a ULP is 3.6e-6 - nearly four
 * buckets - and the 26-neighbour search reaches one. Measured on
 * `data/nema-23-76mm.step` solid `#3` before this was fixed: 674 loop points
 * across 28 of 257 faces read as unmapped, and EVERY ONE of them had an
 * emitted vertex within 0.49 of a float32 ULP (0.19 to 0.49, at magnitudes
 * 68.8 to 76.7). Not one was a dropped ring; the probe could not see points
 * that were there.
 *
 * That matters more than an ordinary off-by-a-bit, because `mapped=` is the
 * column this file's own header tells the next reader to trust, and a probe
 * that invents dropped rings on healthy geometry is worse than no probe.
 * This is the third false positive of exactly that shape, after the
 * styled-face blindness and the area units below.
 *
 * So the bucket is derived per face from the largest coordinate it involves:
 * `max(1e-6, maxAbs * 8 * 2^-24)`. The second term is eight times the worst
 * float32 storage error at that magnitude, so the quantisation of the two
 * spellings lands in the same bucket or an adjacent one, which the neighbour
 * search already covers. The 1e-6 floor keeps small-coordinate models reading
 * exactly as they did - `Right_Hand.step` is metre-authored around 0.1, where
 * the float32 term is 5e-8 and the floor is what applies. Note the floor is
 * in RAW FILE UNITS, so it is a tighter physical tolerance on a millimetre
 * file than on a metre one; that asymmetry only bites below the float32 term,
 * which is where it does not matter. The bucket in force is printed per row.
 * Found by review on bldrs-ai/conway#711.
 *
 * ### AREA IS CONVERTED FROM THE FILE'S OWN LENGTH UNIT
 *
 * STEP geometry is emitted in RAW FILE COORDINATES - the metre conversion
 * rides on the root scene transform, not on the mesh (see
 * `rootUnitScaleTransform`, conway#458). So a fixed 1e6 scaling of the area
 * column is only right for a metre-authored file, and reports a millimetre
 * one (`data/create-a-tube.step`) 1e6 times too large. The factor is read from
 * the representation's own LENGTH_UNIT instead. When a model declares more
 * than one, or none, no conversion is invented: the column is labelled `fu2`,
 * file units squared, and says so in the header line.
 *
 * Usage:
 *   node scripts/debug/face_health.mjs <model> <solid express id>
 *
 * Example - the AmazingHand proximal shell, whose b-spline faces wrap their
 * surface's u closure (bldrs-ai/test-models#65):
 *
 *   node scripts/debug/face_health.mjs Right_Hand.step 19715
 *
 * Reads `compiled/`, not `src/`, so rebuild (`yarn build-incremental`, or
 * `yarn build-codex-MT` if conway-geom changed) before trusting a run.
 */
import fs from 'node:fs'
import {assertWasmFresh} from './wasmFreshness.mjs'

assertWasmFresh('face_health')

const REPO_ROOT = new URL('../../', import.meta.url)
const compiled = (rel) => import(new URL(`compiled/${rel}`, REPO_ROOT).href)
const [modelPath, wantSolid] = process.argv.slice(2)

if (modelPath === undefined || wantSolid === undefined) {
  console.error('usage: node scripts/debug/face_health.mjs <model> <solid express id>')
  process.exit(2)
}

process.env.CONWAY_DISABLE_STAGED_FACES = '1'

const [{AP214GeometryExtraction}, {ConwayModelLoader}, {default: Logger},
  {default: Environment}, {ConwayGeometry},
  {global_unit_assigned_context, length_unit}] = await Promise.all([
    compiled('src/AP214E3_2010/ap214_geometry_extraction.js'),
    compiled('src/loaders/conway_model_loader.js'),
    compiled('src/logging/logger.js'),
    compiled('src/utilities/environment.js'),
    compiled('dependencies/conway-geom/index.js'),
    compiled('src/AP214E3_2010/AP214E3_2010_gen/index.js'),
  ])
let conwayWasm
const oi = ConwayGeometry.prototype.initialize
ConwayGeometry.prototype.initialize = function(...a) { conwayWasm = this; return oi.apply(this, a) }
Environment.checkEnvironment(); Logger.initializeWasmCallbacks()
Logger.setSink((l, m) => { const s = String(m); if (/Error extracting face|no geometry|not valid/.test(s)) console.error(`NATIVE: ${s.slice(0, 200)}`) })

// Weld/lookup bucket, in raw file units. See "THE WELD BUCKET IS
// FLOAT32-SIZED" above: the floor, and the per-magnitude term that is eight
// times the worst float32 storage error at a given coordinate size.
const BUCKET_FLOOR = 1e-6
const BUCKET_PER_UNIT = 8 * Math.pow(2, -24)
const bucketFor = (maxAbs) => Math.max(BUCKET_FLOOR, maxAbs * BUCKET_PER_UNIT)
const keyWith = (q) => (x, y, z) =>
  `${Math.round(x * q)},${Math.round(y * q)},${Math.round(z * q)}`

const original = AP214GeometryExtraction.prototype.extractAdvancedFace
const realAddOrStageFace = AP214GeometryExtraction.prototype.addOrStageFace
const rows = []
let fired = 0

// Metres per file unit, read the way rootUnitScaleTransform reads it - through
// the representation's own context_of_items - and read WHILE THAT RUNS. It
// cannot be read afterwards: the loader's model resolves references lazily
// against a buffer it no longer holds once the load returns, and every
// context_of_items then throws "Value in STEP was incorrectly typed".
//
// A set, not a scalar, so a model declaring two length units is reported
// rather than silently taking one of them. See "AREA IS CONVERTED FROM THE
// FILE'S OWN LENGTH UNIT" above.
const metresPerUnit = new Set()
const realRootUnitScale = AP214GeometryExtraction.prototype.rootUnitScaleTransform

AP214GeometryExtraction.prototype.rootUnitScaleTransform = function(representation) {
  try {
    const declared =
      representation.context_of_items?.findVariant?.(global_unit_assigned_context)
          ?.units?.find((unit) => unit.findVariant(length_unit))?.findVariant(length_unit)
    const inMetres = declared ? this.convertToMetres(declared) : undefined
    if (inMetres !== undefined) metresPerUnit.add(inMetres)
  } catch { /* unreadable context: not a unit declaration this can use */ }
  return realRootUnitScale.call(this, representation)
}

AP214GeometryExtraction.prototype.extractAdvancedFace = function(from, geometry, parentLocalID) {
  if (this.model.getElementByLocalID?.(parentLocalID)?.expressID !== Number(wantSolid)) {
    return original.call(this, from, geometry, parentLocalID)
  }
  ++fired

  // Capture the loops exactly as they are handed to native, in the order they
  // are handed over (index 0 is what earcut reads as the outer ring).
  const cm = this.conwayModel
  const realCreate = cm.createBound3D.bind(cm)
  const loops = []
  cm.createBound3D = (params) => {
    const c = params.curve
    const n = c?.getPointsSize?.() ?? 0
    const pts = []
    for (let i = 0; i < n; ++i) { const p = c.get3d(i); pts.push([p.x, p.y, p.z]) }
    loops.push({pts, type: params.type, seam: params.seam, seamPair: params.seamPair,
      orientation: params.orientation})
    return realCreate(params)
  }

  // Route the tessellation into an isolation geometry at addOrStageFace - the
  // one point both of extractAdvancedFace's branches pass through - and give
  // the extractor's own target the result afterwards, so the model still loads
  // with every face in it. See "THE ISOLATION FOLLOWS addOrStageFace" above.
  //
  // The own property shadows the prototype for this call only, and is deleted
  // again in the finally, so a nested or later face is unaffected.
  //
  // One consequence to know about: extractAdvancedFace's own face-accounting
  // reads its target's triangle count around this call, and the diversion
  // makes that delta zero. `trackFaceAccounting` is off in every run this
  // probe is used for, and nothing here reads those counters; a run that wants
  // them wants the extractor unwrapped.
  const fresh = new this.wasmModule.IfcGeometry()
  let realTarget
  this.addOrStageFace = function(parameters, target) {
    realTarget = target
    return realAddOrStageFace.call(this, parameters, fresh)
  }
  try {
    // The extractor is handed its REAL target, not the isolation geometry: the
    // redirect above is what captures that target and diverts the
    // tessellation, and passing `fresh` here as well would make the extractor
    // hand the face back to itself and count it twice - measured, that read as
    // #19218 emitting 6360 triangles instead of 3180.
    original.call(this, from, geometry, parentLocalID)
  } finally {
    delete this.addOrStageFace
    cm.createBound3D = realCreate
  }

  // `realTarget` is undefined only if the face never reached tessellation at
  // all - a surface the extractor declined. Nothing was produced to hand back
  // in that case, and the row below reports the face as empty, which it is.
  ;(realTarget ?? geometry).appendGeometry(fresh)
  fresh.reify({x: 0, y: 0, z: 0})

  const wasm = conwayWasm.wasmModule
  const vd = wasm.HEAPF32.slice(fresh.GetVertexData() / 4, fresh.GetVertexData() / 4 + fresh.GetVertexDataSize())
  const id = wasm.HEAPU32.slice(fresh.GetIndexData() / 4, fresh.GetIndexData() / 4 + fresh.GetIndexDataSize())
  const nv = vd.length / 6
  const nt = id.length / 3

  // The bucket is sized for THIS face: both spellings of its largest
  // coordinate have to land in the same bucket or a neighbouring one.
  let maxAbs = 0
  for (let i = 0; i < nv; ++i) {
    maxAbs = Math.max(maxAbs, Math.abs(vd[i * 6]), Math.abs(vd[i * 6 + 1]),
        Math.abs(vd[i * 6 + 2]))
  }
  for (const loop of loops) {
    for (const p of loop.pts) {
      maxAbs = Math.max(maxAbs, Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2]))
    }
  }
  const bucket = bucketFor(maxAbs)
  const Q = 1 / bucket
  const key = keyWith(Q)

  // Weld by quantized position.
  const wm = new Map()
  const widx = new Int32Array(nv)
  for (let i = 0; i < nv; ++i) {
    const k = key(vd[i * 6], vd[i * 6 + 1], vd[i * 6 + 2])
    let w = wm.get(k); if (w === undefined) { w = wm.size; wm.set(k, w) }
    widx[i] = w
  }
  const edges = new Set()
  let area = 0, degen = 0
  for (let t = 0; t < nt; ++t) {
    const a = id[t * 3], b = id[t * 3 + 1], c = id[t * 3 + 2]
    const A = [vd[a * 6], vd[a * 6 + 1], vd[a * 6 + 2]]
    const B = [vd[b * 6], vd[b * 6 + 1], vd[b * 6 + 2]]
    const C = [vd[c * 6], vd[c * 6 + 1], vd[c * 6 + 2]]
    const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]]
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0]
    const m = Math.hypot(cx, cy, cz)
    area += m / 2
    if (m === 0) ++degen
    const wa = widx[a], wb = widx[b], wc = widx[c]
    if (wa === wb || wb === wc || wc === wa) continue
    edges.add(`${wa}_${wb}`); edges.add(`${wb}_${wc}`); edges.add(`${wc}_${wa}`)
  }
  const open = []
  for (const k of edges) { const [u, v] = k.split('_'); if (!edges.has(`${v}_${u}`)) open.push(k) }

  // Expected boundary: consecutive pairs of every loop, either direction.
  const expected = new Set()
  let loopSegments = 0, loopPointsMapped = 0, loopPointsTotal = 0
  const idOf = (p) => {
    // exact bucket first, then the 26 neighbours (float32 emit vs double loop)
    const w = wm.get(key(p[0], p[1], p[2]))
    if (w !== undefined) return w
    const bx = Math.round(p[0] * Q), by = Math.round(p[1] * Q), bz = Math.round(p[2] * Q)
    for (let dx = -1; dx <= 1; ++dx) for (let dy = -1; dy <= 1; ++dy) for (let dz = -1; dz <= 1; ++dz) {
      const q = wm.get(`${bx + dx},${by + dy},${bz + dz}`)
      if (q !== undefined) return q
    }
    return undefined
  }
  for (const loop of loops) {
    const ids = loop.pts.map(idOf)
    loopPointsTotal += ids.length
    loopPointsMapped += ids.filter((x) => x !== undefined).length
    for (let i = 0; i + 1 < ids.length; ++i) {
      if (ids[i] === undefined || ids[i + 1] === undefined || ids[i] === ids[i + 1]) continue
      expected.add(`${ids[i]}_${ids[i + 1]}`); expected.add(`${ids[i + 1]}_${ids[i]}`)
      ++loopSegments
    }
  }
  const spurious = open.filter((k) => !expected.has(k))

  rows.push({
    express: from.expressID,
    surface: from.face_geometry?.constructor?.name?.replace('b_spline_surface_with_knots', 'BSPLINE'),
    nBounds: loops.length,
    loopSizes: loops.map((l) => l.pts.length),
    types: loops.map((l) => l.type),
    seamPair: loops.map((l) => (l.seamPair ? 1 : 0)),
    seam: loops.map((l) => (l.seam ? 1 : 0)),
    nv, nt, welded: wm.size, area, degen, bucket,
    open: open.length, spurious: spurious.length,
    loopSegments, loopPointsMapped, loopPointsTotal,
  })
  fresh.delete?.()
}

const data = new Uint8Array(fs.readFileSync(modelPath))
await ConwayModelLoader.loadModelWithScene(data, true, 20, 0)
if (fired === 0) { console.error(`PROBE NEVER FIRED for solid #${wantSolid}`); process.exit(2) }

const mmPerUnit = metresPerUnit.size === 1 ? [...metresPerUnit][0] * 1e3 : undefined
const areaScale = mmPerUnit === undefined ? 1 : mmPerUnit * mmPerUnit
const areaUnit = mmPerUnit === undefined ? 'fu2' : 'mm2'

console.log(`# face health, solid #${wantSolid}: ${fired} faces seen`)
console.log('  spurious = welded open edges that are NOT a segment of any trim loop')
console.log('  mapped   = loop points found in the emitted mesh (low => the face lost its boundary)')
console.log(mmPerUnit === undefined ?
  `  area     = FILE UNITS squared (fu2): the model declares ${metresPerUnit.size} length units` :
  `  area     = mm2, from the file's own length unit (1 file unit = ${mmPerUnit} mm)`)
rows.sort((a, b) => b.spurious - a.spurious)
let totSpur = 0
for (const r of rows) {
  totSpur += r.spurious
  console.log(
    `  #${String(r.express).padEnd(6)} ${String(r.surface).padEnd(26)} bounds=${r.nBounds} ` +
    `types=[${r.types}] seamPair=[${r.seamPair}] loopPts=[${r.loopSizes}] ` +
    `v=${r.nv}/${r.welded} t=${r.nt} area=${(r.area * areaScale).toFixed(2)}${areaUnit} degen=${r.degen} ` +
    `bucket=${r.bucket.toExponential(2)} open=${r.open} spurious=${r.spurious} loopSeg=${r.loopSegments} mapped=${r.loopPointsMapped}/${r.loopPointsTotal}`)
}
console.log(`TOTAL spurious open edges: ${totSpur}`)
