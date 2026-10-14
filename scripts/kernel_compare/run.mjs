#!/usr/bin/env node
/**
 * Corpus walk for the kernel-compare harness: one process per (model, arm /
 * variant), strictly sequential, ascending size within a tier, with a
 * per-run timeout.  Appends one row per run to `<out>/rows.jsonl`.
 *
 *   node scripts/kernel_compare/run.mjs [--arms conway:mt,smlib-js:heal=false,...]
 *        [--tiers T0,T1,T2,T3] [--out <dir>] [--timeout <s>]
 *        [--max-old-space <MB>] [--tolerance <mm>] [--force] [--dry-run] ...
 *
 * Contract for the measure scripts: scripts/kernel_compare/README.md.
 * Plan (arms, comparison rules, the T3 band rule): design/new/kernel-compare-smlib.md.
 * Flags: see HELP below.
 */
import {spawn, spawnSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {Buffer, constants as bufferConstants} from 'node:buffer'
import {performance} from 'node:perf_hooks'
import {setTimeout, clearTimeout} from 'node:timers'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..')

const KIB = 1024
const MIB = KIB * KIB
const MS_PER_S = 1000
const STDOUT_TAIL_CHARS = 4 * MIB
const STDERR_TAIL_BLOCKS = 64
const STDERR_TAIL_CHARS = STDERR_TAIL_BLOCKS * KIB
const ERROR_TAIL_CHARS = 2 * KIB
const CLOSE_GRACE_MS = 3000
const DEFAULT_TIMEOUT_S = 1800
const DEFAULT_MAX_OLD_SPACE_MB = 8192
const DEFAULT_ARMS = 'conway:mt,conway:st,smlib-js:heal=false,smlib-js:heal=true,occt'
const DEFAULT_TIERS = 'T0,T1,T2,T3'
const DEFAULT_OUT = '/home/user/kernel-compare-out'
const DEFAULT_PUBLIC = '/home/user/test-models'
const DEFAULT_PRIVATE = '/home/user/test-models-private'
const DEFAULT_PYTHON = '/home/user/kc-venv/bin/python'
const DEFAULT_TIME_BIN = '/usr/bin/time'
const LFS_MAGIC = 'version https://git-lfs'
const SIGNAL_BASE = 128
const FIRST_LINE_CHARS = 200
const RUN_ID_CHARS = 15

/**
 * T3 size bands in MiB: [lo, hi) except the 500-600 band, whose upper bound is
 * inclusive (so a file of exactly 600 MiB is still "straddling the string
 * limit" rather than "> 600").
 */
const BAND_EDGES_MIB = {small: 50, mid: 200, large: 500, limit: 600}
const BANDS = [
  {name: '<50', test: (b) => b < BAND_EDGES_MIB.small * MIB},
  {name: '50-200', test: (b) => b < BAND_EDGES_MIB.mid * MIB},
  {name: '200-500', test: (b) => b < BAND_EDGES_MIB.large * MIB},
  {name: '500-600', test: (b) => b <= BAND_EDGES_MIB.limit * MIB},
  {name: '>600', test: () => true},
]

/**
 * V8's longest string, in UTF-16 code units (a latin-1 decode of a file of this many bytes is the
 * longest `readFileSync(..., 'latin1')` can return). 536,870,888 on Node 22. The smallest T3 file
 * strictly above it is the P1 probe: the one file whose point is to find out what the string limit
 * does to each arm, so the band rule never skips it (see `probeFileFor`).
 */
const MAX_STRING_BYTES = bufferConstants.MAX_STRING_LENGTH

const T2_T3_BOUNDARY_BYTES = BAND_EDGES_MIB.small * MIB

const MEMORY_RE = new RegExp([
  'FATAL ERROR:.*(heap|allocation failed|out of memory)',
  'JavaScript heap out of memory',
  'Reached heap limit',
  'Invalid string length',
  'Cannot allocate',
  'out of memory',
  'MemoryError',
  'std::bad_alloc',
  'memory access out of bounds',
  'Aborted\\(.*OOM',
  'Cannot enlarge memory',
].join('|'), 'i')
const STRING_LENGTH_RE = /Invalid string length/

const HELP = `usage: node scripts/kernel_compare/run.mjs [flags]
  --arms <list>          comma list of arm[:variant] (default ${DEFAULT_ARMS})
                         conway:mt|st  smlib-js:heal=true|false  smlib-py:heal=true|false  occt
  --tiers <list>         T0,T1,T2,T3 (default ${DEFAULT_TIERS})
  --out <dir>            output dir (default ${DEFAULT_OUT})
  --timeout <s>          per-run timeout (default ${DEFAULT_TIMEOUT_S})
  --max-old-space <MB>   --max-old-space-size for BOTH node arms (default ${DEFAULT_MAX_OLD_SPACE_MB})
  --tolerance <mm>       passed through to every arm
  --python <path>        python for smlib-py / occt (default ${DEFAULT_PYTHON})
  --public <dir>         public corpus root (default ${DEFAULT_PUBLIC})
  --private <dir>        private corpus root (default ${DEFAULT_PRIVATE})
  --smoke-list <file>    T1 list (default regression/smoke_models.txt)
  --arm-dir <dir>        where the *_measure.* scripts live (default this directory)
  --time-bin <path>      GNU time for max RSS of crashed children (default ${DEFAULT_TIME_BIN}; used only if it exists)
  --only <substr>        keep only models whose path contains substr
  --force                re-run (model, arm, variant) already in rows.jsonl
  --dry-run              print the plan and exit
`

/**
 * Parse --key value / --key=value / boolean flags.
 *
 * @param {string[]} argv Arguments after the script name.
 * @return {object} Flag map.
 */
function parseArgs(argv) {
  const bools = new Set(['force', 'dry-run', 'help'])
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) {
      throw new Error(`unexpected argument ${a}`)
    }
    const eq = a.indexOf('=')
    const key = eq < 0 ? a.slice(2) : a.slice(2, eq)
    if (bools.has(key)) {
      flags[key] = true
    } else if (eq >= 0) {
      flags[key] = a.slice(eq + 1)
    } else {
      i++
      if (i >= argv.length) {
        throw new Error(`missing value for ${a}`)
      }
      flags[key] = argv[i]
    }
  }
  return flags
}

