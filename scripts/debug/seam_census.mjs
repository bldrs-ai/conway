#!/usr/bin/env node
/**
 * Watertightness census: every unpaired edge of every solid, classified by
 * what happened to that piece of boundary on the OTHER side.
 *
 * A closed B-rep solid tessellates to a closed mesh only if every boundary
 * segment one face emits is emitted, reversed, by its neighbour. This welds
 * each solid's faces together (one float32-sized bucket per solid, as in
 * face_health.mjs), finds the directed edges whose reverse is absent, and
 * sorts each one into a cause.
 *
 * First, whether it is a gap at all. An edge emitted TWICE in the same
 * direction has its vertices shared and nothing missing; the two triangles
 * just disagree about winding:
 *
 *   flipped-in-face    both triangles belong to one face: the face is wound
 *                      inconsistently inside itself.
 *   flipped-across     they belong to two faces: one of the pair is wound
 *                      against its shell. The orientation vote below says which.
 *
 * Share draws with `DoubleSide`, so a flipped triangle is not culled, but
 * three.js negates the normal of a back-facing triangle when it shades it, so
 * a flipped triangle can still show as a wrongly lit streak.
 *
 * An edge emitted once is a real gap, and the question is what the other side
 * did with that piece of boundary:
 *
 *   interior           the edge is not a segment of its own face's trim loops.
 *                      Either the face has a hole of its own (face_health
 *                      .mjs's `spurious`), or it skipped one of its own loop
 *                      points and chorded across it; the neighbour that kept
 *                      that point then reads neighbour-dropped.
 *   neighbour-dropped  the edge is a loop segment, the neighbour's loop holds
 *                      the SAME segment, and the neighbour emitted no vertex at
 *                      one of its ends. earcut's filterPoints deletes collinear
 *                      and duplicate ring points, so this is that signature.
 *   neighbour-split    same, but the neighbour emitted a vertex strictly
 *                      inside the segment: a T-junction, such as a CDT Steiner
 *                      point on a constraint edge.
 *   neighbour-missing  the neighbour holds the segment and both its ends, and
 *                      emitted neither it nor anything on it: a dropped region.
 *   sampling-differs   no other loop holds this segment, but another face's
 *                      loop passes within tolerance of it. The two faces
 *                      sampled one curve differently. The extractor memoises
 *                      each trimmed edge under its EDGE_CURVE, so the adjacent
 *                      face reuses the same polyline (ap214_geometry_extraction
 *                      .ts, extractAdvancedFace), and this class should be
 *                      empty. A non-empty count names an edge the memo missed.
 *   no-partner         no other face's loop comes near. The rim of a genuinely
 *                      open shell, or a gap in the source model: the floor, not
 *                      a defect (conway#670's "legitimate" and "source gap").
 *
 * The orientation vote then finds faces wound against most of their shared
 * boundary, and the census is re-run with them turned around. What is left in
 * `reoriented` is the gaps plus faces inconsistent within themselves; a whole
 * face reversed against its shell no longer counts.
 *
 * The per-face probe (loops captured at createBound3D, tessellation diverted
 * at addOrStageFace, heap copied with .slice(), bucket sized from float32
 * ULPs, area units from the file's LENGTH_UNIT) is face_health.mjs's. Read its
 * header for why each of those is the way it is; every one was a measured
 * false positive before it was fixed.
 *
 * Usage:
 *   node scripts/debug/seam_census.mjs <model> [solid express id] [--edges N]
 *
 * `--edges N` lists the N longest unpaired edges with their faces and class.
 *
 * Reads `compiled/`, not `src/`, so rebuild (`yarn build-incremental`, or
 * `yarn build-codex-MT` if conway-geom changed) before trusting a run.
 * Made for conway-geom#215 (Right_Hand.step's dashed seams) and conway#670.
 */
import fs from 'node:fs'
import {assertWasmFresh} from './wasmFreshness.mjs'

assertWasmFresh('seam_census')

const REPO_ROOT = new URL('../../', import.meta.url)
const compiled = (rel) => import(new URL(`compiled/${rel}`, REPO_ROOT).href)

