/* eslint-disable no-magic-numbers */
// Codex review of #706 (P1): once an IFC4X3-only entity (IFCROAD,
// IFCFACILITYPART, IFCPAVEMENT, IFCKERB — see ifc4x3_supertype_aliases.ts,
// issue #280) is indexed as its nearest IFC4 supertype, that borrowed type
// is all `IfcApiProxyIfc.getRawLineData` had left to export as the web-ifc
// "type" code. Before the fix here, that meant `getLine()`'s
// FromRawLineData converter for the BORROWED type (e.g. IfcBuildingStorey)
// decoded the REAL record's argument tape (e.g. IfcFacilityPart's) against
// the wrong field layout — corrupting property reads for every road,
// facility part, pavement and kerb a real IFC4X3 model carries, exactly
// the path Share's `USE_WEBIFC_SHIM=true` build reads through.
//
// The second describe block below covers the follow-on: Share's
// `entityTypeName()` (itemProperties.jsx) resolves a numeric type code to
// a display label via `getIfcType`, which the sentinel codes above left
// with no `IfcTypesMap` entry at all (verified: `IfcTypesMap[-280001]` is
// `undefined`) — so before that fix these entities fell through to
// Share's generic empty/'Element' label instead of "Road"/"Facility
// Part"/etc. `IFC4X3_WEBIFC_TYPE_NAMES` (the reverse of
// `IFC4X3_WEBIFC_TYPE_CODES`) fixes that too.
//
// These tests exercise the real IfcAPI -> getPassthrough -> getRawLineData
// / getLine / properties.getIfcType path (not the isolated alias module —
// see ifc4x3_supertype_aliases.test.ts for that), because both defects
// only exist on this path.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import EntityTypesIfc from '../../ifc/ifc4_gen/entity_types_ifc.gen'
import {
  IFC4X3_UNKNOWN_PROVENANCE_TYPE_CODE,
  IFC4X3_WEBIFC_TYPE_CODES,
} from '../../ifc/ifc4x3_supertype_aliases'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { IfcAPI } from './ifc_api'
import { shimIfcEntityReverseMap } from './shim_schema_mapping'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

/**
 * A minimal `IFC4X3_RC2` file: one of each entity {@link
 * IFC4X3_WEBIFC_TYPE_CODES} covers (real KIT-Simple-Road-Test-shaped
 * argument lists, so the corrupted fields are the ones codex named —
 * IfcFacilityPart's PredefinedType/UsageType), plus a genuine
 * IfcBuildingStorey and IfcBuildingElementProxy so the fix's "only the
 * aliased two, never a real one" scoping is pinned in the same model.
 * Every reference (ObjectPlacement, Representation) is left `$` so
 * OpenModel's geometry/placement passes have nothing to dangle on.
 */
const IFC4X3_SNIPPET = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION((''),'2;1');
FILE_NAME('test.ifc','2026-08-31',(''),(''),'','','');
FILE_SCHEMA(('IFC4X3_RC2'));
ENDSEC;

