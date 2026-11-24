#!/usr/bin/env node
/**
 * Synthetic scale ladder for the kernel side-by-side (T3, predictions P1/P2
 * in design/new/kernel-compare-smlib.md).
 *
 * The real STEP corpora top out at 282 MB, so the 500–600 MiB band that
 * straddles V8's maximum string length, and everything above it, has to be
 * synthesised. This writes a STEP file of roughly a requested size made of
 * real B-rep content: one source part replicated as K distinct product
 * occurrences under one assembly root.
 *
 * Structure (the CAx-IF / OCCT exporter shape, as in nist/as1-oc-214.stp):
 *
 *   copy i (i = 0..K-1): the source's whole DATA section, every entity id
 *     shifted by i * stride (stride = the source's largest id), with the
 *     top product's id and name suffixed `_<i+1>`. Each copy therefore has
 *     its own PRODUCT / PRODUCT_DEFINITION / SHAPE_DEFINITION_REPRESENTATION
 *     / shape representation and its own B-rep entities: no reader can
 *     share a copy's geometry with another's by entity id.
 *
 *   root: PRODUCT 'synthetic_scale_K' → PRODUCT_DEFINITION → SDR →
 *     SHAPE_REPRESENTATION(origin, place_0..place_K-1) in copy 0's
 *     representation context (so the grid offsets are in the source's
 *     length unit), and per copy:
 *       NEXT_ASSEMBLY_USAGE_OCCURRENCE(root PD, copy PD)
 *       PRODUCT_DEFINITION_SHAPE('Placement', NAUO)
 *       CONTEXT_DEPENDENT_SHAPE_REPRESENTATION(RR, that PDS)
 *       (REPRESENTATION_RELATIONSHIP(copy rep, root rep)
 *        REPRESENTATION_RELATIONSHIP_WITH_TRANSFORMATION(IDT)
 *        SHAPE_REPRESENTATION_RELATIONSHIP())
 *       ITEM_DEFINED_TRANSFORMATION(copy rep's own axis placement, place_i)
 *     RR rep_1 = child, rep_2 = parent; IDT item_1 in the child, item_2 in
 *     the parent — the CAx-IF reading, which is also the one every reader
 *     falls back to when it cannot tell.
 *
 *   place_i puts copy i on an XY grid, ceil(sqrt(K)) columns, spaced by
 *   1.25x the extent of every 3D CARTESIAN_POINT in the source (rounded up
 *   to 2 significant digits), so no two copies touch. The union's extents
 *   are ((cols-1)*sx + ex, (rows-1)*sy + ey, ez) for a part of extents
 *   (ex, ey, ez).
 *
 * The output is written in chunks, never assembled as one JS string: a file
 * above the string limit is exactly what this exists to make.
 *
 * Output is LF-only (the source's CRLF is normalised) and byte-reproducible
 * for given arguments (fixed FILE_NAME timestamp), and the size is planned
 * exactly before writing, so `--fit` can place a file on either side of the
 * limit to the byte granularity of one copy.
 *
 * Usage:
 *   node scripts/kernel_compare/gen_scale.mjs --source <part.step> --out <file.step>
 *       (--copies K | --target-bytes N|max-string [--fit nearest|at-most|above])
 *       [--spacing sx,sy] [--json]
 *
 *   --copies K          exactly K copies
 *   --target-bytes N    pick K so the file is ≈ N bytes; `max-string` means
 *                       this Node's buffer.constants.MAX_STRING_LENGTH
 *   --fit               nearest (default) | at-most (size ≤ N) | above (size > N)
 *   --spacing sx,sy     grid pitch in the source's length unit (default: derived)
 *   --plan              print the plan, write nothing
 *
 * Prints one JSON object on the last line of stdout: output path, bytes, K,
 * grid, spacing, expected union extent, and bytes relative to the string
 * limit.
 */

import fs from 'node:fs'
import path from 'node:path'
import {constants as bufferConstants} from 'node:buffer'

const MAX_STRING_LENGTH = bufferConstants.MAX_STRING_LENGTH
const CHUNK_BYTES = 8 * 1024 * 1024
const FILE_TIMESTAMP = '2026-01-01T00:00:00'


