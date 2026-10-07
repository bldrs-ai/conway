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
 * WHAT THIS CHECKS, AND WHAT IT DELIBERATELY DOES NOT
 * ----------------------------------------------------
 * ONE hard failure: the marker names a different conway-geom SHA than this
 * checkout has. That is the incident described above and the only condition
 * this module is willing to block on.
 *
 * Everything else is ADVISORY - printed, never fatal. That is a deliberate
 * retreat. Four review rounds on conway#717 each added a term to a model of
 * "what the build depends on" (untracked file contents, nested submodules,
 * runtime variant selection, legacy marker formats) and each time the next
 * round found another; twice a fix rejected a CORRECTLY rebuilt tree, which
 * is the failure that teaches people to bypass a check. A gate that is
 * approximately sound and occasionally wrong about correct work is worth
 * less than a narrow one that is right.
 *
 * Known and uncovered, by choice:
 *   - a DIRTY submodule is reported, not blocked, and its digest does not
 *     descend into conway-geom's own submodules (glm, tinynurbs, ...);
 *   - the gated artifact is the one the DEFAULT loader path uses; overrides
 *     such as FORCE_SINGLE_THREAD or PLATFORM=web select a different
 *     variant, and this does not follow them;
 *   - a build that dies halfway with a zero exit still stamps;
 *   - mirror drift between the two Dist copies is not checked at all - the
 *     comparison produced two false positives and no true ones.
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
 * The variant Jest loads. jest.single-thread.setup.js forces
 * FORCE_SINGLE_THREAD, which makes loadWasmModule() pick
 * `ConwayGeomWasmNode.js` instead of `ConwayGeomWasmNodeMT.js` (conway#724).
 * It is checked alongside `GATED_TARGET` rather than instead of it: the debug
 * probes, the CLI and the regression runs still load NodeMT. Without this a
 * native change rebuilt through a NodeMT-only entry point (`build-codex-MT`)
 * is stamped and passes the gate while the whole Jest suite keeps running the
 * previous single-thread engine.
 */
const JEST_TARGET = 'ConwayGeomWasmNode'

/** Every artifact a consumer in this repo loads by default; see `classifyAll`. */
const LOADED_TARGETS = [GATED_TARGET, JEST_TARGET]

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

// A Dist is "populated" when it holds ANY artifact a consumer loads by default
// (`LOADED_TARGETS`). NodeMT alone is not the test: the existing `build-node` /
// `build-single-thread` entry points `clean` first and restore only the
// single-thread Node artifact, and a NodeMT-only sentinel read that tree as
// `missing` (nonfatal) before the Node marker was ever examined, so a stale
// Node that Jest was running passed the gate (codex review, conway#727).
const SENTINEL = LOADED_TARGETS.map((name) => `${name}.js`).join(' or ')


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
 *   marker: object|null,
 *   expectedSha: string|null,
 *   expectedDirty: string|null,
 *   gatedTarget: string,
 * }} facts
 * Only `stale` is fatal. See the header for why everything else is advisory.
 *
 * @return {{status: string, fatal: boolean, message: string, remedy: string|null,
 *   warnings: string[]}}
 */
function classify({
  populated,
  marker,
  expectedSha,
  expectedDirty = null,
  gatedTarget = GATED_TARGET,
}) {
  const REBUILD = `yarn wasm-prebuilt --force   (or rebuild: yarn build-codex-node / yarn build-GHA-all)`

  if (populated === 0) {
    return {
      status: 'missing',
      fatal: false,
      message: `no ${SENTINEL} in either Dist location — the geometry wasm is not populated`,
      remedy: 'yarn wasm-prebuilt',
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
      .map(([name, s]) => `${name} is ${s} — not what jest or the debug probes ` +
        'load, so it is reported rather than blocking')

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
      remedy: 'rebuild conway-geom (`yarn build-codex-node` rebuilds the Node and NodeMT variants)',
    },
  }

  if (status === 'ok') {
    return {
      status: 'ok',
      fatal: false,
      message: `${gatedTarget} matches conway-geom ${String(expectedSha).slice(0, 10)} ` +
        `(${gated?.source ?? 'unknown source'})`,
      remedy: null,
      warnings,
    }
  }

  return {status, fatal: status === 'stale', ...MESSAGES[status], warnings}
}

