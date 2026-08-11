import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'
import { createRequire } from 'module'

/* eslint-disable @typescript-eslint/no-explicit-any -- render_glb.cjs is an
   untyped CommonJS CLI script, loaded here through createRequire. */

/**
 * Path resolution in scripts/render_glb.cjs (conway#457).
 *
 * The script accepts a comma-joined chunk list, and used to split on comma
 * unconditionally — which tore a real path containing a comma into fragments
 * and reported the first fragment as missing. Several models we ship are
 * named that way, and `-g` keeps the source basename, so following
 * scripts/debug/README.md on one of them failed.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root rather than relative to this file: the test
// runs from compiled/src/scripts, where a relative hop would land in
// compiled/scripts, which does not exist (scripts/ is not part of the tsc
// build). Jest's rootDir is the repo root.
const { resolveGlbPaths } =
  require_(path.resolve(process.cwd(), 'scripts/render_glb.cjs')) as
    { resolveGlbPaths: (spec: string) => string[] }

let workDir: string

/** A name in the shape that broke: a comma inside a single real filename. */
const COMMA_NAME = 'Wiesenplatz 7, 4057 Basel_test0.glb'

beforeAll(() => {

  workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'render-glb-paths-'))

  fs.writeFileSync(path.join(workDir, COMMA_NAME), 'not-a-real-glb')
  fs.writeFileSync(path.join(workDir, 'chunk0.glb'), 'not-a-real-glb')
  fs.writeFileSync(path.join(workDir, 'chunk1.glb'), 'not-a-real-glb')
})

afterAll(() => {

  fs.rmSync(workDir, { recursive: true, force: true })
})


describe('render_glb path resolution', () => {

  test('a real path containing a comma resolves to itself (issue #457)', () => {

    const target = path.join(workDir, COMMA_NAME)

    // The regression: this used to come back as ['<dir>/Wiesenplatz 7',
    // ' 4057 Basel_test0.glb'] and fail on the first, which reads as a
    // missing file rather than as a parsing decision.
    expect(resolveGlbPaths(target)).toEqual([target])
  })

  test('a genuine chunk list still splits', () => {

    const chunks = [
      path.join(workDir, 'chunk0.glb'),
      path.join(workDir, 'chunk1.glb'),
    ]

    expect(resolveGlbPaths(chunks.join(','))).toEqual(chunks)
  })

  test('a JSON array resolves chunks whose names contain commas', () => {

    // The case the literal-path rule alone cannot reach: a comma-named model
    // large enough that the CLI splits it, so no single file bears the name.
    // visual_diff_report.cjs passes this form.
    const chunks = [
      path.join(workDir, COMMA_NAME),
      path.join(workDir, 'chunk0.glb'),
    ]

    expect(resolveGlbPaths(JSON.stringify(chunks))).toEqual(chunks)
  })

  test('a JSON array with a missing member fails rather than rendering part', () => {

    const chunks = [path.join(workDir, 'chunk0.glb'), path.join(workDir, 'gone.glb')]

    expect(() => resolveGlbPaths(JSON.stringify(chunks))).toThrow(/gone\.glb/)
  })

  test('a trailing comma from a shell-built list still resolves', () => {

    const target = path.join(workDir, 'chunk0.glb')

    expect(resolveGlbPaths(`${target},`)).toEqual([target])
  })

  test('a missing path names both readings rather than one fragment', () => {

    const missing = path.join(workDir, 'Nowhere 1, 2345 Somewhere.glb')

    // What the error says is the whole point of the issue: the old failure
    // surfaced as ENOENT on "Nowhere 1", a string the caller never typed.
    expect(() => resolveGlbPaths(missing)).toThrow(/No such GLB/)
    expect(() => resolveGlbPaths(missing)).toThrow(/2-chunk list/)
  })

  test('a CLI failure surfaces its own message to visual_diff_report', () => {

    // This contract spans two files and has no other guard. render_glb.cjs
    // prints "Error: <message>"; visual_diff_report.cjs's
    // childFailureDiagnostic picks the FIRST stderr line matching its regex
    // and puts it in the PR comment's table cell. Letting Node throw
    // uncaught instead degrades every render-failure cell to a source code
    // frame, with the whole suite otherwise green.
    //
    // Scope, honestly: this pins the END-TO-END result, not each mechanism.
    // Removing the "Error:" prefix alone keeps it passing, because the stack
    // printed after the message opens with an "Error:" line that matches the
    // same regex. Both are kept because a non-Error throw has no stack.
    const script = path.resolve(process.cwd(), 'scripts/render_glb.cjs')
    const missing = path.join(workDir, 'Nowhere 1, 2345 Somewhere.glb')

    let stderr = ''

    try {
      execFileSync(
          process.execPath,
          [script, missing, path.join(workDir, 'out.png')],
          { stdio: 'pipe' })
    } catch (err) {
      stderr = ((err as { stderr?: Buffer }).stderr ?? '').toString()
    }

    // The regex is copied from visual_diff_report.cjs:138 deliberately — the
    // point is to fail here if either side drifts.
    const picked = stderr.split('\n').filter(Boolean).find(
        (line) => /error|cannot|not found|bad option|unexpected/i.test(line))

    expect(picked).toMatch(/No such GLB/)
    expect(picked).toContain('Nowhere 1, 2345 Somewhere.glb')

    // And the stack still reaches the job log, which is a separate consumer.
    expect(stderr).toMatch(/at resolveGlbPaths/)
  })

  test('a chunk list with one missing member does not silently render the rest', () => {

    const spec = [
      path.join(workDir, 'chunk0.glb'),
      path.join(workDir, 'absent.glb'),
    ].join(',')

    // Rendering the surviving chunk would drop part of the model and look
    // like a geometry regression in the visual diff, which is worse than
    // failing.
    expect(() => resolveGlbPaths(spec)).toThrow(/absent\.glb/)
  })
})
