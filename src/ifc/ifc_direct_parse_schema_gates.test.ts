import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { describe, expect, test, beforeAll } from '@jest/globals'

/**
 * Subprocess smoke tests for the four direct-parse entry points gated in
 * bldrs-ai/conway#713 (P1, round 5): `ifc_command_line_main.ts` (shipped
 * `bin.cli`), `ifc_regression_main.ts` (spawned as a child process by
 * `ifc_regression_batch_main.ts`), and `examples/browser.ts` /
 * `examples/validator.ts` (shipped `bin.browser` / `bin.validator`). Each
 * parses IFC directly via `IfcStepParser`, bypassing the gated
 * streaming-open surface, so each carries its own
 * `selectIfcSchemaKindForHeader(...) === 'ifc4x3'` check.
 *
 * Five review rounds on #713 each found a gate that existed in source but
 * did not actually fire where it was claimed to — wiring bugs a unit test
 * of `selectIfcSchemaKindForHeader` itself cannot see, because nothing
 * exercises these `main()`-style entry files. These tests do: they spawn
 * the real built artifact, the way it is really invoked, and check the
 * process outcome (exit code, stdout/stderr), not an internal function
 * result.
 *
 * Verified as a discriminating test (not just a green check): the CLI's
 * and the browser's gates were each temporarily commented out and the
 * build rebuilt; both times the corresponding test here failed (exit 0,
 * no "IFC4X3" in the output) before the gate was restored. See the PR
 * description / commit message for the exact pre-fix exit codes.
 *
 * Discriminating in a second way, independent of the gate under test: a
 * binary that refuses every input would pass a "4X3 fails" assertion
 * trivially, so every case below also runs the SAME artifact against
 * `data/index.ifc` (ordinary IFC4) and requires it to *succeed*. All
 * fixtures are repo-local (`data/`).
 */

const REPO_ROOT = process.cwd()
// INELIGIBLE for the IFC4-compatible IFC4X3 route (bldrs-ai/conway#280):
// the #713 road fixture plus an IFC4X3-only IFCALIGNMENT record. The plain
// road fixture is eligible now and loads, which the regression-child case
// below checks as a positive control.
const IFC4X3_FIXTURE = path.resolve(REPO_ROOT, 'data/ifc4x3_road_entities_ineligible.ifc')
const IFC4X3_ELIGIBLE_FIXTURE = path.resolve(REPO_ROOT, 'data/ifc4x3_road_geometry.ifc')
const IFC4_FIXTURE = path.resolve(REPO_ROOT, 'data/index.ifc')

const SUBPROCESS_TIMEOUT_MS = 60000

/**
 * A FILE_SCHEMA identifier belonging to the IFC4X3 family that
 * `IFC4X3_IDENTIFIERS` (ifc_schema_selection.ts) does NOT recognise.
 * `selectIfcSchemaKind` THROWS `UnrecognizedIfc4x3SchemaError` for this case
 * rather than returning a kind -- a different code path from the plain
 * `IFC4X3_RC2` refusal above, and one that reaches each entry point's outer
 * catch instead of its explicit `exit(1)` gate. Generated from the ordinary
 * 4X3 fixture rather than committed as a second near-duplicate file.
 */
const UNRECOGNIZED_4X3_SCHEMA = 'IFC4X3_TC1'

/**
 * Runs a node script and returns its outcome without throwing on a
 * non-zero exit — `execFileSync` normally throws in that case, which would
 * make the exit code itself invisible to the assertions below.
 *
 * @param scriptPath Absolute path to the compiled `.js`/`.cjs` entry file.
 * @param args Positional/flag arguments to pass on argv.
 * @param stdin Data to write to the child's stdin, then close it. `examples/
 *   browser.ts` drops into an interactive `readline` prompt on a
 *   successful load; closing stdin immediately lets the process exit
 *   instead of hanging the test.
 * @return exit code (0 when the process was not killed by a signal and
 *   set no other code) and captured stdout/stderr.
 */
function runNode(
    scriptPath: string, args: string[], stdin = ''):
    { code: number, stdout: string, stderr: string } {
  try {
    const stdout = execFileSync('node', [scriptPath, ...args], {
      cwd: REPO_ROOT,
      input: stdin,
      timeout: SUBPROCESS_TIMEOUT_MS,
      encoding: 'utf8',
    })
    return { code: 0, stdout, stderr: '' }
  } catch (err) {
    const asExecError = err as {
      status?: number | null
      stdout?: string
      stderr?: string
      signal?: string | null
    }

    if (asExecError.status === undefined || asExecError.status === null) {
      // Killed by a signal (e.g. the timeout) rather than exiting normally —
      // this is an infrastructure failure of the test itself, not a
      // "refused" outcome, so fail loudly with what we captured rather
      // than reporting a fake exit code.
      throw new Error(
          `${scriptPath} did not exit normally ` +
          `(signal=${String(asExecError.signal)}): ` +
          `stdout=${String(asExecError.stdout)} stderr=${String(asExecError.stderr)}`)
    }

    return {
      code: asExecError.status,
      stdout: String(asExecError.stdout ?? ''),
      stderr: String(asExecError.stderr ?? ''),
    }
  }
}