/**
 * Order in which verdicts are reported when several gated targets disagree:
 * the coarser problem first, `stale` (the only fatal one) outranking all.
 */
const SEVERITY = ['stale', 'dirty', 'unresolved', 'unstamped', 'ok']

/**
 * `classify` for every artifact this repo loads by default (`LOADED_TARGETS`),
 * reporting the worst verdict. Each target is still judged on its own marker
 * entry, so a partial build that stamped only one of them is not blessed for
 * the other. The other (Web*) targets stay advisory, as in `classify`.
 *
 * Only the targets in `present` are judged (default: all of `LOADED_TARGETS`).
 * A target whose artifact is not on disk cannot be what anything is running,
 * so a leftover marker entry for it must not decide the verdict; but a
 * target that IS present is judged on its own marker even when its sibling is
 * absent. `missing` is therefore "neither is present", not "NodeMT is absent".
 *
 * @param {object} facts same shape as `classify`, minus `gatedTarget`, plus
 *   optional `present: string[]` naming the LOADED_TARGETS found on disk
 * @return {{status: string, fatal: boolean, message: string, remedy: string|null,
 *   warnings: string[]}}
 */
function classifyAll(facts) {
  const {present = LOADED_TARGETS} = facts
  const targets = LOADED_TARGETS.filter((target) => present.includes(target))

  if (targets.length === 0) {
    return classify({...facts, populated: 0})
  }

  const verdicts = targets.map((target) => ({
    target,
    verdict: classify({...facts, gatedTarget: target}),
  }))

  // `missing` (nothing populated) is target-independent and always first.
  const missing = verdicts.find(({verdict}) => verdict.status === 'missing')
  if (missing) {
    return missing.verdict
  }

  const worst = [...verdicts].sort((a, b) =>
    SEVERITY.indexOf(a.verdict.status) - SEVERITY.indexOf(b.verdict.status))[0]

  // A gated target's own warnings list the OTHER gated target as an advisory
  // sibling; drop that, since here it is judged, not merely reported.
  const warnings = [...new Set(verdicts.flatMap(({verdict}) => verdict.warnings))]
      .filter((w) => !LOADED_TARGETS.some((t) => w.startsWith(`${t} is `)))

  if (worst.verdict.status === 'ok') {
    // Say so when both were checked, so a green line is not read as NodeMT only.
    const message = worst.verdict.message.replace(
        `${worst.target} matches`,
        targets.length > 1 ? `${targets.join(' and ')} match` : `${worst.target} matches`)
    return {...worst.verdict, message, warnings}
  }

  return {...worst.verdict, warnings}
}


/**
 * Which Dist directories and which `LOADED_TARGETS` are on disk. Population is
 * judged per target, never off NodeMT alone (see `SENTINEL`). The existence
 * test is injected so this is checkable without a real Dist.
 *
 * @param {function(string, string): boolean} exists whether `<dir>/<target>.js` exists
 * @return {{populatedDirs: string[], present: string[]}}
 */
function loadedArtifacts(exists) {
  return {
    populatedDirs: DIST_TARGETS.filter((d) => LOADED_TARGETS.some((t) => exists(d, t))),
    present: LOADED_TARGETS.filter((t) => DIST_TARGETS.some((d) => exists(d, t))),
  }
}


/**
 * Gather the facts from disk and git, then `classify` them.
 *
 * @return {{status: WasmStatus, message: string, remedy: string|null}}
 */
function inspect() {
  const {populatedDirs, present} = loadedArtifacts((dir, target) =>
    fs.existsSync(path.join(dir, `${target}.js`)))

  return classifyAll({
    populated: populatedDirs.length,
    present,
    marker: populatedDirs.length > 0 ? readMarker(populatedDirs[0]) : null,
    expectedSha: submoduleSha(),
    expectedDirty: submoduleDirtyDigest(),
  })
}


module.exports = {
  ALL_TARGETS,
  evaluateTarget,
  markerEntries,
  DIST_TARGETS,
  GATED_TARGET,
  JEST_TARGET,
  LOADED_TARGETS,
  classify,
  classifyAll,
  submoduleDirtyDigest,
  MARKER_NAME,
  SENTINEL,
  inspect,
  loadedArtifacts,
  readMarker,
  shaForPackageVersion,
  submoduleSha,
  writeMarker,
}
