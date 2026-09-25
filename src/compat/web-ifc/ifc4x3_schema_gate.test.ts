// codex review of bldrs-ai/conway#713 (P1): every entry point in
// ifc_api_proxy_ifc.ts that opens an IFC model hard-codes IfcStepParser
// (the IFC4 parser/EntityTypesIfc ordinals), and Share builds with
// USE_WEBIFC_SHIM=true — this file (IfcAPI.OpenModel/OpenModelAsync) is the
// actual production path an IFC4X3 file reaches, NOT ConwayModelLoader's
// native path (already covered by ifc4x3_step_model.test.ts and gated in
// conway_model_loader.ts). Without IfcApiProxyIfc.assertSchemaSupported,
// a 4X3 file would silently parse and extract under IFC4's ordinals here —
// the exact misidentification bldrs-ai/conway#280 exists to eliminate —
// with no error at all. This is the finding most likely to regress
// silently, so it gets its own coverage rather than a manual check.
import fs from 'fs'
import { describe, expect, test, beforeAll, jest } from '@jest/globals'
import { IfcAPI } from './ifc_api'
import Logger from '../../logging/logger'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import type { PreviewMeshPayload } from './streamed_preview_channel'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// An INELIGIBLE IFC4X3_RC2 file: the #713 road fixture plus one
// IFC4X3-only record (IFCALIGNMENT, last in the file) that neither IFC4 nor
// the translation table can decode. Since bldrs-ai/conway#280 an eligible
// 4X3 file loads here through the IFC4-compatible route
// (ifc4x3_ifc4_compat.ts, covered by ifc4x3_compat_route.test.ts), so only
// an ineligible one still exercises the refusal. Because the offending
// record is LAST, the refusal is decided only after the whole file has been
// indexed. That makes the zero-emission assertions below the strongest
// version of the #713 ordering finding.
const IFC4X3_FIXTURE_PATH = 'data/ifc4x3_road_entities_ineligible.ifc'

// Appended as the last record of each synthetic 4X3 file below: IFC4X3-only
// and untranslated, so the file is refused (see IFC4X3_FIXTURE_PATH).
const INELIGIBLE_TAIL =
  "#99=IFCALIGNMENT('3vP000000000000000099',$,'A',$,$,$,$,.NOTDEFINED.);\n"

// StorePreviewChannel only ever builds its first generation (and so only
// ever calls maybeEmitEarlySpatialPlates_/extracts a product) once the live
// sink's topLevelCount reaches FIRST_GENERATION_MIN_RECORDS (1024,
// store_preview_channel.ts) — below that, ensureGeneration_ returns false
// unconditionally and the channel emits nothing, however the schema gate
// is ordered. Every repo-local IFC fixture (all a few KB, a few hundred
// records at most) sits under that floor, so the preview-ordering test
// below needs a fixture that clears it — hence generated rather than
// checked in as a data/ file: 1100 one-line filler records are cheap to
// parse and keep the fixture out of the size budget a committed file would
// cost. This is what makes the ordering assertion able to fail: without
// enough records, StorePreviewChannel.flushAsync() is a no-op regardless
// of where the schema gate sits, and a test built on a small fixture would
// pass whether the ordering fix is present or reverted.
const FILLER_RECORDS = 1100

/**
 * A synthetic IFC4X3_RC2 file large enough (see FILLER_RECORDS above) to
 * clear StorePreviewChannel's FIRST_GENERATION_MIN_RECORDS floor, with a
 * minimal spatial hierarchy (Project/Site/Building/Storey + a contained
 * wall) and a length-unit assignment — the four preconditions
 * maybeEmitEarlySpatialPlates_ checks (IfcProject, IfcUnitAssignment,
 * IfcBuildingStorey, IfcRelAggregates) before it will emit a plate. Shaped
 * after the equivalent IFC4 synthetic fixture in
 * store_preview_channel.test.ts's 'early plates defer until the unit
 * assignment is indexed' test, just relabelled IFC4X3_RC2 and padded out
 * past the record floor.
 *
 * @return {Uint8Array} The synthetic file's bytes.
 */
