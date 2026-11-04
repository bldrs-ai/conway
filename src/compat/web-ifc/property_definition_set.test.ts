// conway#763: typed values written in place (inline elements) in the raw
// line parse behind getLine and the property reads.
//
// StepParser.extractArguments pushed every value inside an inline element to
// the record's top-level arguments. So a typed list in a select, e.g.
// IFC4's IfcRelDefinesByProperties.RelatingPropertyDefinition as an
// IFCPROPERTYSETDEFINITIONSET((#20,#21)), read as only its first member and
// spilled the rest into the following attributes: an element whose sets hang
// off a definition set lost every set after the first. Typed values inside a
// list (an enumerated value's (IFCLABEL('a'),IFCLABEL('b'))) went the same
// way, leaving their list empty.
//
// data/property_definition_set.ifc has every aggregate-valued select member
// IFC4 and IFC4X3 define: IfcPropertySetDefinitionSet, IfcComplexNumber,
// IfcCompoundPlaneAngleMeasure, IfcLineIndex / IfcArcIndex; plus typed values
// inside a list (IfcPropertyEnumeratedValue, IfcPropertyListValue).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { IfcAPI } from './ifc_api'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

const FIXTURE = 'data/property_definition_set.ifc'

// Express IDs in the fixture.
const WALL_1 = 1
const WALL_2 = 2
const WALL_3 = 3
const REL_SET = 10
const REL_SET_REVERSED = 12
const COMPLEX = 31
const ANGLE = 32
const ENUMERATED = 33
const LIST = 34
const POLY_CURVE = 41

let api: IfcAPI
let buffer: Uint8Array

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array(fs.readFileSync(FIXTURE))
}, 120000)

const ref = (value: number) => ({ type: 5, value })
const real = (value: number) => ({ type: 4, value })
const label = (value: string) => ({ type: 1, value })

/** getLine(id, false), untyped: GetLine's declared type is the shim's `string | void`. */
const line = (modelID: number, id: number): any => api.GetLine(modelID, id, false)

/** Element ID -> the express IDs of its property sets, as getPropertySets gives them. */
async function setIDs(modelID: number, element: number): Promise<number[]> {
  return (await api.properties.getPropertySets(modelID, element, false))!
      .map((set: any) => set.expressID)
}

describe('typed values written in place keep their lists (conway#763)', () => {

  test('a property definition set keeps every member, in order', async () => {
    const modelID = api.OpenModel(buffer, SETTINGS)

    expect(line(modelID, REL_SET).RelatingPropertyDefinition)
        .toEqual([ref(20), ref(21)])
    expect(line(modelID, REL_SET_REVERSED).RelatingPropertyDefinition)
        .toEqual([ref(23), ref(22), ref(20)])

    // The typed entity path already read the whole set; the raw path now
    // agrees with it.
    const model = (api.getPassthrough(modelID) as IfcApiProxyIfc).model[0]
    const typed = (model.getElementByExpressID(REL_SET) as any).RelatingPropertyDefinition
    expect(typed.Value.map((set: any) => set.expressID)).toEqual([20, 21])

    api.CloseModel(modelID)
  }, 120000)

  test('the relationship index records every member: relating order kept, duplicates once', async () => {
    const modelID = api.OpenModel(buffer, SETTINGS)

    // #1: the definition set's two, then the plain relationship's one, in
    // type-index order. Read only the first member before (20, 22).
    expect(await setIDs(modelID, WALL_1)).toEqual([20, 21, 22])
    expect(await setIDs(modelID, WALL_2)).toEqual([20, 21])
    // #3 is listed twice in one relationship whose set is not in ID order:
    // the set's own order, each member once.
    expect(await setIDs(modelID, WALL_3)).toEqual([23, 22, 20])

    const recursive = (await api.properties.getPropertySets(modelID, WALL_1, true))!
    expect(recursive.map((set: any) => set.Name.value)).toEqual(['First', 'Second', 'Third'])
    expect(recursive[1].HasProperties.map((p: any) => p.NominalValue))
        .toEqual([[real(1.5), real(-2)], [52, 30, 15, 0].map(real)])

    // The index on a spilled source is built from record spans read in file
    // order, through the same parse.
    const spilled = api.OpenModel(buffer, SETTINGS)
    api.SpillModelSource(spilled, new InMemoryStepByteStore(buffer), 512, 3)
    for (const wall of [WALL_1, WALL_2, WALL_3]) {
      expect(await setIDs(spilled, wall)).toEqual(await setIDs(modelID, wall))
    }

    api.CloseModel(spilled)
    api.CloseModel(modelID)
  }, 120000)

  test('the other aggregate-valued select members keep their lists and leave the next attribute alone', () => {
    const modelID = api.OpenModel(buffer, SETTINGS)

    // These spilled their tail into Unit (NominalValue 1.5, Unit -2.).
    const complex = line(modelID, COMPLEX)
    expect(complex.NominalValue).toEqual([real(1.5), real(-2)])
    expect(complex.Unit).toEqual(ref(100))

    const angle = line(modelID, ANGLE)
    expect(angle.NominalValue).toEqual([52, 30, 15, 0].map(real))
    expect(angle.Unit).toEqual(ref(101))

    // A list of typed lists, inside a record-level list.
    const curve = line(modelID, POLY_CURVE)
    expect(curve.Points).toEqual(ref(40))
    expect(curve.Segments).toEqual([[1, 2].map(real), [2, 3, 4].map(real)])
    expect(curve.SelfIntersect).toEqual({ type: 3, value: 'F' })

    api.CloseModel(modelID)
  }, 120000)

  test('typed values inside a list stay in it', () => {
    const modelID = api.OpenModel(buffer, SETTINGS)

    // These read EnumerationValues 'a' and EnumerationReference 'b'.
    const enumerated = line(modelID, ENUMERATED)
    expect(enumerated.EnumerationValues).toEqual([label('a'), label('b')])
    expect(enumerated.EnumerationReference).toBeNull()

    const list = line(modelID, LIST)
    expect(list.ListValues).toEqual([real(1), real(2)])
    expect(list.Unit).toEqual(ref(100))

    api.CloseModel(modelID)
  }, 120000)

  test('an IFC2X3 header reads the same lines (one parser for every IFC schema)', () => {
    const ifc2x3 = new TextEncoder().encode(
        new TextDecoder().decode(buffer).replace("FILE_SCHEMA(('IFC4'))", "FILE_SCHEMA(('IFC2X3'))"))
    const modelID = api.OpenModel(ifc2x3, SETTINGS)
    const ifc4 = api.OpenModel(buffer, SETTINGS)

    expect(line(modelID, COMPLEX).NominalValue).toEqual([real(1.5), real(-2)])
    expect(line(modelID, ENUMERATED).EnumerationValues).toEqual([label('a'), label('b')])
    for (const id of [COMPLEX, ANGLE, ENUMERATED, LIST]) {
      expect(line(modelID, id)).toEqual(line(ifc4, id))
    }

    api.CloseModel(ifc4)
    api.CloseModel(modelID)
  }, 120000)
})