/**
 * Parse `arm[:variant]` into the pieces the runner needs.
 *
 * @param {string} spec e.g. `smlib-js:heal=false`.
 * @return {object} {spec, arm, variant, key, runtime, script, args}.
 */
function parseArm(spec) {
  const colon = spec.indexOf(':')
  const arm = colon < 0 ? spec : spec.slice(0, colon)
  const given = colon < 0 ? null : spec.slice(colon + 1)
  if (arm === 'conway') {
    const variant = given ?? 'mt'
    if (variant !== 'mt' && variant !== 'st') {
      throw new Error(`bad conway variant "${variant}" (mt|st)`)
    }
    return {arm, variant, key: `conway:${variant}`, runtime: 'node', script: 'conway_measure.mjs',
      args: ['--threads', variant]}
  }
  if (arm === 'smlib-js' || arm === 'smlib-py') {
    const variant = given ?? 'heal=false'
    const m = /^heal=(true|false)$/.exec(variant)
    if (!m) {
      throw new Error(`bad ${arm} variant "${variant}" (heal=true|false)`)
    }
    return {arm, variant, key: `${arm}:${variant}`, runtime: arm === 'smlib-js' ? 'node' : 'python',
      script: arm === 'smlib-js' ? 'smlib_measure.mjs' : 'smlib_measure.py', args: ['--heal', m[1]]}
  }
  if (arm === 'occt') {
    if (given && given !== 'default') {
      throw new Error(`occt takes no variant (got "${given}")`)
    }
    return {arm, variant: 'default', key: 'occt', runtime: 'python', script: 'occt_measure.py', args: []}
  }
  throw new Error(`unknown arm "${arm}"`)
}

/**
 * @param {number} bytes File size.
 * @return {string} T3 band name.
 */
function bandOf(bytes) {
  return BANDS.find((b) => b.test(bytes)).name
}

/**
 * @param {string} p Path.
 * @return {boolean} True for .step/.stp in any case.
 */
function isStep(p) {
  return /\.(step|stp)$/i.test(p)
}

/**
 * Recursively list STEP files under a root, without following symlinked dirs.
 *
 * @param {string} root Directory.
 * @return {string[]} Absolute paths.
 */
