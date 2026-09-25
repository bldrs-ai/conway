#!/usr/bin/env node
/**
 * Record that the WASM currently in `Dist/` was built from the conway-geom
 * SHA this checkout has.
 *
 * This is an ASSERTION, not a verification — nothing here rebuilds or hashes
 * the binaries against their source. Run it only where that assertion is true:
 * immediately after a native `yarn build-GHA-all`, or by hand when you know a
 * build matches. `yarn wasm-prebuilt` stamps itself and does not need this.
 */
const {inspect, submoduleSha, writeMarker} = require('./wasmProvenance.cjs')

const sha = submoduleSha()

if (sha === null) {
  console.error('[wasm-stamp] ERROR: cannot read the conway-geom submodule HEAD')
  process.exit(1)
}

const written = writeMarker({
  conwayGeomSha: sha,
  conwayCommit: null,
  source: process.argv[2] ?? 'native-build',
})

if (written.length === 0) {
  console.error('[wasm-stamp] ERROR: no populated Dist directory to stamp')
  process.exit(1)
}

console.log(`[wasm-stamp] recorded conway-geom ${sha.slice(0, 10)} in ${written.length} location(s)`)
console.log(`[wasm-stamp] ${inspect().message}`)