const args = process.argv.slice(2)
const edgesFlag = args.indexOf('--edges')
const listEdges = edgesFlag >= 0 ? Number(args.splice(edgesFlag, 2)[1]) : 0
const [modelPath, wantSolidArg] = args
const wantSolid = wantSolidArg === undefined ? undefined : Number(wantSolidArg)

if (modelPath === undefined) {
  console.error('usage: node scripts/debug/seam_census.mjs <model> [solid express id] [--edges N]')
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
Logger.setSink(() => {})

const BUCKET_FLOOR = 1e-6
const BUCKET_PER_UNIT = 8 * Math.pow(2, -24)
const bucketFor = (maxAbs) => Math.max(BUCKET_FLOOR, maxAbs * BUCKET_PER_UNIT)

const original = AP214GeometryExtraction.prototype.extractAdvancedFace
const realAddOrStageFace = AP214GeometryExtraction.prototype.addOrStageFace

// solid express id -> [{express, surface, loops: [[x,y,z]...][], pos: Float32Array, idx: Uint32Array}]
const solids = new Map()

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
  const solid = this.model.getElementByLocalID?.(parentLocalID)?.expressID
  if (solid === undefined || (wantSolid !== undefined && solid !== wantSolid)) {
    return original.call(this, from, geometry, parentLocalID)
  }

  const cm = this.conwayModel
  const realCreate = cm.createBound3D.bind(cm)
  const loops = []
  cm.createBound3D = (params) => {
    const c = params.curve
    const n = c?.getPointsSize?.() ?? 0
    const pts = []
    for (let i = 0; i < n; ++i) { const p = c.get3d(i); pts.push([p.x, p.y, p.z]) }
    loops.push(pts)
    return realCreate(params)
  }

  const fresh = new this.wasmModule.IfcGeometry()
  let realTarget
  this.addOrStageFace = function(parameters, target) {
    realTarget = target
    return realAddOrStageFace.call(this, parameters, fresh)
  }
  try {
    original.call(this, from, geometry, parentLocalID)
  } finally {
    delete this.addOrStageFace
    cm.createBound3D = realCreate
  }
  ;(realTarget ?? geometry).appendGeometry(fresh)
  fresh.reify({x: 0, y: 0, z: 0})

  const wasm = conwayWasm.wasmModule
  const vd = wasm.HEAPF32.slice(fresh.GetVertexData() / 4, fresh.GetVertexData() / 4 + fresh.GetVertexDataSize())
  const idx = wasm.HEAPU32.slice(fresh.GetIndexData() / 4, fresh.GetIndexData() / 4 + fresh.GetIndexDataSize())
  const nv = vd.length / 6
  const pos = new Float32Array(nv * 3)
  for (let i = 0; i < nv; ++i) {
    pos[i * 3] = vd[i * 6]; pos[i * 3 + 1] = vd[i * 6 + 1]; pos[i * 3 + 2] = vd[i * 6 + 2]
  }

  if (!solids.has(solid)) solids.set(solid, [])
  solids.get(solid).push({
    express: from.expressID,
    surface: from.face_geometry?.constructor?.name?.replace('b_spline_surface_with_knots', 'bspline') ?? '?',
    sameSense: from.same_sense,
    loops, pos, idx,
  })
  fresh.delete?.()
}

const data = new Uint8Array(fs.readFileSync(modelPath))
await ConwayModelLoader.loadModelWithScene(data, true, 20, 0)
if (solids.size === 0) {
  console.error(wantSolid === undefined ? 'PROBE NEVER FIRED: no ADVANCED_FACE was extracted' :
    `PROBE NEVER FIRED for solid #${wantSolid}`)
  process.exit(2)
}

const mmPerUnit = metresPerUnit.size === 1 ? [...metresPerUnit][0] * 1e3 : undefined
const lenScale = mmPerUnit ?? 1
const lenUnit = mmPerUnit === undefined ? 'fu' : 'mm'

const CLASSES = ['flipped-in-face', 'flipped-across', 'interior', 'neighbour-dropped',
  'neighbour-split', 'neighbour-missing', 'sampling-differs', 'no-partner']