function walkSteps(root) {
  const out = []
  const stack = [root]
  while (stack.length > 0) {
    const dir = stack.pop()
    let ents
    try {
      ents = fs.readdirSync(dir, {withFileTypes: true})
    } catch (e) {
      log(`warn: cannot read ${dir}: ${e.code ?? e.message}`)
      continue
    }
    for (const ent of ents) {
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) {
        if (ent.name !== '.git' && ent.name !== 'node_modules') {
          stack.push(p)
        }
      } else if (ent.isFile() && isStep(ent.name)) {
        out.push(p)
      }
    }
  }
  return out
}

/**
 * @param {string} p File path.
 * @return {boolean} True when the file is a Git LFS pointer stub.
 */
function isLfsStub(p) {
  const fd = fs.openSync(p, 'r')
  try {
    const buf = Buffer.alloc(LFS_MAGIC.length)
    const n = fs.readSync(fd, buf, 0, buf.length, 0)
    return buf.toString('latin1', 0, n) === LFS_MAGIC
  } finally {
    fs.closeSync(fd)
  }
}

/**
 * @param {string} msg Progress line.
 */
function log(msg) {
  process.stderr.write(`${msg}\n`)
}

/**
 * Read the T0 manifest into the list of files with writer_ok true.
 *
 * @param {string} manifestPath Manifest path.
 * @return {object} {files, missing, total}.
 */
function readT0Manifest(manifestPath) {
  const j = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  let list = Array.isArray(j) ? j : null
  if (!list && j && typeof j === 'object') {
    for (const k of ['entries', 'fixtures', 'files', 'models', 'items']) {
      if (Array.isArray(j[k])) {
        list = j[k]
        break
      }
    }
    list ??= Object.values(j).filter((v) => v && typeof v === 'object')
  }
  const dir = path.dirname(manifestPath)
  const files = []
  const missing = []
  for (const e of list) {
    if (e?.writer_ok !== true || typeof e.file !== 'string') {
      continue
    }
    const p = path.resolve(dir, e.file)
    if (fs.existsSync(p)) {
      files.push(p)
    } else {
      missing.push(p)
    }
  }
  return {files, missing, total: list.length}
}

/**
 * Resolve the tier membership of every model.
 *
 * @param {object} cfg Parsed configuration.
 * @return {object[]} Models {path, size, tier, band?}, ascending size within tier.
 */
function planModels(cfg) {
  const want = new Set(cfg.tiers)
  const models = []
  const seen = new Set()
  const add = (p, tier) => {
    const real = fs.realpathSync(p)
    if (seen.has(real)) {
      return
    }
    seen.add(real)
    const size = fs.statSync(real).size
    models.push({path: p, size, tier, band: tier === 'T3' ? bandOf(size) : undefined})
  }

  // T0
  if (want.has('T0')) {
    const manifest = path.join(cfg.out, 't0_blends', 'manifest.json')
    if (!fs.existsSync(manifest)) {
      log(`T0: ${manifest} absent, skipping T0 (run gen_blends.py first)`)
    } else {
      const {files, missing, total} = readT0Manifest(manifest)
      log(`T0: manifest lists ${total} entries, ${files.length} with writer_ok:true`)
      for (const m of missing) {
        log(`warn: T0 manifest file missing on disk: ${m}`)
      }
      files.forEach((f) => add(f, 'T0'))
    }
  }

  const needCorpus = ['T1', 'T2', 'T3'].some((t) => want.has(t))
  if (needCorpus) {
    if (!fs.existsSync(cfg.publicRoot)) {
      throw new Error(`public corpus root ${cfg.publicRoot} does not exist`)
    }
    const publicSteps = walkSteps(cfg.publicRoot)
    const privateSteps = fs.existsSync(cfg.privateRoot) ? walkSteps(cfg.privateRoot) : []
    if (!fs.existsSync(cfg.privateRoot)) {
      log(`warn: private corpus root ${cfg.privateRoot} absent`)
    }

    // T1: smoke list entries resolved by basename under the public corpus.
    const smoke = fs.readFileSync(cfg.smokeList, 'utf8').split('\n').map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && isStep(l))
    const byBase = new Map()
    for (const p of publicSteps.sort()) {
      const b = path.basename(p)
      byBase.set(b, [...byBase.get(b) ?? [], p])
    }
    const t1 = new Set()
    const unresolved = []
    for (const name of smoke) {
      const hits = byBase.get(name)
      if (!hits) {
        unresolved.push(name)
        continue
      }
      if (hits.length > 1) {
        log(`warn: smoke entry ${name} matches ${hits.length} files, using ${hits[0]}`)
      }
      t1.add(hits[0])
    }
    if (unresolved.length > 0) {
      throw new Error(`T1: smoke entries not found under ${cfg.publicRoot}: ${unresolved.join(', ')}`)
    }
    if (want.has('T1')) {
      [...t1].forEach((p) => add(p, 'T1'))
    }

    const rest = [...publicSteps, ...privateSteps].filter((p) => !t1.has(p))
    for (const p of rest) {
      const size = fs.statSync(p).size
      if (size < T2_T3_BOUNDARY_BYTES) {
        if (want.has('T2')) {
          add(p, 'T2')
        }
      } else if (want.has('T3')) {
        add(p, 'T3')
      }
    }
  }

  if (want.has('T3')) {
    const synth = path.join(cfg.out, 't3_synthetic')
    if (fs.existsSync(synth)) {
      walkSteps(synth).forEach((p) => add(p, 'T3'))
    } else {
      log(`T3: ${synth} absent, no synthetic files`)
    }
  }

  const tierRank = {T0: 0, T1: 1, T2: 2, T3: 3}
  models.sort((a, b) => tierRank[a.tier] - tierRank[b.tier] || a.size - b.size || a.path.localeCompare(b.path))
  return cfg.only ? models.filter((m) => m.path.includes(cfg.only)) : models
}

