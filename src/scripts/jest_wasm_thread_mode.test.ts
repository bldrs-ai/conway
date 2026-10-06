import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import { ConwayGeometry, wasmType } from '../../dependencies/conway-geom'

/**
 * Which conway-geom wasm build runs where (bldrs-ai/conway#724, #726).
 *
 * Jest runs the suite on the SINGLE-THREAD build, set by the setupFile
 * jest.single-thread.setup.js, because the MT build spawns a pthread pool per
 * `initialize()` that is never terminated and the full suite then outgrows
 * the machine. That trades away unit coverage of the MT build, so this file
 * does three things to keep the trade honest:
 *
 *   1. Proves the setting took effect in Jest (a flag nobody reads is the
 *      failure that would hide a regression of the mitigation).
 *   2. Keeps one explicit MT initialisation in the suite, in a child process
 *      so its pool dies with it.
 *   3. Pins that no benchmark or regression path inherits the flag: they all
 *      run outside Jest, and the MT numbers they report are what perf work
 *      compares across releases.
 *
 * Paths resolve from this file (compiled/src/scripts) and from the repo root,
 * which is Jest's rootDir and cwd.
 */
const repoRoot = process.cwd()
const compiledGeomIndex =
  fileURLToPath(new URL('../../dependencies/conway-geom/index.js', import.meta.url))


describe('Jest runs on the single-thread wasm', () => {

  beforeAll(async () => {
    expect(await new ConwayGeometry().initialize()).toBe(true)
  })

  test('the setupFile set the flag in the test context', () => {
    expect(process.env.FORCE_SINGLE_THREAD).toBe('true')
  })

  test('initialize() loaded ConwayGeomWasmNode, not NodeMT', () => {
    // `wasmType` is the live binding loadWasmModule() assigns, so this is the
    // module that was actually instantiated, not just what the env says.
    expect(wasmType).toBe('Node')
  })
})


describe('the multi-threaded build still initialises', () => {

  // A child process, with the flag removed from its environment, so this
  // loads exactly what the CLI, the regression runs and the benchmarks load.
  // The child exits explicitly: the pool is never torn down (#726), so
  // process exit is what reclaims it.
  //
  // The script goes in a file, not `node --input-type=module -e`: the pthread
  // workers Emscripten spawns inherit the parent's execArgv, and a worker
  // cannot take --input-type ("only with string input via --eval").
  const childScript = `
    const m = await import(${JSON.stringify(compiledGeomIndex)})
    const ok = await new m.ConwayGeometry().initialize()
    console.log(JSON.stringify({
      ok,
      wasmType: m.wasmType,
      flag: process.env.FORCE_SINGLE_THREAD ?? null,
    }))
    process.exit(0)
  `
  let workDir: string

  beforeAll(() => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wasm-thread-mode-'))
  })

  afterAll(() => {
    fs.rmSync(workDir, { recursive: true, force: true })
  })

  test('a process without the flag gets ConwayGeomWasmNodeMT', () => {
    const env = { ...process.env }
    delete env.FORCE_SINGLE_THREAD

    const script = path.join(workDir, 'init_mt.mjs')
    fs.writeFileSync(script, childScript)

    const out = execFileSync(process.execPath, [script], { env, encoding: 'utf8', timeout: 25000 })
    const report = JSON.parse(out.trim().split('\n').pop() as string)

    expect(report).toEqual({ ok: true, wasmType: 'NodeMT', flag: null })
  })
})


describe('benchmark and regression paths are not forced single-thread', () => {

  /** Non-comment lines of a file that mention the flag. */
  function flagLines(file: string, commentPrefix: string): string[] {
    return fs.readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => !line.trim().startsWith(commentPrefix))
        .filter((line) => line.includes('FORCE_SINGLE_THREAD'))
  }

  test('no CI workflow sets the flag', () => {
    // perf-three-public/-private, perf-baseline-oneoff, rc-regression
    // (perf_ab, the serial --perf pass), the regression and visual-diff jobs
    // and the Tier A goldens all live in these files and all run on NodeMT.
    // Setting it anywhere here would silently move those onto the
    // single-thread build and make every recorded timing incomparable.
    const dir = path.join(repoRoot, '.github/workflows')
    const files = fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))

    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      expect({ file, lines: flagLines(path.join(dir, file), '#') })
          .toEqual({ file, lines: [] })
    }
  })

  test('the benchmark drivers do not set the flag', () => {
    for (const script of ['scripts/benchmark.cjs', 'scripts/perf_ab_compare.cjs']) {
      const file = path.join(repoRoot, script)

      expect(fs.existsSync(file)).toBe(true)
      expect({ script, lines: flagLines(file, '//') }).toEqual({ script, lines: [] })
    }
  })

  test('no perf or benchmark package script sets the flag, and neither does `test`', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
    const scripts = pkg.scripts as Record<string, string>

    // `cli-profile` is deliberately single-thread (it feeds `node --prof`
    // flamegraphs); it is a profiler, not a benchmark, and stays out of this
    // pattern. `test` is here because setting the flag there would apply to
    // child processes and nested yarn runs; it belongs in the setupFile.
    const guarded = Object.keys(scripts).filter((name) => /perf|bench/i.test(name) || name === 'test')

    expect(guarded).toContain('test')
    for (const name of guarded) {
      expect({ name, uses: scripts[name].includes('FORCE_SINGLE_THREAD') })
          .toEqual({ name, uses: false })
    }
  })
})
