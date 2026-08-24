/**
 * Does every TypeScript source tsc compiles have a compiled output?
 *
 * `yarn test` runs jest over `compiled/**\/*.test.js` and `yarn lint` runs
 * eslint over `src/`. Neither reads a `.ts` test, so a source file with no
 * output is simply absent from the run — and jest reports a PASS over the
 * suites that do exist, with no indication that it is a smaller set than
 * the tree contains. That is worst exactly where the gate matters most:
 * a merge that brings in new test files leaves them invisible until
 * someone rebuilds, so "precommit passed" is a statement about the
 * previous build. Observed on conway#566 — merging a PR that adds a
 * 443-line test file left precommit reporting an unchanged
 * 102 suites / 698 tests, against the true 103 / 701 after
 * `yarn build-incremental`.
 *
 * `yarn precommit` rebuilds before it tests, which is the actual fix: tsc
 * is the authority on whether an output's CONTENT is current, and this
 * cannot be. What this adds is that "the build ran" and "the outputs
 * exist" are not the same claim — `tsc --build` trusts
 * `tsconfig.tsbuildinfo`, and .github/workflows/build.yml already carries
 * a comment about a cached buildinfo that declared the tree up to date
 * while `compiled/dependencies/conway-geom/index.js` was missing. This
 * compares inputs to outputs directly and never consults the buildinfo,
 * so it still fires when the rebuild is skipped, and when the buildinfo
 * lies about an output that is MISSING.
 *
 * **What it does not catch — source-driven staleness only.** It answers
 * "does every source tsc compiles have an output", so it covers the
 * class the defect above came from: sources arriving or changing with no
 * output, and outputs that were deleted. It does not cover an output
 * whose CONTENT was changed out of band while its source is unchanged —
 * hand-edited while debugging, copied in from another tree, left
 * truncated by a killed build. `tsc --build` has nothing to rebuild in
 * that case (the buildinfo's per-file hash is over the SOURCE text; it
 * records no hash of the emitted `.js`), so the modified file survives
 * `yarn build-incremental` and an existence check passes over it.
 * Reproduced rather than reasoned about: a line appended to
 * `compiled/src/scripts/check_compiled_fresh.test.js` came back
 * byte-identical from a rebuild, and this check exited 0.
 *
 * That gap is left open deliberately, because both ways of closing it
 * cost more than it does:
 *
 * - **Hash-validate the outputs** — against what? The buildinfo stores
 *   source hashes, not output hashes, and it is the thing that lies. A
 *   manifest written by our own build gets refreshed from the modified
 *   file by the `yarn build-incremental` that `precommit` runs
 *   immediately before this check, so it would be validating against
 *   itself. Re-emitting and comparing is the next option, not a cheaper
 *   one.
 * - **Force a clean emit** — measured: `tsc --build --force` is 37.7s
 *   against 0.5s for the incremental `tsc --build` on an up-to-date
 *   tree, so ~+37s on every commit against a ~85s gate, to close a hole
 *   that needs someone to have modified a gitignored build output by
 *   hand. `compiled/` being untracked also keeps the two revert commands
 *   AGENTS.md warns about from producing this shape — neither has a
 *   `compiled/` blob to restore.
 *
 * So this stays a fast existence check, and a forced re-emit is the
 * manual reset for when you do suspect a modified tree:
 * `npx tsc --build --force && yarn build-incremental` (the second pass
 * re-runs `ts-add-js-extension` over the fresh emit).
 *
 * Do NOT reset by deleting the directory. `compiled/` also holds
 * artifacts tsc does not emit — `compiled/dependencies/conway-geom/Dist`
 * is the wasm glue, put there by `yarn wasm-prebuilt` or by a real
 * conway-geom build, and `yarn clean` is `rm -rf compiled` plus more.
 * Learned by doing it here: after `rm -rf compiled && yarn
 * build-incremental` this check passed, every source had an output, and
 * 37 suites still failed on `Cannot find module
 * '../Dist/ConwayGeomWasmNodeMT.js'`. Which is the same lesson from the
 * other side — a green existence check is a claim about tsc's outputs,
 * not about the tree jest runs against.
 *
 * **Existence rather than mtimes, for a separate reason.** `tsc --build`
 * does not rewrite an output (or `tsconfig.tsbuildinfo`) whose input's
 * content hash is unchanged, so a source merely touched by a checkout
 * stays permanently "older than its output" under an mtime comparison:
 * measured here, `yarn build-incremental` did not clear it, which would
 * leave the gate failing with no way to satisfy it. The reverse
 * direction does not work as a tamper signal either — the build's last
 * step (`ts-add-js-extension`) rewrites outputs after tsc writes the
 * buildinfo, leaving 2,314 of 2,635 emitted `.js` files legitimately
 * newer than it. An absent output has no such ambiguity.
 *
 * Usage:
 *   node scripts/check-compiled-fresh.cjs [--root <dir>]
 *
 * Exits 1 and names the offenders when any output is missing.
 */