/**
 * Bundles one example/CLI entry the same way `bundle-examples` does
 * (matching `package.json`'s own `bundle-cli` / `bundle-browser` /
 * `bundle-validator` scripts, which is in turn what `bin.cli` /
 * `bin.browser` / `bin.validator` point at), and returns the produced
 * path, or `undefined` when bundling could not be done here.
 *
 * Bundling `browser.js` and `validator.js` pulls in
 * `conway_geometry.js`'s dynamic imports of the WEB wasm build
 * (`ConwayGeomWasmWeb(MT).js`) even though these binaries only run in
 * Node — esbuild resolves both branches of the runtime `import()`
 * regardless of which one node will take. Those Dist files only exist
 * after building ALL FOUR wasm targets (`yarn build-GHA-all` /
 * `yarn build`), not after `yarn build-incremental` or the Node-only
 * `yarn build-codex-MT` this repo's own dev-loop docs point agents at. CI's
 * `build` job (`.github/workflows/build.yml`) does run `build-GHA-all`
 * before its Test step, so bundling should succeed there; it does not in a
 * Node-MT-only sandbox. Bundling `cli.js` is unaffected by this — the CLI
 * only imports `ConwayGeometry` the module re-exports, and that resolves
 * fine — but is included here on the same path for symmetry and because a
 * future refactor could add the same web-only import to the CLI too.
 *
 * @param entryJs Compiled entry file to bundle (already produced by
 *   `yarn build-incremental`).
 * @param outCjs Destination path for the bundled artifact.
 * @return the bundled path on success, `undefined` on failure (logged).
 */
function tryBundle(entryJs: string, outCjs: string): string | undefined {
  try {
    execFileSync(
        path.resolve(REPO_ROOT, 'node_modules/.bin/esbuild'),
        [
          '--bundle', '--format=cjs', '--platform=node',
          '--banner:js=#!/usr/bin/env node',
          entryJs, `--outfile=${outCjs}`,
        ],
        { cwd: REPO_ROOT, timeout: SUBPROCESS_TIMEOUT_MS, stdio: 'pipe' },
    )
    return outCjs
  } catch (err) {
    console.warn(
        `[ifc_direct_parse_schema_gates] could not bundle ${entryJs} ` +
        `(falling back to the unbundled compiled entry point — see the ` +
        `tryBundle() doc comment for why this is expected outside CI's ` +
        `full multi-target wasm build): ${(err as Error).message}`)
    return undefined
  }
}

/** Compiled (unbundled) entry points; guaranteed to exist after `yarn build-incremental`. */
const COMPILED_CLI = path.resolve(REPO_ROOT, 'compiled/src/ifc/ifc_command_line_main.js')
const COMPILED_REGRESSION = path.resolve(REPO_ROOT, 'compiled/src/ifc/ifc_regression_main.js')
const COMPILED_BROWSER = path.resolve(REPO_ROOT, 'compiled/examples/browser.js')
const COMPILED_VALIDATOR = path.resolve(REPO_ROOT, 'compiled/examples/validator.js')

for (const required of [
  COMPILED_CLI, COMPILED_REGRESSION, COMPILED_BROWSER, COMPILED_VALIDATOR,
]) {
  if (!fs.existsSync(required)) {
    // Loud, not a skip: a missing compiled entry point means the tree this
    // suite is running against was never built with `yarn build-incremental`
    // (or examples/ was dropped from tsconfig's `include`), and every
    // assertion below would otherwise report a false "refused".
    throw new Error(
        `${required} is missing. This suite requires ` +
        `\`yarn build-incremental\` to have run first (see AGENTS.md — ` +
        `Jest runs compiled/, not source).`)
  }
}

/**
 * `bin.cli` in package.json points at the bundled artifact; bundle it here
 * (falling back to the unbundled compiled entry — see `tryBundle`'s doc
 * comment) rather than assuming either is already present.
 */
let cliArtifact: string
let browserArtifact: string
let validatorArtifact: string
let unrecognized4x3Fixture: string

