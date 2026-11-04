/* eslint-disable no-magic-numbers */
// conway#763: inline elements (typed values written in place) in the raw line
// parse, StepParser.extractArguments, on synthetic argument lists. The model-
// level reads of the same shapes are in
// src/compat/web-ifc/property_definition_set.test.ts.
//
// The input is what extractLineArguments hands the parse: a record's
// arguments after its opening paren, through the closing `);`.
import { describe, expect, test } from '@jest/globals'

import IfcStepParser from '../../ifc/ifc_step_parser'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { ParseResult } from './step_parser'

/**
 * Parse one record's argument text.
 *
 * @param text The arguments, from after the record's `(` through `);`.
 * @return {[any, ParseResult]} The raw arguments and how the parse ended.
 */
function parse(text: string): [any, ParseResult] {
  return IfcStepParser.Instance.extractArguments(
      new ParsingBuffer(new TextEncoder().encode(text)), 1)
}

const real = (value: number) => ({ type: 4, value })
const label = (value: string) => ({ type: 1, value })

describe('inline elements in the raw line parse (conway#763)', () => {

  test('a list inside an inline element is built whole, and the next argument stays put', () => {
    expect(parse('IFCCOMPLEXNUMBER((1.5,-2.)),$);')).toEqual(
        [[[real(1.5), real(-2)], null], ParseResult.COMPLETE])
  })

  test('an inline element inside a list stays in the list', () => {
    expect(parse("'a',(IFCLABEL('x'),IFCLABEL('y')),$);")).toEqual(
        [[label('a'), [label('x'), label('y')], null], ParseResult.COMPLETE])
  })

  test('an inline element inside a list inside an inline element lands in that list', () => {
    // No IFC attribute has this shape; it pins the nesting rule, under which
    // each value goes to the innermost list open around it.
    expect(parse('IFCX((IFCY(1.),IFCZ((2.,3.)),())),$);')).toEqual([[
      [real(1), [real(2), real(3)], []],
      null,
    ], ParseResult.COMPLETE])
  })

  test('a syntax error inside an inline element fails the record', () => {
    // An element with no argument list. These used to come back COMPLETE,
    // the first with only two arguments and the others with an empty list.
    for (const text of ["'a',IFCLABEL,$);", "'a',(IFCLABEL),$);", "'a',(IFCX(IFCLABEL)),$);"]) {
      expect(parse(text)[1]).toBe(ParseResult.SYNTAX_ERROR)
    }
  })
})
