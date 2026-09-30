#!/usr/bin/env node
/**
 * Report whether the geometry WASM matches the conway-geom source this
 * checkout has. See scripts/wasmProvenance.cjs for the scope, and for what
 * this deliberately does not cover.
 *
 * Exit 1 ONLY when the marker names a different submodule SHA. Every other
 * condition — a dirty tree, an unstamped or unresolved bundle, a stale
 * sibling — prints and exits 0. That asymmetry is the point: four review
 * rounds on conway#717 showed the broader checks rejecting correctly rebuilt
 * trees, and a gate that is wrong about correct work is one people route
 * around.
 *
 * `--warn-only` never exits non-zero, for call sites that want the notice
 * without the block. `yarn precommit` uses it.
 */
const {inspect} = require('./wasmProvenance.cjs')

const WARN_ONLY = process.argv.includes('--warn-only')
const {status, fatal, message, remedy, warnings} = inspect()

for (const warning of warnings) {
  console.warn(`[wasm-fresh] note: ${warning}`)
}

if (status === 'ok') {
  console.log(`[wasm-fresh] ${message}`)
  process.exit(0)
}

const blocking = fatal && !WARN_ONLY

console.error(`[wasm-fresh] ${blocking ? 'ERROR' : 'WARNING'}: ${message}`)

if (remedy !== null) {
  console.error(`[wasm-fresh] fix: ${remedy}`)
}

process.exit(blocking ? 1 : 0)
