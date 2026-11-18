/* eslint-disable no-magic-numbers */
// conway#788: a derived attribute written as `*` keeps its slot in the raw
// line parse behind getLine, getItemProperties and GetRawLineData.
//
// StepParser.extractArguments stepped over `*` without pushing anything, so
// every attribute after it read one slot early and the last one went
// missing: IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.) came back as Dimensions
// LENGTHUNIT, UnitType MILLI, Prefix METRE and no Name. The parse is
// schema-blind, so it hit every record that writes `*` ahead of another
// attribute, in every schema: IfcSIUnit, IfcGeometricRepresentationSubContext
// and IfcOrientedEdge in IFC2X3 / IFC4 / IFC4X3, and AP214's oriented_edge
// and friends. The typed entity path (what geometry extraction reads) indexes
// fields by position in the record and never had the shift.
//
// `*` now reads as `{ type: 0 }`, what web-ifc's own GetLine returns for it
// (checked on data/derived_attributes.ifc against this repo's web-ifc
// devDependency: package 0.0.35, whose engine reports 0.0.34), so a
// value-less `$` (null) and a derived `*` stay distinguishable as they are
// upstream. This is conway#764's second defect; its nested-list and binary
// defects are separate arms and still open.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import IfcStepParser from '../../ifc/ifc_step_parser'
import { IfcSIPrefix, IfcSIUnit, IfcSIUnitName, IfcUnitEnum } from '../../ifc/ifc4_gen'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { ParseResult } from '../../step/parsing/step_parser'
import { IfcAPI } from './ifc_api'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

const FIXTURE = 'data/derived_attributes.ifc'

// Express IDs in the fixture.
const SUB_CONTEXT = 13
const LENGTH_UNIT = 21
const AREA_UNIT = 22
const ORIENTED_EDGE = 33

const AP214_FIXTURE = 'data/ap214-two-representations.step'
const AP214_ORIENTED_EDGE = 307

const DERIVED = { type: 0 }
const ref = (value: number) => ({ type: 5, value })
const real = (value: number) => ({ type: 4, value })
const label = (value: string) => ({ type: 1, value })
const enumeration = (value: string) => ({ type: 3, value })

let api: IfcAPI
let buffer: Uint8Array

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array(fs.readFileSync(FIXTURE))
}, 120000)

/** getLine(id, false), untyped: GetLine's declared type is the shim's `string | void`. */
const line = (modelID: number, id: number): any => api.GetLine(modelID, id, false)

/**
 * Parse one record's argument text, as extractLineArguments hands it over.
 *
 * @param text The arguments, from after the record's `(` through `);`.
 * @return {[any, ParseResult]} The raw arguments and how the parse ended.
 */
function parse(text: string): [any, ParseResult] {
  return IfcStepParser.Instance.extractArguments(
      new ParsingBuffer(new TextEncoder().encode(text)), 1)
}

