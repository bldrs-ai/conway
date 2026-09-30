#!/usr/bin/env node
/**
 * Record that the named targets in `Dist/` were built from the conway-geom
 * source this checkout has.
 *
 * Usage: `yarn wasm-stamp --built <target>...`
 *
 * Provenance is per target, so a partial build stamps exactly what it
 * rebuilt and leaves every other entry untouched. That is what makes the
 * documented `yarn build-codex-MT` loop work with the freshness gate: it
 * refreshes `ConwayGeomWasmNodeMT`, which is what jest and the debug probes
 * load, while any stale Web sibling keeps its older provenance and is
 * reported as a warning rather than erased or vouched for (conway#717).
 *
 * This remains an ASSERTION, not a verification — nothing here rebuilds or
 * hashes the binaries against their source — so it belongs immediately after
 * a build that succeeded, and nowhere else.
 */
const {ALL_TARGETS, inspect, submoduleDirtyDigest, submoduleSha, writeMarker} =
  require('./wasmProvenance.cjs')

const args = process.argv.slice(2)
const builtIndex = args.indexOf('--built')
const built = builtIndex === -1 ? [] : args.slice(builtIndex + 1).filter((a) => !a.startsWith('--'))
const unknown = built.filter((t) => !ALL_TARGETS.includes(t))

if (built.length === 0) {
  console.error('[wasm-stamp] ERROR: no targets given. Usage: ' +
    `yarn wasm-stamp --built <${ALL_TARGETS.join('|')}>...`)
  process.exit(1)
}

if (unknown.length > 0) {
  console.error(`[wasm-stamp] ERROR: unknown target(s): ${unknown.join(', ')}`)
  console.error(`[wasm-stamp] known targets: ${ALL_TARGETS.join(', ')}`)
  process.exit(1)
}

const sha = submoduleSha()

if (sha === null) {
  console.error('[wasm-stamp] ERROR: cannot read the conway-geom submodule HEAD')
  process.exit(1)
}

const written = writeMarker(built, {
  conwayGeomSha: sha,
  conwayCommit: null,
  sourceDirty: submoduleDirtyDigest(),
  source: 'native-build',
})

if (written.length === 0) {
  console.error('[wasm-stamp] ERROR: no populated Dist directory to stamp')
  process.exit(1)
}

console.log(`[wasm-stamp] ${built.join(', ')} -> conway-geom ${sha.slice(0, 10)} ` +
  `in ${written.length} location(s)`)

const {message, warnings} = inspect()

console.log(`[wasm-stamp] ${message}`)
for (const warning of warnings) {
  console.log(`[wasm-stamp] note: ${warning}`)
}
