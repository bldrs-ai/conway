#!/usr/bin/env node
/**
 * Where a STEP/IFC file puts the records a product needs, and what that costs
 * the parse-time preview.
 *
 * conway#542. The preview channel emits a product only when its whole closure
 * sits inside the scanned PREFIX (`deferDanglingPlacements`), and Revit — and
 * as it turns out others — write per-product placements toward the file tail,
 * so early ticks meet long runs of products that cannot extract and the user
 * sees nothing until the parse is nearly done. This turns that from a code
 * comment into a number, with no engine involved.
 *
 * Two curves are reported:
 *
 *  - **all records**: with the first p% scanned, what fraction of records seen
 *    so far have every `#ref` also inside that prefix? Backward-pointing
 *    references track the diagonal; forward ones fall below it.
 *  - **placed products**: the same question asked only of records that carry a
 *    placement, resolving the placement CHAIN transitively. This is the one
 *    that predicts the preview, because it is exactly the population the
 *    channel iterates and exactly the closure it defers on.
 *
 * Byte-oriented rather than string-oriented: a 900 MB model does not want to
 * be a JS string, and record identity is a Uint32Array indexed by express ID
 * rather than a Map, which keeps a 9 M-record file in tens of MB.
 *
 * A third curve simulates a SHARDED parse: N readers starting at even byte
 * offsets and advancing together. A product is emittable once every record
 * it needs sits inside the union of the scanned ranges — a very different
 * question from "inside the leading prefix".
 *
 * That curve came out NEGATIVE, which is why it is worth keeping. Sharding
 * the parse makes preview coverage strictly WORSE at equal bytes scanned,
 * on every file in the corpus: at 70% scanned DOWA emits 19,854 products
 * with one reader and 1 with four. Emission needs a product's whole closure
 * scanned, a leading prefix is contiguous so a file-order-local closure is
 * satisfied, and N readers replace that one region with N shorter ones and
 * N-1 holes. Any closure spanning a hole is blocked, and more shards means
 * more holes.
 *
 * The conclusion that survives: shard the INDEX BUILD, not the parse the
 * preview reads. An offset/type index has no closure, so it shards without
 * penalty, and once it is complete the windowed provider can page any
 * closure at any offset — which is what makes file layout stop mattering.
 *
 *   node scripts/layout_report.mjs <file> [...]
 *   node scripts/layout_report.mjs <in.ifc> --emit-tail-placements <out.ifc>
 *
 * The second form writes a copy with every leaf point/direction record moved
 * to the end of the DATA section, which is the Archicad shape reproduced at
 * fixture scale: same records, same ids, same semantics, hostile order. That
 * is how a deterministic test gets the deferral behaviour without shipping a
 * 400 MB model.
 */
import fs from 'fs'

const HASH = 0x23
const EQUALS = 0x3d
const SEMI = 0x3b
const QUOTE = 0x27
const SLASH = 0x2f
const STAR = 0x2a
const OPEN = 0x28
const CLOSE = 0x29
const ZERO = 0x30
const NINE = 0x39

/* The placement CHAIN: what a placement resolves through, transitively,
 * AND what gates a product that references one directly. */
const PLACEMENT_NAMES = new Set([
  'IFCLOCALPLACEMENT', 'IFCAXIS2PLACEMENT3D', 'IFCAXIS2PLACEMENT2D',
  'IFCCARTESIANPOINT', 'IFCDIRECTION', 'IFCGRIDPLACEMENT',
  'AXIS2_PLACEMENT_3D', 'AXIS2_PLACEMENT_2D', 'CARTESIAN_POINT', 'DIRECTION',
])

