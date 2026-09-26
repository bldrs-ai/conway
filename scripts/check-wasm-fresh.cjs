#!/usr/bin/env node
/**
 * Fail when the geometry WASM in `Dist/` was not built from the conway-geom
 * source this checkout has. See scripts/wasmProvenance.cjs for why.
 *
 * Sibling of `check-compiled-fresh.cjs`, which answers the same shape of
 * question for TypeScript: "the build ran" and "the outputs are current" are
 * different claims, and only the second one matters.
 *
 * Exit codes: 0 fresh (or a warning the caller chose to tolerate), 1 stale.
 *
 * `--warn-only` reports and exits 0 — for call sites that want the notice
 * without blocking, such as the hint printed after a submodule update.
 */
const {inspect} = require('./wasmProvenance.cjs')

const WARN_ONLY = process.argv.includes('--warn-only')

// `unresolved` cannot distinguish "matches" from "does not match", so it is a
// warning rather than a failure: a shallow clone reaches it routinely and
// there is nothing the developer did wrong to get there.
const TOLERATED = new Set(['ok', 'unresolved'])

const {status, message, remedy} = inspect()

if (status === 'ok') {
  console.log(`[wasm-fresh] ${message}`)
  process.exit(0)
}

const label = TOLERATED.has(status) || WARN_ONLY ? 'WARNING' : 'ERROR'

console.error(`[wasm-fresh] ${label}: ${message}`)

if (remedy !== null) {
  console.error(`[wasm-fresh] fix: ${remedy}`)
}

process.exit(TOLERATED.has(status) || WARN_ONLY ? 0 : 1)
