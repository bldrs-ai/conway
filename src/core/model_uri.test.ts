/* eslint-disable no-magic-numbers */
// M5: universal entity addressing — a model URI plus an express-ID fragment —
// must round-trip and resolve relative references the way IFC external-ref
// locations demand.
import { describe, expect, test } from '@jest/globals'

import {
  formatEntityAddress,
  parseEntityAddress,
  resolveReference,
} from './model_uri'

describe( 'model URI addressing', () => {

  test( 'formats and parses an entity address round-trip', () => {
    const uri = formatEntityAddress( 'https://ex.com/part-B.ifc', 4022 )

    expect( uri ).toBe( 'https://ex.com/part-B.ifc#4022' )

    const parsed = parseEntityAddress( uri )
    expect( parsed.modelURI ).toBe( 'https://ex.com/part-B.ifc' )
    expect( parsed.expressID ).toBe( 4022 )
  } )

  test( 'splits on the last # so the model URI keeps earlier structure', () => {
    // (Model URIs shouldn't carry a '#', but parsing must be unambiguous.)
    const parsed = parseEntityAddress( 'scheme://h/a#b#42' )
    expect( parsed.modelURI ).toBe( 'scheme://h/a#b' )
    expect( parsed.expressID ).toBe( 42 )
  } )

  test( 'rejects formatting a model URI that contains #', () => {
    expect( () => formatEntityAddress( 'a#b', 1 ) ).toThrow( /#/ )
  } )

  test( 'rejects formatting a non-integer or negative express ID', () => {
    expect( () => formatEntityAddress( 'a', 1.5 ) ).toThrow()
    expect( () => formatEntityAddress( 'a', -1 ) ).toThrow()
  } )

  test( 'rejects an address with no fragment or a non-numeric fragment', () => {
    expect( () => parseEntityAddress( 'a.ifc' ) ).toThrow( /fragment/ )
    expect( () => parseEntityAddress( 'a.ifc#' ) ).toThrow( /express ID/ )
    expect( () => parseEntityAddress( 'a.ifc#x' ) ).toThrow( /express ID/ )
  } )

  test( 'resolves a relative reference against an absolute base URI', () => {
    expect(
        resolveReference( 'https://ex.com/site/plan.ifc', '../shared/grid.ifc' ) )
        .toBe( 'https://ex.com/shared/grid.ifc' )

    expect(
        resolveReference( 'https://ex.com/site/plan.ifc', 'wing-A.ifc' ) )
        .toBe( 'https://ex.com/site/wing-A.ifc' )
  } )

  test( 'passes an already-absolute reference through unchanged', () => {
    expect(
        resolveReference( 'https://ex.com/a.ifc', 'https://other.org/b.ifc' ) )
        .toBe( 'https://other.org/b.ifc' )
  } )

  test( 'resolves relative references against a scheme-less base', () => {
    expect( resolveReference( 'project/plan.ifc', 'wing-A.ifc' ) )
        .toBe( 'project/wing-A.ifc' )
    expect( resolveReference( 'project/site/plan.ifc', '../grid.ifc' ) )
        .toBe( 'project/grid.ifc' )
  } )
} )
