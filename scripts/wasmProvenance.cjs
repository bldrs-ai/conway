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
 * Provenance is PER ARTIFACT, and the gate is SCOPED
 * --------------------------------------------------
 * An earlier design stamped the bundle as a whole, and that ran into a
 * contradiction the review surfaced in three rounds (conway#717): a partial
 * build (`build-codex-MT`, `build-GHA-MT`, `yarn build-MT`) rebuilds one or
 * two variants and copies `bin/release/*` wholesale, so stamping it vouches
 * for siblings that may predate the change — while NOT stamping it makes the
 * documented MT workflow fail the gate on a correctly rebuilt tree. Stamping
 * and clearing are both wrong for the same input, which means the bundle was
 * the wrong unit.
 *
 * So each TARGET carries its own identity, and a partial build updates only
 * what it rebuilt. The gate then asks a narrower, answerable question: is the
 * artifact THIS CONSUMER LOADS current? `GATED_TARGET` is
 * `ConwayGeomWasmNodeMT`, which is what jest and every script in
 * `scripts/debug/` import. A stale sibling is reported as a warning rather
 * than a failure, because it cannot affect them — and is still named, so a
 * release path can act on it.
 *
 * What a marker does and does not assert
 * --------------------------------------
 * `wasm-stamp` and the native build write the marker from the CURRENT
 * submodule state — that is an ASSERTION that the artifact in `Dist/` came
 * from that source, not a verification of it. Nothing here hashes the wasm
 * against a rebuild, so a build that dies halfway with a zero exit still
 * stamps. A marker is as trustworthy as the step that wrote it; what it
 * removes is the case where nobody can even tell.
 */
const {execFileSync} = require('child_process')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..')
const SUBMODULE = path.join(REPO_ROOT, 'dependencies', 'conway-geom')

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

const GATED_TARGET = 'ConwayGeomWasmNodeMT'

/**
 * Every variant a complete build produces. Used to stamp a full build and to
 * report stale siblings; NOT a precondition for the gate — see `GATED_TARGET`.
 */
const ALL_TARGETS = [
  'ConwayGeomWasmNode',
  'ConwayGeomWasmNodeMT',
  'ConwayGeomWasmWeb',
  'ConwayGeomWasmWebMT',
]

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
  return git(['rev-parse', 'HEAD'], SUBMODULE)
}


/**
 * Digest of the submodule's UNCOMMITTED state, or null when it is clean.
 *
 * A SHA alone is not an identity during the normal iterative C++ workflow:
 * edit `conway_geometry/*.h`, rebuild, and `HEAD` is unchanged, so a marker
 * written before the edit still matches and everything reports `ok` while
 * running WASM that predates the edit (codex review, conway#717). Folding the
 * working-tree state in means an edit invalidates the marker exactly as a
 * commit would.
 *
 * Three sources, because two were not enough: `status --porcelain` for the
 * NAMES of changed and untracked files, `diff HEAD` for the CONTENT of
 * tracked changes, and the CONTENT of each untracked file. That last one is
 * not belt-and-braces — `dependencies/conway-geom/genie.lua` globs
 * `conway_geometry/**` recursively, so a source file is a real build input
 * from the moment it exists, before anyone runs `git add`. Hashing only names
 * meant creating a file, stamping a build, then editing that file left the
 * digest unchanged and the gate green against wasm that predated the edit
 * (codex review, conway#717).
 *
 * `--exclude-standard` keeps this bounded: `bin/`, `Dist/` and `gmake/` are
 * gitignored, so the untracked set is source files and little else.
 *
 * @return {string|null}
 */
