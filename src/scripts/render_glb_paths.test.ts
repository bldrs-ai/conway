import fs from 'fs'
import os from 'os'
import path from 'path'
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

  test('a missing path names both readings rather than one fragment', () => {

    const missing = path.join(workDir, 'Nowhere 1, 2345 Somewhere.glb')

    // What the error says is the whole point of the issue: the old failure
    // surfaced as ENOENT on "Nowhere 1", a string the caller never typed.
    expect(() => resolveGlbPaths(missing)).toThrow(/No such GLB/)
    expect(() => resolveGlbPaths(missing)).toThrow(/2-chunk list/)
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