// Distance from p to segment ab, and the parameter of the foot along ab.
function toSegment(p, a, b) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len2 = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2]
  let t = len2 === 0 ? 0 :
    ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / len2
  const tc = Math.min(1, Math.max(0, t))
  const q = [a[0] + ab[0] * tc - p[0], a[1] + ab[1] * tc - p[1], a[2] + ab[2] * tc - p[2]]
  return {d: Math.hypot(q[0], q[1], q[2]), t}
}

// Smallest distance between two segments, sampled. Exact closest-approach is
// not needed: this only decides whether another loop runs ALONG an edge, and a
// loop that does passes within tolerance of every sample.
function segmentNearSegment(a, b, c, d, tol) {
  for (const s of [0.25, 0.5, 0.75]) {
    const p = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s]
    if (toSegment(p, c, d).d > tol) return false
  }
  return true
}

function censusSolid(faces) {
  let maxAbs = 0
  for (const f of faces) {
    for (const v of f.pos) maxAbs = Math.max(maxAbs, Math.abs(v))
    for (const loop of f.loops) for (const p of loop) maxAbs = Math.max(maxAbs, ...p.map(Math.abs))
  }
  const bucket = bucketFor(maxAbs)
  const Q = 1 / bucket
  const cell = (p) => [Math.round(p[0] * Q), Math.round(p[1] * Q), Math.round(p[2] * Q)]

  // One weld over the whole solid. Emitted vertices go in first, so a loop
  // point that the face DID emit resolves to the emitted id, and a loop point
  // that no face emitted gets an id of its own, marked unemitted.
  const weld = new Map()
  const where = []
  const lookup = (p) => {
    const [bx, by, bz] = cell(p)
    const exact = weld.get(`${bx},${by},${bz}`)
    if (exact !== undefined) return exact
    for (let dx = -1; dx <= 1; ++dx) for (let dy = -1; dy <= 1; ++dy) for (let dz = -1; dz <= 1; ++dz) {
      const q = weld.get(`${bx + dx},${by + dy},${bz + dz}`)
      if (q !== undefined) return q
    }
    return undefined
  }
  const intern = (p) => {
    let w = lookup(p)
    if (w === undefined) { w = where.length; where.push(p); weld.set(cell(p).join(','), w) }
    return w
  }

  let triangles = 0
  for (const f of faces) {
    const nv = f.pos.length / 3
    f.wid = new Int32Array(nv)
    for (let i = 0; i < nv; ++i) f.wid[i] = intern([f.pos[i * 3], f.pos[i * 3 + 1], f.pos[i * 3 + 2]])
    f.emittedVerts = new Set(f.wid)
    triangles += f.idx.length / 3
  }

  // Every loop segment, undirected, with each face that holds it. A face whose
  // loops run along a seam holds that segment twice, once each way, so the
  // occurrence list is a multiset: its own second occurrence is its partner.
  const loopSegs = new Map() // "min_max" -> [{face, from, to}]
  const loopSegList = [] // [{face, a, b}] in positions, for the proximity search
  for (let fi = 0; fi < faces.length; ++fi) {
    for (const loop of faces[fi].loops) {
      const ids = loop.map(intern)
      for (let i = 0; i + 1 < ids.length; ++i) {
        if (ids[i] === ids[i + 1]) continue
        const k = ids[i] < ids[i + 1] ? `${ids[i]}_${ids[i + 1]}` : `${ids[i + 1]}_${ids[i]}`
        if (!loopSegs.has(k)) loopSegs.set(k, [])
        loopSegs.get(k).push({face: fi, from: ids[i], to: ids[i + 1]})
        loopSegList.push({face: fi, a: where[ids[i]], b: where[ids[i + 1]]})
      }
    }
  }
  const segKey = (a, b) => a < b ? `${a}_${b}` : `${b}_${a}`

  // Directed edges per face, with the faces in `reversed` wound backwards.
  // Run twice: as emitted, and with the faces the orientation vote below
  // finds reversed turned around, so the second census counts only gaps.
  const buildEdges = (reversed) => {
    const emittedBy = new Map() // "a_b" -> [face index]
    const faceEdges = faces.map(() => new Set())
    for (let fi = 0; fi < faces.length; ++fi) {
      const f = faces[fi]
      for (let t = 0; t < f.idx.length; t += 3) {
        const w = [f.wid[f.idx[t]], f.wid[f.idx[t + 1]], f.wid[f.idx[t + 2]]]
        if (w[0] === w[1] || w[1] === w[2] || w[2] === w[0]) continue
        if (reversed.has(fi)) w.reverse()
        for (let k = 0; k < 3; ++k) {
          const e = `${w[k]}_${w[(k + 1) % 3]}`
          faceEdges[fi].add(e)
          if (!emittedBy.has(e)) emittedBy.set(e, [])
          emittedBy.get(e).push(fi)
        }
      }
    }
    return {emittedBy, faceEdges}
  }

  const onSegTol = 4 * bucket
  const classify = ({emittedBy, faceEdges}) => {
    const unpaired = []
    for (const [e, owners] of emittedBy) {
      const [a, b] = e.split('_').map(Number)
      if (emittedBy.has(`${b}_${a}`)) continue
      const f = owners[0]
      const pa = where[a], pb = where[b]
      const length = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2])
      const occ = loopSegs.get(segKey(a, b)) ?? []
      const ownIndex = occ.findIndex((o) => o.face === f)
      let cls
      let partner
      if (owners.length > 1) {
        // Emitted twice, the same way both times: the vertices are shared and
        // nothing is missing, so this is orientation, not a gap.
        const other = owners.find((o) => o !== f)
        if (other !== undefined) partner = faces[other].express
        cls = other === undefined ? 'flipped-in-face' : 'flipped-across'
      } else if (ownIndex < 0) {
        cls = 'interior'
      } else {
        const others = occ.filter((_, i) => i !== ownIndex)
        if (others.length > 0) {
          const g = others[0].face
          partner = faces[g].express
          const G = faces[g]
          if (!G.emittedVerts.has(a) || !G.emittedVerts.has(b)) {
            cls = 'neighbour-dropped'
          } else {
            let split = false
            for (const w of G.emittedVerts) {
              if (w === a || w === b) continue
              const {d, t} = toSegment(where[w], pa, pb)
              if (d <= onSegTol && t > 1e-9 && t < 1 - 1e-9) { split = true; break }
            }
            cls = split ? 'neighbour-split' : 'neighbour-missing'
          }
        } else {
          const tol = Math.max(onSegTol, 1e-3 * length)
          const near = loopSegList.find((s) => s.face !== f && segmentNearSegment(pa, pb, s.a, s.b, tol))
          if (near !== undefined) partner = faces[near.face].express
          cls = near !== undefined ? 'sampling-differs' : 'no-partner'
        }
      }
      unpaired.push({cls, length: length * lenScale, face: faces[f].express,
        surface: faces[f].surface, partner})
    }
    return unpaired
  }

  const asEmitted = buildEdges(new Set())
  const unpaired = classify(asEmitted)

  // Orientation vote. For each face, over the loop segments it shares with
  // another face: `agree` counts its emitted boundary edges whose REVERSE some
  // other face emits (correctly paired), `disagree` those some other face
  // emits in the SAME direction. A face wound backwards relative to its shell
  // has disagree > agree whatever the global orientation is, which is the only
  // thing this can decide: it finds the odd face out, not which way is outside.
  const reversed = new Set()
  const votes = []
  for (let fi = 0; fi < faces.length; ++fi) {
    let agree = 0, disagree = 0
    for (const e of asEmitted.faceEdges[fi]) {
      const [a, b] = e.split('_').map(Number)
      const occ = loopSegs.get(segKey(a, b))
      if (occ === undefined || !occ.some((o) => o.face !== fi)) continue
      if ((asEmitted.emittedBy.get(`${b}_${a}`) ?? []).some((o) => o !== fi)) ++agree
      if (asEmitted.emittedBy.get(e).some((o) => o !== fi)) ++disagree
    }
    if (disagree > agree) {
      reversed.add(fi)
      votes.push({express: faces[fi].express, surface: faces[fi].surface,
        sameSense: faces[fi].sameSense, agree, disagree})
    }
  }
  const afterReorienting = reversed.size === 0 ? unpaired : classify(buildEdges(reversed))

  return {triangles, bucket, unpaired, reversedFaces: votes, afterReorienting}
}

