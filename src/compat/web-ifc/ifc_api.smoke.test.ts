/* eslint-disable */
// Smoke test for the vendored web-ifc compat surface (`IfcAPI`).
//
// CI's IFC regression exercises Conway's *native* parse path, never the
// compat `IfcAPI` shim. This proves the shim actually works end-to-end —
// open a model, stream geometry, read properties — for the formats Bldrs
// Share drives through it (IFC + STEP/AP214), and that the AP203→AP214
// routing added to the passthrough factory is reachable without throwing.
//
// Boots the wasm the same way src/ifc/ifc_geometry_extraction.test.ts
// does (no SetWasmPath → default locate handler resolves the conway-geom
// wasm from the dist). See design/new/web-ifc-compat-surface.md.
import fs from 'fs'
import { describe, expect, test, beforeAll } from '@jest/globals'
import { IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

let api: IfcAPI

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000)

describe('web-ifc compat IfcAPI', () => {

  test('opens an IFC model, streams geometry, reads properties', async () => {
    const buffer = new Uint8Array(fs.readFileSync('data/index.ifc'))

    const modelID = api.OpenModel(buffer, SETTINGS)
    expect(modelID).toBeGreaterThanOrEqual(0)

    // Geometry: StreamAllMeshes must emit at least one FlatMesh carrying
    // at least one PlacedGeometry.
    let meshCount = 0
    let placedGeometryCount = 0
    api.StreamAllMeshes(modelID, (mesh) => {
      meshCount++
      placedGeometryCount += mesh.geometries.size()
    })
    expect(meshCount).toBeGreaterThan(0)
    expect(placedGeometryCount).toBeGreaterThan(0)

    // Properties: the spatial structure resolves to an IfcProject-rooted
    // tree with a numeric expressID.
    const tree: any = await api.properties.getSpatialStructure(modelID)
    expect(tree).toBeDefined()
    expect(typeof tree.expressID).toBe('number')

    // Item properties for the spatial root come back as an object.
    const rootProps: any = await api.properties.getItemProperties(modelID, tree.expressID)
    expect(rootProps).toBeDefined()

    api.CloseModel(modelID)
  }, 120000)

  test('opens a STEP (AP214) model and streams geometry', async () => {
    const buffer = new Uint8Array(fs.readFileSync('data/create-a-tube.step'))

    const modelID = api.OpenModel(buffer, SETTINGS)
    expect(modelID).toBeGreaterThanOrEqual(0)

    let placedGeometryCount = 0
    api.StreamAllMeshes(modelID, (mesh) => {
      placedGeometryCount += mesh.geometries.size()
    })
    expect(placedGeometryCount).toBeGreaterThan(0)

    api.CloseModel(modelID)
  }, 120000)

  test('routes an AP203 (CONFIG_CONTROL_DESIGN) model through the AP214 loader without throwing', () => {
    // Validates the AP203→AP214 fall-through added to the passthrough
    // factory (the standalone adapter had no AP203 case and errored).
    // Tolerant on the modelID — AP203-via-AP214 parse correctness is
    // tracked separately (step-support.md Phase 4); here we only assert
    // the routing path is reachable and does not throw.
    const buffer = new Uint8Array(fs.readFileSync('data/config-control-design-min.step'))

    let modelID = -2
    expect(() => {
      modelID = api.OpenModel(buffer, SETTINGS)
    }).not.toThrow()
    expect(typeof modelID).toBe('number')
    expect(modelID).toBeGreaterThanOrEqual(-1)

    if (modelID >= 0) {
      api.CloseModel(modelID)
    }
  }, 120000)
})
