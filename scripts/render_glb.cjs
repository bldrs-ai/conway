#!/usr/bin/env node
/**
 * Render a (untextured) GLB to PNG with a pure-JS software rasterizer.
 *
 * Zero native dependencies by design: CI visual diffs must run on any
 * runner without headless-gl/canvas prebuilts, Xvfb, or a Node version
 * pin, and software rasterization is bit-deterministic across machines.
 * Handles exactly what conway's CLI `-g` exporter emits: triangle
 * primitives (mode 4), float VEC3 POSITION, u8/u16/u32 indices, node
 * trees with matrix or TRS transforms. No textures, skins, or sparse
 * accessors.
 *
 * Usage:
 *   render_glb.cjs <in.glb> <out.png> [--size N]
 *   render_glb.cjs --pair <before.glb> <after.glb> <outPrefix> [--size N]
 *
 * Pair mode renders both files with ONE camera framed on the union of
 * the two bounding boxes (writes <outPrefix>-before.png and
 * <outPrefix>-after.png). That shared framing is the point: a geometry
 * regression that moves the bounds (e.g. a stray spike) shows up as an
 * obvious scale/shape difference instead of two individually auto-fit,
 * incomparable images.
 */
'use strict'

const fs = require('fs')
const zlib = require('zlib')

// ---------------------------------------------------------------------------
// GLB / glTF parsing
// ---------------------------------------------------------------------------

const COMPONENT_BYTES = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }

/** @param {Buffer} buf @returns {{json: any, bin: Buffer}} */
function parseGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546C67) {
    throw new Error('not a GLB (bad magic)')
  }
  let offset = 12
  let json = null
  let bin = null
  while (offset < buf.length) {
    const chunkLen = buf.readUInt32LE(offset)
    const chunkType = buf.readUInt32LE(offset + 4)
    const body = buf.slice(offset + 8, offset + 8 + chunkLen)
    if (chunkType === 0x4E4F534A) {
      json = JSON.parse(body.toString('utf8'))
    } else if (chunkType === 0x004E4942) {
      bin = body
    }
    offset += 8 + chunkLen + (chunkLen % 4 === 0 ? 0 : 4 - (chunkLen % 4))
  }
  if (!json || !bin) {
    throw new Error('GLB missing JSON or BIN chunk')
  }
  return { json, bin }
}

/** Read an accessor into a flat JS number array. */
function readAccessor(json, bin, accessorIndex) {
  const acc = json.accessors[accessorIndex]
  const view = json.bufferViews[acc.bufferView]
  const compBytes = COMPONENT_BYTES[acc.componentType]
  const compCount = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type]
  const stride = view.byteStride || compBytes * compCount
  const base = (view.byteOffset || 0) + (acc.byteOffset || 0)
  const out = new Array(acc.count * compCount)
  for (let i = 0; i < acc.count; i++) {
    const at = base + i * stride
    for (let c = 0; c < compCount; c++) {
      const o = at + c * compBytes
      switch (acc.componentType) {
        case 5126: out[i * compCount + c] = bin.readFloatLE(o); break
        case 5125: out[i * compCount + c] = bin.readUInt32LE(o); break
        case 5123: out[i * compCount + c] = bin.readUInt16LE(o); break
        case 5121: out[i * compCount + c] = bin.readUInt8(o); break
        case 5122: out[i * compCount + c] = bin.readInt16LE(o); break
        case 5120: out[i * compCount + c] = bin.readInt8(o); break
        default: throw new Error(`unsupported componentType ${acc.componentType}`)
      }
    }
  }
  return out
}

function mat4Multiply(a, b) {
  const r = new Array(16)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let s = 0
      for (let k = 0; k < 4; k++) {
        s += a[k * 4 + row] * b[col * 4 + k]
      }
      r[col * 4 + row] = s
    }
  }
  return r
}

const MAT4_IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

/** Column-major local matrix from a glTF node (matrix wins over TRS). */
function nodeLocalMatrix(node) {
  if (node.matrix) {
    return node.matrix
  }
  const [tx, ty, tz] = node.translation || [0, 0, 0]
  const [qx, qy, qz, qw] = node.rotation || [0, 0, 0, 1]
  const [sx, sy, sz] = node.scale || [1, 1, 1]
  const x2 = qx + qx; const y2 = qy + qy; const z2 = qz + qz
  const xx = qx * x2; const xy = qx * y2; const xz = qx * z2
  const yy = qy * y2; const yz = qy * z2; const zz = qz * z2
  const wx = qw * x2; const wy = qw * y2; const wz = qw * z2
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ]
}

