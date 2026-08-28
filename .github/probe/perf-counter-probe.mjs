// Probe workload + statistics for .github/workflows/perf-counter-probe.yml.
//
// Two modes, one file, because the workflow is a self-contained experiment and
// a second script would be a second thing to keep in sync:
//
//   node perf-counter-probe.mjs workload      -> runs the fixed workload, prints one JSON line
//   node perf-counter-probe.mjs stats <tsv>   -> aggregates the samples the workflow collected
//
// WORKLOAD DESIGN — the whole point is that repeated runs should differ only
// by machine noise, so the workload must be free of every input that varies
// run to run:
//   - no I/O, no network, no filesystem reads (page-cache state would leak in)
//   - no Math.random, no Date/hrtime-dependent branching (timing must not feed
//     back into control flow, or the metric measures itself)
//   - fixed iteration count, not a fixed time budget
//   - allocation-free inner loops: a GC that triggers on a different iteration
//     between runs would move both instruction count and wall time
// The checksum is printed so the optimizer cannot dead-code the loop away and
// so a divergent result (different CPU rounding, a miscompile) is visible
// rather than silently averaged in.

import fs from 'node:fs'

const ITERS_INT = 360_000_000
const ITERS_FLOAT = 120_000_000

/** Integer mixing loop (imul/xor/shift): exercises the ALU, no allocation. */
function integerWork(iters) {
  let a = 0x1234567 >>> 0
  let b = 0x89abcdef >>> 0
  for (let i = 0; i < iters; i++) {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0
    b = (b ^ a) >>> 0
    b = ((b << 13) | (b >>> 19)) >>> 0
  }
  return (a ^ b) >>> 0
}

/** Float loop (mul/add/sqrt): exercises the FPU on a bounded, non-drifting value. */
function floatWork(iters) {
  let f = 1.0
  let acc = 0.0
  for (let i = 0; i < iters; i++) {
    f = f * 1.0000001 + 1e-9
    acc += Math.sqrt(f)
    // Bounded rescale keeps `f` in a fixed exponent range so the arithmetic
    // cost per iteration cannot drift over the loop (denormals/large exponents
    // are not the same cost) and so `acc` stays comparable across runs.
    if (f > 2.0) {
      f = 1.0
    }
  }
  return acc
}

function runWorkload() {
  const t0 = process.hrtime.bigint()
  const cpu0 = process.cpuUsage()
  const intResult = integerWork(ITERS_INT)
  const floatResult = floatWork(ITERS_FLOAT)
  const cpu1 = process.cpuUsage(cpu0)
  const t1 = process.hrtime.bigint()
  const record = {
    wallMs: Number(t1 - t0) / 1e6,
    cpuUserUs: cpu1.user,
    cpuSysUs: cpu1.system,
    // Checksums must be byte-identical across every run and every replica.
    checksumInt: intResult,
    checksumFloat: floatResult.toExponential(12),
  }
  process.stdout.write(`PROBE_NODE_JSON ${JSON.stringify(record)}\n`)
}

function stats(values) {
  const n = values.length
  const sorted = [...values].sort((x, y) => x - y)
  const mean = values.reduce((s, v) => s + v, 0) / n
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  // Sample stdev (n-1): these 10 runs are a sample of the machine's behaviour,
  // not the population.
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0
  const stdev = Math.sqrt(variance)
  return {
    n,
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median,
    stdev,
    cvPct: mean === 0 ? 0 : (stdev / mean) * 100,
  }
}

function fmt(v) {
  if (!Number.isFinite(v)) {
    return 'NaN'
  }
  return Math.abs(v) >= 1000 ? v.toFixed(1) : v.toPrecision(8)
}

function runStats(tsvPath) {
  const lines = fs.readFileSync(tsvPath, 'utf8').trim().split('\n').filter((l) => l.length > 0)
  const header = lines[0].split('\t')
  const rows = lines.slice(1).map((l) => {
    const cells = l.split('\t')
    const row = {}
    header.forEach((h, i) => {
      row[h] = cells[i]
    })
    return row
  })

  const variants = [...new Set(rows.map((r) => r.variant))]
  // Fixed metric order so the log block reads the same on every replica and a
  // three-way diff of the job logs lines up.
  const metrics = ['instructions', 'cycles', 'taskClockMs', 'cpuUserMs', 'wallMs']

  for (const variant of variants) {
    const vRows = rows.filter((r) => r.variant === variant)
    console.log('')
    console.log(`=== PROBE_CV_TABLE variant=${variant} samples=${vRows.length} ===`)
    console.log(['metric', 'n', 'median', 'mean', 'stdev', 'cv_pct', 'min', 'max'].join('\t'))
    for (const metric of metrics) {
      const values = vRows
        .map((r) => Number(r[metric]))
        .filter((v) => Number.isFinite(v) && v > 0)
      if (values.length === 0) {
        console.log(`PROBE_CV variant=${variant} metric=${metric} UNAVAILABLE`)
        continue
      }
      const s = stats(values)
      console.log([metric, s.n, fmt(s.median), fmt(s.mean), fmt(s.stdev), s.cvPct.toFixed(4), fmt(s.min), fmt(s.max)].join('\t'))
      console.log(
        `PROBE_CV variant=${variant} metric=${metric} n=${s.n} median=${fmt(s.median)} ` +
        `mean=${fmt(s.mean)} stdev=${fmt(s.stdev)} cv_pct=${s.cvPct.toFixed(4)} ` +
        `min=${fmt(s.min)} max=${fmt(s.max)}`)
    }
    // Determinism check: any divergence here invalidates the variance numbers
    // above, because the runs were not doing identical work.
    const checksums = new Set(vRows.map((r) => `${r.checksumInt}/${r.checksumFloat}`))
    console.log(`PROBE_CHECKSUM variant=${variant} distinct=${checksums.size} values=${[...checksums].join(' | ')}`)
  }
}

const mode = process.argv[2]
if (mode === 'workload') {
  runWorkload()
} else if (mode === 'stats') {
  runStats(process.argv[3])
} else {
  console.error('usage: perf-counter-probe.mjs workload | stats <tsv>')
  process.exit(2)
}