/* Types the closure expands THROUGH but which do not, by themselves, gate a
 * product that merely references one. The grid chain below the placement,
 * missing entirely until conway#546.
 *
 * IFCGRIDPLACEMENT was in the set above but nothing it references was, so
 * the walk expanded exactly one hop and stopped at
 * IFCVIRTUALGRIDINTERSECTION — never reaching the axes, their axis curves,
 * or the points those bottom out in. The direction of that error is why it
 * is worth naming: a closure that stops early makes a grid-placed product
 * look usable SOONER than it is, so every curve below came out optimistic.
 * The engine reads the whole chain — resolveVirtualGridIntersection walks
 * IntersectingAxes, gridAxisLine reduces IfcGridAxis.AxisCurve to a segment
 * of an IfcPolyline or an IfcLine.
 *
 * IFCVECTOR is here for the IfcLine arm alone: IfcLine.Dir is an IfcVector,
 * which carries the IfcDirection. Curve types gridAxisLine does not reduce
 * (IFCCIRCLE, IFCTRIMMEDCURVE, ...) are deliberately absent — the engine
 * warns and drops the placement rather than resolving through them, so
 * expanding them here would model a chain that is never walked.
 *
 * Separate from the set above because an IFCGRID references its own axes,
 * and an IfcGrid is itself a placed product. Folding these in there made
 * every grid look as if it could not be emitted until its axis points were
 * scanned — which the engine does not require, since a grid places off its
 * own IfcLocalPlacement and carries no representation. Measured on a
 * grid-plus-swept-polyline control: with them folded in, the grid product's
 * usable-at moved a whole decile later and the blocker attribution changed;
 * split like this the same file reports byte-identically to before. */
const PLACEMENT_CHAIN_ONLY_NAMES = new Set([
  'IFCVIRTUALGRIDINTERSECTION', 'IFCGRIDAXIS', 'IFCPOLYLINE', 'IFCLINE',
  'IFCVECTOR',
])

/* What makes a record a PRODUCT for this purpose, as opposed to a geometry
 * item that merely carries a placement.
 *
 * Narrower than the chain set on purpose. An IfcProduct's ObjectPlacement is
 * an IfcLocalPlacement, whereas IfcExtrudedAreaSolid and friends reference an
 * IfcAxis2Placement3D directly — so counting every placement reference
 * inflates the product population by the geometry, wildly on solid-heavy
 * files. STEP has no IfcLocalPlacement, and its shape representations do hang
 * off AXIS2_PLACEMENT_3D, so that spelling stays in for STEP files. */
const PRODUCT_PLACEMENT_NAMES = new Set([
  'IFCLOCALPLACEMENT', 'IFCGRIDPLACEMENT', 'AXIS2_PLACEMENT_3D',
])

/* The chain LEAVES: the records a placement bottoms out in. Measurements
 * across the corpus show these — not the placements and not the geometry —
 * are what arrives last on the files that stream badly, and they are the
 * cheapest records in the file. See conway#542. */
const LEAF_NAMES = new Set([
  'IFCCARTESIANPOINT', 'IFCDIRECTION', 'CARTESIAN_POINT', 'DIRECTION',
])

/* Percentile buckets for the curves. */
const BUCKETS = 1000

/* Shard counts simulated for the sharded-parse curve. */
const SHARD_COUNTS = [1, 2, 4, 8]


/**
 * Walk the data section, calling back per record.
 *
 * Hand-rolled: a STEP string literal ('...', '' escaped) and a slash-star
 * comment can both contain `;` and `#`, so a naive split mis-slices exactly
 * the files with the most interesting content.
 *
 * @param {Buffer} buf the file
 * @param {Function} onRecord `(id, typeStart, typeEnd, offset, end, argsFrom)`
 */