DATA;
#1=IFCROAD('0road000000000000000001',$,'Road Network','desc',$,$,$,$,.ELEMENT.);
#2=IFCFACILITYPART('0part000000000000000002',$,'Road-ROADSEGMENT-01','desc',$,$,$,$,.ELEMENT.,IFCROADPARTTYPEENUM(.ROADSEGMENT.),.LONGITUDINAL.);
#3=IFCPAVEMENT('0pave000000000000000003',$,'Carriageway','desc',$,$,$,$,IFCPAVEMENTTYPEENUM(.NOTDEFINED.));
#4=IFCKERB('0kerb000000000000000004',$,'Kerb','desc',$,$,$,$,IFCKERBTYPEENUM(.NOTDEFINED.));
#5=IFCBUILDINGSTOREY('0real000000000000000005',$,'Real Storey','desc',$,$,$,$,.ELEMENT.,3.5);
#6=IFCBUILDINGELEMENTPROXY('0real000000000000000006',$,'Real Proxy','desc',$,$,$,'TAG6',.NOTDEFINED.);
ENDSEC;
END-ISO-10303-21;
`

let api: IfcAPI
let modelID: number

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()

  const buffer = new TextEncoder().encode(IFC4X3_SNIPPET)

  modelID = api.OpenModel(buffer, SETTINGS)
})

describe('getLine property corruption on aliased IFC4X3 entities (codex review, #706)', () => {

  test('IFCFACILITYPART: no misread Elevation, no dropped UsageType', () => {

    const proxy = api.getPassthrough(modelID)!
    const raw = proxy.getRawLineData(2)

    // Not the borrowed IfcBuildingStorey code — that would be
    // shimIfcEntityReverseMap[EntityTypesIfc.IFCBUILDINGSTOREY].
    expect(raw.type).toBe(IFC4X3_WEBIFC_TYPE_CODES.IFCFACILITYPART)
    expect(raw.type).not.toBe(shimIfcEntityReverseMap[EntityTypesIfc.IFCBUILDINGSTOREY])

    // No converter for that code -> getLine falls back to the raw,
    // unconverted 11-argument tape (the real IfcFacilityPart record),
    // not an IfcBuildingStorey-shaped object.
    const line = proxy.getLine(2) as any

    expect(line.arguments).toHaveLength(11)
    expect(line.Elevation).toBeUndefined()
    expect(line.UsageType).toBeUndefined()

    // The real PredefinedType/UsageType values are still THERE, in the
    // raw tape, at their real positions — nothing is lost, just not
    // confidently mislabeled as another type's fields.
    expect(line.arguments[9]).toMatchObject({ value: 'ROADSEGMENT' })
    expect(line.arguments[10]).toMatchObject({ value: 'LONGITUDINAL' })
  })

  test('IFCROAD, IFCPAVEMENT, IFCKERB: also fall back to the raw tape', () => {

    const proxy = api.getPassthrough(modelID)!

    for (const [expressID, argCount, aliasKeyword] of [
      [1, 9, 'IFCROAD'],
      [3, 9, 'IFCPAVEMENT'],
      [4, 9, 'IFCKERB'],
    ] as const) {
      const raw = proxy.getRawLineData(expressID)

      expect(raw.type).toBe(IFC4X3_WEBIFC_TYPE_CODES[aliasKeyword])

      const line = proxy.getLine(expressID) as any

      expect(line.arguments).toHaveLength(argCount)
      // A typed converter's output would have named fields
      // (GlobalId/Name/...); the raw fallback never does.
      expect(line.GlobalId).toBeUndefined()
    }
  })

  test('a genuine IfcBuildingStorey is unaffected: real Elevation, typed fields', () => {

    const proxy = api.getPassthrough(modelID)!
    const raw = proxy.getRawLineData(5)

    expect(raw.type).toBe(shimIfcEntityReverseMap[EntityTypesIfc.IFCBUILDINGSTOREY])

    const line = proxy.getLine(5) as any

    expect(line.Name).toMatchObject({ value: 'Real Storey' })
    expect(line.Elevation).toMatchObject({ value: 3.5 })
  })

  test('a genuine IfcBuildingElementProxy is unaffected: real Tag/PredefinedType', () => {

    const proxy = api.getPassthrough(modelID)!
    const raw = proxy.getRawLineData(6)

    expect(raw.type).toBe(shimIfcEntityReverseMap[EntityTypesIfc.IFCBUILDINGELEMENTPROXY])

    const line = proxy.getLine(6) as any

    expect(line.Name).toMatchObject({ value: 'Real Proxy' })
    expect(line.Tag).toMatchObject({ value: 'TAG6' })
    expect(line.PredefinedType).toMatchObject({ value: 'NOTDEFINED' })
  })
})

describe('getIfcType label round-trip for aliased IFC4X3 entities', () => {

  test('each sentinel code resolves to its real IFC4X3 keyword via both getIfcType entry points', () => {

    const proxy = api.getPassthrough(modelID)!

    for (const [expressID, keyword] of [
      [1, 'IFCROAD'],
      [2, 'IFCFACILITYPART'],
      [3, 'IFCPAVEMENT'],
      [4, 'IFCKERB'],
    ] as const) {
      const type = proxy.getRawLineData(expressID).type

      // The shared, schema-agnostic entry point (`IfcAPI.properties`,
      // what `model.ifcManager.getIfcType(0, code)` ultimately reaches)...
      expect(api.properties.getIfcType(type)).toBe(keyword)
      // ...and the per-model passthrough's own `properties` (the other
      // form the coordinator named) agree.
      expect(proxy.properties.getIfcType(type)).toBe(keyword)
    }
  })

  test('a genuine IfcBuildingStorey/IfcBuildingElementProxy still resolves via IfcTypesMap, unaffected', () => {

    const proxy = api.getPassthrough(modelID)!

    for (const [expressID, entityType] of [
      [5, EntityTypesIfc.IFCBUILDINGSTOREY],
      [6, EntityTypesIfc.IFCBUILDINGELEMENTPROXY],
    ] as const) {
      const type = proxy.getRawLineData(expressID).type

      expect(type).toBe(shimIfcEntityReverseMap[entityType])
      expect(api.properties.getIfcType(type)).toBe(EntityTypesIfc[entityType])
      expect(proxy.properties.getIfcType(type)).toBe(EntityTypesIfc[entityType])
    }
  })
})

describe('inconclusive provenance on a spilled/windowed model (codex review, #706 P2)', () => {

  // Small enough that a record's own attribute-list range and the
  // keyword window ifc4x3KeywordScanRange asks for land in DIFFERENT
  // chunks — the residency mismatch codex named
  // (ensureResidentByExpressID pages only a record's own range, never
  // bytes before it). maxResidentChunks generous enough that paging a
  // whole record (which can span several of these small chunks) never
  // itself thrashes against the cap.
  const CHUNK_BYTES = 32
  const MAX_RESIDENT_CHUNKS = 16

  /**
   * Open a fresh spilled model over the shared fixture bytes — a fresh
   * model per test so one test's paging can't leave residency state for
   * the next.
   *
   * @return {{proxy: any, model: any}} The passthrough and its model.
   */
  function openSpilledModel() {
    const bytes = new TextEncoder().encode(IFC4X3_SNIPPET)
    const freshModelID = api.OpenModel(bytes, SETTINGS)
    const proxy = api.getPassthrough(freshModelID) as any
    const [model] = proxy.model as [any, any]

    model.spillSourceToExternalStore(
        new InMemoryStepByteStore(bytes), CHUNK_BYTES, MAX_RESIDENT_CHUNKS)

    return { proxy, model }
  }

  test(
      'IFCFACILITYPART: only the record range resident (keyword window ' +
      'unpaged) falls to the UNKNOWN sentinel, never the borrowed ' +
      'IfcBuildingStorey code',
      async () => {

        const { proxy, model } = openSpilledModel()

        // Exactly what a caller who does NOT know about
        // ifc4x3KeywordScanRange does: page the record's own range only
        // (ensureResidentByExpressID — the same thing
        // IfcApiProxyIfc.ensureLineResident used to do, in full, before
        // this fix).
        await model.ensureResidentByExpressID(2)

        const raw = proxy.getRawLineData(2)

        expect(raw.type).toBe(IFC4X3_UNKNOWN_PROVENANCE_TYPE_CODE)
        expect(raw.type).not.toBe(IFC4X3_WEBIFC_TYPE_CODES.IFCFACILITYPART)
        expect(raw.type).not.toBe(shimIfcEntityReverseMap[EntityTypesIfc.IFCBUILDINGSTOREY])

        // Still the safe raw-tape fallback, not a misread IfcBuildingStorey.
        const line = proxy.getLine(2) as any

        expect(line.arguments).toHaveLength(11)
        expect(line.Elevation).toBeUndefined()
      })

  test(
      'IFCFACILITYPART: ensureLineResident (the documented real sequencing) ' +
      'pre-pages the keyword window and resolves it correctly',
      async () => {

        const { proxy } = openSpilledModel()

        await proxy.ensureLineResident(2)

        const raw = proxy.getRawLineData(2)

        expect(raw.type).toBe(IFC4X3_WEBIFC_TYPE_CODES.IFCFACILITYPART)

        const line = proxy.getLine(2) as any

        expect(line.arguments).toHaveLength(11)
        expect(line.Elevation).toBeUndefined()
        expect(line.arguments[9]).toMatchObject({ value: 'ROADSEGMENT' })
      })

  test(
      'a genuine IfcBuildingStorey with only its own range resident is ' +
      'ALSO inconclusive (unknown), not confidently genuine — the scan ' +
      'cannot tell the two apart without the keyword bytes either way',
      async () => {

        const { proxy, model } = openSpilledModel()

        await model.ensureResidentByExpressID(5)

        const raw = proxy.getRawLineData(5)

        expect(raw.type).toBe(IFC4X3_UNKNOWN_PROVENANCE_TYPE_CODE)

        // Losing the typed Elevation view is the accepted, honest cost —
        // strictly better than a road silently reporting one.
        const line = proxy.getLine(5) as any

        expect(line.Elevation).toBeUndefined()
      })

  test(
      'a genuine IfcBuildingStorey resolves correctly once ensureLineResident ' +
      'pages its keyword window too',
      async () => {

        const { proxy } = openSpilledModel()

        await proxy.ensureLineResident(5)

        const raw = proxy.getRawLineData(5)

        expect(raw.type).toBe(shimIfcEntityReverseMap[EntityTypesIfc.IFCBUILDINGSTOREY])

        const line = proxy.getLine(5) as any

        expect(line.Elevation).toMatchObject({ value: 3.5 })
      })
})
