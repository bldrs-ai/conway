/* eslint-disable no-magic-numbers */
// Integration tests for source-buffer spill (windowed residency).
//
// Parity requirement: after `SpillModelSource`, every record decodes
// byte-for-byte identically through the windowed provider — the async
// property APIs page ranges in via `ensureResident` and produce the
// same output as the fully-resident model. Tiny chunks + a tiny
// residency cap force straddling records and LRU eviction on the
// small fixture.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// Tiny windows so the fixture exercises chunk straddles + eviction.
const CHUNK_BYTES = 512
const MAX_RESIDENT_CHUNKS = 3

let api: IfcAPI
let buffer: Uint8Array

/** Open a fresh model from the shared fixture bytes. */
function openModel(): number {
  return api.OpenModel(buffer, SETTINGS)
}

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array(fs.readFileSync('data/index.ifc'))
}, 120000)

describe('SpillModelSource', () => {

  test('property reads are identical before and after a spill', async () => {
    const modelID = openModel()
    const passthrough = api.getPassthrough(modelID)!

    // Snapshot every record through the resident path first.
    const lineIDs = passthrough.getAllLines()
    const before = new Map<number, any>()

    for (let i = 0; i < lineIDs.size(); i++) {
      const expressID = lineIDs.get(i)

      before.set(expressID, await api.properties.getItemProperties(modelID, expressID))
    }

    expect(before.size).toBeGreaterThan(10)

    const spilled = api.SpillModelSource(
        modelID, new InMemoryStepByteStore(buffer), CHUNK_BYTES, MAX_RESIDENT_CHUNKS)

    expect(spilled).toBe(true)

    // Every record decodes identically through windows. Iterating in
    // the same order with a 3-chunk cap forces continuous paging.
    for (const [expressID, expected] of before) {
      const after = await api.properties.getItemProperties(modelID, expressID)

      expect(after).toEqual(expected)
    }

    api.CloseModel(modelID)
  }, 120000)

  test('spatial tree (names mode) and property sets survive a spill', async () => {
    const modelID = openModel()

    const treeBefore = await api.properties.getSpatialStructure(modelID, 'names')
    const psetsBeforeByProduct = new Map<number, any>()

    // Snapshot psets for a handful of products found in the tree.
    const stack = [treeBefore]
    const productIDs: number[] = []

    while (stack.length > 0 && productIDs.length < 8) {
      const node = stack.pop()! as any

      if (typeof node.expressID === 'number') {
        productIDs.push(node.expressID)
      }
      stack.push(...(node.children ?? []))
    }

    for (const id of productIDs) {
      psetsBeforeByProduct.set(id, await api.properties.getPropertySets(modelID, id))
    }

    api.SpillModelSource(
        modelID, new InMemoryStepByteStore(buffer), CHUNK_BYTES, MAX_RESIDENT_CHUNKS)

    const treeAfter = await api.properties.getSpatialStructure(modelID, 'names')

    expect(treeAfter).toEqual(treeBefore)

    for (const [id, expected] of psetsBeforeByProduct) {
      expect(await api.properties.getPropertySets(modelID, id)).toEqual(expected)
    }

    api.CloseModel(modelID)
  }, 120000)

  test('synchronous reads without ensureResident throw after a spill', () => {
    const modelID = openModel()
    const passthrough = api.getPassthrough(modelID)! as any

    const lineIDs = passthrough.getAllLines()
    const firstID = lineIDs.get(0)

    // Resident: sync getLine works.
    expect(passthrough.getLine(firstID)).toBeDefined()

    api.SpillModelSource(
        modelID, new InMemoryStepByteStore(buffer), CHUNK_BYTES, MAX_RESIDENT_CHUNKS)

    // Spilled + nothing resident: the sync path must fail loudly, not
    // silently return wrong bytes.
    expect(() => passthrough.getLine(firstID)).toThrow(/not resident/)

    api.CloseModel(modelID)
  }, 120000)

  test('spill rejects a store whose size does not match the source', () => {
    const modelID = openModel()

    const wrongStore = new InMemoryStepByteStore(buffer.subarray(0, buffer.byteLength - 1))

    expect(() => api.getPassthrough(modelID)!
        .spillSourceToExternalStore!(wrongStore, CHUNK_BYTES, MAX_RESIDENT_CHUNKS))
        .toThrow(/does not match/)

    api.CloseModel(modelID)
  }, 120000)

  test('ReleaseEntityCache keeps working on a spilled model', async () => {
    const modelID = openModel()
    const passthrough = api.getPassthrough(modelID)!

    const lineIDs = passthrough.getAllLines()
    const someID = lineIDs.get(Math.floor(lineIDs.size() / 2))

    const expected = await api.properties.getItemProperties(modelID, someID)

    api.SpillModelSource(
        modelID, new InMemoryStepByteStore(buffer), CHUNK_BYTES, MAX_RESIDENT_CHUNKS)
    api.ReleaseEntityCache(modelID)

    expect(await api.properties.getItemProperties(modelID, someID)).toEqual(expected)

    api.CloseModel(modelID)
  }, 120000)
})
