#!/usr/bin/env node
/**
 * Join the rows written by run.mjs into `<out>/compare.csv` (one line per
 * model, full paths allowed: it stays outside the repo) and `<out>/summary.md`
 * (meant to be pasted into design/new/kernel-compare-smlib.md, so anything
 * from the private corpus or t3_synthetic is labelled by tier + size band +
 * index, never by filename).
 *
 *   node scripts/kernel_compare/join.mjs [--out <dir>] [--private <root>]
 *
 * Inputs: `<out>/rows.jsonl` (last row per model/arm/variant wins),
 * `<out>/run_header.json` (optional).  Row contract: README.md in this dir.
 */
import fs from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import process from 'node:process'

const require = createRequire(import.meta.url)
const {csvRow} = require('../csv_rfc4180.cjs')

const KIB = 1024
const MIB = KIB * KIB
const GIB = KIB * MIB
const DEFAULT_OUT = '/home/user/kernel-compare-out'
const DEFAULT_PRIVATE = '/home/user/test-models-private'
const AREA_BAND = 0.01
const EXACT_AGREE = 0.001
const ERROR_COLS = 160
const RATIO_DIGITS = 4
const BAND_EDGES_MIB = {small: 50, mid: 200, large: 500, limit: 600}
const BANDS = [
  {name: '<50', test: (b) => b < BAND_EDGES_MIB.small * MIB},
  {name: '50-200', test: (b) => b < BAND_EDGES_MIB.mid * MIB},
  {name: '200-500', test: (b) => b < BAND_EDGES_MIB.large * MIB},
  {name: '500-600', test: (b) => b <= BAND_EDGES_MIB.limit * MIB},
  {name: '>600', test: () => true},
]
const TIERS = ['T0', 'T1', 'T2', 'T3']
const ARM_ORDER = ['conway:mt', 'conway:st', 'smlib-js:heal=false', 'smlib-js:heal=true', 'smlib-py:heal=false', 'smlib-py:heal=true', 'occt']
const AXES = ['x', 'y', 'z']

/**
 * @param {number} bytes Size.
 * @return {string} Band name.
 */
function bandOf(bytes) {
  return BANDS.find((b) => b.test(bytes)).name
}

/**
 * @param {object} row Row.
 * @return {string} Arm key as run.mjs uses it (occt has no variant).
 */
function armKeyOf(row) {
  return row.variant && row.variant !== 'default' ? `${row.arm}:${row.variant}` : row.arm
}

/**
 * @param {number[]} xs Numbers.
 * @return {number|null} Median or null when empty.
 */
