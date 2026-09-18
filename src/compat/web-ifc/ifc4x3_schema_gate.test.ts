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

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// The same small synthetic IFC4X3_RC2 fixture ifc4x3_step_model.test.ts
// uses (see that file for why it's synthetic and where its counts come
// from) — any FILE_SCHEMA(('IFC4X3_RC2')) file exercises this gate.
const IFC4X3_FIXTURE_PATH = 'data/ifc4x3_road_entities.ifc'

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
})
