#!/usr/bin/env node
/**
 * Populate the conway-geom WASM binaries (the `Dist/` bundle) from the
 * published `@bldrs-ai/conway` npm package, so `yarn test` runs without the
 * heavy EMSDK/GENie native build.
 *
 * Why this exists
 * ---------------
 * Jest runs against `compiled/` and the compiled conway-geom interface
 * (`compiled/dependencies/conway-geom/interface/conway_geometry.js`) loads
 * `../Dist/ConwayGeomWasmNodeMT.js` at init. Those `Dist/*.js` + `*.wasm`
 * binaries are produced only by the native toolchain (`yarn build-GHA-all`,
 * needs EMSDK) — a fresh checkout has just the committed `.d.ts`, so any test
 * that touches geometry dies with `Cannot find module '../Dist/...'`. The
 * published package already ships those binaries, so for the common
 * dev-container case (run the suite, don't rebuild the C++) we can just lift
 * them out of the tarball.
 *
 * Caveat: this is the *last published* build. The WASM is a function of the
 * conway-geom submodule SHA; if you've changed that submodule (or the native
 * binding), the prebuilt bundle won't match — do a real `yarn build-*` instead.
 * Pin a specific build with CONWAY_PREBUILT_WASM_VERSION; force a refresh with
 * `--force` (or FORCE=1).
 */
const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const PACKAGE = '@bldrs-ai/conway'
const VERSION = process.env.CONWAY_PREBUILT_WASM_VERSION || 'latest'
const FORCE = process.argv.includes('--force') || process.env.FORCE === '1'

const REPO_ROOT = path.resolve(__dirname, '..')
// Path inside the tarball, and the two in-repo Dist locations to mirror it to:
// `compiled/` is what the tests load; the source-side `Dist/` is where a real
// build emits, kept in sync so non-compiled tooling resolves too.
const DIST_IN_TARBALL = 'package/compiled/dependencies/conway-geom/Dist'
const DIST_TARGETS = [
  path.join(REPO_ROOT, 'compiled', 'dependencies', 'conway-geom', 'Dist'),
  path.join(REPO_ROOT, 'dependencies', 'conway-geom', 'Dist'),
]
// The MT node build is the module the jest geometry path actually imports;
// its presence is our "already populated" sentinel.
const SENTINEL = 'ConwayGeomWasmNodeMT.js'


/** @return {void} */
function main() {
  const primaryTarget = DIST_TARGETS[0]

  if (!FORCE && fs.existsSync(path.join(primaryTarget, SENTINEL))) {
    console.log(`[prebuilt-wasm] ${SENTINEL} already present — skipping ` +
      `(use --force or FORCE=1 to refresh).`)
    return
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conway-wasm-'))

  try {
    console.log(`[prebuilt-wasm] fetching ${PACKAGE}@${VERSION} ...`)
    // `npm pack` resolves the registry/auth for us and writes a .tgz. Registry
    // traffic goes direct (registry.npmjs.org), not through the geometry build.
    const packOut = execFileSync(
        'npm',
        ['pack', `${PACKAGE}@${VERSION}`, '--silent', '--pack-destination', tmpDir],
        { cwd: tmpDir, encoding: 'utf8' })

    const tgz = packOut.trim().split('\n').pop().trim()
    const tgzPath = path.join(tmpDir, tgz)

    // Extract only the Dist bundle from the tarball.
    execFileSync(
        'tar',
        ['-xzf', tgzPath, '-C', tmpDir, DIST_IN_TARBALL],
        { stdio: 'inherit' })

    const extractedDist = path.join(tmpDir, DIST_IN_TARBALL)
    const files = fs.readdirSync(extractedDist)

    if (files.length === 0) {
      throw new Error(`no Dist files in ${PACKAGE}@${VERSION} tarball`)
    }

    for (const target of DIST_TARGETS) {
      fs.mkdirSync(target, { recursive: true })
      for (const file of files) {
        fs.copyFileSync(path.join(extractedDist, file), path.join(target, file))
      }
    }

    console.log(`[prebuilt-wasm] installed ${files.length} file(s) ` +
      `(${files.join(', ')}) into:`)
    for (const target of DIST_TARGETS) {
      console.log(`  - ${path.relative(REPO_ROOT, target)}`)
    }
    console.log('[prebuilt-wasm] done. NOTE: this is the last-published build; ' +
      'rebuild from source if you changed the conway-geom submodule.')
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

main()