describe('a derived `*` keeps its attribute slot (conway#788)', () => {

  test('the raw parse gives `*` a value, wherever it is written', () => {
    expect(parse('*,.LENGTHUNIT.,.MILLI.,.METRE.);')).toEqual([[
      DERIVED, enumeration('LENGTHUNIT'), enumeration('MILLI'), enumeration('METRE'),
    ], ParseResult.COMPLETE])

    // Last, and inside a list or an inline element: no IFC attribute writes
    // `*` there, but every value-producing token takes one slot wherever it
    // sits, so these pin the rule rather than a schema.
    expect(parse('1.,*);')).toEqual([[real(1), DERIVED], ParseResult.COMPLETE])
    expect(parse('(*,1.),$);')).toEqual([[[DERIVED, real(1)], null], ParseResult.COMPLETE])
    expect(parse('IFCX(*),1.);')).toEqual([[DERIVED, real(1)], ParseResult.COMPLETE])
  })

  test('an IfcSIUnit reads Dimensions, UnitType, Prefix and Name from their own slots', async () => {
    const modelID = api.OpenModel(buffer, SETTINGS)

    // Before: Dimensions LENGTHUNIT, UnitType MILLI, Prefix METRE, no Name.
    const length = line(modelID, LENGTH_UNIT)
    expect(length.Dimensions).toEqual(DERIVED)
    expect(length.UnitType).toEqual(enumeration('LENGTHUNIT'))
    expect(length.Prefix).toEqual(enumeration('MILLI'))
    expect(length.Name).toEqual(enumeration('METRE'))

    // Before: Dimensions AREAUNIT, UnitType null, Prefix SQUARE_METRE.
    const area = line(modelID, AREA_UNIT)
    expect(area.Dimensions).toEqual(DERIVED)
    expect(area.UnitType).toEqual(enumeration('AREAUNIT'))
    expect(area.Prefix).toBeNull()
    expect(area.Name).toEqual(enumeration('SQUARE_METRE'))

    // The read #788 was reported through (Share's engine).
    expect(await api.properties.getItemProperties(modelID, LENGTH_UNIT)).toEqual(length)

    // The typed entity agrees, and always did: it is what unit scaling in
    // geometry extraction reads.
    const model = (api.getPassthrough(modelID) as IfcApiProxyIfc).model[0]
    const typed = model.getElementByExpressID(LENGTH_UNIT) as IfcSIUnit
    expect(typed.UnitType).toBe(IfcUnitEnum.LENGTHUNIT)
    expect(typed.Prefix).toBe(IfcSIPrefix.MILLI)
    expect(typed.Name).toBe(IfcSIUnitName.METRE)

    api.CloseModel(modelID)
  }, 120000)

  test('a representation sub-context and an oriented edge keep their explicit attributes', () => {
    const modelID = api.OpenModel(buffer, SETTINGS)

    // Four derived slots ahead of ParentContext: before, ParentContext read
    // as CoordinateSpaceDimension and the last four attributes as nothing.
    expect(api.GetRawLineData(modelID, SUB_CONTEXT).arguments).toEqual([
      label('Body'), label('Model'),
      DERIVED, DERIVED, DERIVED, DERIVED,
      ref(10), null, enumeration('MODEL_VIEW'), null,
    ])
    const subContext = line(modelID, SUB_CONTEXT)
    expect(subContext.ParentContext).toEqual(ref(10))
    expect(subContext.TargetView).toEqual(enumeration('MODEL_VIEW'))

    // Before: EdgeStart the edge, EdgeEnd the orientation.
    const edge = line(modelID, ORIENTED_EDGE)
    expect(edge.EdgeStart).toEqual(DERIVED)
    expect(edge.EdgeEnd).toEqual(DERIVED)
    expect(edge.EdgeElement).toEqual(ref(32))
    expect(edge.Orientation).toEqual(enumeration('F'))

    api.CloseModel(modelID)
  }, 120000)

  test.each(['IFC2X3', 'IFC4X3_ADD2'])('an %s header reads the same lines (one parser for every IFC schema)', (schema) => {
    // IFC4X3 opens through the IFC4-compatible route, whose raw lines also
    // pass through maskRawArguments (ifc4x3_ifc4_compat.ts).
    const other = new TextEncoder().encode(
        new TextDecoder().decode(buffer).replace("FILE_SCHEMA(('IFC4'))", `FILE_SCHEMA(('${schema}'))`))
    const modelID = api.OpenModel(other, SETTINGS)
    const ifc4 = api.OpenModel(buffer, SETTINGS)

    expect(line(modelID, LENGTH_UNIT).Name).toEqual(enumeration('METRE'))
    for (const id of [SUB_CONTEXT, LENGTH_UNIT, AREA_UNIT, ORIENTED_EDGE]) {
      expect(line(modelID, id)).toEqual(line(ifc4, id))
    }

    api.CloseModel(ifc4)
    api.CloseModel(modelID)
  }, 120000)

  test('the AP214 raw path keeps an oriented_edge\'s edge_element in its slot', () => {
    // ORIENTED_EDGE('',*,*,#306,.T.): the same parse, through the AP214
    // proxy's getRawLineData. Before, edge_start read #306.
    const modelID = api.OpenModel(new Uint8Array(fs.readFileSync(AP214_FIXTURE)), SETTINGS)

    expect(api.GetRawLineData(modelID, AP214_ORIENTED_EDGE).arguments).toEqual([
      label(''), DERIVED, DERIVED, ref(306), enumeration('T'),
    ])

    api.CloseModel(modelID)
  }, 120000)
})