function eachRecord(buf, onRecord) {
  const size = buf.length
  let where = buf.indexOf('DATA;')
  where = where < 0 ? 0 : where + 5

  while (where < size) {
    // Find the next record start, skipping strings and comments.
    while (where < size) {
      const ch = buf[where]
      if (ch === QUOTE) {
        ++where
        while (where < size) {
          if (buf[where] === QUOTE) {
            if (buf[where + 1] === QUOTE) {
              where += 2
              continue
            }
            ++where
            break
          }
          ++where
        }
        continue
      }
      if (ch === SLASH && buf[where + 1] === STAR) {
        const end = buf.indexOf('*/', where + 2)
        where = end < 0 ? size : end + 2
        continue
      }
      if (ch === HASH) {
        break
      }
      ++where
    }
    if (where >= size) {
      return
    }

    const start = where
    let cursor = where + 1
    let id = 0
    let digits = 0
    while (cursor < size && buf[cursor] >= ZERO && buf[cursor] <= NINE) {
      id = id * 10 + (buf[cursor] - ZERO)
      ++cursor
      ++digits
    }
    if (digits === 0) {
      where = cursor + 1
      continue
    }
    while (cursor < size && buf[cursor] !== EQUALS && buf[cursor] !== SEMI) {
      ++cursor
    }
    if (cursor >= size || buf[cursor] === SEMI) {
      where = cursor + 1
      continue
    }
    const argsFrom = cursor
    ++cursor
    while (cursor < size && (buf[cursor] === 0x20 || buf[cursor] === 0x0a ||
      buf[cursor] === 0x0d || buf[cursor] === 0x09)) {
      ++cursor
    }
    const typeStart = cursor
    while (cursor < size && buf[cursor] !== OPEN && buf[cursor] !== SEMI) {
      ++cursor
    }
    const typeEnd = cursor

    // Walk to the terminating `;`.
    let ended = -1
    while (cursor < size) {
      const ch = buf[cursor]
      if (ch === QUOTE) {
        ++cursor
        while (cursor < size) {
          if (buf[cursor] === QUOTE) {
            if (buf[cursor + 1] === QUOTE) {
              cursor += 2
              continue
            }
            ++cursor
            break
          }
          ++cursor
        }
        continue
      }
      if (ch === SLASH && buf[cursor + 1] === STAR) {
        const end = buf.indexOf('*/', cursor + 2)
        cursor = end < 0 ? size : end + 2
        continue
      }
      if (ch === SEMI) {
        ended = cursor
        break
      }
      ++cursor
    }
    if (ended < 0) {
      return
    }

    onRecord(id, typeStart, typeEnd, start, ended + 1, argsFrom)
    where = ended + 1
  }
}


/**
 * Collect every `#ref` in a record's argument bytes.
 *
 * @param {Buffer} buf the file
 * @param {number} from first byte of the args
 * @param {number} to one past the last
 * @param {Function} onRef called with each referenced id
 */
function eachRef(buf, from, to, onRef) {
  let where = from
  while (where < to) {
    const ch = buf[where]
    if (ch === QUOTE) {
      ++where
      while (where < to) {
        if (buf[where] === QUOTE) {
          if (buf[where + 1] === QUOTE) {
            where += 2
            continue
          }
          ++where
          break
        }
        ++where
      }
      continue
    }
    // Comments, like strings, may legally contain `#123` text that is not a
    // reference. eachRecord already skips them for exactly that reason;
    // skipping strings here but not comments let a commented-out argument
    // invent forward references and placement dependencies, which moves
    // every curve this script reports (codex round 2 on #543).
    if (ch === SLASH && buf[where + 1] === STAR) {
      const end = buf.indexOf('*/', where + 2)
      where = end < 0 || end + 2 > to ? to : end + 2
      continue
    }
    if (ch === HASH) {
      let cursor = where + 1
      let id = 0
      let digits = 0
      while (cursor < to && buf[cursor] >= ZERO && buf[cursor] <= NINE) {
        id = id * 10 + (buf[cursor] - ZERO)
        ++cursor
        ++digits
      }
      if (digits > 0) {
        onRef(id)
      }
      where = cursor
      continue
    }
    ++where
  }
}


/**
 * Collect every `#ref` that sits inside a NESTED aggregate of a record —
 * `(#1,#2)` rather than a bare `#1` argument.
 *
 * Used for one thing: an `IFCGRID`'s `UAxes`/`VAxes`/`WAxes`. Those three are
 * the only aggregate-valued attributes IfcGrid has in every schema conway
 * generates (IFC2X3, IFC4, IFC4X3 — same eleven-or-ten attribute list, same
 * three list slots), so "refs at aggregate depth" picks them out exactly,
 * without hard-coding attribute positions or splitting arguments. The bare
 * refs it skips are `ObjectPlacement` and `Representation`, neither of which
 * the axis scan reads.
 *
 * Depth is counted from the record's own argument list: the first `(` after
 * the type name opens depth 1, so an aggregate member is at depth >= 2.
 * Strings and comments are skipped for the same reason `eachRef` skips them —
 * both may legally contain `(` and `#123`.
 *
 * @param {Buffer} buf the file
 * @param {number} from first byte of the args (the `=`)
 * @param {number} to one past the last
 * @param {Function} onRef called with each referenced id
 */
