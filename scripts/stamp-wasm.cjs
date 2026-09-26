#!/usr/bin/env node
/**
 * Record that the WASM currently in `Dist/` was built from the conway-geom
 * source this checkout has — or, when the build was partial, remove any
 * existing marker so the bundle reads `unstamped` instead.
 *
 * Usage: `yarn wasm-stamp --built <target>...`
 *
 * Why the target list is required
 * -------------------------------
 * A partial build (`build-GHA-MT`, `build-codex-MT`, `yarn build-MT`) rebuilds
 * one or two variants but copies `bin/release/*` wholesale, so siblings left
 * there by an earlier build at a different SHA ride along into `Dist/`.
 * Stamping that asserts the stale Web artifacts are current, and a browser
 * consumer then executes them under an `ok` verdict — a worse outcome than no
 * marker at all, because it converts "nobody can tell" into a confident wrong
 * answer (codex review, conway#717). So a stamp is written only when all four
 * variants were rebuilt; anything less clears the marker.
 *
 * This remains an ASSERTION about a complete build, not a verification of it:
 * nothing here rebuilds or hashes the binaries against their source.
 */
const {REQUIRED_TARGETS, clearMarker, inspect, submoduleDirtyDigest, submoduleSha, writeMarker} =
  require('./wasmProvenance.cjs')

const args = process.argv.slice(2)
const builtIndex = args.indexOf('--built')
const built = builtIndex === -1 ? [] : args.slice(builtIndex + 1).filter((a) => !a.startsWith('--'))
const missing = REQUIRED_TARGETS.filter((t) => !built.includes(t))

if (missing.length > 0) {
  const cleared = clearMarker()

  console.log('[wasm-stamp] partial build ' +
    `(${built.length === 0 ? 'no targets named' : built.join(', ')}); ` +
    `not stamping — ${missing.join(', ')} may be stale in Dist.`)
  console.log(`[wasm-stamp] cleared ${cleared.length} existing marker(s); ` +
    'Dist now reads `unstamped` until a full build or `yarn wasm-prebuilt --force`.')
  process.exit(0)
}

const sha = submoduleSha()

if (sha === null) {
  console.error('[wasm-stamp] ERROR: cannot read the conway-geom submodule HEAD')
  process.exit(1)
}

const written = writeMarker({
  conwayGeomSha: sha,
  conwayCommit: null,
  sourceDirty: submoduleDirtyDigest(),
  source: 'native-build',
})

if (written.length === 0) {
  console.error('[wasm-stamp] ERROR: no populated Dist directory to stamp')
  process.exit(1)
}

console.log(`[wasm-stamp] recorded conway-geom ${sha.slice(0, 10)} in ${written.length} location(s)`)
console.log(`[wasm-stamp] ${inspect().message}`)