/**
 * @param {string[]} argv
 * @return {object}
 */
function parseArgs(argv) {
  const o = {fit: 'nearest', json: false, plan: false}

  for (let i = 0; i < argv.length; ++i) {
    const a = argv[i]
    const next = () => {
      if (i + 1 >= argv.length) {
        throw new Error(`${a} needs a value`)
      }

      return argv[++i]
    }

    switch (a) {
      case '--source': o.source = next(); break
      case '--out': o.out = next(); break
      case '--copies': o.copies = Number(next()); break
      case '--target-bytes': {
        const v = next()
        o.targetBytes = v === 'max-string' ? MAX_STRING_LENGTH : Number(v)
        break
      }
      case '--fit': o.fit = next(); break
      case '--spacing': o.spacing = next().split(',').map(Number); break
      case '--plan': o.plan = true; break
      case '--json': o.json = true; break
      case '-h': case '--help': o.help = true; break
      default: throw new Error(`unknown argument: ${a}`)
    }
  }

  if (o.help) {
    return o
  }

  if (!o.source || (!o.out && !o.plan)) {
    throw new Error('--source and --out are required')
  }

  if ((o.copies === undefined) === (o.targetBytes === undefined)) {
    throw new Error('give exactly one of --copies and --target-bytes')
  }

  if (o.copies !== undefined && !(Number.isInteger(o.copies) && o.copies >= 1)) {
    throw new Error(`--copies needs a positive integer, got ${o.copies}`)
  }

  if (o.targetBytes !== undefined && !(Number.isFinite(o.targetBytes) && o.targetBytes > 0)) {
    throw new Error(`--target-bytes needs a positive number or max-string, got ${o.targetBytes}`)
  }

  if (!['nearest', 'at-most', 'above'].includes(o.fit)) {
    throw new Error(`--fit must be nearest, at-most or above, got ${o.fit}`)
  }

  if (o.spacing !== undefined &&
      (o.spacing.length !== 2 || !o.spacing.every((v) => Number.isFinite(v) && v > 0))) {
    throw new Error('--spacing needs two positive numbers: sx,sy')
  }

  return o
}


/**
 * Split a DATA section into records, each a template of literal text and
 * entity references, so a copy is emitted by re-joining with shifted ids.
 * String literals ('…' with '' escapes) and comments are respected: a '#'
 * inside a string is text, and comments are dropped.
 *
 * @param {string} data Text between `DATA;` and its `ENDSEC;` (latin1-decoded)
 * @return {object[]} records: {id, type, lits: string[], refs: number[], text}
 */
function parseRecords(data) {
  const records = []
  let text = ''
  let i = 0
  const n = data.length

  while (i < n) {
    const c = data[i]

    if (c === '\'') {
      // String literal: copy through to its closing quote ('' is an escape).
      let j = i + 1

      while (j < n) {
        if (data[j] === '\'') {
          if (data[j + 1] === '\'') {
            j += 2
            continue
          }

          break
        }

        ++j
      }

      text += data.slice(i, j + 1)
      i = j + 1
    } else if (c === '/' && data[i + 1] === '*') {
      const end = data.indexOf('*/', i + 2)
      i = end < 0 ? n : end + 2
    } else if (c === ';') {
      const trimmed = `${text};`.trim()
      const m = /^#(\d+)\s*=\s*([A-Za-z_][A-Za-z_0-9]*|\()/.exec(trimmed)

      if (!m) {
        throw new Error(`unparseable record: ${trimmed.slice(0, 120)}`)
      }

      records.push({id: Number(m[1]), type: m[2] === '(' ? '(complex)' : m[2].toUpperCase(),
        ...splitRefs(trimmed), text: trimmed})
      text = ''
      ++i
    } else {
      text += c
      ++i
    }
  }

  if (text.trim().length > 0) {
    throw new Error(`DATA section ends inside a record: ${text.slice(0, 120)}`)
  }

  return records
}


/**
 * @param {string} text One record, comments already removed
 * @return {{lits: string[], refs: number[]}}
 */