function eachAggregateRef(buf, from, to, onRef) {
  let where = from
  let depth = 0
  while (where < to) {
    const ch = buf[where]
    if (ch === QUOTE) {
      ++where
      while (where < to) {
        if (buf[where] === QUOTE) {
          if (buf[where + 1] === QUOTE) {
            where += 2
            continue
          }
          ++where
          break
        }
        ++where
      }
      continue
    }
    if (ch === SLASH && buf[where + 1] === STAR) {
      const end = buf.indexOf('*/', where + 2)
      where = end < 0 || end + 2 > to ? to : end + 2
      continue
    }
    if (ch === OPEN) {
      ++depth
      ++where
      continue
    }
    if (ch === CLOSE) {
      --depth
      ++where
      continue
    }
    if (ch === HASH) {
      let cursor = where + 1
      let id = 0
      let digits = 0
      while (cursor < to && buf[cursor] >= ZERO && buf[cursor] <= NINE) {
        id = id * 10 + (buf[cursor] - ZERO)
        ++cursor
        ++digits
      }
      if (digits > 0 && depth >= 2) {
        onRef(id)
      }
      where = cursor
      continue
    }
    ++where
  }
}


/**
 * Turn a bucketed histogram into a cumulative count at each percentile.
 *
 * @param {Uint32Array} histogram counts per bucket
 * @return {Float64Array} cumulative counts
 */
function cumulative(histogram) {
  const out = new Float64Array(histogram.length)
  let running = 0
  for (let i = 0; i < histogram.length; ++i) {
    running += histogram[i]
    out[i] = running
  }
  return out
}


/**
 * Report both curves for one file.
 *
 * @param {string} path the file
 */