/**
 * Run one child to completion (or kill its process group at the timeout).
 *
 * @param {string[]} argv Full command line.
 * @param {object} opts {timeoutMs, timeBin}.
 * @return {Promise<object>} Raw outcome.
 */
function runChild(argv, opts) {
  return new Promise((resolve) => {
    let rssFile = null
    let cmd = argv
    if (opts.timeBin) {
      rssFile = path.join(os.tmpdir(), `kc-time-${process.pid}-${Date.now()}.txt`)
      cmd = [opts.timeBin, '-v', '-o', rssFile, ...argv]
    }
    const t0 = performance.now()
    const child = spawn(cmd[0], cmd.slice(1), {detached: true, stdio: ['ignore', 'pipe', 'pipe']})
    currentChild = child
    let out = ''
    let err = ''
    let timedOut = false
    let settled = false
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (d) => {
      out += d
      if (out.length > STDOUT_TAIL_CHARS) {
        out = out.slice(-STDOUT_TAIL_CHARS)
      }
    })
    child.stderr.on('data', (d) => {
      err += d
      if (err.length > STDERR_TAIL_CHARS) {
        err = err.slice(-STDERR_TAIL_CHARS)
      }
    })
    const timer = setTimeout(() => {
      timedOut = true
      killGroup(child)
    }, opts.timeoutMs)
    const finish = (code, signal) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      currentChild = null
      let maxRssKb = null
      let timeSignal = null
      if (rssFile) {
        try {
          const txt = fs.readFileSync(rssFile, 'utf8')
          const m = /Maximum resident set size \(kbytes\): (\d+)/.exec(txt)
          maxRssKb = m ? Number(m[1]) : null
          const s = /Command terminated by signal (\d+)/.exec(txt)
          timeSignal = s ? signalName(Number(s[1])) : null
        } catch {
          // time wrote nothing (killed with the group): no RSS
        }
        fs.rmSync(rssFile, {force: true})
      }
      resolve({stdout: out, stderr: err, code, signal: signal ?? timeSignal, timedOut,
        wallMs: performance.now() - t0, maxRssKb})
    }
    child.on('error', (e) => {
      err += `spawn error: ${e.message}\n`
      finish(null, null)
    })
    child.on('close', finish)
    child.on('exit', (code, signal) => {
      setTimeout(() => {
        child.stdout.destroy()
        child.stderr.destroy()
        finish(code, signal)
      }, CLOSE_GRACE_MS).unref()
    })
  })
}

let currentChild = null

/**
 * @param {import('node:child_process').ChildProcess} child Detached child.
 */
function killGroup(child) {
  try {
    process.kill(-child.pid, 'SIGKILL')
  } catch {
    try {
      child.kill('SIGKILL')
    } catch {
      // already gone
    }
  }
}

/**
 * @param {number} n Signal number.
 * @return {string} Name such as SIGKILL.
 */
function signalName(n) {
  return Object.entries(os.constants.signals).find(([, v]) => v === n)?.[0] ?? `SIG${n}`
}