beforeAll(() => {
  // Rewrite FILE_SCHEMA on the existing 4X3 fixture rather than committing a
  // second near-duplicate .ifc: the throwing path only depends on the
  // header, not on which 4X3 entities follow it.
  const ifc4x3Source = fs.readFileSync(IFC4X3_FIXTURE, 'utf8')
  const rewritten = ifc4x3Source.replace(
      /FILE_SCHEMA\(\('IFC4X3_RC2'\)\);/,
      `FILE_SCHEMA(('${UNRECOGNIZED_4X3_SCHEMA}'));`)

  if (rewritten === ifc4x3Source) {
    // Loud, not silent: a fixture format change upstream would otherwise
    // leave this suite exercising the ORIGINAL (recognised) schema under a
    // test that claims to cover the unrecognised one.
    throw new Error(
        `Could not rewrite FILE_SCHEMA in ${IFC4X3_FIXTURE} -- expected ` +
        `literal FILE_SCHEMA(('IFC4X3_RC2'));`)
  }

  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conway-unrecognized-4x3-'))
  unrecognized4x3Fixture = path.join(fixtureDir, 'unrecognized_4x3.ifc')
  fs.writeFileSync(unrecognized4x3Fixture, rewritten)
  // Bundled INTO `compiled/examples/`, exactly where `package.json`'s
  // bundle-cli/bundle-browser/bundle-validator scripts put these artifacts
  // and where `bin.*` points -- NOT into a temp directory. A bundle carries
  // a runtime-relative path to the wasm (`../Dist/ConwayGeomWasmNodeMT.js`,
  // resolved against the bundle's own location), so a bundle written
  // anywhere else dies in wasm init before reaching any of the code under
  // test. That failure is silent here in the worst way: these binaries
  // print "An error occurred: ..." and still exit 0, so a temp-dir bundle
  // made the CLI test fail with "Expected: not 0" for a reason that had
  // nothing to do with the schema gate it exists to check.
  const bundleDir = path.resolve(REPO_ROOT, 'compiled/examples')

  fs.mkdirSync(bundleDir, { recursive: true })

  // `bundle-examples` does not stop at esbuild: it finishes with
  // `rm -rf compiled/Dist && cp -r dependencies/conway-geom/Dist compiled/`.
  // That copy is load-bearing, because a bundle resolves its wasm as
  // `../Dist/...` relative to itself -- from `compiled/examples/` that is
  // `compiled/Dist/`, NOT the `compiled/dependencies/conway-geom/Dist/`
  // that tsc produces. Bundling without it yields a binary that dies in
  // wasm init, and since these binaries exit 0 on a fatal error, it dies
  // in a way that makes the IFC4 control pass vacuously.
  const wasmSource = path.resolve(REPO_ROOT, 'compiled/dependencies/conway-geom/Dist')
  const wasmTarget = path.resolve(REPO_ROOT, 'compiled/Dist')

  if (fs.existsSync(wasmSource)) {
    fs.cpSync(wasmSource, wasmTarget, { recursive: true })
  }

  cliArtifact =
    tryBundle(COMPILED_CLI, path.join(bundleDir, 'cli-bundled.cjs')) ?? COMPILED_CLI
  browserArtifact =
    tryBundle(COMPILED_BROWSER, path.join(bundleDir, 'browser-bundled.cjs')) ?? COMPILED_BROWSER
  validatorArtifact =
    tryBundle(COMPILED_VALIDATOR, path.join(bundleDir, 'validator-bundled.cjs')) ??
    COMPILED_VALIDATOR

  console.log(
      '[ifc_direct_parse_schema_gates] artifacts under test:\n' +
      `  cli:        ${cliArtifact}\n` +
      `  regression: ${COMPILED_REGRESSION}\n` +
      `  browser:    ${browserArtifact}\n` +
      `  validator:  ${validatorArtifact}`)
}, SUBPROCESS_TIMEOUT_MS * 3)

