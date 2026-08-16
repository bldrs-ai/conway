/**
 * Profile store-backed vs resident IFC extract on one file.
 *
 *   node --expose-gc --max-old-space-size=8192 \
 *     scripts/profile_store_extract.mjs --store path.ifc
 *   node --expose-gc --max-old-space-size=8192 \
 *     scripts/profile_store_extract.mjs --resident path.ifc
 *
 * Store path: OpenModelStream + DEFER_GEOMETRY + ExtractGeometryBatchAsync.
 * Resident path: OpenModel (full ArrayBuffer) + StreamAllMeshes.
 *
 * The store wrapper counts fs reads so I/O is visible separately from
 * the pump's prefetch/extract/release split.
 */
import * as fs from 'node:fs'
import * as process from 'node:process'
import { performance } from 'node:perf_hooks'

const args = process.argv.slice(2)
const mode = args.includes('--resident') ? 'resident' : 'store'
const batchIdx = args.indexOf('--batch')
const batchSize = batchIdx >= 0 ? Number(args[batchIdx + 1]) : 8
const filePath = args.find((a) => !a.startsWith('--') && a !== String(batchSize))

if (!filePath) {
  console.error('usage: profile_store_extract.mjs [--store|--resident] [--batch N] <file.ifc>')
  process.exit(2)
}

function heapMB() {
  globalThis.gc?.()
  const u = process.memoryUsage()
  return {
    heap: u.heapUsed / (1024 * 1024),
    rss: u.rss / (1024 * 1024),
    ext: u.external / (1024 * 1024),
    ab: u.arrayBuffers / (1024 * 1024),
  }
}

function fmt(h) {
  return `heap=${h.heap.toFixed(1)} rss=${h.rss.toFixed(1)} ext=${h.ext.toFixed(1)} ab=${h.ab.toFixed(1)}`
}

class CountingFileStore {
  constructor(path) {
    this.fd = fs.openSync(path, 'r')
    this.byteLength = fs.fstatSync(this.fd).size
    this.reads = 0
    this.bytes = 0
    this.ms = 0
  }

  async read(offset, length) {
    const t0 = performance.now()
    const buf = Buffer.allocUnsafe(length)
    const got = fs.readSync(this.fd, buf, 0, length, offset)
    this.ms += performance.now() - t0
    this.reads++
    this.bytes += got
    return new Uint8Array(buf.buffer, buf.byteOffset, got)
  }

  close() {
    fs.closeSync(this.fd)
  }

  snapshot() {
    return { reads: this.reads, bytesMB: this.bytes / (1024 * 1024), ioMs: this.ms }
  }
}

const { IfcAPI, LogLevel } = await import('../compiled/src/compat/web-ifc/ifc_api.js')

const api = new IfcAPI()
await api.Init()
api.SetLogLevel(LogLevel.LOG_LEVEL_ERROR)

const tAll = performance.now()
const before = heapMB()
console.log(`mode=${mode} file=${filePath} sizeMB=${(fs.statSync(filePath).size / (1024 * 1024)).toFixed(1)} batch=${batchSize}`)
console.log(`start ${fmt(before)}`)

const SETTINGS = {
  COORDINATE_TO_ORIGIN: true,
  USE_FAST_BOOLS: true,
  ON_PROGRESS: (ev) => {
    if (ev && ev.phase && ev.completed === ev.total) {
      const extra = ev.residentSourceMb !== undefined ? ` window=${ev.residentSourceMb.toFixed(1)}` : ''
      console.log(`  phase ${ev.phase} done ${fmt(heapMB())}${extra}`)
    }
  },
}

let modelID
let store
const tOpen = performance.now()

if (mode === 'resident') {
  const bytes = new Uint8Array(fs.readFileSync(filePath))
  console.log(`buffered ${fmt(heapMB())} (+${(bytes.byteLength / (1024 * 1024)).toFixed(1)} MB file)`)
  modelID = api.OpenModel(bytes, SETTINGS)
} else {
  store = new CountingFileStore(filePath)
  SETTINGS.DEFER_GEOMETRY = true
  modelID = await api.OpenModelStream(store, SETTINGS)
}

const openMs = performance.now() - tOpen
console.log(`open ${openMs.toFixed(0)}ms id=${modelID} ${fmt(heapMB())}`)
if (store) {
  console.log(`  store after open ${JSON.stringify(store.snapshot())}`)
}

if (modelID < 0) {
  console.error('open failed')
  process.exit(1)
}

let meshes = 0
const tGeom = performance.now()

if (mode === 'resident') {
  api.StreamAllMeshes(modelID, () => {
    meshes++
  })
} else {
  let pumped = 0
  for (;;) {
    const { extracted, remaining } = await api.ExtractGeometryBatchAsync(
      modelID, batchSize, () => {
        meshes++
      })
    pumped += extracted
    if (pumped > 0 && pumped % 256 === 0) {
      const io = store.snapshot()
      const passthrough = api.getPassthrough(modelID)
      const prof = passthrough?.extractProfile
      console.log(
        `  pumped=${pumped} remain=${remaining} ${fmt(heapMB())} ` +
        `ioReads=${io.reads} ioMB=${io.bytesMB.toFixed(1)} ioMs=${io.ioMs.toFixed(0)} ` +
        (prof ?
          `prefetch=${prof.prefetchMs} extract=${prof.extractMs} release=${prof.releaseMs} pinMax=${prof.pinMax}` :
          ''))
    }
    if (remaining === 0 && extracted === 0) {
      break
    }
  }
}

const geomMs = performance.now() - tGeom
const after = heapMB()
const passthrough = api.getPassthrough(modelID)
const prof = passthrough?.extractProfile
const windowMb = passthrough?.model?.[0]?.residentSourceBytes

console.log(`geometry ${geomMs.toFixed(0)}ms meshes=${meshes} ${fmt(after)}`)
if (prof) {
  console.log(`  pump split prefetch=${prof.prefetchMs}ms extract=${prof.extractMs}ms release=${prof.releaseMs}ms batches=${prof.batches} pinMax=${prof.pinMax}`)
}
if (store) {
  console.log(`  store total ${JSON.stringify(store.snapshot())}`)
  store.close()
}
console.log(`total ${(performance.now() - tAll).toFixed(0)}ms windowHint=${windowMb ?? 'n/a'}`)
api.CloseModel(modelID)
