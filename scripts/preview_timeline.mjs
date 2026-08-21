/**
 * When does the parse-time preview actually put pixels on the screen?
 *
 *   node --max-old-space-size=16384 scripts/preview_timeline.mjs <file.ifc>
 *
 * conway#542's layout report is a static prediction: it reads the file and
 * says which products COULD extract at each prefix. This runs the engine and
 * records what the preview channel DID emit, against the parse cursor, so the
 * prediction can be checked rather than believed.
 *
 * Reported per decile of the parse: preview meshes emitted so far and wall
 * clock at that point, plus the headline — time to FIRST preview mesh, which
 * is the number a first-time visitor experiences as "did anything happen".
 * `stop()` then prints the deferral split, which is the diagnosis when the
 * answer is "nothing happened for eight seconds".
 *
 * `--no-preview` opens with ON_PREVIEW_MESH unset, which is the control: the
 * channel ticks inline on parse progress and pages source through the
 * windowed provider on every attempt, INCLUDING the ones that go on to
 * defer. Comparing the two parse times says whether a preview that delivers
 * nothing is merely useless or is actively taxing the parse it is waiting
 * for.
 */
import * as fs from 'node:fs'
import * as process from 'node:process'
import { performance } from 'node:perf_hooks'

const argv = process.argv.slice(2)
const noPreview = argv.includes('--no-preview')
const filePath = argv.find((a) => !a.startsWith('--'))

if (!filePath) {
  console.error('usage: preview_timeline.mjs <file.ifc>')
  process.exit(2)
}

class FileStore {
  constructor(path) {
    this.fd = fs.openSync(path, 'r')
    this.byteLength = fs.fstatSync(this.fd).size
  }

  async read(offset, length) {
    const buf = Buffer.allocUnsafe(length)
    const got = fs.readSync(this.fd, buf, 0, length, offset)
    return new Uint8Array(buf.buffer, buf.byteOffset, got)
  }

  close() {
    fs.closeSync(this.fd)
  }
}

const { IfcAPI, LogLevel } = await import('../compiled/src/compat/web-ifc/ifc_api.js')

const api = new IfcAPI()
await api.Init()
api.SetLogLevel(LogLevel.LOG_LEVEL_INFO)

const store = new FileStore(filePath)
const sizeMB = store.byteLength / (1024 * 1024)

let previewMeshes = 0
let firstPreviewMs = -1
let firstPreviewAtBytes = -1
let parseCursor = 0
let nextDecile = 1
const timeline = []
const t0 = performance.now()

const SETTINGS = {
  COORDINATE_TO_ORIGIN: true,
  USE_FAST_BOOLS: true,
  DEFER_GEOMETRY: true,
  ON_PREVIEW_MESH: noPreview ? undefined : () => {
    ++previewMeshes
    if (firstPreviewMs < 0) {
      firstPreviewMs = performance.now() - t0
      firstPreviewAtBytes = parseCursor
    }
  },
  ON_PROGRESS: (ev) => {
    if (!ev || ev.phase !== 'dataParse' || !ev.total) {
      return
    }
    parseCursor = ev.completed
    // Sample on decile crossings rather than every tick: the callback fires
    // per parse slide, and a per-tick log would itself perturb what we time.
    while (nextDecile <= 10 && ev.completed >= ev.total * nextDecile / 10) {
      timeline.push({
        pct: nextDecile * 10,
        ms: performance.now() - t0,
        meshes: previewMeshes,
      })
      ++nextDecile
    }
  },
}

console.log(
  `file=${filePath} sizeMB=${sizeMB.toFixed(1)}` +
  `${noPreview ? ' preview=OFF (control)' : ''}`)

const modelID = await api.OpenModelStream(store, SETTINGS)
const openMs = performance.now() - t0

if (modelID < 0) {
  console.error('open failed')
  process.exit(1)
}

console.log('  parse | wall ms | preview meshes')
for (const row of timeline) {
  console.log(
    `  ${String(row.pct).padStart(4)}% | ${row.ms.toFixed(0).padStart(7)} | ` +
    `${String(row.meshes).padStart(14)}`)
}

console.log(
  firstPreviewMs < 0 ?
    `first preview mesh: NEVER (open took ${openMs.toFixed(0)}ms)` :
    `first preview mesh: ${firstPreviewMs.toFixed(0)}ms, at ` +
    `${(100 * firstPreviewAtBytes / store.byteLength).toFixed(1)}% of the file`)
console.log(`preview meshes total ${previewMeshes}, open ${openMs.toFixed(0)}ms`)

api.CloseModel(modelID)
store.close()
