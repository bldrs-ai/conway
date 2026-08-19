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
 *   node scripts/layout_report.mjs <file> [...]
 */
import fs from 'fs'

const HASH = 0x23
const EQUALS = 0x3d
const SEMI = 0x3b
const QUOTE = 0x27
const SLASH = 0x2f
const STAR = 0x2a
const OPEN = 0x28
const ZERO = 0x30
const NINE = 0x39

/* The placement CHAIN: what a placement resolves through, transitively. */
const PLACEMENT_NAMES = new Set([
  'IFCLOCALPLACEMENT', 'IFCAXIS2PLACEMENT3D', 'IFCAXIS2PLACEMENT2D',
  'IFCCARTESIANPOINT', 'IFCDIRECTION', 'IFCGRIDPLACEMENT',
  'AXIS2_PLACEMENT_3D', 'AXIS2_PLACEMENT_2D', 'CARTESIAN_POINT', 'DIRECTION',
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
  let records = 0
  eachRecord(buf, (id, typeStart, typeEnd, start, end) => {
    offsetOf[id] = start
    const name = buf.toString('latin1', typeStart, typeEnd).trim().toUpperCase()
    let slot = typeIndex.get(name)
    if (slot === undefined) {
      slot = typeNames.length
      typeNames.push(name)
      typeIndex.set(name, slot)
    }
    typeOf[id] = slot
    if (PLACEMENT_NAMES.has(name)) {
      isPlacement[id] = 1
    }
    if (PRODUCT_PLACEMENT_NAMES.has(name)) {
      isProductPlacement[id] = 1
    }
    if (LEAF_NAMES.has(name)) {
      isLeaf[id] = 1
      leafBytes += end - start
      ++leafRecords
    }
    ++records
  })

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
  for (let id = 0; id <= maxId; ++id) {
    placementResolveAt[id] = offsetOf[id]
    placementBlocker[id] = id
    leafFirstResolveAt[id] = isLeaf[id] === 1 ? 0 : offsetOf[id]
  }
  for (let round = 0; round < 8; ++round) {
    let changed = false
    eachRecord(buf, (id, typeStart, typeEnd, start, end, argsFrom) => {
      if (isPlacement[id] === 0) {
        return
      }
      let at = placementResolveAt[id]
      let leafAt = leafFirstResolveAt[id]
      let blocker = placementBlocker[id]
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
        }
      })
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
      break
    }
  }

  // Pass 2: bucket both curves.
  const scannedHist = new Uint32Array(BUCKETS + 1)
  const usableHist = new Uint32Array(BUCKETS + 1)
  const productScanned = new Uint32Array(BUCKETS + 1)
  const productUsable = new Uint32Array(BUCKETS + 1)
  const productLeafFirst = new Uint32Array(BUCKETS + 1)
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
      if (isPlacement[ref] === 1) {
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


const args = process.argv.slice(2)
for (const path of args) {
  report(path)
}