function splitRefs(text) {
  const lits = []
  const refs = []
  let lit = ''
  let i = 0

  while (i < text.length) {
    const c = text[i]

    if (c === '\'') {
      let j = i + 1

      while (j < text.length) {
        if (text[j] === '\'') {
          if (text[j + 1] === '\'') {
            j += 2
            continue
          }

          break
        }

        ++j
      }

      lit += text.slice(i, j + 1)
      i = j + 1
    } else if (c === '#' && text[i + 1] >= '0' && text[i + 1] <= '9') {
      let j = i + 1

      while (j < text.length && text[j] >= '0' && text[j] <= '9') {
        ++j
      }

      lits.push(lit)
      lit = ''
      refs.push(Number(text.slice(i + 1, j)))
      i = j
    } else {
      lit += c
      ++i
    }
  }

  lits.push(lit)

  return {lits, refs}
}


/**
 * Mark the closing quote of the first two string literals of a PRODUCT
 * record (its id and name) with \u0000, so a copy can splice in a suffix.
 *
 * @param {object} rec
 * @return {void}
 */
function markProductName(rec) {
  // A PRODUCT record has exactly one ref before its context list: its own id.
  let marked = 0

  rec.lits = rec.lits.map((l) => {
    let out = ''
    let i = 0

    while (i < l.length) {
      if (l[i] === '\'' && marked < 2) {
        let j = i + 1

        while (j < l.length) {
          if (l[j] === '\'') {
            if (l[j + 1] === '\'') {
              j += 2
              continue
            }

            break
          }

          ++j
        }

        out += `${l.slice(i, j)}\u0000`
        ++marked
        i = j + 1
      } else {
        out += l[i]
        ++i
      }
    }

    return out
  })

  if (marked !== 2) {
    throw new Error(`PRODUCT #${rec.id}: expected id and name strings, found ${marked}`)
  }
}


/**
 * Read the source and locate everything the assembly links to.
 *
 * @param {string} file
 * @return {object}
 */