function submoduleDirtyDigest() {
  const status = git(['status', '--porcelain'], SUBMODULE)

  if (status === null || status === '') {
    return null
  }

  const hash = crypto.createHash('sha256')

  hash.update(status).update('\0').update(git(['diff', 'HEAD'], SUBMODULE) ?? '')

  const untracked = git(['ls-files', '--others', '--exclude-standard'], SUBMODULE) ?? ''

  for (const rel of untracked.split('\n').filter(Boolean).sort()) {
    hash.update('\0').update(rel).update('\0')
    try {
      const full = path.join(SUBMODULE, rel)

      if (fs.statSync(full).isFile()) {
        hash.update(fs.readFileSync(full))
      }
    } catch {
      // Raced with a delete, or unreadable. The name is already folded in,
      // which is enough to mark the tree dirty.
    }
  }

  return hash.digest('hex')
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
 * Record `record` as the provenance of each named target, in every populated
 * Dist directory.
 *
 * @param {string[]} targets target names this record describes
 * @param {object} record
 * @return {string[]} the directories written
 */
function writeMarker(targets, record) {
  const written = []

  for (const dir of DIST_TARGETS) {
    if (!fs.existsSync(dir)) {
      continue
    }

    // MERGE rather than replace: a partial build must leave the entries for
    // targets it did not rebuild exactly as they were, so their staleness
    // stays visible instead of being erased by the rebuild of a sibling.
    const existing = markerEntries(readMarker(dir)) ?? {}
    const stamped = {...record, stampedAt: new Date().toISOString()}

    for (const name of targets) {
      existing[name] = stamped
    }

    fs.writeFileSync(
        path.join(dir, MARKER_NAME),
        `${JSON.stringify({version: 2, targets: existing}, null, 2)}\n`)
    written.push(dir)
  }

  return written
}


/**
 * Digest of EVERY artifact in a Dist directory, not just the sentinel.
 *
 * The sentinel alone is not enough: `ConwayGeomWasmWebMT.wasm` is a separate
 * 1.8MB file, and a C++-only change or an interrupted copy can leave it
 * differing between the mirrors while the Node glue matches byte for byte. A
 * sentinel-only comparison would call that agreement and let `inspect()`
 * return `ok` while two consumers ran different engines (codex review,
 * conway#717).
 *
 * Restricted to the RUNTIME artifacts (`.js`, `.wasm`). The source-side
 * mirror also carries the `.d.ts` declarations, which the build copies there
 * and not into `compiled/`; folding those in flags every correctly populated
 * tree as skewed. Measured on a good tree before narrowing this — the five
 * `.d.ts` files were the only difference, with every `.js` and `.wasm`
 * byte-identical. A type declaration cannot make two consumers run different
 * engines, which is the only thing this comparison is for.
 *
 * Names are folded in alongside contents so an extra or missing runtime file
 * counts as a difference rather than being silently skipped, and the marker
 * itself is excluded — it is written per-directory and would otherwise make
 * every pair of mirrors disagree.
 *
 * @param {string} dir
 * @return {string|null} null when the directory cannot be read.
 */
function bundleDigest(dir) {
  try {
    const hash = crypto.createHash('sha256')

    const runtime = fs.readdirSync(dir)
        .filter((n) => n.endsWith('.js') || n.endsWith('.wasm'))
        .sort()

    for (const name of runtime) {
      const full = path.join(dir, name)

      if (!fs.statSync(full).isFile()) {
        continue
      }
      hash.update(name).update('\0').update(fs.readFileSync(full))
    }

    return hash.digest('hex')
  } catch {
    return null
  }
}


/**
 * @typedef {'ok'|'missing'|'unstamped'|'stale'|'dirty'|'skew'|'unresolved'} WasmStatus
 */

/**
 * Evaluate ONE target's marker entry against the current source.
 *
 * @param {object|undefined} entry
 * @param {string|null} expectedSha
 * @param {string|null} expectedDirty
 * @return {'ok'|'unstamped'|'stale'|'dirty'|'unresolved'}
 */
function evaluateTarget(entry, expectedSha, expectedDirty) {
  if (entry === undefined || entry === null) {
    return 'unstamped'
  }

  if (entry.conwayGeomSha === null || entry.conwayGeomSha === undefined || expectedSha === null) {
    return 'unresolved'
  }

  if (entry.conwayGeomSha !== expectedSha) {
    return 'stale'
  }

  return (entry.sourceDirty ?? null) === expectedDirty ? 'ok' : 'dirty'
}


/**
 * Per-target entries from a marker, tolerating the v1 flat shape.
 *
 * A v1 marker described the whole bundle, which is exactly what a published
 * tarball is, so it maps onto every target rather than being discarded — a
 * checkout that fetched a prebuilt before this change keeps working.
 *
 * @param {object|null} marker
 * @return {object|null}
 */
function markerEntries(marker) {
  if (marker === null || marker === undefined) {
    return null
  }

  if (marker.targets !== undefined && marker.targets !== null) {
    return marker.targets
  }

  const flat = {
    conwayGeomSha: marker.conwayGeomSha ?? null,
    conwayCommit: marker.conwayCommit ?? null,
    sourceDirty: marker.sourceDirty ?? null,
    source: marker.source,
  }

  return Object.fromEntries(ALL_TARGETS.map((name) => [name, flat]))
}


/**
 * Decide the status from already-gathered facts.
 *
 * Kept pure and exported so the decision table is testable without a Dist, a
 * submodule or a build — `inspect()` below is the I/O half and does no
 * deciding of its own.
 *
 * The verdict is about `gatedTarget` ALONE. Other targets being stale is
 * reported in `warnings`, never as a failure: they cannot affect the consumer
 * this gate protects, and failing on them is what made the documented
 * `build-codex-MT` workflow unusable (conway#717 review round three).
 *
 * @param {{
 *   populated: number,
 *   mirrorsAgree: boolean|null,
 *   marker: object|null,
 *   expectedSha: string|null,
 *   expectedDirty: string|null,
 *   gatedTarget: string,
 * }} facts
 * @return {{status: string, message: string, remedy: string|null, warnings: string[]}}
 */
function classify({
  populated,
  mirrorsAgree,
  marker,
  expectedSha,
  expectedDirty = null,
  gatedTarget = GATED_TARGET,
}) {
  const REBUILD = `yarn wasm-prebuilt --force   (or rebuild: yarn build-codex-MT / yarn build-GHA-all)`

  if (populated === 0) {
    return {
      status: 'missing',
      message: `no ${SENTINEL} in either Dist location — the geometry wasm is not populated`,
      remedy: 'yarn wasm-prebuilt',
      warnings: [],
    }
  }

  // Mirror skew is decided BEFORE provenance, because when the two disagree
  // the marker can only describe one of them and a "fresh" verdict would be
  // read as covering both.
  if (mirrorsAgree === false) {
    return {
      status: 'skew',
      message: 'the two Dist mirrors hold DIFFERENT build bundles ' +
        `(${DIST_TARGETS.map((d) => path.relative(REPO_ROOT, d)).join(' vs ')}) — ` +
        'whichever one a given consumer resolves decides which engine it runs',
      remedy: REBUILD,
      warnings: [],
    }
  }

  const entries = markerEntries(marker)
  const gated = entries === null ? undefined : entries[gatedTarget]
  const status = evaluateTarget(gated, expectedSha, expectedDirty)

  // Siblings are advisory. Named individually so a release path can act on
  // them without re-deriving which one moved.
  const warnings = entries === null ? [] : ALL_TARGETS
      .filter((name) => name !== gatedTarget)
      .map((name) => [name, evaluateTarget(entries[name], expectedSha, expectedDirty)])
      .filter(([, s]) => s !== 'ok' && s !== 'unresolved')
      .map(([name, s]) => `${name} is ${s} — it does not gate jest or the debug ` +
        'probes, but a browser consumer would run it')

  const MESSAGES = {
    unstamped: {
      message: `${gatedTarget} carries no provenance, so nothing can say which ` +
        'conway-geom source it was built from',
      remedy: `yarn wasm-prebuilt --force, or \`yarn wasm-stamp --built ${gatedTarget}\` ` +
        'if you know this build matches the checked-out submodule',
    },
    unresolved: {
      message: `${gatedTarget}'s conway-geom SHA could not be resolved in this clone` +
        (gated?.conwayCommit ? ` (conway commit ${gated.conwayCommit} not present)` : ''),
      remedy: 'git fetch origin, then `yarn check-wasm-fresh` again',
    },
    stale: {
      message: `${gatedTarget} was built from conway-geom ` +
        `${String(gated?.conwayGeomSha).slice(0, 10)} but this checkout has ` +
        `${String(expectedSha).slice(0, 10)} — jest and the debug probes are ` +
        'running the OLD engine against the current source',
      remedy: REBUILD,
    },
    dirty: {
      message: 'conway-geom has uncommitted changes that postdate this build — ' +
        `${gatedTarget} predates your edits even though the submodule SHA still matches`,
      remedy: 'rebuild conway-geom (`yarn build-codex-MT` rebuilds just this target)',
    },
  }

  if (status === 'ok') {
    return {
      status: 'ok',
      message: `${gatedTarget} matches conway-geom ${String(expectedSha).slice(0, 10)} ` +
        `(${gated?.source ?? 'unknown source'})`,
      remedy: null,
      warnings,
    }
  }

  return {status, ...MESSAGES[status], warnings}
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
    bundleDigest(populatedDirs[0]) === bundleDigest(populatedDirs[1]) :
    null

  return classify({
    populated: populatedDirs.length,
    mirrorsAgree,
    marker: populatedDirs.length > 0 ? readMarker(populatedDirs[0]) : null,
    expectedSha: submoduleSha(),
    expectedDirty: submoduleDirtyDigest(),
    gatedTarget: GATED_TARGET,
  })
}


module.exports = {
  ALL_TARGETS,
  evaluateTarget,
  markerEntries,
  DIST_TARGETS,
  GATED_TARGET,
  bundleDigest,
  classify,
  submoduleDirtyDigest,
  MARKER_NAME,
  SENTINEL,
  inspect,
  readMarker,
  shaForPackageVersion,
  submoduleSha,
  writeMarker,
}
