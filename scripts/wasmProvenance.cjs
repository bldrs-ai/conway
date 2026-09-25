/**
 * Which conway-geom source the WASM in `Dist/` was built from, and whether
 * that still matches the submodule this checkout has.
 *
 * Why this exists
 * ---------------
 * `Dist/*.js` + `*.wasm` are build outputs — gitignored, produced only by the
 * EMSDK toolchain (`yarn build-GHA-all`) or lifted from a published tarball
 * (`yarn wasm-prebuilt`). NOTHING in the tree records which conway-geom SHA a
 * given `Dist/` corresponds to, so `git submodule update` to a new SHA leaves
 * the old binaries in place and every consumer silently runs the previous
 * engine against the new TypeScript.
 *
 * The failure is not theoretical and it is not loud. Observed on this repo in
 * Sep 2026: `dependencies/conway-geom/Dist` was a Sep-18 build while the
 * submodule was checked out at `d049451` (Sep 23, conway-geom#214).
 * `scripts/debug/face_health.mjs` ran happily against it and reproduced the
 * PRE-#214 numbers for `ADVANCED_FACE #18856` — i.e. it reported a fixed
 * defect as still live, with no warning of any kind. The workflow this repo
 * actually runs is "bump the submodule, measure, commit the pin", and a stale
 * `Dist/` corrupts the measuring step specifically.
 *
 * CI never had this problem, because it already enforces the invariant: it
 * computes the submodule SHA, keys the WASM cache on it
 * (`wasm-${os}-emsdk${v}-${sha}` in build.yml), and the regression job fails
 * outright on a cache miss. This module is that same rule, moved to where
 * humans and debug scripts can hit it.
 *
 * What a marker does and does not assert
 * --------------------------------------
 * `wasm-stamp` and the native build write the marker from the CURRENT
 * submodule SHA — that is an ASSERTION that the build in `Dist/` came from
 * that source, not a verification of it. Nothing here hashes the wasm against
 * a rebuild. A marker is therefore as trustworthy as the step that wrote it;
 * what it removes is the case where nobody can even tell.
 */
const {execFileSync} = require('child_process')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..')

/**
 * Both in-repo Dist locations. `compiled/` is what jest and the debug scripts
 * load; the source-side one is where a native build emits. They are mirrored
 * rather than symlinked, so they can drift apart independently — a worktree
 * build or an interrupted copy updates one and not the other, which is its own
 * failure mode and is checked separately below.
 */
const DIST_TARGETS = [
  path.join(REPO_ROOT, 'compiled', 'dependencies', 'conway-geom', 'Dist'),
  path.join(REPO_ROOT, 'dependencies', 'conway-geom', 'Dist'),
]

const MARKER_NAME = '.wasm-provenance.json'

// The MT node build is the module the jest geometry path imports, so its
// presence is what "Dist is populated" means in practice.
const SENTINEL = 'ConwayGeomWasmNodeMT.js'


/**
 * @param {string[]} args
 * @param {string} [cwd]
 * @return {string|null} trimmed stdout, or null if git failed (shallow clone,
 *   missing object, not a repo).
 */
function git(args, cwd = REPO_ROOT) {
  try {
    return execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim()
  } catch {
    return null
  }
}


/** @return {string|null} the conway-geom SHA this checkout has. */
function submoduleSha() {
  return git(['rev-parse', 'HEAD'], path.join(REPO_ROOT, 'dependencies', 'conway-geom'))
}


/**
 * Resolve the conway-geom SHA a published package was built from.
 *
 * Package versions carry the conway commit in their suffix
 * (`1.1604.715-gefd109ea` -> `efd109ea`), and that commit's gitlink IS the
 * conway-geom SHA — `git rev-parse <commit>:dependencies/conway-geom`. Returns
 * null when the commit is not in this clone, which a shallow or stale fetch
 * makes routine; callers must treat that as "unresolved", never as a match.
 *
 * @param {string} version an `@bldrs-ai/conway` version string
 * @return {{conwayCommit: string|null, conwayGeomSha: string|null}}
 */
function shaForPackageVersion(version) {
  const suffix = /-g([0-9a-f]{7,40})$/.exec(version)

  if (suffix === null) {
    return {conwayCommit: null, conwayGeomSha: null}
  }

  const conwayCommit = suffix[1]

  return {
    conwayCommit,
    conwayGeomSha: git(['rev-parse', `${conwayCommit}:dependencies/conway-geom`]),
  }
}


/**
 * @param {string} dir
 * @return {object|null}
 */
function readMarker(dir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, MARKER_NAME), 'utf8'))
  } catch {
    return null
  }
}


/**
 * Write the same marker into every populated Dist target.
 *
 * @param {object} record
 * @return {string[]} the directories written
 */