function median(xs) {
  if (xs.length === 0) {
    return null
  }
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/**
 * @param {*} v Value.
 * @return {boolean} True for a finite number.
 */
function num(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

/**
 * @param {number|null} a Numerator.
 * @param {number|null} b Denominator.
 * @return {number|null} a/b, or null if either is missing or b is not positive.
 */
function ratio(a, b) {
  return num(a) && num(b) && b > 0 ? a / b : null
}

/**
 * @param {number|null} r Ratio.
 * @return {string} Fixed-digit ratio or a dash.
 */
function fmtRatio(r) {
  return r === null ? '-' : r.toFixed(RATIO_DIGITS)
}

/**
 * @param {number} bytes Size.
 * @return {string} Human size.
 */
function fmtSize(bytes) {
  return bytes < MIB ? `${(bytes / KIB).toFixed(1)} KiB` : `${(bytes / MIB).toFixed(1)} MiB`
}

/**
 * @param {string} s Cell text.
 * @return {string} Markdown-table-safe text.
 */
function cell(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
}

/**
 * @param {string[]} head Header cells.
 * @param {string[][]} rows Body rows.
 * @return {string} Markdown table.
 */
function table(head, rows) {
  const lines = [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`]
  for (const r of rows) {
    lines.push(`| ${r.map(cell).join(' | ')} |`)
  }
  return lines.join('\n')
}

/**
 * @param {string[]} argv Arguments.
 * @return {object} Flags.
 */
function parseArgs(argv) {
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--help') {
      flags.help = true
    } else if (a === '--out' || a === '--private') {
      i++
      if (i >= argv.length) {
        throw new Error(`missing value for ${a}`)
      }
      flags[a.slice(2)] = argv[i]
    } else {
      throw new Error(`unexpected argument ${a}`)
    }
  }
  return flags
}

/**
 * @param {string} p Path.
 * @param {string} root Root.
 * @return {boolean} True if p is under root.
 */
function under(p, root) {
  const rel = path.relative(root, p)
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)
}

/**
 * Collapse rows.jsonl to the last row per (model, arm key).
 *
 * @param {string} file rows.jsonl path.
 * @return {object} {byModel: Map<model, Map<armKey, row>>, count}.
 */
function loadRows(file) {
  const byModel = new Map()
  let count = 0
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) {
      return
    }
    let r
    try {
      r = JSON.parse(line)
    } catch {
      process.stderr.write(`warn: rows.jsonl line ${i + 1} is not JSON, ignored\n`)
      return
    }
    count++
    if (!byModel.has(r.model)) {
      byModel.set(r.model, new Map())
    }
    byModel.get(r.model).set(armKeyOf(r), r)
  })
  return {byModel, count}
}

/**
 * Per-model facts shared by CSV and summary.
 *
 * @param {Map} byModel Collapsed rows.
 * @param {string} privateRoot Private corpus root.
 * @param {object} keys Headline arm keys {conway, smlib, occt}.
 * @return {object[]} Models, ascending size within tier.
 */
function buildModels(byModel, privateRoot, keys) {
  const models = []
  for (const [model, arms] of byModel) {
    const any = [...arms.values()][0]
    const size = [...arms.values()].map((r) => r.size_bytes).find(num) ?? 0
    const tier = any.tier ?? '?'
    models.push({
      path: model, arms, size, tier,
      band: any.band ?? bandOf(size),
      isPrivate: under(model, privateRoot) || model.split(path.sep).includes('t3_synthetic'),
    })
  }
  const rank = (t) => TIERS.indexOf(t) < 0 ? TIERS.length : TIERS.indexOf(t)
  models.sort((a, b) => rank(a.tier) - rank(b.tier) || a.size - b.size || a.path.localeCompare(b.path))

  const baseCount = new Map()
  models.filter((m) => !m.isPrivate).forEach((m) => {
    const b = path.basename(m.path)
    baseCount.set(b, (baseCount.get(b) ?? 0) + 1)
  })
  const idx = new Map()
  for (const m of models) {
    if (m.isPrivate) {
      const k = `${m.tier}-${m.band}`
      idx.set(k, (idx.get(k) ?? 0) + 1)
      m.label = `${k}#${idx.get(k)}`
    } else {
      const b = path.basename(m.path)
      m.label = baseCount.get(b) > 1 ? `${path.basename(path.dirname(m.path))}/${b}` : b
    }
    m.metrics = metricsFor(m, keys)
  }
  return models
}

const isOk = (r) => r?.status === 'ok'

/**
 * Cross-arm ratios and matches for one model (null where not computable).
 *
 * @param {object} m Model.
 * @param {object} keys Headline arm keys.
 * @return {object} Metrics.
 */
function metricsFor(m, keys) {
  const c = m.arms.get(keys.conway)
  const s = m.arms.get(keys.smlib)
  const o = m.arms.get(keys.occt)
  const both = (a, b) => isOk(a) && isOk(b)
  // An OCCT exact area flagged unstable is not a reference (README, F5).
  const occtArea = o?.exact_area_unstable === true ? null : o?.exact_area_mm2
  const bbox = (a, b) => AXES.map((_, i) => both(a, b) ? ratio(a.bbox_extent_mm?.[i], b.bbox_extent_mm?.[i]) : null)
  const match = (a, b) => both(a, b) && num(a.bodies) && num(b.bodies) ? a.bodies === b.bodies : null
  return {
    areaConwaySmlib: both(c, s) ? ratio(c.mesh_area_mm2, s.exact_area_mm2) : null,
    areaConwayOcct: both(c, o) ? ratio(c.mesh_area_mm2, occtArea) : null,
    areaSmlibOcct: both(s, o) ? ratio(s.exact_area_mm2, occtArea) : null,
    rssConwaySmlib: both(c, s) ? ratio(c.peak_rss_bytes, s.peak_rss_bytes) : null,
    bboxConwaySmlib: bbox(c, s),
    bboxConwayOcct: bbox(c, o),
    bodiesConwaySmlib: match(c, s),
    bodiesConwayOcct: match(c, o),
    bodiesSmlibOcct: match(s, o),
    conway: c, smlib: s, occt: o,
  }
}

/**
 * @param {object[]} models Models.
 * @param {string[]} armKeys Arm keys present.
 * @return {string} compare.csv text.
 */
function buildCsv(models, armKeys) {
  const perArm = ['status', 'read_ms', 'total_ms', 'peak_rss_bytes', 'bodies', 'triangles', 'mesh_area_mm2',
    'exact_area_mm2', 'bbox_x', 'bbox_y', 'bbox_z', 'error']
  const head = ['model', 'tier', 'band', 'size_bytes']
  for (const k of armKeys) {
    perArm.forEach((f) => head.push(`${k}.${f}`))
  }
  head.push('area_ratio_conway_smlib', 'area_ratio_conway_occt', 'area_ratio_smlib_occt', 'rss_ratio_conway_smlib')
  armKeys.forEach((k) => head.push(`peak_over_file.${k}`))
  for (const pair of ['conway_smlib', 'conway_occt']) {
    AXES.forEach((a) => head.push(`bbox_ratio_${pair}_${a}`))
  }
  head.push('bodies_match_conway_smlib', 'bodies_match_conway_occt', 'bodies_match_smlib_occt',
      'occt_exact_area_unstable')

  const lines = [csvRow(head)]
  for (const m of models) {
    const f = [m.path, m.tier, m.band, m.size]
    for (const k of armKeys) {
      const r = m.arms.get(k)
      f.push(r?.status, r?.read_ms, r?.total_ms, r?.peak_rss_bytes, r?.bodies, r?.triangles, r?.mesh_area_mm2,
        r?.exact_area_mm2, r?.bbox_extent_mm?.[0], r?.bbox_extent_mm?.[1], r?.bbox_extent_mm?.[2],
        r?.error ? String(r.error).split('\n')[0] : null)
    }
    const x = m.metrics
    f.push(x.areaConwaySmlib, x.areaConwayOcct, x.areaSmlibOcct, x.rssConwaySmlib)
    for (const k of armKeys) {
      f.push(ratio(m.arms.get(k)?.peak_rss_bytes, m.size))
    }
    f.push(...x.bboxConwaySmlib, ...x.bboxConwayOcct, x.bodiesConwaySmlib, x.bodiesConwayOcct, x.bodiesSmlibOcct,
      x.occt?.exact_area_unstable)
    lines.push(csvRow(f))
  }
  return `${lines.join('\n')}\n`
}

/**
 * Remove private names from free text.
 *
 * @param {string} text Text.
 * @param {object[]} models All models.
 * @param {string} privateRoot Private root.
 * @param {string} out Output dir.
 * @return {string} Scrubbed text.
 */
function scrub(text, models, privateRoot, out) {
  let t = String(text)
  for (const m of models.filter((x) => x.isPrivate)) {
    t = t.split(m.path).join(m.label).split(path.basename(m.path)).join(m.label)
  }
  return t.split(privateRoot).join('<private-root>').split(out).join('<out>')
}

/**
 * @param {object[]} models Models.
 * @param {object} keys Headline arm keys.
 * @param {string[]} armKeys Present arm keys.
 * @param {object} header run_header.json (may be empty).
 * @param {number} rowCount Row count.
 * @param {string} privateRoot Private root.
 * @param {string} out Output dir.
 * @return {string} summary.md text.
 */
function buildSummary(models, keys, armKeys, header, rowCount, privateRoot, out) {
  const md = []
  const sc = (t) => scrub(t, models, privateRoot, out)
  const firstLine = (e) => sc(String(e ?? '').split('\n')[0]).slice(0, ERROR_COLS)

  md.push('# Kernel compare results', '')
  md.push(`Joined ${rowCount} rows, ${models.length} models. Headline arms: \`${keys.conway}\` vs \`${keys.smlib}\`` +
    `${armKeys.includes(keys.occt) ? `, OCCT arm \`${keys.occt}\`` : ''}.`, '')
  md.push('Area ratio conway/SMLib = conway `mesh_area_mm2` / SMLib `exact_area_mm2`; conway/OCCT likewise ' +
    'against OCCT `exact_area_mm2`. Medians are over models where both arms are `ok`. Bands are MiB.', '')

  // Run header
  md.push('## Run', '')
  if (Object.keys(header).length === 0) {
    md.push('_run_header.json not found._', '')
  } else {
    const rows = [
      ['conway commit', `${header.conway_git_sha ?? '?'}${header.conway_tree_dirty ? ' (dirty tree)' : ''}`],
      ['smlibwasm', header.smlibwasm_version],
      ['node', header.node_version],
      ['python', header.python_version],
      ['cpu', `${header.cpu_model} x${header.cpu_cores}`],
      ['memory', header.total_memory_bytes ? `${(header.total_memory_bytes / GIB).toFixed(1)} GiB` : '?'],
      ['thread modes', JSON.stringify(header.thread_modes)],
      ['node --max-old-space-size', `${header.max_old_space_mb} MB (both node arms)`],
      ['per-run timeout', `${header.timeout_s} s`],
      ['mesh tolerance passed', header.tolerance_mm ?? 'arm default'],
      ['arms', (header.arms ?? []).join(', ')],
      ['invocations', String((header.invocations ?? []).length)],
    ]
    md.push(table(['Field', 'Value'], rows.map(([a, b]) => [a, String(b ?? '?')])), '')
  }

  // Results table
  md.push('## Results', '')
  const resRows = TIERS.map((t) => {
    const ms = models.filter((m) => m.tier === t)
    const okC = ms.filter((m) => isOk(m.metrics.conway)).length
    const okS = ms.filter((m) => isOk(m.metrics.smlib)).length
    const notes = []
    for (const [label, key] of [['conway', keys.conway], ['smlib-js', keys.smlib], ['occt', keys.occt]]) {
      const bad = new Map()
      ms.forEach((m) => {
        const s = m.arms.get(key)?.status
        if (s && s !== 'ok') {
          bad.set(s, (bad.get(s) ?? 0) + 1)
        }
      })
      if (bad.size > 0) {
        notes.push(`${label}: ${[...bad].map(([s, n]) => `${n} ${s}`).join(', ')}`)
      }
    }
    const a = median(ms.map((m) => m.metrics.areaConwaySmlib).filter(num))
    const r = median(ms.map((m) => m.metrics.rssConwaySmlib).filter(num))
    const nA = ms.filter((m) => num(m.metrics.areaConwaySmlib)).length
    const nR = ms.filter((m) => num(m.metrics.rssConwaySmlib)).length
    return [t, String(ms.length), `${okC}/${ms.length}`, `${okS}/${ms.length}`,
      a === null ? '-' : `${fmtRatio(a)} (n=${nA})`, r === null ? '-' : `${fmtRatio(r)} (n=${nR})`, notes.join('; ')]
  })
  md.push(table(['Tier', 'Models', 'conway ok', 'smlib-js ok', 'Median area ratio conway/SMLib',
    'Median peak RSS ratio conway/SMLib', 'Notes'], resRows), '')

  md.push('### ok per arm', '')
  md.push(table(['Tier', ...armKeys], TIERS.map((t) => {
    const ms = models.filter((m) => m.tier === t)
    return [t, ...armKeys.map((k) => `${ms.filter((m) => isOk(m.arms.get(k))).length}/${ms.length}`)]
  })), '')

  // Failures
  md.push('## Failures', '')
  const fails = []
  const skipped = new Map()
  for (const m of models) {
    for (const k of armKeys) {
      const r = m.arms.get(k)
      if (!r || r.status === 'ok') {
        continue
      }
      if (r.status === 'skipped') {
        skipped.set(k, (skipped.get(k) ?? 0) + 1)
        continue
      }
      fails.push([m.tier, m.label, fmtSize(m.size), k, r.status, firstLine(r.error)])
    }
  }
  md.push(fails.length === 0 ? 'None.' : table(['Tier', 'Model', 'Size', 'Arm', 'Status', 'Error (first line)'], fails), '')
  if (skipped.size > 0) {
    md.push(`Skipped runs (band rule or LFS stub; not failures): ${[...skipped].map(([k, n]) => `${k} ${n}`).join(', ')}.`, '')
  }

  // T3 by band
  md.push('## T3 scale ladder by band', '')
  const t3 = models.filter((m) => m.tier === 'T3')
  for (const b of BANDS) {
    const ms = t3.filter((m) => m.band === b.name)
    md.push(`### ${b.name} MiB`, '')
    if (ms.length === 0) {
      md.push('_No files in this band._ (The plan requires at least one per band.)', '')
      continue
    }
    const rows = []
    for (const m of ms) {
      for (const k of armKeys) {
        const r = m.arms.get(k)
        if (!r) {
          continue
        }
        rows.push([m.label, fmtSize(m.size), k, r.status,
          num(r.peak_rss_bytes) ? (r.peak_rss_bytes / MIB).toFixed(0) : '-',
          num(r.peak_rss_bytes) && m.size > 0 ? (r.peak_rss_bytes / m.size).toFixed(2) : '-',
          num(r.total_ms) ? r.total_ms.toFixed(0) : '-'])
      }
    }
    md.push(table(['Model', 'Size', 'Arm', 'Status', 'Peak RSS (MiB)', 'Peak RSS / file', 'total_ms'], rows), '')
  }

  // Outliers
  md.push('## Outliers', '')
  const outlierTable = (title, rows, head) => {
    md.push(`### ${title}`, '')
    md.push(rows.length === 0 ? 'None.' : table(head, rows), '')
  }
  const byDev = (get) => (a, b) => Math.abs(Math.log(get(b))) - Math.abs(Math.log(get(a)))
  const areaOut = (get) => models.filter((m) => num(get(m)) && get(m) > 0 && Math.abs(get(m) - 1) > AREA_BAND)
    .sort(byDev(get)).map((m) => [m.tier, m.label, fmtSize(m.size), fmtRatio(get(m))])
  outlierTable('Area ratio conway/SMLib outside [0.99, 1.01]', areaOut((m) => m.metrics.areaConwaySmlib), ['Tier', 'Model', 'Size', 'Ratio'])
  outlierTable('Area ratio conway/OCCT outside [0.99, 1.01]', areaOut((m) => m.metrics.areaConwayOcct), ['Tier', 'Model', 'Size', 'Ratio'])
  const exactOut = models.filter((m) => num(m.metrics.areaSmlibOcct) && Math.abs(m.metrics.areaSmlibOcct - 1) > EXACT_AGREE)
    .sort(byDev((m) => m.metrics.areaSmlibOcct)).map((m) => [m.tier, m.label, fmtSize(m.size), fmtRatio(m.metrics.areaSmlibOcct)])
  outlierTable('SMLib vs OCCT exact area differ by more than 0.1%', exactOut, ['Tier', 'Model', 'Size', 'SMLib/OCCT'])
  const bboxOut = models.flatMap((m) => {
    const rs = m.metrics.bboxConwaySmlib
    return rs.some((r) => num(r) && Math.abs(r - 1) > AREA_BAND)
      ? [[m.tier, m.label, fmtSize(m.size), rs.map(fmtRatio).join(' / ')]] : []
  })
  outlierTable('bbox extent ratio conway/SMLib outside [0.99, 1.01] on any axis (x / y / z)', bboxOut, ['Tier', 'Model', 'Size', 'Ratios'])
  const bodyOut = models.filter((m) => m.metrics.bodiesConwaySmlib === false || m.metrics.bodiesConwayOcct === false ||
    m.metrics.bodiesSmlibOcct === false).map((m) => {
    const x = m.metrics
    const n = (r) => isOk(r) && num(r.bodies) ? String(r.bodies) : '-'
    return [m.tier, m.label, fmtSize(m.size), n(x.conway), n(x.smlib), n(x.occt)]
  })
  outlierTable('Body-count mismatches', bodyOut, ['Tier', 'Model', 'Size', 'conway', 'SMLib', 'OCCT'])
  return `${md.join('\n')}\n`
}