function analyseSource(file) {
  const bytes = fs.readFileSync(file)
  let nonAscii = 0

  for (let i = 0; i < bytes.length; ++i) {
    if (bytes[i] >= 0x80) {
      ++nonAscii
    }
  }

  // latin1 keeps one char per byte, so writing back as latin1 is byte-exact.
  const text = bytes.toString('latin1').replace(/\r\n?/g, '\n')
  const dataAt = text.search(/\bDATA\s*;/)

  if (dataAt < 0) {
    throw new Error('no DATA section')
  }

  const dataStart = text.indexOf(';', dataAt) + 1
  const endAt = text.indexOf('ENDSEC;', dataStart)

  if (endAt < 0) {
    throw new Error('DATA section has no ENDSEC')
  }

  if (/\bDATA\s*[;(]/.test(text.slice(endAt))) {
    throw new Error('more than one DATA section: not supported')
  }

  const schemaMatch = /FILE_SCHEMA\s*\(\s*\([^;]*\)\s*\)\s*;/.exec(text.slice(0, dataAt))

  if (!schemaMatch) {
    throw new Error('no FILE_SCHEMA in header')
  }

  const records = parseRecords(text.slice(dataStart, endAt))
  const byId = new Map(records.map((r) => [r.id, r]))

  if (byId.size !== records.length) {
    throw new Error('duplicate entity ids in source')
  }

  const attrRefs = (r) => r.refs.slice(1)

  // Top product definition: one no NAUO names as its child.
  const children = new Set()

  for (const r of records) {
    if (r.type === 'NEXT_ASSEMBLY_USAGE_OCCURRENCE') {
      children.add(attrRefs(r)[1])
    }
  }

  const pdTypes = new Set(['PRODUCT_DEFINITION', 'PRODUCT_DEFINITION_WITH_ASSOCIATED_DOCUMENTS'])
  const roots = records.filter((r) => pdTypes.has(r.type) && !children.has(r.id))

  if (roots.length !== 1) {
    throw new Error(`need exactly one top PRODUCT_DEFINITION, found ${roots.length}`)
  }

  const pd = roots[0]
  const pds = records.find((r) => r.type === 'PRODUCT_DEFINITION_SHAPE' && attrRefs(r)[0] === pd.id)

  if (!pds) {
    throw new Error(`no PRODUCT_DEFINITION_SHAPE for #${pd.id}`)
  }

  const sdr = records.find((r) => r.type === 'SHAPE_DEFINITION_REPRESENTATION' &&
    attrRefs(r)[0] === pds.id)

  if (!sdr) {
    throw new Error(`no SHAPE_DEFINITION_REPRESENTATION for #${pds.id}`)
  }

  const rep = byId.get(attrRefs(sdr)[1])
  const repRefs = attrRefs(rep)
  const context = repRefs[repRefs.length - 1]
  const origin = repRefs.slice(0, -1).find((id) => byId.get(id)?.type === 'AXIS2_PLACEMENT_3D')

  if (origin === undefined) {
    throw new Error(`top shape representation #${rep.id} lists no AXIS2_PLACEMENT_3D: ` +
      'the ITEM_DEFINED_TRANSFORMATION needs one in the child. Not supported.')
  }

  const pdf = byId.get(attrRefs(pd)[0])
  const product = byId.get(attrRefs(pdf)[0])

  if (product?.type !== 'PRODUCT') {
    throw new Error(`PRODUCT_DEFINITION #${pd.id} does not lead to a PRODUCT`)
  }

  markProductName(product)

  // Source extent from every 3D CARTESIAN_POINT, for the grid pitch. A
  // superset of the solid's extent (it includes surface origins, control
  // points and any wireframe), which only makes the gaps wider.
  const lo = [Infinity, Infinity, Infinity]
  const hi = [-Infinity, -Infinity, -Infinity]

  for (const r of records) {
    if (r.type !== 'CARTESIAN_POINT') {
      continue
    }

    const m = /\(\s*([^()]*)\)\s*\)\s*;$/.exec(r.text)
    const xyz = m ? m[1].split(',').map(Number) : []

    if (xyz.length === 3 && xyz.every(Number.isFinite)) {
      for (let k = 0; k < 3; ++k) {
        lo[k] = Math.min(lo[k], xyz[k])
        hi[k] = Math.max(hi[k], xyz[k])
      }
    }
  }

  let maxId = 0

  for (const r of records) {
    maxId = Math.max(maxId, r.id, ...r.refs)
  }

  // Per-record constant byte count and its refs, for exact size planning.
  let litBytes = 0
  const allRefs = []

  for (const r of records) {
    litBytes += r.lits.reduce((s, l) => s + l.length, 0) + r.refs.length + 1 // '#'s + '\n'
    allRefs.push(...r.refs)
  }

  allRefs.sort((a, b) => a - b)

  return {
    file, bytes: bytes.length, nonAscii, schema: schemaMatch[0], records,
    pd: pd.id, rep: rep.id, context, origin, product: product.id, productRecord: product,
    pointExtent: [0, 1, 2].map((k) => hi[k] - lo[k]),
    maxId, litBytes, allRefs,
  }
}


/** @return {number} decimal digits of a positive integer */
function digits(x) {
  return x < 10 ? 1 : Math.floor(Math.log10(x)) + 1
}


/**
 * Round up to two significant digits.
 *
 * @param {number} x > 0
 * @return {number}
 */
function niceCeil(x) {
  const p = 10 ** (Math.floor(Math.log10(x)) - 1)

  return Number((Math.ceil(x / p) * p).toPrecision(12))
}


/**
 * Format a coordinate as a STEP REAL (always with a decimal point).
 *
 * @param {number} v
 * @return {string}
 */
function real(v) {
  const [mantissa, exponent] = String(v).split('e')
  const m = mantissa.includes('.') ? mantissa : `${mantissa}.`

  return exponent === undefined ? m : `${m}E${exponent}`
}


/**
 * Exact byte count of copy i: the literal text plus the digits of every
 * shifted id, plus the product-name suffixes.
 *
 * @param {object} src
 * @param {number} i
 * @param {number} stride
 * @return {number}
 */