const fs = require('fs')
const path = require('path')

/**
 * tsc's inputs, from tsconfig.json's `include`. A root that does not exist
 * (a fresh clone with the submodule uninitialised) is skipped rather than
 * reported — tsc would not be compiling it either.
 */
const INPUT_ROOTS = [
  { dir: 'src', recursive: true },
  { dir: 'dependencies/conway-geom', recursive: false },
  { dir: 'dependencies/conway-geom/interface', recursive: true },
  { dir: 'examples', recursive: true },
]

/** tsconfig.json's `exclude`, as root-relative path prefixes. */
const EXCLUDED_PREFIXES = [
  'external',
  'compiled',
  path.join('dependencies', 'conway-geom', 'compiled'),
]

/** Where tsc's `outDir` puts them. */
const OUT_DIR = 'compiled'

/**
 * Every `.ts` file tsc compiles under one root.
 *
 * `.d.ts` files are inputs that emit nothing, so they have no output to
 * look for and are skipped.
 *
 * @param {string} root Repo root to resolve against.
 * @param {string} relativeDir Directory to walk, relative to the root.
 * @param {boolean} recursive Whether to descend into subdirectories.
 * @param {string[]} into Accumulator of root-relative file paths.
 * @return {string[]} `into`.
 */
function collectSources(root, relativeDir, recursive, into) {

  let entries

  try {
    entries = fs.readdirSync(path.join(root, relativeDir), { withFileTypes: true })
  } catch {
    return into
  }

  for (const entry of entries) {

    const relativePath = path.join(relativeDir, entry.name)

    if (EXCLUDED_PREFIXES.some((prefix) =>
      relativePath === prefix || relativePath.startsWith(`${prefix}${path.sep}`))) {
      continue
    }

    // statSync rather than entry.isDirectory(): a worktree commonly
    // symlinks a submodule or a shared build output into place, and
    // readdir reports those as links rather than as what they point at.
    let stats

    try {
      stats = fs.statSync(path.join(root, relativePath))
    } catch {
      continue
    }

    if (stats.isDirectory()) {

      if (recursive) {
        collectSources(root, relativePath, true, into)
      }

      continue
    }

    if (relativePath.endsWith('.d.ts') || !relativePath.endsWith('.ts')) {
      continue
    }

    into.push(relativePath)
  }

  return into
}

/**
 * The output path tsc emits for one input.
 *
 * tsconfig sets `outDir` and leaves `rootDir` inferred; the inputs span
 * `src/`, `examples/` and `dependencies/`, so the inferred root is the repo
 * root and the tree is mirrored verbatim under `compiled/`.
 *
 * @param {string} relativeSource Root-relative `.ts` path.
 * @return {string} Root-relative `.js` path.
 */
function outputPathFor(relativeSource) {

  return path.join(OUT_DIR, `${relativeSource.slice(0, -'.ts'.length)}.js`)
}

/**
 * Sources tsc would compile that have no output under `compiled/`.
 *
 * @param {string} root Repo root. Defaults to the process cwd.
 * @return {string[]} Root-relative source paths, sorted.
 */
function sourcesWithoutOutput(root = process.cwd()) {

  const sources = []

  for (const { dir, recursive } of INPUT_ROOTS) {
    collectSources(root, dir, recursive, sources)
  }

  const missing = sources.filter(
      (relativeSource) => !fs.existsSync(path.join(root, outputPathFor(relativeSource))))

  missing.sort()

  return missing
}

/** How many offenders to name before summarising the rest. */
const LISTED = 10

/**
 * Render the failure for a human, or an empty string when nothing is missing.
 *
 * @param {string[]} missing What sourcesWithoutOutput found.
 * @return {string} The message, or '' when there is nothing to report.
 */
function describeMissing(missing) {

  if (missing.length === 0) {
    return ''
  }

  const lines = [
    `compiled/ is stale: ${missing.length} source file(s) have no compiled output.`,
    'jest runs over compiled/, so those files are not in this run at all —',
    'a pass here would be reporting the previous build\'s tests.',
    '',
  ]

  for (const file of missing.slice(0, LISTED)) {
    lines.push(`  ${file}`)
  }

  if (missing.length > LISTED) {
    lines.push(`  ... and ${missing.length - LISTED} more`)
  }

  lines.push('', 'Run `yarn build-incremental` and try again.')

  return lines.join('\n')
}

module.exports = {
  INPUT_ROOTS,
  OUT_DIR,
  describeMissing,
  outputPathFor,
  sourcesWithoutOutput,
}

if (require.main === module) {

  const argv = process.argv.slice(2)
  const rootFlag = argv.indexOf('--root')
  const root = rootFlag >= 0 ? argv[rootFlag + 1] : process.cwd()

  const message = describeMissing(sourcesWithoutOutput(root))

  if (message !== '') {
    console.error(message)
    process.exit(1)
  }
}