function report(path) {
  const buf = fs.readFileSync(path)
  const size = buf.length

  // Pass 1: id -> offset, and which ids are placement records.
  let maxId = 0
  eachRecord(buf, (id) => {
    if (id > maxId) {
      maxId = id
    }
  })
  const offsetOf = new Uint32Array(maxId + 1)
  const isPlacement = new Uint8Array(maxId + 1)
  /* The subset of isPlacement that gates a product REFERENCING it. See
   * PLACEMENT_CHAIN_ONLY_NAMES for why the two differ. */
  const gatesProduct = new Uint8Array(maxId + 1)
  const isProductPlacement = new Uint8Array(maxId + 1)
  const isLeaf = new Uint8Array(maxId + 1)
  let leafBytes = 0
  let leafRecords = 0

  // Type names are interned into a small table and referenced by index, so
  // naming the blocking record later costs one Uint16 per id rather than a
  // string per id — the difference between tens of MB and several GB on a
  // 9 M-record file.
  const typeNames = ['']
  const typeIndex = new Map()
  const typeOf = new Uint16Array(maxId + 1)
  /* Every axis an IFCGRID lists, from every IFCGRID in the file. The INVERSE
   * half of the grid chain — see the gate below for what it is for. Bounded by
   * the axis count (1408 on the largest corpus model), so a plain array. */
  const gridAxisRefs = []
  const isGridPlacement = new Uint8Array(maxId + 1)
  let records = 0
  eachRecord(buf, (id, typeStart, typeEnd, start, end, argsFrom) => {
    offsetOf[id] = start
    const name = buf.toString('latin1', typeStart, typeEnd).trim().toUpperCase()
    let slot = typeIndex.get(name)
    if (slot === undefined) {
      slot = typeNames.length
      typeNames.push(name)
      typeIndex.set(name, slot)
    }
    typeOf[id] = slot
    if (PLACEMENT_NAMES.has(name) || PLACEMENT_CHAIN_ONLY_NAMES.has(name)) {
      isPlacement[id] = 1
    }
    if (PLACEMENT_NAMES.has(name)) {
      gatesProduct[id] = 1
    }
    if (PRODUCT_PLACEMENT_NAMES.has(name)) {
      isProductPlacement[id] = 1
    }
    if (LEAF_NAMES.has(name)) {
      isLeaf[id] = 1
      leafBytes += end - start
      ++leafRecords
    }
    if (name === 'IFCGRIDPLACEMENT') {
      isGridPlacement[id] = 1
    }
    if (name === 'IFCGRID') {
      eachAggregateRef(buf, argsFrom, end, (ref) => gridAxisRefs.push(ref))
    }
    ++records
  })

  /* The INVERSE lookup, which no forward closure can reach (conway#607).
   *
   * IfcGeometryExtraction.extractGridPlacement resolves the intersection and
   * then has to find the IfcGrid that OWNS the axes, to place off that grid's
   * own placement. IfcGridAxis's route back to its grid is the
   * PartOfU/PartOfV/PartOfW INVERSE attributes and the generated schema layer
   * carries no inverses, so `gridByAxis` scans every IfcGrid's UAxes/VAxes/
   * WAxes instead. Those are reference arrays, so an axis record that is not
   * yet indexed throws there (conway#546 classifies the throw), region 1's
   * catch in extractGridPlacement absorbs only StepBufferNotResidentError, and
   * the product defers and is retried.
   *
   * A product never references the grid — the grid references the axis, not
   * the reverse — so walking forward from a product cannot reach an IfcGrid
   * record at all. Before this gate the report said such a product was ready
   * as soon as its own intersection chain was scanned, which is the same
   * silently-flattering direction conway#546 exists to correct.
   *
   * Three properties of the engine scan make one scalar per file enough:
   *
   *  - It is ALL-OR-NOTHING across grids. The loop visits every IfcGrid, so
   *    any grid with an unscanned axis list blocks EVERY grid placement in the
   *    file, however local that placement's own chain is. Hence the max over
   *    all grids rather than a per-grid gate.
   *  - It is not sticky. `gridByAxis_` is assigned AFTER the loop, so a scan
   *    that threw memoises nothing and the gate really is "every grid's axis
   *    list is indexed", not "some prefix of them".
   *  - It reads only `gridAxis.localID`, never the axis' AxisCurve. So the
   *    gate is where the AXIS RECORDS land, not where their curves' points do
   *    — `offsetOf`, deliberately, not `placementResolveAt`.
   *
   * An IfcGrid record that is not yet indexed is not visited by the scan at
   * all (`model.types` iterates the type index), so it cannot throw and is not
   * part of the gate. That leaves a real engine hazard this report does not
   * model — the memo can complete over a PARTIAL set of grids and be cached —
   * but the failure there is a silently mis-placed product rather than a
   * deferred one, and this tool measures deferral. */
  let gridAxisScanAt = 0
  let gridAxisScanBlocker = 0

  for (const ref of gridAxisRefs) {
    if (ref <= maxId && offsetOf[ref] > gridAxisScanAt) {
      gridAxisScanAt = offsetOf[ref]
      gridAxisScanBlocker = ref
    }
  }

  // Placement chains are shallow but transitive (a local placement points at
  // its parent and at an axis placement, which points at points/directions),
  // so resolve them to a fixed point before asking when a product can be
  // placed. Without this a product looks resolvable the moment its immediate
  // IFCLOCALPLACEMENT is scanned, which is not what the extractor needs.
  const placementResolveAt = new Uint32Array(maxId + 1)
  const placementBlocker = new Uint32Array(maxId + 1)

  // The counterfactual: the same chain resolved as if a cheap pre-pass had
  // already harvested every leaf point/direction, so a leaf never gates a
  // product. The gap between the two curves is what such a pass would buy.
  const leafFirstResolveAt = new Uint32Array(maxId + 1)

  // For the sharded curve, the useful quantity is not an absolute offset but
  // how far INTO ITS OWN BAND a required record sits: with N readers advancing
  // together, a record at 90% of the file is reached at the same moment as one
  // at 90% of any other band. Per shard count, carry the max of that fraction
  // over the placement chain alongside the absolute max.
  const shardChainProgress = SHARD_COUNTS.map(() => new Float64Array(maxId + 1))
  const bandProgress = (offset, shards) => {
    const band = Math.min(shards - 1, Math.floor(offset / size * shards))
    return (offset - band * size / shards) / (size / shards)
  }

  /* The scan's cost in each curve's own units. Grid axes are not leaves, so
   * the leaf-first counterfactual does not get past this gate either — a
   * point-harvesting pre-pass would not have indexed an IfcGridAxis. */
  const gridAxisScanProgress = SHARD_COUNTS.map(
      (shards) => bandProgress(gridAxisScanAt, shards))

  for (let id = 0; id <= maxId; ++id) {
    /* Seeding the gate onto the IFCGRIDPLACEMENT record itself, rather than
     * onto the products, is what makes the rest of this free: the fixed point
     * already propagates a placement's resolve time up through whatever
     * references it, so a product reached via IfcLocalPlacement.PlacementRelTo
     * is gated exactly like one that references the grid placement directly,
     * and a file with no IFCGRIDPLACEMENT is untouched — which matches the
     * engine, where the memo is never built at all for such a model. */
    const gridGated = isGridPlacement[id] === 1 && gridAxisScanAt > offsetOf[id]

    placementResolveAt[id] = gridGated ? gridAxisScanAt : offsetOf[id]
    placementBlocker[id] = gridGated ? gridAxisScanBlocker : id
    leafFirstResolveAt[id] = isLeaf[id] === 1 ? 0 :
      (gridGated ? gridAxisScanAt : offsetOf[id])
    for (let s = 0; s < SHARD_COUNTS.length; ++s) {
      shardChainProgress[s][id] = Math.max(
          bandProgress(offsetOf[id], SHARD_COUNTS[s]),
          isGridPlacement[id] === 1 ? gridAxisScanProgress[s] : 0)
    }
  }
  // Iterate to a FIXED POINT, not a fixed round count. Each round propagates
  // one more hop along a chain that runs against file order, so a hard stop
  // at 8 left a deeper hierarchy partially resolved -- and a partially
  // resolved chain reports its products as usable EARLIER than they are,
  // which silently flatters every curve below (codex round 2 on #543).
  // Convergence is guaranteed: each cell only ever increases and is bounded
  // above by the largest record offset, so even a cyclic placement graph
  // settles. The bound is a hang guard for a hostile file, not the
  // termination condition, and blowing through it is reported rather than
  // absorbed.
  const PLACEMENT_ROUND_LIMIT = 64
  let placementRounds = 0
  let placementConverged = false
  for (; placementRounds < PLACEMENT_ROUND_LIMIT; ++placementRounds) {
    let changed = false
    eachRecord(buf, (id, typeStart, typeEnd, start, end, argsFrom) => {
      if (isPlacement[id] === 0) {
        return
      }
      let at = placementResolveAt[id]
      let leafAt = leafFirstResolveAt[id]
      let blocker = placementBlocker[id]
      const shardAt = SHARD_COUNTS.map((unused, s) => shardChainProgress[s][id])
      eachRef(buf, argsFrom, end, (ref) => {
        if (ref <= maxId) {
          const refAt = placementResolveAt[ref]
          if (refAt > at) {
            at = refAt
            blocker = placementBlocker[ref]
          }
          const leafRefAt = leafFirstResolveAt[ref]
          if (leafRefAt > leafAt) {
            leafAt = leafRefAt
          }
          for (let s = 0; s < SHARD_COUNTS.length; ++s) {
            const p = shardChainProgress[s][ref]
            if (p > shardAt[s]) {
              shardAt[s] = p
            }
          }
        }
      })
      for (let s = 0; s < SHARD_COUNTS.length; ++s) {
        if (shardAt[s] > shardChainProgress[s][id]) {
          shardChainProgress[s][id] = shardAt[s]
          changed = true
        }
      }
      if (at > placementResolveAt[id]) {
        placementResolveAt[id] = at
        placementBlocker[id] = blocker
        changed = true
      }
      if (leafAt > leafFirstResolveAt[id]) {
        leafFirstResolveAt[id] = leafAt
        changed = true
      }
    })
    if (!changed) {
      placementConverged = true
      break
    }
  }
  if (!placementConverged) {
    console.error(
      `WARNING: placement chains did not converge in ${PLACEMENT_ROUND_LIMIT} ` +
      'rounds; the product curves below understate when products become ' +
      'usable.')
  }

  // Pass 2: bucket both curves.
  const scannedHist = new Uint32Array(BUCKETS + 1)
  const usableHist = new Uint32Array(BUCKETS + 1)
  const productScanned = new Uint32Array(BUCKETS + 1)
  const productUsable = new Uint32Array(BUCKETS + 1)
  const productLeafFirst = new Uint32Array(BUCKETS + 1)
  const productSharded = SHARD_COUNTS.map(() => new Uint32Array(BUCKETS + 1))
  let forward = 0
  let products = 0
  let productsDeferredByPlacement = 0
  const blockedBy = new Map()

  const bucketOf = (offset) => Math.min(BUCKETS, Math.floor(offset / size * BUCKETS))

  eachRecord(buf, (id, typeStart, typeEnd, start, end, argsFrom) => {
    let resolveAt = start
    let placementAt = 0
    let hasPlacement = false
    let blocker = 0
    let leafPlacementAt = 0
    const shardReady = SHARD_COUNTS.map(
        (shards) => bandProgress(start, shards))
    eachRef(buf, argsFrom, end, (ref) => {
      if (ref > maxId) {
        return
      }
      const at = offsetOf[ref]
      if (at > resolveAt) {
        resolveAt = at
      }
      if (isProductPlacement[ref] === 1) {
        hasPlacement = true
      }
      if (gatesProduct[ref] === 1) {
        const chainAt = placementResolveAt[ref]
        if (chainAt > placementAt) {
          placementAt = chainAt
          blocker = placementBlocker[ref]
        }
        const leafChainAt = leafFirstResolveAt[ref]
        if (leafChainAt > leafPlacementAt) {
          leafPlacementAt = leafChainAt
        }
      }
      for (let s = 0; s < SHARD_COUNTS.length; ++s) {
        const p = Math.max(
            bandProgress(at, SHARD_COUNTS[s]),
            gatesProduct[ref] === 1 ? shardChainProgress[s][ref] : 0)
        if (p > shardReady[s]) {
          shardReady[s] = p
        }
      }
    })
    if (resolveAt > end) {
      ++forward
    }
    scannedHist[bucketOf(start)]++
    usableHist[bucketOf(resolveAt)]++

    // A "placed product": carries a placement and is not itself part of a
    // placement chain. That is the population the preview iterates.
    if (hasPlacement && isPlacement[id] === 0) {
      ++products
      const readyAt = Math.max(resolveAt, placementAt)
      productScanned[bucketOf(start)]++
      productUsable[bucketOf(readyAt)]++
      productLeafFirst[bucketOf(Math.max(resolveAt, leafPlacementAt))]++
      for (let s = 0; s < SHARD_COUNTS.length; ++s) {
        productSharded[s][Math.min(
            BUCKETS, Math.floor(shardReady[s] * BUCKETS))]++
      }
      if (placementAt > end) {
        ++productsDeferredByPlacement
        const name = typeNames[typeOf[blocker]] || '(unknown)'
        blockedBy.set(name, (blockedBy.get(name) || 0) + 1)
      }
    }
  })

  const scanned = cumulative(scannedHist)
  const usable = cumulative(usableHist)
  const pScanned = cumulative(productScanned)
  const pUsable = cumulative(productUsable)
  const pLeaf = cumulative(productLeafFirst)
  const pShard = productSharded.map(cumulative)

  console.log(`\n=== ${path}`)
  console.log(
    `    ${(size / 1e6).toFixed(1)} MB, ${records} records, ` +
    `${forward} (${(100 * forward / records).toFixed(1)}%) reference forward`)
  console.log(
    `    ${products} placed products, ${productsDeferredByPlacement} ` +
    `(${products === 0 ? 0 : (100 * productsDeferredByPlacement / products).toFixed(1)}%) ` +
    'wait on a placement written after them')
  console.log(
    `    ${leafRecords} leaf point/direction records, ` +
    `${(100 * leafBytes / size).toFixed(1)}% of bytes`)
  console.log(
    '    prefix |  all records          |  placed products      | leaf-first')
  console.log(
    '           |  scanned  usable  gap |  scanned  usable   gap |    usable')

  for (let pct = 10; pct <= 100; pct += 10) {
    const at = Math.floor(BUCKETS * pct / 100)
    const s = scanned[at]
    const u = usable[at]
    const ps = pScanned[at]
    const pu = pUsable[at]
    const gap = s === 0 ? 0 : 100 * (s - u) / s
    const pgap = ps === 0 ? 0 : 100 * (ps - pu) / ps
    console.log(
      `    ${String(pct).padStart(5)}% | ${String(s).padStart(8)} ` +
      `${String(u).padStart(7)} ${gap.toFixed(0).padStart(3)}% | ` +
      `${String(ps).padStart(8)} ${String(pu).padStart(7)} ${pgap.toFixed(0).padStart(4)}% | ` +
      `${String(pLeaf[at]).padStart(9)}`)
  }

  console.log(
    '\n    sharded parse — placed products emittable, by per-shard progress:')
  console.log(
    `    progress | ${SHARD_COUNTS.map(
        (n) => `N=${n}`.padStart(9)).join(' ')}`)
  for (let pct = 10; pct <= 100; pct += 10) {
    const at = Math.floor(BUCKETS * pct / 100)
    console.log(
      `    ${String(pct).padStart(7)}% | ` +
      SHARD_COUNTS.map(
          (unused, s) => String(pShard[s][at]).padStart(9)).join(' '))
  }
  console.log(`    (of ${products} placed products)`)

  if (blockedBy.size > 0) {
    const ranked = [...blockedBy.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    console.log('    deferred by (last record in the chain to arrive):')
    for (const [name, count] of ranked) {
      console.log(
        `      ${String(count).padStart(8)} ` +
        `(${(100 * count / products).toFixed(0).padStart(3)}%)  ${name}`)
    }
  }
}


/**
 * Rewrite a file with its leaf point/direction records moved to the end of
 * the DATA section, preserving ids and text exactly.
 *
 * Record order is the only thing that changes, so the result parses to an
 * identical model and differs only in when each record becomes indexable —
 * which is precisely the variable under test.
 *
 * @param {string} inPath source file
 * @param {string} outPath destination
 */
function emitTailPlacements(inPath, outPath) {
  const buf = fs.readFileSync(inPath)
  const head = []
  const tail = []
  let cursor = buf.indexOf('DATA;')
  cursor = cursor < 0 ? 0 : cursor + 5
  const prologue = buf.subarray(0, cursor)
  let lastEnd = cursor

  eachRecord(buf, (id, typeStart, typeEnd, start, end) => {
    const name = buf.toString('latin1', typeStart, typeEnd).trim().toUpperCase()
    ;(LEAF_NAMES.has(name) ? tail : head).push(buf.subarray(start, end))
    lastEnd = end
  })

  const epilogue = buf.subarray(lastEnd)
  const nl = Buffer.from('\n')
  const parts = [prologue, nl]

  for (const chunk of head) {
    parts.push(chunk, nl)
  }
  for (const chunk of tail) {
    parts.push(chunk, nl)
  }
  parts.push(epilogue)

  fs.writeFileSync(outPath, Buffer.concat(parts))
  console.log(
    `${outPath}: ${head.length} records, then ${tail.length} leaf ` +
    'point/direction records moved to the tail')
}


const args = process.argv.slice(2)
const emitAt = args.indexOf('--emit-tail-placements')

if (emitAt >= 0) {
  emitTailPlacements(args[0], args[emitAt + 1])
} else {
  for (const path of args) {
    report(path)
  }
}