function copyBytes(src, i, stride) {
  const off = i * stride
  const refs = src.allRefs
  let total = src.litBytes + refs.length // one digit minimum per ref

  // digits(r + off) = 1 + #{d ≥ 1 : r + off ≥ 10^d}
  for (let d = 1; 10 ** d <= refs[refs.length - 1] + off; ++d) {
    const threshold = 10 ** d - off
    // count of refs ≥ threshold
    let a = 0
    let b = refs.length

    while (a < b) {
      const mid = (a + b) >> 1

      if (refs[mid] < threshold) {
        a = mid + 1
      } else {
        b = mid
      }
    }

    total += refs.length - a
  }

  // two \u0000 markers each become `_<i+1>'` (the quote was consumed by the marker)
  return total + 2 * (`_${i + 1}`.length)
}


/**
 * Emit one copy's records.
 *
 * @param {object} src
 * @param {number} i
 * @param {number} stride
 * @param {(s: string) => void} put
 * @return {void}
 */
function emitCopy(src, i, stride, put) {
  const off = i * stride
  const suffix = `_${i + 1}'`

  for (const r of src.records) {
    let s = r.lits[0]

    for (let k = 0; k < r.refs.length; ++k) {
      s += `#${r.refs[k] + off}${r.lits[k + 1]}`
    }

    if (r === src.productRecord) {
      s = s.replaceAll('\u0000', suffix)
    }

    put(`${s}\n`)
  }
}


/**
 * The assembly root and the per-copy links, as lines.
 *
 * @param {object} src
 * @param {number} K
 * @param {number} stride
 * @param {number[]} spacing [sx, sy]
 * @param {number} cols
 * @return {string[]}
 */