const quantile = (sorted, q) => sorted.length === 0 ? 0 :
  sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
const fmt = (x) => x.toFixed(x >= 1 ? 2 : 3)

console.log(`# seam census: ${modelPath}`)
console.log(`  lengths in ${lenUnit}${mmPerUnit === undefined ?
  ` (FILE UNITS: the model declares ${metresPerUnit.size} length units)` : ''}`)
console.log('  `reoriented` = unpaired edges left once the reversed faces listed below are turned around')
console.log(`  ${'solid'.padEnd(8)} ${'faces'.padStart(5)} ${'tris'.padStart(7)} ${'unpaired'.padStart(8)} ` +
  `${'reoriented'.padStart(10)}  ` + CLASSES.map((c) => c.replace('neighbour-', 'n-')).join(' '))

const all = []
const allAfter = []
const allReversed = []
const solidRows = []
for (const [solid, faces] of solids) {
  const {triangles, unpaired, reversedFaces, afterReorienting} = censusSolid(faces)
  all.push(...unpaired.map((u) => ({...u, solid})))
  allAfter.push(...afterReorienting.map((u) => ({...u, solid})))
  allReversed.push(...reversedFaces.map((r) => ({...r, solid})))
  solidRows.push({solid, faces: faces.length, triangles, unpaired, after: afterReorienting.length})
}
solidRows.sort((x, y) => y.unpaired.length - x.unpaired.length)
for (const r of solidRows) {
  if (r.unpaired.length === 0 && wantSolid === undefined) continue
  const counts = CLASSES.map((c) => r.unpaired.filter((u) => u.cls === c).length)
  console.log(`  #${String(r.solid).padEnd(7)} ${String(r.faces).padStart(5)} ${String(r.triangles).padStart(7)} ` +
    `${String(r.unpaired.length).padStart(8)} ${String(r.after).padStart(10)}  ` +
    counts.map((n, i) => String(n).padStart(CLASSES[i].replace('neighbour-', 'n-').length)).join(' '))
}
const clean = solidRows.filter((r) => r.unpaired.length === 0).length
console.log(`  (${clean} of ${solidRows.length} solids have no unpaired edges${wantSolid === undefined ? ' and are not listed' : ''})`)

