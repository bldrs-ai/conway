/* eslint-disable no-magic-numbers */
// Tests for the roots-only express ID iterator (RootExpressIDs).
//
// Parity requirement: the iterator yields exactly the GlobalId-bearing
// (IfcRoot-derived) records — no geometric resources — and it must do so
// straight from the type index: no descriptor materialisation and no
// source-buffer reads, so it keeps working on a spilled model with
// nothing resident (where sync getLine throws).
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// Tiny windows force the spilled model to have ~nothing resident.
const CHUNK_BYTES = 512
const MAX_RESIDENT_CHUNKS = 3

let api: IfcAPI
let buffer: Uint8Array

/** Open a fresh model from the shared fixture bytes. */
function openModel(): number {
  return api.OpenModel(buffer, SETTINGS)
}

/**
 * Collect the distinct express IDs of records whose decoded properties
 * carry a GlobalId — the ground truth the type-index iterator must match.
 *
 * @param modelID The model to sweep.
 * @return {Promise<Set<number>>} Express IDs of GlobalId-bearing records.
 */
async function globalIdBearingIDs(modelID: number): Promise<Set<number>> {
  const lineIDs = api.getPassthrough(modelID)!.getAllLines()
  const result = new Set<number>()

  for (let i = 0; i < lineIDs.size(); i++) {
    const expressID = lineIDs.get(i)
    const properties = await api.properties.getItemProperties(modelID, expressID)

    if (properties?.GlobalId !== void 0 && properties?.GlobalId !== null) {
      result.add(expressID)
    }
  }

  return result
}

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array(fs.readFileSync('data/index.ifc'))
}, 120000)

describe('RootExpressIDs', () => {

  test('yields exactly the GlobalId-bearing records', async () => {
    const modelID = openModel()

    const expected = await globalIdBearingIDs(modelID)

    // Multi-mapped entities may repeat, so dedupe through a Set.
    const roots = new Set(api.RootExpressIDs(modelID)!)

    expect(roots.size).toBeGreaterThan(10)
    expect(roots).toEqual(expected)

    // And strictly fewer records than the whole model — the point is
    // skipping the geometric resources.
    const totalLines = api.getPassthrough(modelID)!.getAllLines().size()

    expect(roots.size).toBeLessThan(totalLines)

    api.CloseModel(modelID)
  }, 120000)

  test('works on a spilled model with nothing resident', async () => {
    const modelID = openModel()
    const passthrough = api.getPassthrough(modelID)! as any

    const before = new Set(api.RootExpressIDs(modelID)!)
    const firstID = passthrough.getAllLines().get(0)

    api.SpillModelSource(
        modelID, new InMemoryStepByteStore(buffer), CHUNK_BYTES, MAX_RESIDENT_CHUNKS)
    api.ReleaseEntityCache(modelID)

    // Sanity: the sync record path really is non-resident here...
    expect(() => passthrough.getLine(firstID)).toThrow(/not resident/)

    // ...yet the iterator never touches the source buffer, so it still
    // yields the identical set.
    expect(new Set(api.RootExpressIDs(modelID)!)).toEqual(before)

    api.CloseModel(modelID)
  }, 120000)

  test('returns undefined for a missing model', () => {
    expect(api.RootExpressIDs(999999)).toBeUndefined()
  })
})