function writeMarker(record) {
  const written = []

  for (const dir of DIST_TARGETS) {
    if (!fs.existsSync(dir)) {
      continue
    }
    fs.writeFileSync(
        path.join(dir, MARKER_NAME),
        `${JSON.stringify({...record, stampedAt: new Date().toISOString()}, null, 2)}\n`)
    written.push(dir)
  }

  return written
}


/** @param {string} file @return {string|null} */
function digest(file) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
  } catch {
    return null
  }
}


/**
 * @typedef {'ok'|'missing'|'unstamped'|'stale'|'skew'|'unresolved'} WasmStatus
 */

/**
 * Decide the status from already-gathered facts.
 *
 * Kept pure and exported so the decision table is testable without a Dist
 * directory, a submodule, or a build — `inspect()` below is the I/O half and
 * does no deciding of its own.
 *
 * @param {{
 *   populated: number,
 *   mirrorsAgree: boolean|null,
 *   marker: object|null,
 *   expectedSha: string|null,
 * }} facts
 * @return {{status: WasmStatus, message: string, remedy: string|null}}
 */
function classify({populated, mirrorsAgree, marker, expectedSha}) {
  if (populated === 0) {
    return {
      status: 'missing',
      message: `no ${SENTINEL} in either Dist location — the geometry wasm is not populated`,
      remedy: 'yarn wasm-prebuilt   (or a native `yarn build-GHA-all`)',
    }
  }

  // Mirror skew is decided BEFORE provenance, because when the two disagree
  // the marker can only describe one of them and a "fresh" verdict would be
  // read as covering both.
  if (mirrorsAgree === false) {
    return {
      status: 'skew',
      message: `the two Dist mirrors hold DIFFERENT ${SENTINEL} builds ` +
        `(${DIST_TARGETS.map((d) => path.relative(REPO_ROOT, d)).join(' vs ')}) — ` +
        'whichever one a given consumer resolves decides which engine it runs',
      remedy: 'yarn wasm-prebuilt --force   (or a native `yarn build-GHA-all`)',
    }
  }

  if (marker === null) {
    return {
      status: 'unstamped',
      message: 'Dist carries no provenance marker, so nothing can say which ' +
        'conway-geom source it was built from',
      remedy: 'yarn wasm-prebuilt --force, or `yarn wasm-stamp` if you know ' +
        'this build matches the checked-out submodule',
    }
  }

  if (marker.conwayGeomSha === null || marker.conwayGeomSha === undefined) {
    return {
      status: 'unresolved',
      message: `Dist came from ${marker.source ?? 'an unknown source'} whose ` +
        'conway-geom SHA could not be resolved in this clone' +
        (marker.conwayCommit ? ` (conway commit ${marker.conwayCommit} not present)` : ''),
      remedy: 'git fetch origin, then `yarn check-wasm-fresh` again',
    }
  }

  if (expectedSha === null) {
    return {
      status: 'unresolved',
      message: 'could not read the conway-geom submodule HEAD to compare against',
      remedy: 'yarn submodule-update',
    }
  }

  if (marker.conwayGeomSha !== expectedSha) {
    return {
      status: 'stale',
      message: `Dist was built from conway-geom ${marker.conwayGeomSha.slice(0, 10)} ` +
        `but this checkout has ${expectedSha.slice(0, 10)} — every consumer is ` +
        'running the OLD engine against the current source',
      remedy: 'yarn wasm-prebuilt --force   (or a native `yarn build-GHA-all`)',
    }
  }

  return {
    status: 'ok',
    message: `Dist matches conway-geom ${expectedSha.slice(0, 10)} ` +
      `(${marker.source ?? 'unknown source'})`,
    remedy: null,
  }
}


/**
 * Gather the facts from disk and git, then `classify` them.
 *
 * @return {{status: WasmStatus, message: string, remedy: string|null}}
 */
function inspect() {
  const populatedDirs = DIST_TARGETS.filter((d) => fs.existsSync(path.join(d, SENTINEL)))

  // Only meaningful when BOTH are populated; a single-mirror checkout has
  // nothing to disagree with, which is not the same as agreeing.
  const mirrorsAgree = populatedDirs.length === DIST_TARGETS.length ?
    digest(path.join(populatedDirs[0], SENTINEL)) === digest(path.join(populatedDirs[1], SENTINEL)) :
    null

  return classify({
    populated: populatedDirs.length,
    mirrorsAgree,
    marker: populatedDirs.length > 0 ? readMarker(populatedDirs[0]) : null,
    expectedSha: submoduleSha(),
  })
}


module.exports = {
  DIST_TARGETS,
  classify,
  MARKER_NAME,
  SENTINEL,
  inspect,
  readMarker,
  shaForPackageVersion,
  submoduleSha,
  writeMarker,
}