const byClass = (title, edges) => {
  console.log(`\n# by class, ${title} (${edges.length} unpaired edges)`)
  console.log(`  ${'class'.padEnd(18)} ${'n'.padStart(6)}  ${'p50'.padStart(7)} ${'p90'.padStart(7)} ${'max'.padStart(7)}  ${lenUnit}`)
  for (const c of CLASSES) {
    const lens = edges.filter((u) => u.cls === c).map((u) => u.length).sort((x, y) => x - y)
    if (lens.length === 0) continue
    console.log(`  ${c.padEnd(18)} ${String(lens.length).padStart(6)}  ${fmt(quantile(lens, 0.5)).padStart(7)} ` +
      `${fmt(quantile(lens, 0.9)).padStart(7)} ${fmt(lens[lens.length - 1]).padStart(7)}`)
  }
}
byClass('as emitted', all)
if (allReversed.length > 0) byClass('after turning the reversed faces around', allAfter)

if (allReversed.length > 0) {
  console.log(`\n# reversed faces: wound against most of their shared boundary (${allReversed.length})`)
  console.log('  agree/disagree = shared boundary edges whose neighbour runs opposite / the same way')
  for (const r of allReversed.sort((x, y) => y.disagree - x.disagree)) {
    console.log(`  solid #${String(r.solid).padEnd(6)} face #${String(r.express).padEnd(6)} ` +
      `${r.surface.padEnd(20)} same_sense=${r.sameSense ? 'T' : 'F'}  agree=${r.agree} disagree=${r.disagree}`)
  }
}

if (listEdges > 0) {
  console.log(`\n# ${listEdges} longest unpaired edges`)
  for (const u of [...all].sort((x, y) => y.length - x.length).slice(0, listEdges)) {
    console.log(`  ${fmt(u.length).padStart(8)}${lenUnit}  solid #${u.solid}  face #${u.face} (${u.surface})` +
      `  ${u.cls}${u.partner !== undefined ? `  partner #${u.partner}` : ''}`)
  }
}
