#!/usr/bin/env node
/**
 * Watertightness census: every unpaired edge of every solid, classified by
 * what happened to that piece of boundary on the OTHER side.
 *
 * A closed B-rep solid tessellates to a closed mesh only if every boundary
 * segment one face emits is emitted, reversed, by its neighbour. This welds
 * each solid's faces together (exact float32 identity first, then a few
 * float32 ULPs at each vertex's own magnitude), counts each directed edge
 * against its reverse, and sorts every edge with a surplus into a cause.
 * Counts are of edges; `half` also counts the surplus incidences, so an edge
 * emitted twice the same way is one edge and two half-edges.
 *
 * First, whether it is a gap at all. An edge emitted TWICE in the same
 * direction has its vertices shared and nothing missing; the two triangles
 * just disagree about winding:
 *
 *   flipped-in-face    both triangles belong to one face: the face is wound
 *                      inconsistently inside itself.
 *   flipped-across     they belong to two faces: one of the pair is wound
 *                      against its shell. The orientation vote below says which.
 *   overlap            two of the triangles sit on the SAME side of the edge
 *                      (within OVERLAP_COS), so it is a doubled or folded
 *                      sheet, not a flip. A flip puts them on opposite sides.
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
 *   node scripts/debug/seam_census.mjs <model> [solid express id] [--edges N] [--exact]
 *
 * `--edges N` lists the N longest unpaired edges with their faces and class.
 * `--exact` welds by float32 identity alone, with no tolerance: run both ways
 * to see how much of a result the weld tolerance is carrying.
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
const exactFlag = args.indexOf('--exact')
const exactOnly = exactFlag >= 0 && args.splice(exactFlag, 1).length > 0
const [modelPath, wantSolidArg] = args
const wantSolid = wantSolidArg === undefined ? undefined : Number(wantSolidArg)

if (modelPath === undefined) {
  console.error('usage: node scripts/debug/seam_census.mjs <model> [solid express id] [--edges N] [--exact]')
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

const CLASSES = ['flipped-in-face', 'flipped-across', 'overlap', 'interior', 'neighbour-dropped',
  'neighbour-split', 'neighbour-missing', 'sampling-differs', 'no-partner']

// Two same-direction triangles on an edge whose third vertices sit on the SAME
// side of it, within this angle, are a doubled or folded sheet rather than a
// winding flip. A flip puts them on opposite sides; a crease between faces
// puts them at the dihedral angle. cos 0.99 is about 8 degrees, so a knife
// edge sharper than that would read as overlap, which is the conservative
// direction: it never manufactures a flip.
const OVERLAP_COS = 0.99

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

// Cosine of the angle between where c1 and c2 sit around the line a-b: each
// third vertex's offset from the line, perpendicular to it. Near 1 means the
// two triangles lie on the same side; negative means opposite sides.
function sideCos(a, b, c1, c2) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const ul = Math.hypot(u[0], u[1], u[2])
  if (ul === 0) return NaN
  u[0] /= ul; u[1] /= ul; u[2] /= ul
  const perp = (c) => {
    const d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    const along = d[0] * u[0] + d[1] * u[1] + d[2] * u[2]
    return [d[0] - along * u[0], d[1] - along * u[1], d[2] - along * u[2]]
  }
  const w1 = perp(c1), w2 = perp(c2)
  const n = Math.hypot(w1[0], w1[1], w1[2]) * Math.hypot(w2[0], w2[1], w2[2])
  return n === 0 ? NaN : (w1[0] * w2[0] + w1[1] * w2[1] + w1[2] * w2[2]) / n
}

function censusSolid(faces) {
  let maxAbs = 0
  for (const f of faces) {
    for (const v of f.pos) maxAbs = Math.max(maxAbs, Math.abs(v))
    for (const loop of f.loops) for (const p of loop) maxAbs = Math.max(maxAbs, ...p.map(Math.abs))
  }

  // The weld. Exact float32 identity first: a boundary point two faces share
  // is one double cast to float32 on both sides, and a loop point is that same
  // double before the cast, so both match bit for bit. Only on a miss is a
  // nearby vertex accepted, and only within a tolerance taken from THAT pair's
  // own magnitude, so a far-flung corner of the solid cannot widen the weld
  // near the origin. The grid is sized from the largest coordinate so that
  // every local tolerance fits inside one cell; it gathers candidates and
  // never decides a weld. `tolWelds` counts the non-exact ones.
  const localTol = (p, q) => bucketFor(Math.max(Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2]),
      Math.abs(q[0]), Math.abs(q[1]), Math.abs(q[2])))
  const Q = 1 / bucketFor(maxAbs)
  const cell = (p) => [Math.round(p[0] * Q), Math.round(p[1] * Q), Math.round(p[2] * Q)]
  const f32 = (p) => `${Math.fround(p[0])},${Math.fround(p[1])},${Math.fround(p[2])}`
  const exact = new Map()
  const grid = new Map()
  const where = []
  let tolWelds = 0
  const lookup = (p) => {
    const hit = exact.get(f32(p))
    if (hit !== undefined || exactOnly) return hit
    const [bx, by, bz] = cell(p)
    let best, bestD = Infinity
    for (let dx = -1; dx <= 1; ++dx) for (let dy = -1; dy <= 1; ++dy) for (let dz = -1; dz <= 1; ++dz) {
      for (const id of grid.get(`${bx + dx},${by + dy},${bz + dz}`) ?? []) {
        const q = where[id]
        const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
        if (d <= localTol(p, q) && d < bestD) { best = id; bestD = d }
      }
    }
    if (best !== undefined) ++tolWelds
    return best
  }
  const intern = (p) => {
    let w = lookup(p)
    if (w === undefined) {
      w = where.length
      where.push(p)
      exact.set(f32(p), w)
      const k = cell(p).join(',')
      if (!grid.has(k)) grid.set(k, [])
      grid.get(k).push(w)
    }
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
  const segsByFace = faces.map(() => []) // [{a, b}] in positions, for the proximity search
  for (let fi = 0; fi < faces.length; ++fi) {
    for (const loop of faces[fi].loops) {
      const ids = loop.map(intern)
      for (let i = 0; i + 1 < ids.length; ++i) {
        if (ids[i] === ids[i + 1]) continue
        const k = ids[i] < ids[i + 1] ? `${ids[i]}_${ids[i + 1]}` : `${ids[i + 1]}_${ids[i]}`
        if (!loopSegs.has(k)) loopSegs.set(k, [])
        loopSegs.get(k).push({face: fi, from: ids[i], to: ids[i + 1]})
        segsByFace[fi].push({a: where[ids[i]], b: where[ids[i + 1]]})
      }
    }
  }
  const segKey = (a, b) => a < b ? `${a}_${b}` : `${b}_${a}`

  // Does a face's loop polyline run along a-b? Every sample, ends included,
  // must lie within tol of SOME segment of that face's loops. The union, not
  // one segment, so a neighbour that samples the boundary as A-M-B still
  // matches A-B, and a segment covering only the middle of A-B does not.
  const runsAlong = (segs, pa, pb, tol) => [0, 0.25, 0.5, 0.75, 1].every((s) => {
    const p = [pa[0] + (pb[0] - pa[0]) * s, pa[1] + (pb[1] - pa[1]) * s, pa[2] + (pb[2] - pa[2]) * s]
    return segs.some((seg) => toSegment(p, seg.a, seg.b).d <= tol)
  })

  // Directed edges per face, with the faces in `reversed` wound backwards.
  // Run twice: as emitted, and with the faces the orientation vote below
  // finds reversed turned around, so the second census counts only gaps.
  // Each incidence keeps its triangle's third vertex for the side test.
  const buildEdges = (reversed) => {
    const emittedBy = new Map() // "a_b" -> [{face, third}]
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
          emittedBy.get(e).push({face: fi, third: w[(k + 2) % 3]})
        }
      }
    }
    return {emittedBy, faceEdges}
  }

  const classify = ({emittedBy}) => {
    const unpaired = []
    for (const [e, fwd] of emittedBy) {
      const [a, b] = e.split('_').map(Number)
      // Paired by COUNT: two forward incidences against one reverse leave one
      // unpaired, which a presence check would hide.
      const excess = fwd.length - (emittedBy.get(`${b}_${a}`)?.length ?? 0)
      if (excess <= 0) continue
      const f = fwd[0].face
      const pa = where[a], pb = where[b]
      const length = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2])
      const occ = loopSegs.get(segKey(a, b)) ?? []
      const ownIndex = occ.findIndex((o) => o.face === f)
      let cls
      let partner
      if (fwd.length > 1) {
        // Emitted more than once the same way. A winding flip puts the two
        // triangles on opposite sides of the edge; a doubled or folded sheet
        // puts them on the same side. A pair on the same side makes it an
        // overlap, whatever the others do.
        let sameSide = false
        for (let i = 0; i < fwd.length && !sameSide; ++i) {
          for (let j = i + 1; j < fwd.length && !sameSide; ++j) {
            const c = sideCos(pa, pb, where[fwd[i].third], where[fwd[j].third])
            if (!(c < OVERLAP_COS)) sameSide = true
          }
        }
        const other = fwd.find((o) => o.face !== f)
        if (other !== undefined) partner = faces[other.face].express
        cls = sameSide ? 'overlap' : other === undefined ? 'flipped-in-face' : 'flipped-across'
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
              if (d <= 4 * localTol(where[w], pa) && t > 1e-9 && t < 1 - 1e-9) { split = true; break }
            }
            cls = split ? 'neighbour-split' : 'neighbour-missing'
          }
        } else {
          const tol = Math.max(4 * localTol(pa, pb), 1e-3 * length)
          const g = faces.findIndex((_, gi) => gi !== f && runsAlong(segsByFace[gi], pa, pb, tol))
          if (g >= 0) partner = faces[g].express
          cls = g >= 0 ? 'sampling-differs' : 'no-partner'
        }
      }
      unpaired.push({cls, half: excess, length: length * lenScale, face: faces[f].express,
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
      if ((asEmitted.emittedBy.get(`${b}_${a}`) ?? []).some((o) => o.face !== fi)) ++agree
      if (asEmitted.emittedBy.get(e).some((o) => o.face !== fi)) ++disagree
    }
    if (disagree > agree) {
      reversed.add(fi)
      votes.push({express: faces[fi].express, surface: faces[fi].surface,
        sameSense: faces[fi].sameSense, agree, disagree})
    }
  }
  const afterReorienting = reversed.size === 0 ? unpaired : classify(buildEdges(reversed))

  return {triangles, tolWelds, unpaired, reversedFaces: votes, afterReorienting}
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

let totalTolWelds = 0
const all = []
const allAfter = []
const allReversed = []
const solidRows = []
for (const [solid, faces] of solids) {
  const {triangles, tolWelds, unpaired, reversedFaces, afterReorienting} = censusSolid(faces)
  totalTolWelds += tolWelds
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
console.log(`  (${totalTolWelds} welds were by tolerance rather than exact float32 identity)`)
const clean = solidRows.filter((r) => r.unpaired.length === 0).length
console.log(`  (${clean} of ${solidRows.length} solids have no unpaired edges${wantSolid === undefined ? ' and are not listed' : ''})`)

const byClass = (title, edges) => {
  const halves = (list) => list.reduce((n, u) => n + u.half, 0)
  console.log(`\n# by class, ${title} (${edges.length} unpaired edges, ${halves(edges)} half-edges)`)
  console.log(`  ${'class'.padEnd(18)} ${'n'.padStart(6)} ${'half'.padStart(6)}  ${'p50'.padStart(7)} ${'p90'.padStart(7)} ${'max'.padStart(7)}  ${lenUnit}`)
  for (const c of CLASSES) {
    const inClass = edges.filter((u) => u.cls === c)
    const lens = inClass.map((u) => u.length).sort((x, y) => x - y)
    if (lens.length === 0) continue
    console.log(`  ${c.padEnd(18)} ${String(lens.length).padStart(6)} ${String(halves(inClass)).padStart(6)}  ${fmt(quantile(lens, 0.5)).padStart(7)} ` +
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
