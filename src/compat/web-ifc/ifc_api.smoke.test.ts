/* eslint-disable */
// Smoke test for the vendored web-ifc compat surface (`IfcAPI`).
//
// CI's IFC regression exercises Conway's *native* parse path, never the
// compat `IfcAPI` shim. This proves the shim actually works end-to-end —
// open a model, stream geometry, read properties — for the formats Bldrs
// Share drives through it (IFC + STEP/AP214), and that the AP203→AP214
// routing added to the passthrough factory is reachable.
//
// Boots the wasm the same way src/ifc/ifc_geometry_extraction.test.ts
// does (no SetWasmPath → default locate handler resolves the conway-geom
// wasm from the dist). See design/new/web-ifc-compat-surface.md.
//
// NOTE: the models are intentionally NOT closed between tests.
// `IfcAPI.CloseModel` calls `conwaywasm.destroy()` on the single shared
// ConwayGeometry created in beforeAll, which would tear down the wasm the
// remaining tests reuse. One wasm lives for the whole file; Jest reaps it
// when the worker exits.
import fs from 'fs'
import { describe, expect, test, beforeAll, jest } from '@jest/globals'
import { IfcAPI } from './ifc_api'
import Logger from '../../logging/logger'

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

    // Properties: the spatial structure resolves to a real IfcProject-rooted
    // tree (numeric expressID, non-empty children), and item properties for
    // the root round-trip the same expressID back.
    const tree = await api.properties.getSpatialStructure(modelID)
    // getSpatialStructure returns `Node | undefined` (the passthrough is
    // optional-chained). Narrow it — undefined here is itself a failure.
    if (tree === undefined) {
      throw new Error('getSpatialStructure returned undefined for the IFC model')
    }
    expect(typeof tree.expressID).toBe('number')
    expect(Array.isArray(tree.children)).toBe(true)
    expect(tree.children.length).toBeGreaterThan(0)

    const rootProps: any = await api.properties.getItemProperties(modelID, tree.expressID)
    expect(rootProps.expressID).toBe(tree.expressID)
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
  }, 120000)

  test('STEP: each PlacedGeometry carries its occurrence path, matching the tree', async () => {
    // The Share-facing contract for per-occurrence selection: a reused part
    // (the nut, placed under every l-bracket-assembly) streams one
    // PlacedGeometry per occurrence, each tagged with the unique occurrence
    // path — even though they share a geometryExpressID (the part type).
    const buffer = new Uint8Array(fs.readFileSync('data/as1-oc-214.stp'))

    const modelID = api.OpenModel(buffer, SETTINGS)
    expect(modelID).toBeGreaterThanOrEqual(0)

    const meshPaths: string[] = []
    api.StreamAllMeshes(modelID, (mesh) => {
      for (let i = 0; i < mesh.geometries.size(); i++) {
        const placed: any = mesh.geometries.get(i)
        meshPaths.push(JSON.stringify(placed.occurrencePath ?? []))
      }
    })

    // Every instance has a non-empty, unique occurrence path -> a pick resolves
    // to one occurrence, not the shared part type.
    expect(meshPaths.length).toBeGreaterThan(0)
    expect(meshPaths.every((p) => p !== '[]')).toBe(true)
    expect(new Set(meshPaths).size).toBe(meshPaths.length)

    // ...and the streamed paths are exactly the product-structure leaf paths.
    const tree: any = await api.properties.getSpatialStructure(modelID)
    const leafPaths: string[] = []
    const walk = (node: any) => {
      const children = node.children ?? []
      if (children.length === 0) leafPaths.push(JSON.stringify(node.occurrencePath))
      for (const child of children) walk(child)
    }
    walk(tree)
    expect(meshPaths.slice().sort()).toEqual(leafPaths.slice().sort())
  }, 120000)

  test('routes an AP203 (CONFIG_CONTROL_DESIGN) model through the AP214 loader', () => {
    // Validates the AP203→AP214 fall-through added to the passthrough
    // factory (the standalone adapter had no AP203 case and errored).
    // OpenModel catches construction errors internally and returns -1, so
    // it never throws — asserting "doesn't throw" proves nothing. Instead
    // assert the AP203 branch was actually entered, by spying on the
    // factory's `Logger.warning('AP203 Step Detected, using AP214 loader')`.
    // AP203-via-AP214 parse correctness is tracked separately
    // (step-support.md Phase 4).
    const buffer = new Uint8Array(fs.readFileSync('data/config-control-design-min.step'))

    const warnSpy = jest.spyOn(Logger, 'warning').mockImplementation(() => {})
    try {
      api.OpenModel(buffer, SETTINGS)
      expect(warnSpy).toHaveBeenCalledWith('AP203 Step Detected, using AP214 loader')
    } finally {
      warnSpy.mockRestore()
    }
  }, 120000)
})
