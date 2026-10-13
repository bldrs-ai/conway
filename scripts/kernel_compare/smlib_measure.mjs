#!/usr/bin/env node
/**
 * smlib-js arm of the kernel-compare harness: one STEP file -> one JSON row.
 *
 *   node scripts/kernel_compare/smlib_measure.mjs <model.step>
 *        [--heal true|false] [--tolerance <mm>] [--angle <deg>] [--threads mt|st]
 *
 * Row contract: scripts/kernel_compare/README.md.  The row is the LAST line of stdout.
 *
 * How the file reaches SMLib (this is the point of prediction P1 in
 * design/new/kernel-compare-smlib.md): the file is read into a Buffer (a
 * Uint8Array) and handed to `fromStep` UNDECODED, exactly as a browser caller
 * would hand it a fetched ArrayBuffer.  `fromStep(data: string | Uint8Array)`
 * is the least-decoded form its API accepts; the whole-file decode to a single
 * JS string happens INSIDE the library (`_text()` in dist/step_import.js), so
 * any `RangeError: Invalid string length` this script reports is the
 * library's, not the harness's.  (`fs.readFileSync` itself caps at 2 GiB
 * (ERR_FS_FILE_TOO_LARGE), well above V8's ~512 MiB string limit, so it cannot
 * mask the string wall.)
 *
 * Heal: `fromStep(data, {heal})` is honoured.  This script's default is
 * heal=false (the plan's headline setting); SMLib's own default is heal=true.
 *
 * Nothing here writes to disk.  Do not add private-corpus names to notes.
 */
import fs from 'node:fs'
import process from 'node:process'

const T0 = performance.now()
const ARM = 'smlib-js'

/** @param {string[]} argv */
function parseArgs(argv) {
  const out = {model: null, heal: false, tolerance: null, angle: 15, threads: null}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const val = () => {
      if (i + 1 >= argv.length) {
        throw new Error(`missing value for ${a}`)
      }
      return argv[++i]
    }
    if (a === '--heal') {
      const v = val().toLowerCase()
      if (v !== 'true' && v !== 'false') {
        throw new Error('--heal takes true|false')
      }
      out.heal = v === 'true'
    } else if (a === '--tolerance') {
      out.tolerance = Number(val())
      if (!(out.tolerance > 0)) {
        throw new Error('--tolerance must be > 0 (mm)')
      }
    } else if (a === '--angle') {
      out.angle = Number(val())
      if (!(out.angle > 0)) {
        throw new Error('--angle must be > 0 (degrees)')
      }
    } else if (a === '--threads') {
      out.threads = val() // accepted for runner uniformity; smlibwasm has no thread modes
    } else if (a.startsWith('--')) {
      throw new Error(`unknown option ${a}`)
    } else if (out.model === null) {
      out.model = a
    } else {
      throw new Error(`unexpected argument ${a}`)
    }
  }
  if (out.model === null) {
    throw new Error('usage: smlib_measure.mjs <model.step> [--heal true|false] [--tolerance mm] [--angle deg]')
  }
  return out
}

/** Memory-shaped failure, per the README taxonomy. */
const OOM_RE = new RegExp([
  'Invalid string length',
  'Invalid (typed )?array length',
  'Array buffer allocation failed',
  'Cannot enlarge memory',
  'memory access out of bounds',
  'out of memory',
  'allocation failed',
  'Aborted\\(OOM',
  'Failed to allocate',
].join('|'), 'i')

/** @param {unknown} e */
function classify(e) {
  const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
  if (OOM_RE.test(msg) || /\bOOM\b/.test(msg)) {
    return 'oom'
  }
  return 'error'
}

/** @param {unknown} e */
function firstLine(e) {
  const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
  return msg.split('\n')[0].slice(0, 500)
}

const round = (v, d = 3) => (v === null || v === undefined || !Number.isFinite(v) ? null : Number(v.toFixed(d)))

/**
 * @param {{model:string, heal:boolean, tolerance:number|null, angle:number}} args
 * @param {Record<string, any>} row mutated in place so a throw still leaves partial timings
 * @param {string[]} notes
 */