/**
 * @param {string} stdout Child stdout tail.
 * @return {object|null} The row on the last non-empty line, if it parses.
 */
function parseRow(stdout) {
  const lines = stdout.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) {
    return null
  }
  try {
    const j = JSON.parse(lines[lines.length - 1])
    return j && typeof j === 'object' && !Array.isArray(j) && typeof j.status === 'string' ? j : null
  } catch {
    return null
  }
}

/**
 * Turn a raw child outcome into a row: the child's own row if it printed one,
 * otherwise a synthesised timeout / oom / crash row.
 *
 * @param {object} raw runChild result.
 * @param {object} ctx {model, size, armDef, timeoutS}.
 * @return {object} Row (without tier/band/run_id).
 */
function toRow(raw, ctx) {
  const {model, size, armDef, timeoutS} = ctx
  const stderrTail = raw.stderr.slice(-ERROR_TAIL_CHARS)
  const parsed = parseRow(raw.stdout)
  const runnerNotes = []
  const killedBySigkill = raw.signal === 'SIGKILL' || raw.code === SIGNAL_BASE + os.constants.signals.SIGKILL
  let row
  if (parsed) {
    row = {...parsed}
    if (raw.timedOut) {
      runnerNotes.push(`runner killed the process after ${timeoutS} s; the row had already been emitted`)
    }
    if (row.peak_rss_bytes === null || row.peak_rss_bytes === undefined) {
      if (raw.maxRssKb !== null) {
        row.peak_rss_bytes = raw.maxRssKb * KIB
        runnerNotes.push('peak_rss_bytes from /usr/bin/time -v (row had none)')
      }
    }
  } else {
    let status
    let first
    if (raw.timedOut) {
      status = 'timeout'
      first = `timeout: killed after ${timeoutS} s`
    } else if (MEMORY_RE.test(raw.stderr)) {
      status = 'oom'
      const hit = raw.stderr.split('\n').find((l) => MEMORY_RE.test(l)) ?? ''
      first = `oom: ${hit.trim().slice(0, FIRST_LINE_CHARS)}`
    } else if (killedBySigkill) {
      status = 'oom'
      first = 'oom: killed by SIGKILL with no runner timeout (likely the kernel OOM killer)'
      runnerNotes.push('SIGKILL without a runner timeout: classified oom on the assumption of the kernel OOM killer; check dmesg')
    } else if (raw.signal) {
      status = 'crash'
      first = `crash: terminated by ${raw.signal}`
    } else {
      status = 'crash'
      first = raw.code === 0 ? 'crash: exit 0 without a JSON row on the last stdout line' : `crash: exit code ${raw.code}`
    }
    row = {
      arm: armDef.arm, variant: armDef.variant, model, size_bytes: size, status,
      error: `${first}\n--- stderr tail ---\n${stderrTail}`,
      read_ms: null, geometry_ms: null, measure_ms: null, total_ms: null,
      peak_rss_bytes: raw.maxRssKb === null ? null : raw.maxRssKb * KIB,
      bodies: null, faces: null, triangles: null, mesh_area_mm2: null, exact_area_mm2: null,
      exact_volume_mm3: null, closed_valid_bodies: null, invalid_bodies: null, bbox_extent_mm: null,
      mesh_tolerance_mm: null, versions: {}, notes: [],
    }
    if (raw.maxRssKb !== null) {
      runnerNotes.push('peak_rss_bytes from /usr/bin/time -v')
    }
  }
  row.arm = armDef.arm
  row.variant = armDef.variant
  row.model = model
  row.size_bytes ??= size
  row.notes = [...Array.isArray(row.notes) ? row.notes : [], ...runnerNotes]
  row.runner_wall_ms = Math.round(raw.wallMs)
  row.runner_exit = {code: raw.code, signal: raw.signal, timed_out: raw.timedOut}
  return row
}

/**
 * @param {object} armDef Arm definition.
 * @param {string} model Model path.
 * @param {object} cfg Configuration.
 * @return {string[]} Command line.
 */
function commandFor(armDef, model, cfg) {
  const script = path.join(cfg.armDir, armDef.script)
  const tol = cfg.tolerance === undefined ? [] : ['--tolerance', cfg.tolerance]
  if (armDef.runtime === 'node') {
    return [process.execPath, `--max-old-space-size=${cfg.maxOldSpace}`, script, model, ...armDef.args, ...tol]
  }
  return [cfg.python, '-I', script, model, ...armDef.args, ...tol]
}