function rootRecords(src, K, stride, spacing, cols) {
  let next = K * stride + 1
  const id = () => next++
  const out = []
  const name = `synthetic_scale_${K}`

  // Its own product contexts; the shape representation below reuses copy 0's
  // representation context, so the grid offsets are in the source's units.
  const appCtx = id()
  out.push(`#${appCtx}=APPLICATION_CONTEXT('synthetic scale ladder assembly');`)
  const prodCtx = id()
  out.push(`#${prodCtx}=PRODUCT_CONTEXT('',#${appCtx},'mechanical');`)
  const pdCtx = id()
  out.push(`#${pdCtx}=PRODUCT_DEFINITION_CONTEXT('part definition',#${appCtx},'design');`)
  const product = id()
  out.push(`#${product}=PRODUCT('${name}','${name}','conway gen_scale.mjs: ${K} copies',(#${prodCtx}));`)
  const pdf = id()
  out.push(`#${pdf}=PRODUCT_DEFINITION_FORMATION_WITH_SPECIFIED_SOURCE('1','',#${product},.NOT_KNOWN.);`)
  const pd = id()
  out.push(`#${pd}=PRODUCT_DEFINITION('design','',#${pdf},#${pdCtx});`)
  const pds = id()
  out.push(`#${pds}=PRODUCT_DEFINITION_SHAPE('','',#${pd});`)
  const cat = id()
  out.push(`#${cat}=PRODUCT_RELATED_PRODUCT_CATEGORY('assembly',$,(#${product}));`)

  const dz = id()
  out.push(`#${dz}=DIRECTION('',(0.,0.,1.));`)
  const dx = id()
  out.push(`#${dx}=DIRECTION('',(1.,0.,0.));`)
  const o = id()
  out.push(`#${o}=CARTESIAN_POINT('',(0.,0.,0.));`)
  const originPlacement = id()
  out.push(`#${originPlacement}=AXIS2_PLACEMENT_3D('',#${o},#${dz},#${dx});`)

  const places = []

  for (let i = 0; i < K; ++i) {
    const x = (i % cols) * spacing[0]
    const y = Math.floor(i / cols) * spacing[1]
    const pt = id()
    out.push(`#${pt}=CARTESIAN_POINT('',(${real(x)},${real(y)},0.));`)
    const pl = id()
    out.push(`#${pl}=AXIS2_PLACEMENT_3D('',#${pt},#${dz},#${dx});`)
    places.push(pl)
  }

  const rep = id()
  out.push(`#${rep}=SHAPE_REPRESENTATION('${name}',(#${originPlacement},` +
    `${places.map((p) => `#${p}`).join(',')}),#${src.context});`)
  const sdr = id()
  out.push(`#${sdr}=SHAPE_DEFINITION_REPRESENTATION(#${pds},#${rep});`)

  for (let i = 0; i < K; ++i) {
    const off = i * stride
    const nauo = id()
    out.push(`#${nauo}=NEXT_ASSEMBLY_USAGE_OCCURRENCE('${i + 1}','copy_${i + 1}','',` +
      `#${pd},#${src.pd + off},$);`)
    const placement = id()
    out.push(`#${placement}=PRODUCT_DEFINITION_SHAPE('Placement','Placement of an item',#${nauo});`)
    const idt = id()
    out.push(`#${idt}=ITEM_DEFINED_TRANSFORMATION('','',#${src.origin + off},#${places[i]});`)
    const rr = id()
    out.push(`#${rr}=(REPRESENTATION_RELATIONSHIP('','',#${src.rep + off},#${rep})` +
      `REPRESENTATION_RELATIONSHIP_WITH_TRANSFORMATION(#${idt})SHAPE_REPRESENTATION_RELATIONSHIP());`)
    const cdsr = id()
    out.push(`#${cdsr}=CONTEXT_DEPENDENT_SHAPE_REPRESENTATION(#${rr},#${placement});`)
  }

  return out
}


/**
 * @param {string} s
 * @return {string} s safe inside a STEP string literal
 */
function stepString(s) {
  return s.replace(/[^\x20-\x7e]/g, '_').replace(/'/g, '\'\'')
}


/**
 * @param {object} src
 * @param {string} outName
 * @param {number} K
 * @return {string}
 */
function header(src, outName, K) {
  return 'ISO-10303-21;\nHEADER;\n' +
    `FILE_DESCRIPTION(('conway kernel_compare synthetic scale ladder: ${K} renumbered copies of ` +
    `${stepString(path.basename(src.file))} under one assembly'),'2;1');\n` +
    `FILE_NAME('${stepString(outName)}','${FILE_TIMESTAMP}',(''),(''),` +
    '\'conway scripts/kernel_compare/gen_scale.mjs\',\'\',\'\');\n' +
    `${src.schema}\nENDSEC;\nDATA;\n`
}

const TRAILER = 'ENDSEC;\nEND-ISO-10303-21;\n'


/**
 * Exact output size for K copies.
 *
 * @param {object} src
 * @param {object} plan {stride, spacing, outName}
 * @param {number} K
 * @param {number[]} prefix prefix[k] = Σ copyBytes(0..k-1), extended on demand
 * @return {number}
 */
function totalBytes(src, plan, K, prefix) {
  while (prefix.length <= K) {
    const k = prefix.length - 1
    prefix.push(prefix[k] + copyBytes(src, k, plan.stride))
  }

  const cols = Math.ceil(Math.sqrt(K))
  const root = rootRecords(src, K, plan.stride, plan.spacing, cols)

  return header(src, plan.outName, K).length + prefix[K] +
    root.reduce((s, l) => s + l.length + 1, 0) + TRAILER.length
}


/**
 * Choose K for a byte target.
 *
 * @return {number}
 */
function chooseK(src, plan, target, fit) {
  const prefix = [0]
  // Exponential then binary search for the largest K with total ≤ target.
  let hiK = 1

  while (totalBytes(src, plan, hiK, prefix) <= target) {
    hiK *= 2
  }

  let loK = Math.max(1, hiK >> 1)

  if (totalBytes(src, plan, loK, prefix) > target) {
    loK = 0
  }

  // invariant: total(loK) ≤ target (or loK = 0), total(hiK) > target
  while (hiK - loK > 1) {
    const mid = (loK + hiK) >> 1

    if (totalBytes(src, plan, mid, prefix) <= target) {
      loK = mid
    } else {
      hiK = mid
    }
  }

  if (fit === 'at-most') {
    if (loK === 0) {
      throw new Error(`even one copy exceeds ${target} bytes`)
    }

    return loK
  }

  if (fit === 'above') {
    return hiK
  }

  if (loK === 0) {
    return hiK
  }

  const below = target - totalBytes(src, plan, loK, prefix)
  const above = totalBytes(src, plan, hiK, prefix) - target

  return below <= above ? loK : hiK
}


/**
 * Write the file in chunks.
 *
 * @return {number} bytes written
 */
function writeFile(src, plan, K, out) {
  const cols = Math.ceil(Math.sqrt(K))
  const fd = fs.openSync(out, 'w')
  let pending = []
  let pendingBytes = 0
  let written = 0

  const flush = () => {
    if (pendingBytes === 0) {
      return
    }

    const buf = Buffer.from(pending.join(''), 'latin1')
    fs.writeSync(fd, buf)
    written += buf.length
    pending = []
    pendingBytes = 0
  }
  const put = (s) => {
    pending.push(s)
    pendingBytes += s.length

    if (pendingBytes >= CHUNK_BYTES) {
      flush()
    }
  }

  try {
    put(header(src, plan.outName, K))

    for (let i = 0; i < K; ++i) {
      emitCopy(src, i, plan.stride, put)
    }

    for (const line of rootRecords(src, K, plan.stride, plan.spacing, cols)) {
      put(`${line}\n`)
    }

    put(TRAILER)
    flush()
  } finally {
    fs.closeSync(fd)
  }

  return written
}


/**
 * @return {Promise<number>} exit code
 */
async function main() {
  const o = parseArgs(process.argv.slice(2))

  if (o.help) {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0])
    return 0
  }

  const src = analyseSource(o.source)

  if (src.nonAscii > 0) {
    console.error(`WARNING: source has ${src.nonAscii} non-ASCII bytes. File bytes then differ ` +
      'from the length of a UTF-8-decoded string (SMLib decodes latin1, one char per byte; ' +
      'Buffer.toString(\'utf8\') does not). Prefer a pure-ASCII source for the string-limit band.')
  }

  const spacing = o.spacing ?? src.pointExtent.slice(0, 2).map((e) => niceCeil(Math.max(e, 1e-9) * 1.25))
  const outName = o.out ? path.basename(o.out) : 'plan.step'
  const plan = {stride: src.maxId, spacing, outName}
  const K = o.copies ?? chooseK(src, plan, o.targetBytes, o.fit)
  const cols = Math.ceil(Math.sqrt(K))
  const rows = Math.ceil(K / cols)
  const planned = totalBytes(src, plan, K, [0])

  const summary = {
    out: o.out ?? null,
    source: o.source,
    source_bytes: src.bytes,
    source_non_ascii_bytes: src.nonAscii,
    copies: K,
    bytes: planned,
    target_bytes: o.targetBytes ?? null,
    fit: o.targetBytes !== undefined ? o.fit : null,
    max_string_length: MAX_STRING_LENGTH,
    bytes_minus_max_string_length: planned - MAX_STRING_LENGTH,
    stride: plan.stride,
    max_entity_id: K * plan.stride + rootRecords(src, K, plan.stride, spacing, cols).length,
    grid: {cols, rows},
    spacing_source_units: spacing,
    source_point_extent_source_units: src.pointExtent,
    union_extent_formula: `((${cols}-1)*${spacing[0]} + ex, (${rows}-1)*${spacing[1]} + ey, ez)` +
      ' for part extents ex,ey,ez in source units',
  }

  if (!o.plan) {
    fs.mkdirSync(path.dirname(path.resolve(o.out)), {recursive: true})
    const started = Date.now()
    const written = writeFile(src, plan, K, o.out)
    const onDisk = fs.statSync(o.out).size

    if (written !== planned || onDisk !== planned) {
      throw new Error(`size plan mismatch: planned ${planned}, wrote ${written}, on disk ${onDisk}`)
    }

    summary.write_ms = Date.now() - started
  }

  console.log(JSON.stringify(summary))

  return 0
}

main().then((code) => {
  process.exitCode = code
}, (err) => {
  console.error(`gen_scale: ${err.message}`)
  process.exitCode = 1
})