async function measure(args, row, notes) {
  const tImport = performance.now()
  const smlib = await import('@classcad/smlibwasm')
  notes.push(`kernel wasm instantiate + module import: ${round(performance.now() - tImport, 1)} ms (not in read_ms)`)
  row.versions.smlibwasm = smlib.version

  // Collect the library's own warnings (stderr noise otherwise) so they reach `notes`.
  // Gap warnings ("faces do not meet exactly ... uncertain by about 4e-04 of its value") repeat
  // per body with different numbers; collapse them to a count and the worst uncertainty.
  const warnings = new Map()
  let gapWarnings = 0
  let gapWorst = 0
  smlib.setWarningHandler((m) => {
    const msg = String(m)
    const g = /uncertain by about ([0-9.e+-]+) of its value/.exec(msg)
    if (g) {
      gapWarnings += 1
      gapWorst = Math.max(gapWorst, Number(g[1]))
      return
    }
    const key = msg.split('\n')[0].slice(0, 200)
    warnings.set(key, (warnings.get(key) ?? 0) + 1)
  })

  // ---- read: file bytes -> parse -> B-rep build ------------------------------------------
  const tRead = performance.now()
  const bytes = fs.readFileSync(args.model) // Buffer extends Uint8Array: undecoded
  const tFile = performance.now()
  let result
  try {
    result = smlib.fromStep(bytes, {heal: args.heal})
  } catch (e) {
    row.read_ms = round(performance.now() - tRead, 1)
    if (e instanceof smlib.ModelingError && /holds no B-rep/.test(e.message)) {
      // The library signals "0 bodies" by throwing; the contract calls that `empty`.
      row.status = 'empty'
      row.error = firstLine(e)
      row.bodies = 0
      notes.push('fromStep throws ModelingError when the file has no B-rep solids/surfaces; mapped to status=empty')
      return
    }
    throw e
  }
  row.read_ms = round(performance.now() - tRead, 1)
  notes.push(`of read_ms, fs.readFileSync took ${round(tFile - tRead, 1)} ms; fromStep (decode+parse+build) the rest`)
  const bodies = Array.isArray(result) ? [...result] : [result]
  row.bodies = bodies.length
  if (bodies.length === 0) {
    row.status = 'empty'
    return
  }

  // ---- exact measurement: massProperties, isValid, bbox ---------------------------------
  const tMeasure = performance.now()
  let faces = 0
  let area = 0
  let volume = 0
  let closedValid = 0
  let invalid = 0
  let sheets = 0
  let measureFailures = 0
  const bbMin = [Infinity, Infinity, Infinity]
  const bbMax = [-Infinity, -Infinity, -Infinity]
  const perBodyTol = []
  const firstFailures = []
  for (const body of bodies) {
    const isPart = body instanceof smlib.Part
    try {
      faces += body.faces().length
      if (isPart) {
        let props = null
        try {
          props = body.massProperties() // default accuracy (ACCURACY = 1e-7)
        } catch (e) {
          // massProperties throws RangeError when the solid has zero volume.
          if (!(e instanceof RangeError) || !/no volume/.test(e.message)) {
            throw e
          }
        }
        if (props === null) {
          // zero-volume solid: not valid; its area still counts if the kernel can integrate it
          invalid += 1
          area += body.area
          notes.push('a Part has zero volume (massProperties refuses); counted invalid, area taken from Part.area')
        } else {
          area += props.area
          if (body.isValid()) {
            closedValid += 1
            volume += props.volume
          } else {
            invalid += 1
          }
        }
      } else {
        sheets += 1
        area += body.area
      }
      const bb = body.bbox()
      const lo = bb.min.toArray()
      const hi = bb.max.toArray()
      for (let k = 0; k < 3; k++) {
        bbMin[k] = Math.min(bbMin[k], lo[k])
        bbMax[k] = Math.max(bbMax[k], hi[k])
      }
      perBodyTol.push(Math.max(bb.diagonal * 1e-3, 1e-6)) // = tessellate()'s default, mesh.js
    } catch (e) {
      measureFailures += 1
      if (firstFailures.length < 3) {
        firstFailures.push(firstLine(e))
      }
      if (classify(e) === 'oom') {
        throw e
      }
    }
  }
  row.measure_ms = round(performance.now() - tMeasure, 1)
  row.faces = faces
  row.invalid_bodies = invalid
  row.closed_valid_bodies = closedValid
  row.exact_volume_mm3 = closedValid > 0 ? volume : null
  if (measureFailures === 0) {
    row.exact_area_mm2 = area
  } else {
    row.exact_area_mm2 = null
    notes.push(`exact measurement failed on ${measureFailures}/${bodies.length} bodies (${firstFailures.join(' | ')}); partial area sum would be ${round(area)} mm2, withheld`)
  }
  if (Number.isFinite(bbMin[0]) && measureFailures < bodies.length) {
    row.bbox_extent_mm = [bbMax[0] - bbMin[0], bbMax[1] - bbMin[1], bbMax[2] - bbMin[2]]
    if (measureFailures > 0) {
      notes.push('bbox_extent_mm covers only the bodies whose measurement succeeded')
    }
  }
  if (sheets > 0) {
    notes.push(`${sheets} of ${bodies.length} bodies are open sheets (Shell): area counted, excluded from volume and invalid_bodies (isValid is Part-only)`)
  }
  notes.push('closed_valid_bodies = Part (closed solid by construction) && isValid(); exact volume is massProperties().volume at accuracy 1e-7')

  // ---- mesh: one tessellation per body, counted then freed --------------------------------
  const tGeom = performance.now()
  let triangles = 0
  let meshArea = 0
  let meshFailures = 0
  const meshFirst = []
  for (const body of bodies) {
    let mesh = null
    try {
      mesh = body.mesh(args.tolerance, args.angle)
      triangles += mesh.length
      meshArea += mesh.area
    } catch (e) {
      meshFailures += 1
      if (meshFirst.length < 3) {
        meshFirst.push(firstLine(e))
      }
      if (classify(e) === 'oom') {
        throw e
      }
    } finally {
      mesh?._poly?.dispose()
    }
  }
  row.geometry_ms = round(performance.now() - tGeom, 1)
  if (meshFailures === 0) {
    row.triangles = triangles
    row.mesh_area_mm2 = meshArea
  } else {
    row.triangles = null
    row.mesh_area_mm2 = null
    notes.push(`mesh failed on ${meshFailures}/${bodies.length} bodies (${meshFirst.join(' | ')}); partial: ${triangles} triangles, ${round(meshArea)} mm2, withheld`)
  }
  if (args.tolerance !== null) {
    row.mesh_tolerance_mm = args.tolerance
  } else if (perBodyTol.length) {
    // SMLib's default is per body: max(0.001 * body bbox diagonal, 1e-6). Record the largest.
    row.mesh_tolerance_mm = Math.max(...perBodyTol)
    notes.push(`mesh tolerance is SMLib's per-body default (0.1% of each body's bbox diagonal, min 1e-6 mm); mesh_tolerance_mm is the largest used (${Math.max(...perBodyTol)}), smallest ${Math.min(...perBodyTol)}`)
  }
  notes.push(`mesh angle ${args.angle} deg (curve and surface angle tolerance)`)

  if (gapWarnings > 0) {
    notes.push(`smlibwasm warned on ${gapWarnings} bodies that their faces leave gaps, so exact volume is uncertain by up to ${gapWorst} of its value on those (the warning concerns volume only)`)
  }
  for (const [m, n] of warnings) {
    notes.push(`smlibwasm warning x${n}: ${m}`)
  }
  row.status = 'ok'
}