function bigSyntheticIfc4x3(): Uint8Array {

  let filler = ''

  for ( let i = 0; i < FILLER_RECORDS; ++i ) {
    filler += `#${i + 1000}=IFCCARTESIANPOINT((${i}.,0.,0.));\n`
  }

  const text =
    'ISO-10303-21;\nHEADER;\n' +
    "FILE_DESCRIPTION((''),'2;1');\n" +
    "FILE_NAME('big.ifc','2026-01-01T00:00:00',(''),(''),'','','');\n" +
    "FILE_SCHEMA(('IFC4X3_RC2'));\nENDSEC;\nDATA;\n" +
    filler +
    '#1=IFCCARTESIANPOINT((0.,0.,0.));\n' +
    '#2=IFCAXIS2PLACEMENT3D(#1,$,$);\n' +
    '#3=IFCLOCALPLACEMENT($,#2);\n' +
    "#90=IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);\n" +
    '#91=IFCUNITASSIGNMENT((#90));\n' +
    "#10=IFCPROJECT('3vP000000000000000001',$,'P',$,$,$,$,$,#91);\n" +
    "#11=IFCSITE('3vP000000000000000002',$,'S',$,$,#3,$,$,.ELEMENT.,$,$,$,$,$);\n" +
    "#12=IFCBUILDING('3vP000000000000000003',$,'B',$,$,#3,$,$,.ELEMENT.,$,$,$);\n" +
    "#13=IFCBUILDINGSTOREY('3vP000000000000000004',$,'L0',$,$,#3,$,$,.ELEMENT.,0.);\n" +
    "#20=IFCRELAGGREGATES('3vP000000000000000005',$,$,$,#10,(#11));\n" +
    "#21=IFCRELAGGREGATES('3vP000000000000000006',$,$,$,#11,(#12));\n" +
    "#22=IFCRELAGGREGATES('3vP000000000000000007',$,$,$,#12,(#13));\n" +
    "#30=IFCWALL('3vP000000000000000008',$,$,$,$,#3,$,$,$);\n" +
    "#31=IFCRELCONTAINEDINSPATIALSTRUCTURE" +
    "('3vP000000000000000009',$,$,$,(#30),#13);\n" +
    INELIGIBLE_TAIL +
    'ENDSEC;\nEND-ISO-10303-21;\n'

  return new TextEncoder().encode( text )
}

// codex review of bldrs-ai/conway#713, P1 round 4 (#discussion_r4050179873):
// the old bounded pre-parse sniff (HEADER_PREFIX_BYTES, retried once to
// HEADER_PREFIX_RETRY_BYTES = 4 MiB) ran independently of the real,
// larger-window parse below it. A header exceeding that retry cap but
// still fitting inside the real parse's pool (STORE_PARSE_POOL_BYTES,
// 16 MiB) made the sniff report non-COMPLETE — treated as "leave it for
// the real parse to report", i.e. skip the gate.
const OLD_SNIFF_CAP_BYTES = 4 * 1024 * 1024

/**
 * A synthetic IFC4X3_RC2 file combining {@link bigSyntheticIfc4x3}'s
 * FILLER_RECORDS (clearing StorePreviewChannel's 1024-record floor, so a
 * preview leak has something to leak) with a HEADER section exceeding
 * `OLD_SNIFF_CAP_BYTES` (so the old bounded sniff could not complete it,
 * while the real 16 MiB parse pool still does) — a legal STEP file (a
 * large `FILE_DESCRIPTION`), not a malformed edge case.
 *
 * @return {Uint8Array} The synthetic file's bytes.
 */
