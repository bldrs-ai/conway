import path from 'path'
import { describe, expect, test } from '@jest/globals'
import { createRequire } from 'module'

/**
 * The "already populated" sentinel of scripts/fetch-prebuilt-wasm.cjs.
 *
 * Jest imports the single-thread `ConwayGeomWasmNode.js`; everything else
 * imports `ConwayGeomWasmNodeMT.js`. `yarn build-MT` cleans Dist and restores
 * only NodeMT, so a NodeMT-only sentinel made `yarn wasm-prebuilt` skip while
 * `yarn test` could not import the absent single-thread module (codex review,
 * conway#727). The skip is `missingSentinels(files).length === 0`.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root, as in wasm_provenance.test.ts.
const { SENTINELS, missingSentinels } =
  require_(path.resolve(process.cwd(), 'scripts/fetch-prebuilt-wasm.cjs')) as {
    SENTINELS: string[],
    missingSentinels: ( files: string[] ) => string[],
  }

describe('fetch-prebuilt-wasm skip decision', () => {
  test('requires both the single-thread and the MT Node build', () => {
    expect([...SENTINELS].sort()).toEqual(['ConwayGeomWasmNode.js', 'ConwayGeomWasmNodeMT.js'])
  })

  test('skips (nothing missing) only when both are present', () => {
    expect(missingSentinels(['ConwayGeomWasmNode.js', 'ConwayGeomWasmNodeMT.js', 'x.d.ts'])).toEqual([])
  })

  test('THE DEFECT: NodeMT alone (the tree build-MT leaves) does not skip', () => {
    expect(missingSentinels(['ConwayGeomWasmNodeMT.js'])).toEqual(['ConwayGeomWasmNode.js'])
  })

  test('Node alone (the tree build-node leaves) does not skip', () => {
    expect(missingSentinels(['ConwayGeomWasmNode.js'])).toEqual(['ConwayGeomWasmNodeMT.js'])
  })

  test('an empty Dist does not skip', () => {
    expect(missingSentinels([])).toEqual([...SENTINELS])
  })

  test('the .d.ts siblings do not count as the artifact', () => {
    expect(missingSentinels(['ConwayGeomWasmNode.d.ts', 'ConwayGeomWasmNodeMT.d.ts']).length).toBe(2)
  })
})
