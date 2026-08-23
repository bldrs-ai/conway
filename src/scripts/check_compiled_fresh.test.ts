import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { createRequire } from 'module'

/**
 * The commit gate's compiled-output check (scripts/check-compiled-fresh.cjs).
 *
 * `yarn precommit` runs jest over `compiled/`, so a source file with no
 * output is not "failing" — it is absent, and the run reports a pass over
 * whatever the previous build left behind. Merging conway#566 (which adds a
 * 443-line test file) into another branch left precommit reporting an
 * unchanged 102 suites / 698 tests; `yarn build-incremental` then produced
 * the true 103 / 701. A gate that silently under-reports is worse than a
 * slow one, and this is the case where it is weakest — a merge is exactly
 * when new tests arrive.
 *
 * Driven over a synthetic tree rather than the repo: asserting against the
 * real `compiled/` would only ever say "the tree I was just built from is
 * fresh", which is the tautology the defect hid behind.
 */
const require_ = createRequire(import.meta.url)

// Resolved from the repo root: the test runs from compiled/src/scripts, and
// scripts/ is not part of the tsc build. Jest's rootDir is the repo root.
const { describeMissing, outputPathFor, sourcesWithoutOutput } =
  require_(path.resolve(process.cwd(), 'scripts/check-compiled-fresh.cjs')) as {
    describeMissing: ( missing: string[] ) => string,
    outputPathFor: ( relativeSource: string ) => string,
    sourcesWithoutOutput: ( root: string ) => string[],
  }

let root: string

/**
 * Write a file, creating its directory.
 *
 * @param relativePath Path under the fixture root.
 * @param contents What to write.
 */
function write( relativePath: string, contents: string ): void {

  const absolute = path.join( root, relativePath )

  fs.mkdirSync( path.dirname( absolute ), { recursive: true } )
  fs.writeFileSync( absolute, contents )
}

/**
 * A source and its compiled output, i.e. a file the gate does cover.
 *
 * @param relativeSource Root-relative `.ts` path.
 */
function writeBuilt( relativeSource: string ): void {

  write( relativeSource, '// source\n' )
  write( outputPathFor( relativeSource ), '// output\n' )
}

beforeEach( () => {
  root = fs.mkdtempSync( path.join( os.tmpdir(), 'check-compiled-fresh-' ) )
} )

afterEach( () => {
  fs.rmSync( root, { recursive: true, force: true } )
} )

describe( 'compiled-output freshness check', () => {

  test( 'a fully built tree is clean', () => {

    writeBuilt( 'src/ifc/ifc_step_model.ts' )
    writeBuilt( 'src/ifc/ifc_step_model.test.ts' )
    writeBuilt( 'examples/browser.ts' )
    writeBuilt( 'dependencies/conway-geom/index.ts' )
    writeBuilt( 'dependencies/conway-geom/interface/conway_geometry.ts' )

    expect( sourcesWithoutOutput( root ) ).toEqual( [] )
    expect( describeMissing( sourcesWithoutOutput( root ) ) ).toBe( '' )
  } )

  test( 'a merged-in test file with no compiled output is caught', () => {

    // The observed shape: everything that was there before is built, and a
    // merge lands one more test file. Pre-fix, `yarn precommit` runs and
    // passes without ever loading it.
    writeBuilt( 'src/ifc/ifc_step_model.ts' )
    write( 'src/compat/web-ifc/aggregate_prefetch_paging.test.ts', '// merged in\n' )

    const missing = sourcesWithoutOutput( root )

    expect( missing ).toEqual( [ 'src/compat/web-ifc/aggregate_prefetch_paging.test.ts' ] )

    const message = describeMissing( missing )

    // Loud, and it names both the offender and the way out — a gate that
    // fails without saying which file or what to run gets bypassed.
    expect( message ).toContain( 'compiled/ is stale' )
    expect( message ).toContain( 'aggregate_prefetch_paging.test.ts' )
    expect( message ).toContain( 'yarn build-incremental' )
  } )

  test( 'a source outside src/ is covered too', () => {

    // tsc compiles examples/ and the conway-geom shim into the same
    // compiled/ tree, and CI has already been burned once by an output
    // missing from exactly that corner (the cached-tsbuildinfo note in
    // .github/workflows/build.yml).
    writeBuilt( 'src/index.ts' )
    write( 'dependencies/conway-geom/index.ts', '// shim\n' )

    expect( sourcesWithoutOutput( root ) )
        .toEqual( [ 'dependencies/conway-geom/index.ts' ] )
  } )

  test( 'declarations and non-TypeScript files are not expected to emit', () => {

    // A `.d.ts` is an input that produces no `.js`; demanding one would
    // fail every tree forever. Same for the assets that sit alongside.
    writeBuilt( 'src/index.ts' )
    write( 'src/ifc/ifc4_gen/schema.d.ts', 'declare const x: number\n' )
    write( 'src/ifc/ifc4_gen/notes.md', 'not compiled\n' )

    expect( sourcesWithoutOutput( root ) ).toEqual( [] )
  } )

  test( 'excluded trees are not scanned', () => {

    // `compiled/` and `external/` are tsconfig `exclude`d. Scanning
    // compiled/ in particular would report every emitted `.js`'s sibling
    // `.d.ts`-less self as missing and make the check unusable.
    writeBuilt( 'src/index.ts' )
    write( 'src/external/vendored.ts', '// not ours\n' )
    write( 'external/vendored.ts', '// not ours\n' )
    write( 'dependencies/conway-geom/compiled/stale.ts', '// not ours\n' )

    // src/external is NOT excluded — tsconfig excludes top-level
    // `external/**/*` only — so it is the one that must still be reported.
    expect( sourcesWithoutOutput( root ) ).toEqual( [ 'src/external/vendored.ts' ] )
  } )

  test( 'a missing input root is not a staleness signal', () => {

    // A fresh clone with `dependencies/conway-geom` uninitialised: tsc is
    // not compiling it either, so failing the gate over it would block a
    // commit for something the build never claimed to cover.
    writeBuilt( 'src/index.ts' )

    expect( sourcesWithoutOutput( root ) ).toEqual( [] )
  } )
} )