/**
 * Walk the scene graph and gather world-space triangles.
 *
 * @returns {Float64Array} xyz triples, 9 numbers per triangle
 */
function collectTriangles(json, bin) {
  const tris = []
  const positionCache = new Map()
  const indexCache = new Map()

  const visit = (nodeIndex, parentMatrix) => {
    const node = json.nodes[nodeIndex]
    const world = mat4Multiply(parentMatrix, nodeLocalMatrix(node))
    if (node.mesh !== undefined) {
      const mesh = json.meshes[node.mesh]
      for (const prim of mesh.primitives) {
        if (prim.mode !== undefined && prim.mode !== 4) {
          continue
        }
        if (prim.attributes.POSITION === undefined) {
          continue
        }
        let pos = positionCache.get(prim.attributes.POSITION)
        if (!pos) {
          pos = readAccessor(json, bin, prim.attributes.POSITION)
          positionCache.set(prim.attributes.POSITION, pos)
        }
        let idx
        if (prim.indices !== undefined) {
          idx = indexCache.get(prim.indices)
          if (!idx) {
            idx = readAccessor(json, bin, prim.indices)
            indexCache.set(prim.indices, idx)
          }
        } else {
          idx = Array.from({ length: pos.length / 3 }, (_, i) => i)
        }
        const m = world
        for (let i = 0; i + 2 < idx.length; i += 3) {
          for (const vi of [idx[i], idx[i + 1], idx[i + 2]]) {
            const x = pos[vi * 3]; const y = pos[vi * 3 + 1]; const z = pos[vi * 3 + 2]
            tris.push(
                m[0] * x + m[4] * y + m[8] * z + m[12],
                m[1] * x + m[5] * y + m[9] * z + m[13],
                m[2] * x + m[6] * y + m[10] * z + m[14],
            )
          }
        }
      }
    }
    for (const child of node.children || []) {
      visit(child, world)
    }
  }

  const scene = json.scenes[json.scene || 0]
  for (const root of scene.nodes) {
    visit(root, MAT4_IDENTITY)
  }
  return Float64Array.from(tris)
}

// ---------------------------------------------------------------------------
// Rasterization
// ---------------------------------------------------------------------------

const VIEW_DIR = normalize([1, 1, 1])
const VIEW_UP = [0, 1, 0]
const LIGHT_DIR = normalize([0.55, 0.9, 0.35])
const BG = 246
const BASE_COLOR = [126, 148, 176]

function normalize(v) {
  const n = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / n, v[1] / n, v[2] / n]
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/** Isometric camera basis: right/up in view plane, dir toward the camera. */
function cameraBasis() {
  const right = normalize(cross(VIEW_UP, VIEW_DIR))
  const up = normalize(cross(VIEW_DIR, right))
  return { right, up, dir: VIEW_DIR }
}

/** Min/max of triangle soup projected onto the camera basis. */
function projectedBounds(tris, basis) {
  const bounds = {
    minX: Infinity, maxX: -Infinity,
    minY: Infinity, maxY: -Infinity,
  }
  for (let i = 0; i < tris.length; i += 3) {
    const v = [tris[i], tris[i + 1], tris[i + 2]]
    const px = dot(v, basis.right)
    const py = dot(v, basis.up)
    if (px < bounds.minX) bounds.minX = px
    if (px > bounds.maxX) bounds.maxX = px
    if (py < bounds.minY) bounds.minY = py
    if (py > bounds.maxY) bounds.maxY = py
  }
  return bounds
}

function unionBounds(a, b) {
  return {
    minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY), maxY: Math.max(a.maxY, b.maxY),
  }
}

/**
 * Render triangles to an RGB pixel buffer with an orthographic camera.
 *
 * @param {Float64Array} tris world-space soup (9 numbers per triangle)
 * @param {object} bounds projected-plane framing (from projectedBounds)
 * @param {number} size output width == height, pixels
 * @returns {Buffer} size*size*3 RGB bytes
 */