async function main() {
  let args
  const row = {
    arm: ARM,
    variant: null,
    model: process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null,
    size_bytes: null,
    status: 'error',
    error: null,
    read_ms: null,
    geometry_ms: null,
    measure_ms: null,
    total_ms: null,
    peak_rss_bytes: null,
    bodies: null,
    faces: null,
    triangles: null,
    mesh_area_mm2: null,
    exact_area_mm2: null,
    exact_volume_mm3: null,
    closed_valid_bodies: null,
    invalid_bodies: null,
    bbox_extent_mm: null,
    mesh_tolerance_mm: null,
    versions: {smlibwasm: null, node: process.versions.node},
    notes: [],
  }
  const notes = row.notes
  try {
    args = parseArgs(process.argv.slice(2))
    row.model = args.model
    row.variant = `heal=${args.heal}`
    row.size_bytes = fs.statSync(args.model).size
    if (args.threads !== null) {
      notes.push(`--threads ${args.threads} ignored: smlibwasm has a single (non-threaded) wasm build`)
    }
    notes.push('file passed to fromStep as an undecoded Uint8Array (Buffer); whole-file latin-1 decode to one string happens inside the library (_text, dist/step_import.js)')
    await measure(args, row, notes)
  } catch (e) {
    row.status = classify(e)
    row.error = firstLine(e)
    if (row.status === 'oom') {
      notes.push('memory-shaped failure; if the message is "Invalid string length" it is raised inside smlibwasm (_text / parse), not by the harness')
    }
  }
  row.total_ms = round(performance.now() - T0, 1)
  // ru_maxrss is KiB on Linux
  row.peak_rss_bytes = process.resourceUsage().maxRSS * 1024
  return row
}

const row = await main()
process.stdout.write(`${JSON.stringify(row)}\n`, () => process.exit(0))
