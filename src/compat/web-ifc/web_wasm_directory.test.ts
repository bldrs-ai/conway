// The wasm-directory normalization behind the isolated-context module
// prefix (Share #1610): embedder SetWasmPath values are site-root-
// relative by convention and must come out as absolute directories,
// since they become runtime dynamic-import prefixes whose resolution
// must not depend on the page or bundle URL (the pthread worker script
// URL derives from the imported module's import.meta.url).
import { describe, expect, test } from '@jest/globals'

import { webWasmDirectory } from './ifc_api'

describe( 'webWasmDirectory', () => {

  test( 'site-root-relative convention absolutizes', () => {
    expect( webWasmDirectory( './static/js/' ) ).toBe( '/static/js/' )
    expect( webWasmDirectory( 'static/js/' ) ).toBe( '/static/js/' )
  } )

  test( 'absolute paths pass through with a trailing slash ensured', () => {
    expect( webWasmDirectory( '/static/js/' ) ).toBe( '/static/js/' )
    expect( webWasmDirectory( '/wasm' ) ).toBe( '/wasm/' )
  } )

  test( 'missing input falls back to the conventional serve directory', () => {
    expect( webWasmDirectory( undefined ) ).toBe( '/static/js/' )
    expect( webWasmDirectory( '' ) ).toBe( '/static/js/' )
  } )
} )