/**
 * Synthesised non-run row (band skip, LFS stub).
 *
 * @param {object} armDef Arm.
 * @param {object} m Model.
 * @param {string} reason Reason, goes in error and notes.
 * @return {object} Row.
 */
function skippedRow(armDef, m, reason) {
  return {
    arm: armDef.arm, variant: armDef.variant, model: m.path, size_bytes: m.size, status: 'skipped',
    error: `skipped: ${reason}`, read_ms: null, geometry_ms: null, measure_ms: null, total_ms: null,
    peak_rss_bytes: null, bodies: null, faces: null, triangles: null, mesh_area_mm2: null,
    exact_area_mm2: null, exact_volume_mm3: null, closed_valid_bodies: null, invalid_bodies: null,
    bbox_extent_mm: null, mesh_tolerance_mm: null, versions: {}, notes: [reason],
  }
}

/**
 * @param {string} cmd Executable.
 * @param {string[]} args Arguments.
 * @return {string|null} Trimmed output of a quick command.
 */
function quick(cmd, args) {
  const r = spawnSync(cmd, args, {encoding: 'utf8'})
  return r.status === 0 ? `${r.stdout}${r.stderr}`.trim() : null
}

/**
 * Write (or update) run_header.json.
 *
 * @param {object} cfg Configuration.
 * @param {object[]} armDefs Selected arms.
 * @param {string} runId This invocation.
 */
function writeHeader(cfg, armDefs, runId) {
  const file = path.join(cfg.out, 'run_header.json')
  let prev = {}
  try {
    prev = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    // first invocation
  }
  let smlibwasm = null
  try {
    smlibwasm = JSON.parse(fs.readFileSync(path.join(REPO, 'node_modules/@classcad/smlibwasm/package.json'), 'utf8')).version
  } catch {
    // not installed
  }
  const dirty = quick('git', ['-C', REPO, 'status', '--porcelain', '--untracked-files=no'])
  const usesPython = armDefs.some((a) => a.runtime === 'python')
  const header = {
    conway_git_sha: quick('git', ['-C', REPO, 'rev-parse', 'HEAD']),
    conway_tree_dirty: dirty === null ? null : dirty.length > 0,
    smlibwasm_version: smlibwasm,
    node_version: process.version,
    python_version: usesPython ? quick(cfg.python, ['-I', '--version']) : (prev.python_version ?? null),
    cpu_model: os.cpus()[0]?.model ?? null,
    cpu_cores: os.cpus().length,
    total_memory_bytes: os.totalmem(),
    platform: `${os.platform()} ${os.release()} ${os.arch()}`,
    thread_modes: {
      conway: armDefs.filter((a) => a.arm === 'conway').map((a) => a.variant),
      'smlib-js': 'single-thread wasm (smlibwasm)',
      env_FORCE_SINGLE_THREAD: process.env.FORCE_SINGLE_THREAD ?? null,
    },
    max_old_space_mb: cfg.maxOldSpace,
    timeout_s: cfg.timeoutS,
    tolerance_mm: cfg.tolerance ?? null,
    time_v: cfg.timeBin !== null,
    corpora: {public: cfg.publicRoot, private: cfg.privateRoot},
    arms: armDefs.map((a) => a.key),
    tiers: cfg.tiers,
    invocations: [...prev.invocations ?? [], {run_id: runId, started_at: new Date().toISOString(), argv: process.argv.slice(2)}],
  }
  fs.writeFileSync(file, `${JSON.stringify(header, null, 2)}\n`)
}

/**
 * @param {string} out Output directory.
 * @return {Map<string, object>} Last non-crash row per model|arm|variant.
 */
function loadDone(out) {
  const done = new Map()
  const file = path.join(out, 'rows.jsonl')
  if (!fs.existsSync(file)) {
    return done
  }
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) {
      return
    }
    try {
      const r = JSON.parse(line)
      if (r.status !== 'crash') {
        done.set(`${r.model}|${r.arm}|${r.variant}`, r)
      }
    } catch {
      log(`warn: rows.jsonl line ${i + 1} is not JSON, ignored`)
    }
  })
  return done
}