function renderToPixels(tris, bounds, size) {
  const basis = cameraBasis()
  const pixels = Buffer.alloc(size * size * 3, BG)
  const depth = new Float64Array(size * size).fill(-Infinity)

  const spanX = bounds.maxX - bounds.minX
  const spanY = bounds.maxY - bounds.minY
  const span = Math.max(spanX, spanY) || 1
  const scale = (size * 0.92) / span
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2

  const toScreen = (v) => [
    (dot(v, basis.right) - cx) * scale + size / 2,
    size / 2 - (dot(v, basis.up) - cy) * scale,
    dot(v, basis.dir),
  ]

  for (let t = 0; t < tris.length; t += 9) {
    const a = toScreen([tris[t], tris[t + 1], tris[t + 2]])
    const b = toScreen([tris[t + 3], tris[t + 4], tris[t + 5]])
    const c = toScreen([tris[t + 6], tris[t + 7], tris[t + 8]])

    const minX = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])))
    const maxX = Math.min(size - 1, Math.ceil(Math.max(a[0], b[0], c[0])))
    const minY = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])))
    const maxY = Math.min(size - 1, Math.ceil(Math.max(a[1], b[1], c[1])))
    if (minX > maxX || minY > maxY) {
      continue
    }

    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    if (area === 0) {
      continue
    }

    // Two-sided Lambert on the world-space face normal — exporter winding
    // varies per pipeline, so shading by |n·L| avoids black back-faces.
    const e1 = [tris[t + 3] - tris[t], tris[t + 4] - tris[t + 1], tris[t + 5] - tris[t + 2]]
    const e2 = [tris[t + 6] - tris[t], tris[t + 7] - tris[t + 1], tris[t + 8] - tris[t + 2]]
    const n = normalize(cross(e1, e2))
    const lambert = 0.3 + 0.7 * Math.abs(dot(n, LIGHT_DIR))
    const r = Math.min(255, BASE_COLOR[0] * lambert) | 0
    const g = Math.min(255, BASE_COLOR[1] * lambert) | 0
    const bl = Math.min(255, BASE_COLOR[2] * lambert) | 0

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5
        const py = y + 0.5
        const w0 = ((b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0])) / area
        const w1 = ((c[0] - b[0]) * (py - b[1]) - (c[1] - b[1]) * (px - b[0])) / area
        const w2 = ((a[0] - c[0]) * (py - c[1]) - (a[1] - c[1]) * (px - c[0])) / area
        if (w0 < 0 || w1 < 0 || w2 < 0) {
          continue
        }
        // Perspective-free interpolation: w1 weights vertex c, w2 weights a,
        // w0 weights b (edge-function convention above).
        const z = a[2] * w2 + b[2] * w0 + c[2] * w1
        const di = y * size + x
        if (z <= depth[di]) {
          continue
        }
        depth[di] = z
        const pi = di * 3
        pixels[pi] = r
        pixels[pi + 1] = g
        pixels[pi + 2] = bl
      }
    }
  }
  return pixels
}

// ---------------------------------------------------------------------------
// PNG encoding (RGB8, filter 0, zlib) — no dependencies
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.slice(4, 8 + data.length)), 8 + data.length)
  return out
}

function writePng(path, pixels, size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type RGB
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    // leading 0 per scanline = "None" filter
    pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3)
  }
  fs.writeFileSync(path, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]))
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function loadTriangles(glbPath) {
  const { json, bin } = parseGlb(fs.readFileSync(glbPath))
  return collectTriangles(json, bin)
}

function main() {
  const args = process.argv.slice(2)
  let size = 640
  const sizeAt = args.indexOf('--size')
  if (sizeAt >= 0) {
    size = parseInt(args[sizeAt + 1], 10)
    args.splice(sizeAt, 2)
  }

  const basis = cameraBasis()
  if (args[0] === '--pair') {
    const [, beforeGlb, afterGlb, outPrefix] = args
    const before = loadTriangles(beforeGlb)
    const after = loadTriangles(afterGlb)
    const bounds = unionBounds(
        projectedBounds(before, basis), projectedBounds(after, basis))
    writePng(`${outPrefix}-before.png`, renderToPixels(before, bounds, size), size)
    writePng(`${outPrefix}-after.png`, renderToPixels(after, bounds, size), size)
  } else {
    const [glbPath, outPath] = args
    const tris = loadTriangles(glbPath)
    writePng(outPath, renderToPixels(tris, projectedBounds(tris, basis), size), size)
  }
}

main()