describe('direct-parse entry points fail closed on IFC4X3', () => {

  test('CLI (bin.cli): refuses IFC4X3, names the schema, and still ' +
    'loads ordinary IFC4', () => {
    const refused = runNode(cliArtifact, [IFC4X3_FIXTURE, '-n'])
    expect(refused.code).not.toBe(0)
    expect(refused.stdout + refused.stderr).toMatch(/IFC4X3/)

    const control = runNode(cliArtifact, [IFC4_FIXTURE, '-n'])
    expect(control.code).toBe(0)
  }, SUBPROCESS_TIMEOUT_MS)

  test('regression child (spawned by ifc_regression_batch_main.ts): ' +
    'refuses IFC4X3 with a non-zero exit, and still succeeds on ordinary ' +
    'IFC4', () => {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conway-regression-'))

    // Matches the real invocation shape in ifc_regression_batch_main.ts'
    // runForFile(): `-d <file> <output>` (digest mode, positional
    // file/output — the batch runner is the whole reason this entry point
    // has no bundled artifact or package.json bin: it is dev/CI-only).
    const refused = runNode(
        COMPILED_REGRESSION, ['-d', IFC4X3_FIXTURE, path.join(workDir, 'refused-out')])
    expect(refused.code).not.toBe(0)
    expect(refused.stdout + refused.stderr).toMatch(/IFC4X3/)

    const control = runNode(
        COMPILED_REGRESSION, ['-d', IFC4_FIXTURE, path.join(workDir, 'control-out')])
    expect(control.code).toBe(0)

    // An ELIGIBLE 4X3 file loads and digests its geometry: the refusal
    // above is about eligibility, not about the schema name.
    const eligible = runNode(
        COMPILED_REGRESSION, ['-d', IFC4X3_ELIGIBLE_FIXTURE, path.join(workDir, 'eligible-out')])
    expect(eligible.code).toBe(0)
    expect(fs.readFileSync(path.join(workDir, 'eligible-out.csv'), 'utf8'))
        .toMatch(/IFCFACETEDBREP/)
  }, SUBPROCESS_TIMEOUT_MS)

  test('browser (bin.browser): refuses IFC4X3, names the schema, and ' +
    'still loads ordinary IFC4', () => {
    const refused = runNode(browserArtifact, [IFC4X3_FIXTURE])
    expect(refused.code).not.toBe(0)
    expect(refused.stdout + refused.stderr).toMatch(/IFC4X3/)

    // Closing stdin immediately lets the interactive readline prompt (only
    // reached on a successful load) exit instead of hanging the test.
    const control = runNode(browserArtifact, [IFC4_FIXTURE], '')
    expect(control.code).toBe(0)
  }, SUBPROCESS_TIMEOUT_MS)

  test('validator (bin.validator): refuses IFC4X3, names the schema, and ' +
    'still queries ordinary IFC4', () => {
    const refused = runNode(validatorArtifact, [IFC4X3_FIXTURE, 'IFCSITE'])
    expect(refused.code).not.toBe(0)
    expect(refused.stdout + refused.stderr).toMatch(/IFC4X3/)

    const control = runNode(validatorArtifact, [IFC4_FIXTURE, 'IFCSITE'])
    expect(control.code).toBe(0)
  }, SUBPROCESS_TIMEOUT_MS)
})

describe('direct-parse entry points fail closed on an unrecognized 4X3-family ' +
  'schema (e.g. IFC4X3_TC1)', () => {

  // `selectIfcSchemaKindForHeader` THROWS `UnrecognizedIfc4x3SchemaError` for
  // this case rather than returning 'ifc4x3', so it never reaches the
  // entry points' explicit `exit(1)` gates covered above -- it surfaces
  // through whatever each entry point does with an uncaught error instead.
  // Two of the four (ifc_command_line_main.ts, ifc_regression_main.ts) wrap
  // their whole body in a top-level `try { doWork() } catch (error) {
  // console.error(...) }` with no exit-code side effect of its own, so
  // without `process.exitCode = 1` in that catch this case exited 0 despite
  // printing the exception -- the same defect class as the bare `exit()`
  // calls fixed in e5696915, one layer further out (codex review of
  // bldrs-ai/conway#713, P1). The other two (examples/browser.ts,
  // examples/validator.ts) call `selectIfcSchemaKindForHeader` at top level
  // with no enclosing catch, so the throw was already an uncaught exception
  // -- Node exits non-zero for that on its own, verified separately (not
  // asserted here as a defect fixed by this PR, since there was none to
  // fix on those two paths).

  test('CLI (bin.cli): refuses an unrecognized 4X3-family schema', () => {
    const refused = runNode(cliArtifact, [unrecognized4x3Fixture, '-n'])
    expect(refused.code).not.toBe(0)
    expect(refused.stdout + refused.stderr).toMatch(/IFC4X3/)
  }, SUBPROCESS_TIMEOUT_MS)

  test('regression child: refuses an unrecognized 4X3-family schema with a ' +
    'non-zero exit', () => {
    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'conway-regression-tc1-'))

    const refused = runNode(
        COMPILED_REGRESSION,
        ['-d', unrecognized4x3Fixture, path.join(workDir, 'refused-out')])
    expect(refused.code).not.toBe(0)
    expect(refused.stdout + refused.stderr).toMatch(/IFC4X3/)
  }, SUBPROCESS_TIMEOUT_MS)

  test('browser (bin.browser): refuses an unrecognized 4X3-family schema', () => {
    const refused = runNode(browserArtifact, [unrecognized4x3Fixture])
    expect(refused.code).not.toBe(0)
    expect(refused.stdout + refused.stderr).toMatch(/IFC4X3/)
  }, SUBPROCESS_TIMEOUT_MS)

  test('validator (bin.validator): refuses an unrecognized 4X3-family schema', () => {
    const refused = runNode(validatorArtifact, [unrecognized4x3Fixture, 'IFCSITE'])
    expect(refused.code).not.toBe(0)
    expect(refused.stdout + refused.stderr).toMatch(/IFC4X3/)
  }, SUBPROCESS_TIMEOUT_MS)
})