/**
 * Fold one finished/skipped row into the per-(arm, band) skip state.
 *
 * State per (arm, band): `prevOom` (the previous file in this band, for this
 * arm, ended oom) and `latched` (remaining files in the band are skipped).
 * Size-monotonic triggers only: Invalid string length, or oom directly after
 * an oom on the next-smaller file in the same band.
 *
 * @param {object} st State for this (arm, band).
 * @param {object} row The row.
 * @param {string} stderrText Raw stderr when available.
 * @return {string|null} Latch reason when this row latched the band.
 */
function updateBandState(st, row, stderrText) {
  if (row.status === 'skipped') {
    // Only a band-rule skip latches; an LFS-stub skip says nothing about size.
    st.latched ||= /size-monotonic/.test(row.error ?? '')
    return null
  }
  let reason = null
  if (row.status !== 'ok' && (STRING_LENGTH_RE.test(row.error ?? '') || STRING_LENGTH_RE.test(stderrText ?? ''))) {
    reason = 'RangeError: Invalid string length'
  } else if (row.status === 'oom' && st.prevOom) {
    reason = 'oom on two consecutive files in the band'
  }
  st.prevOom = row.status === 'oom'
  if (reason) {
    st.latched = true
    st.reason = reason
  }
  return reason
}

/**
 * The P1 probe: the smallest T3 model in this run whose size exceeds V8's string limit.
 *
 * The within-band latch ("oom on two consecutive files") can fire on two below-limit files in the
 * 500-600 MiB band, and the next file in the band, or the whole > 600 band, would then be skipped,
 * so the above-limit file that answers "what happens past the string limit" would never run. This
 * file therefore runs in every arm regardless of the latch. Only this one file is exempt: later
 * files in the band still skip. It is chosen among the models planned for this run (after `--only`).
 *
 * @param {object[]} models Planned models.
 * @return {object|null} The model, or null when no planned T3 file exceeds the limit.
 */
function probeFileFor(models) {
  let probe = null
  for (const m of models) {
    if (m.tier === 'T3' && m.size > MAX_STRING_BYTES && (probe === null || m.size < probe.size)) {
      probe = m
    }
  }
  return probe
}

let interrupted = false

/**
 * Entry point.
 */
