#!/usr/bin/env node
/**
 * Time the parse and geometry-extraction phases of a tessellated IFC.
 *
 * The CLI is not usable for this: it writes per-entity output whether or not
 * `-n` is passed, and on a million-face model that console traffic dominates
 * the profile — a first attempt at measuring here attributed 5.3 s of an 8.2 s
 * run to `writeBuffer`, which says nothing about the pump. This suppresses
 * conway's log sinks and times the two phases separately.
 *
 * Intended for conway#446's lever 2 (face entity materialisation), paired with
 * make_tessellated_ifc.mjs when PSB.ifc is not reachable. Use it for
 * before/after on ONE file; absolute numbers are not comparable to PSB's.
 *
 * Usage:
 *   node scripts/debug/bench_tessellated.mjs <model.ifc> [--runs N]
 *
 *   --runs N   repeat and report each run (default 3); the first is usually
 *              slowest, so read the median rather than the mean
 *
 * Requires a built tree (`yarn build-incremental`).
 */

import fs from 'node:fs'

const DEFAULT_RUNS = 3
const EXIT_USAGE = 1
const MILLISECONDS = 1000

/** Bytes per megabyte, for the RSS and size reports. */
const BYTES_PER_MB = 1024 * 1024

const args = process.argv.slice(2)

let model
let runs = DEFAULT_RUNS

for (let i = 0; i < args.length; ++i) {
  if (args[i] === '--runs') {
    runs = Number(args[++i])
  } else {
    model = args[i]
  }
}

if (model === undefined || !Number.isFinite(runs)) {
  process.stderr.write('Error: usage: bench_tessellated.mjs <model.ifc> [--runs N]\n')
  process.exit(EXIT_USAGE)
}

// Installed BEFORE the wasm module initialises: conway binds these as its log
// sinks at startup, so replacing them afterwards would leave the originals
// wired in and put the console traffic straight back into the measurement.
globalThis.logInfo = () => {}
globalThis.logWarning = () => {}
globalThis.logError = () => {}

const { IfcGeometryExtraction } =
  await import('/home/user/conway/compiled/src/ifc/ifc_geometry_extraction.js')
const IfcStepParser =
  (await import('/home/user/conway/compiled/src/ifc/ifc_step_parser.js')).default
const ParsingBuffer =
  (await import('/home/user/conway/compiled/src/parsing/parsing_buffer.js')).default
const { ConwayGeometry } =
  await import('/home/user/conway/compiled/dependencies/conway-geom/index.js')

const bytes = fs.readFileSync(model)

const geometry = new ConwayGeometry()

await geometry.initialize()

const results = []

for (let run = 0; run < runs; ++run) {
  const parseStart = Date.now()

  const buffer = new ParsingBuffer(bytes)

  IfcStepParser.Instance.parseHeader(buffer)

  const [, parsed] = IfcStepParser.Instance.parseDataToModel(buffer)

  const parseSeconds = (Date.now() - parseStart) / MILLISECONDS

  const pumpStart = Date.now()

  const extraction = new IfcGeometryExtraction(geometry, parsed)

  extraction.extractIFCGeometryData()

  const pumpSeconds = (Date.now() - pumpStart) / MILLISECONDS

  results.push({
    run: run + 1,
    parseSeconds: +parseSeconds.toFixed(2),
    pumpSeconds: +pumpSeconds.toFixed(2),
    totalSeconds: +(parseSeconds + pumpSeconds).toFixed(2),
    rssMb: +(process.memoryUsage().rss / BYTES_PER_MB).toFixed(0),
  })
}

const pumps = results.map((each) => each.pumpSeconds).sort((a, b) => a - b)

console.log(JSON.stringify({
  model,
  megabytes: +(bytes.length / BYTES_PER_MB).toFixed(1),
  runs: results,
  medianPumpSeconds: pumps[Math.floor(pumps.length / 2)],
}, null, 1))