function bigHeaderIfc4x3(): Uint8Array {

  let filler = ''

  for ( let i = 0; i < FILLER_RECORDS; ++i ) {
    filler += `#${i + 1000}=IFCCARTESIANPOINT((${i}.,0.,0.));\n`
  }

  const description = 'A'.repeat( OLD_SNIFF_CAP_BYTES + 1024 * 1024 )

  const text =
    'ISO-10303-21;\nHEADER;\n' +
    `FILE_DESCRIPTION(('${description}'),'2;1');\n` +
    "FILE_NAME('big_header.ifc','2026-01-01T00:00:00',(''),(''),'','','');\n" +
    "FILE_SCHEMA(('IFC4X3_RC2'));\nENDSEC;\nDATA;\n" +
    filler +
    '#1=IFCCARTESIANPOINT((0.,0.,0.));\n' +
    '#2=IFCAXIS2PLACEMENT3D(#1,$,$);\n' +
    '#3=IFCLOCALPLACEMENT($,#2);\n' +
    "#90=IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);\n" +
    '#91=IFCUNITASSIGNMENT((#90));\n' +
    "#10=IFCPROJECT('3vP000000000000000001',$,'P',$,$,$,$,$,#91);\n" +
    "#11=IFCSITE('3vP000000000000000002',$,'S',$,$,#3,$,$,.ELEMENT.,$,$,$,$,$);\n" +
    "#12=IFCBUILDING('3vP000000000000000003',$,'B',$,$,#3,$,$,.ELEMENT.,$,$,$);\n" +
    "#13=IFCBUILDINGSTOREY('3vP000000000000000004',$,'L0',$,$,#3,$,$,.ELEMENT.,0.);\n" +
    "#20=IFCRELAGGREGATES('3vP000000000000000005',$,$,$,#10,(#11));\n" +
    "#21=IFCRELAGGREGATES('3vP000000000000000006',$,$,$,#11,(#12));\n" +
    "#22=IFCRELAGGREGATES('3vP000000000000000007',$,$,$,#12,(#13));\n" +
    "#30=IFCWALL('3vP000000000000000008',$,$,$,$,#3,$,$,$);\n" +
    "#31=IFCRELCONTAINEDINSPATIALSTRUCTURE" +
    "('3vP000000000000000009',$,$,$,(#30),#13);\n" +
    INELIGIBLE_TAIL +
    'ENDSEC;\nEND-ISO-10303-21;\n'

  return new TextEncoder().encode( text )
}

let api: IfcAPI

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000)