async function main() {
  const flags = parseArgs(process.argv.slice(2))
  if (flags.help) {
    process.stdout.write(HELP)
    return
  }
  const positive = (name, dflt) => {
    const v = Number(flags[name] ?? dflt)
    if (!(v > 0)) {
      throw new Error(`--${name} must be a positive number`)
    }
    return v
  }
  const tiers = (flags.tiers ?? DEFAULT_TIERS).split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
  for (const t of tiers) {
    if (!['T0', 'T1', 'T2', 'T3'].includes(t)) {
      throw new Error(`unknown tier ${t}`)
    }
  }
  const cfg = {
    out: path.resolve(flags.out ?? DEFAULT_OUT),
    tiers,
    timeoutS: positive('timeout', DEFAULT_TIMEOUT_S),
    maxOldSpace: positive('max-old-space', DEFAULT_MAX_OLD_SPACE_MB),
    tolerance: flags.tolerance,
    python: flags.python ?? DEFAULT_PYTHON,
    publicRoot: path.resolve(flags.public ?? DEFAULT_PUBLIC),
    privateRoot: path.resolve(flags.private ?? DEFAULT_PRIVATE),
    smokeList: path.resolve(flags['smoke-list'] ?? path.join(REPO, 'regression/smoke_models.txt')),
    armDir: path.resolve(flags['arm-dir'] ?? HERE),
    only: flags.only,
    force: Boolean(flags.force),
  }
  const timeBinPath = flags['time-bin'] ?? DEFAULT_TIME_BIN
  cfg.timeBin = fs.existsSync(timeBinPath) ? timeBinPath : null
  if (cfg.timeBin === null) {
    log(`note: ${timeBinPath} not found; crashed children will have peak_rss_bytes null`)
  }
  const armDefs = (flags.arms ?? DEFAULT_ARMS).split(',').map((s) => s.trim()).filter(Boolean).map(parseArm)
  if (new Set(armDefs.map((a) => a.key)).size !== armDefs.length) {
    throw new Error('duplicate arm in --arms')
  }
  const missing = armDefs.filter((a) => !fs.existsSync(path.join(cfg.armDir, a.script)))
  if (missing.length > 0) {
    throw new Error(`measure script(s) not found in ${cfg.armDir}: ${[...new Set(missing.map((a) => a.script))].join(', ')}`)
  }
  if (armDefs.some((a) => a.runtime === 'python') && !fs.existsSync(cfg.python)) {
    throw new Error(`python ${cfg.python} not found (--python)`)
  }

  fs.mkdirSync(cfg.out, {recursive: true})
  const models = planModels(cfg)
  const total = models.length * armDefs.length
  const tierCounts = tiers.map((t) => `${t}=${models.filter((m) => m.tier === t).length}`).join(' ')
  log(`plan: ${models.length} models (${tierCounts}) x ${armDefs.length} arms = ${total} runs; out ${cfg.out}`)
  if (flags['dry-run']) {
    for (const m of models) {
      log(`  ${m.tier}${m.band ? ` ${m.band}` : ''}  ${(m.size / MIB).toFixed(1)} MiB  ${m.path}`)
    }
    return
  }

  const runId = new Date().toISOString().replace(/[-:.]/g, '').slice(0, RUN_ID_CHARS)
  writeHeader(cfg, armDefs, runId)
  const done = cfg.force ? new Map() : loadDone(cfg.out)
  const rowsFile = path.join(cfg.out, 'rows.jsonl')
  const bandState = new Map()
  const probe = probeFileFor(models)
  if (probe) {
    log(`P1 probe (never band-skipped): ${(probe.size / MIB).toFixed(1)} MiB ${path.basename(probe.path)} > MAX_STRING_LENGTH ${MAX_STRING_BYTES}`)
  }
  const counts = {ran: 0, resumed: 0, skipped: 0}
  let idx = 0

  process.on('SIGINT', () => {
    interrupted = true
    if (currentChild) {
      killGroup(currentChild)
    }
    log('interrupted; rows written so far are kept (resume with the same command)')
  })

  for (const m of models) {
    const lfs = isLfsStub(m.path)
    for (const armDef of armDefs) {
      if (interrupted) {
        return
      }
      idx++
      const tag = `[${idx}/${total}] ${m.tier}${m.band ? ` ${m.band}` : ''} ${(m.size / MIB).toFixed(1)} MiB ${armDef.key} ${path.basename(m.path)}`
      const stKey = `${armDef.key}|${m.band}`
      const st = m.tier === 'T3' ? (bandState.get(stKey) ?? bandState.set(stKey, {prevOom: false, latched: false, reason: ''}).get(stKey)) : null
      const prior = done.get(`${m.path}|${armDef.arm}|${armDef.variant}`)
      if (prior) {
        counts.resumed++
        log(`${tag} -> resumed (${prior.status})`)
        if (st) {
          updateBandState(st, prior, '')
        }
        continue
      }
      let row
      let stderrText = ''
      if (lfs) {
        row = skippedRow(armDef, m, 'Git LFS pointer stub (file not fetched)')
      } else if (st?.latched && m !== probe) {
        row = skippedRow(armDef, m, `size-monotonic failure earlier in band ${m.band} for ${armDef.key}: ${st.reason}`)
      } else {
        const raw = await runChild(commandFor(armDef, m.path, cfg), {timeoutMs: cfg.timeoutS * MS_PER_S, timeBin: cfg.timeBin})
        if (interrupted) {
          return
        }
        row = toRow(raw, {model: m.path, size: m.size, armDef, timeoutS: cfg.timeoutS})
        stderrText = raw.stderr
      }
      row.tier = m.tier
      if (m.band) {
        row.band = m.band
      }
      row.run_id = runId
      fs.appendFileSync(rowsFile, `${JSON.stringify(row)}\n`)
      if (row.status === 'skipped') {
        counts.skipped++
      } else {
        counts.ran++
      }
      let latchNote = ''
      if (st && !lfs) {
        const reason = updateBandState(st, row, stderrText)
        if (reason) {
          latchNote = `; band ${m.band} latched for ${armDef.key} (${reason})`
        }
      }
      const rss = row.peak_rss_bytes ? `, rss ${(row.peak_rss_bytes / MIB).toFixed(0)} MiB` : ''
      log(`${tag} -> ${row.status} (${((row.runner_wall_ms ?? 0) / MS_PER_S).toFixed(1)} s${rss})${latchNote}`)
    }
  }
  log(`done: ${counts.ran} ran, ${counts.skipped} skipped, ${counts.resumed} resumed; rows in ${rowsFile}`)
}

main().catch((e) => {
  log(`error: ${e.message}`)
  process.exit(2)
})