/**
 * Entry point.
 */
function main() {
  const flags = parseArgs(process.argv.slice(2))
  if (flags.help) {
    process.stdout.write('usage: node scripts/kernel_compare/join.mjs [--out <dir>] [--private <root>]\n')
    return
  }
  const out = path.resolve(flags.out ?? DEFAULT_OUT)
  const rowsFile = path.join(out, 'rows.jsonl')
  if (!fs.existsSync(rowsFile)) {
    throw new Error(`${rowsFile} not found (run run.mjs first)`)
  }
  let header = {}
  try {
    header = JSON.parse(fs.readFileSync(path.join(out, 'run_header.json'), 'utf8'))
  } catch {
    process.stderr.write('note: run_header.json missing or unreadable\n')
  }
  const privateRoot = path.resolve(flags.private ?? header.corpora?.private ?? DEFAULT_PRIVATE)
  const {byModel, count} = loadRows(rowsFile)
  const present = new Set()
  byModel.forEach((arms) => arms.forEach((_, k) => present.add(k)))
  const armKeys = [...ARM_ORDER.filter((k) => present.has(k)), ...[...present].filter((k) => !ARM_ORDER.includes(k)).sort()]
  const keys = {
    conway: present.has('conway:mt') ? 'conway:mt' : 'conway:st',
    smlib: present.has('smlib-js:heal=false') || !present.has('smlib-py:heal=false') ? 'smlib-js:heal=false' : 'smlib-py:heal=false',
    occt: 'occt',
  }
  const models = buildModels(byModel, privateRoot, keys)
  fs.writeFileSync(path.join(out, 'compare.csv'), buildCsv(models, armKeys))
  fs.writeFileSync(path.join(out, 'summary.md'), buildSummary(models, keys, armKeys, header, count, privateRoot, out))
  process.stderr.write(`wrote ${path.join(out, 'compare.csv')} and ${path.join(out, 'summary.md')} (${models.length} models, ${count} rows)\n`)
}

try {
  main()
} catch (e) {
  process.stderr.write(`error: ${e.message}\n`)
  process.exit(2)
}