describe('IfcAPI: IFC4X3 schema gate on the web-ifc compat surface (#713 P1)', () => {

  test('OpenModel (classic/synchronous path) fails closed instead of ' +
      'silently extracting under IFC4 ordinals', () => {

    const buffer = new Uint8Array(fs.readFileSync(IFC4X3_FIXTURE_PATH))

    // Logger.error is expected here -- the factory logs the caught
    // construction error before reporting OpenModel failure. Silenced so
    // this expected-failure test doesn't spam the console; still verified
    // below (the mock was called).
    const errorSpy = jest.spyOn(Logger, 'error').mockImplementation(() => {})

    try {
      const modelID = api.OpenModel(buffer, SETTINGS)

      // -1 is IfcAPI's documented failure return (see OpenModel/from in
      // ifc_api_model_passthrough_factory.ts) -- NOT a valid model ID that
      // happened to extract wrong geometry. A regression here that instead
      // returns >= 0 means the file silently parsed under IFC4.
      expect(modelID).toBe(-1)
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      errorSpy.mockRestore()
    }
  })

  test('OpenModelAsync (cooperative path) fails closed the same way', async () => {

    const buffer = new Uint8Array(fs.readFileSync(IFC4X3_FIXTURE_PATH))

    const errorSpy = jest.spyOn(Logger, 'error').mockImplementation(() => {})

    try {
      const modelID = await api.OpenModelAsync(buffer, SETTINGS)

      expect(modelID).toBe(-1)
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      errorSpy.mockRestore()
    }
  })

  test('an ordinary IFC4 model is unaffected by the gate', () => {

    const buffer = new Uint8Array(fs.readFileSync('data/index.ifc'))

    const modelID = api.OpenModel(buffer, SETTINGS)

    expect(modelID).toBeGreaterThanOrEqual(0)
  })

  // codex review of bldrs-ai/conway#713 (P1, ordering): OpenModelStream
  // (IfcApiProxyIfc.parseColumnarFromStore) used to gate AFTER
  // buildIndexStreamingAsync and storePreview.flushAsync() had already run
  // -- so with ON_PREVIEW_MESH set, a live StorePreviewChannel could emit
  // wrongly IFC4-typed preview meshes for a 4X3 file before the rejection
  // ever fired. This is the compat-surface twin of the plain
  // 'OpenModelStream rejects a 4X3 file with zero preview callbacks' test
  // below, which pins the actual ordering fix; this one just pins that the
  // store-backed open fails closed the same way OpenModel/OpenModelAsync do.
  test('OpenModelStream (store-backed path) fails closed instead of ' +
      'silently extracting under IFC4 ordinals', async () => {

    const bytes = new Uint8Array(fs.readFileSync(IFC4X3_FIXTURE_PATH))
    const store = new InMemoryStepByteStore(bytes)

    const warningSpy = jest.spyOn(Logger, 'warning').mockImplementation(() => {})

    try {
      const modelID = await api.OpenModelStream(store, SETTINGS)

      expect(modelID).toBe(-1)
    } finally {
      warningSpy.mockRestore()
    }
  })

  test('OpenModelStream on an ordinary IFC4 model is unaffected by the gate',
      async () => {

        const bytes = new Uint8Array(fs.readFileSync('data/index.ifc'))
        const store = new InMemoryStepByteStore(bytes)

        const modelID = await api.OpenModelStream(store, SETTINGS)

        expect(modelID).toBeGreaterThanOrEqual(0)

        api.CloseModel(modelID)
      })

  // This is the assertion that actually encodes the ordering finding (P2):
  // a test that only checked the final -1 rejection (the test above) would
  // have passed against the pre-fix code too, since the old code DID
  // eventually reject the file -- just after the preview channel had
  // already had the chance to run during buildIndexStreamingAsync/
  // storePreview.flushAsync(). Uses bigSyntheticIfc4x3() rather than the
  // bare road-entities fixture or any other checked-in data/ file: none of
  // them clear StorePreviewChannel's 1024-record floor (see that
  // function's doc comment), so StorePreviewChannel never reaches its
  // emission path for them regardless of gate placement, and a test built
  // on one would pass whether the ordering fix is present or reverted.
  // Verified by hand against a revert of the ordering fix (the gate moved
  // back to after buildIndexStreamingAsync/storePreview.flushAsync(),
  // matching the pre-fix code): with that revert this test fails,
  // payloads.length > 0 -- see the PR description for the exact count
  // observed.
  test('OpenModelStream emits ZERO preview-mesh callbacks before rejecting ' +
      'a 4X3 model (fail-closed ordering, #713 P2)', async () => {

        const bytes = bigSyntheticIfc4x3()
        const store = new InMemoryStepByteStore(bytes)

        const payloads: PreviewMeshPayload[] = []

        const warningSpy = jest.spyOn(Logger, 'warning').mockImplementation(() => {})

        try {
          const modelID = await api.OpenModelStream(store, {
            ...SETTINGS,
            DEFER_GEOMETRY: true,
            ON_PREVIEW_MESH: (mesh) => {
              payloads.push(mesh)
            },
          })

          expect(modelID).toBe(-1)
          expect(payloads).toHaveLength(0)
        } finally {
          warningSpy.mockRestore()
        }
      })

  // Supplementary coverage for the seam at the proxy level, same shape as
  // conway#713's P1 round 4 finding (#discussion_r4050179873: a header
  // exceeding the old bounded sniff's retry cap but fitting the real
  // parse's pool). NOTE this does not discriminate old vs. new code on
  // THIS path the way the equivalent tests in
  // ifc4x3_schema_gate_stream_open.test.ts do: verified by hand against
  // the pre-seam code (f089f917), this test already passed there too --
  // `parseColumnarFromStore` carried a second, fallback
  // `assertSchemaSupported` call after the parse (see that function's
  // pre-seam history) specifically to catch the case its own up-front
  // sniff could miss, so old code already rejected this shape by the time
  // OpenModelStream returned. Kept anyway as regression coverage that the
  // single-gate seam (`onHeaderParsed`, replacing that two-gate
  // arrangement) still catches it. The round 4 finding itself was on the
  // NATIVE opens in ifc_stream_open.ts, which had no such fallback --
  // those tests are the ones proven to fail against f089f917.
  test('OpenModelStream rejects a 4X3 file whose header exceeds the old ' +
      'bounded-sniff cap but fits the real parse pool, with zero preview ' +
      'callbacks', async () => {

        const bytes = bigHeaderIfc4x3()
        const store = new InMemoryStepByteStore(bytes)

        const payloads: PreviewMeshPayload[] = []

        const warningSpy = jest.spyOn(Logger, 'warning').mockImplementation(() => {})

        try {
          const modelID = await api.OpenModelStream(store, {
            ...SETTINGS,
            DEFER_GEOMETRY: true,
            ON_PREVIEW_MESH: (mesh) => {
              payloads.push(mesh)
            },
          })

          expect(modelID).toBe(-1)
          expect(payloads).toHaveLength(0)
        } finally {
          warningSpy.mockRestore()
        }
      })
})
