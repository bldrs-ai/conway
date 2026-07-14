// Tests for the spatial structure's `'names'` mode and the
// ReleaseEntityCache extension.
//
// `'names'` returns nodes carrying only Name/LongName/GlobalId value
// handles (read via the typed entities' lazy per-field getters), where
// `true` spreads each node's full flattened attribute record — the
// web-ifc-era eager visit Share is moving off of. Parity requirement:
// `true`-mode output is unchanged by the feature, and `'names'` nodes
// agree with `true` nodes on the attributes they do carry.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { IfcAPI } from './ifc_api'
import { Node } from './properties_passthrough'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

let api: IfcAPI
let modelID: number

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()

  const buffer = new Uint8Array(fs.readFileSync('data/index.ifc'))

  modelID = api.OpenModel(buffer, SETTINGS)
}, 120000)

/** Flatten a spatial tree into a node list, depth first. */
function collect(root: Node): Node[] {
  const out: Node[] = []
  const stack: Node[] = [root]

  while (stack.length > 0) {
    const node = stack.pop()!

    out.push(node)
    stack.push(...(node.children ?? []))
  }
  return out
}

describe('getSpatialStructure names mode', () => {

  test('names mode returns name handles without full records', async () => {
    const tree = await api.properties.getSpatialStructure(modelID, 'names')

    if (tree === undefined) {
      throw new Error('getSpatialStructure returned undefined')
    }

    const nodes = collect(tree)

    expect(nodes.length).toBeGreaterThan(1)

    // At least one node carries a Name handle in web-ifc shape.
    const named = nodes.filter((n) => n.Name !== undefined)

    expect(named.length).toBeGreaterThan(0)
    for (const node of named) {
      expect(node.Name).toEqual({ type: 1, value: expect.any(String) })
    }

    // Non-project nodes are products with GlobalIds.
    const withGlobalId = nodes.filter((n) => n.GlobalId !== undefined)

    expect(withGlobalId.length).toBeGreaterThan(0)

    // Light means light: no node carries full-record fields that only the
    // flattened `true` mode spreads in (e.g. OwnerHistory / Description).
    for (const node of nodes) {
      expect((node as any).OwnerHistory).toBeUndefined()
      expect((node as any).Description).toBeUndefined()
    }
  }, 120000)

  test('names mode agrees with true mode where they overlap', async () => {
    const namesTree = await api.properties.getSpatialStructure(modelID, 'names')
    const fullTree = await api.properties.getSpatialStructure(modelID, true)

    if (namesTree === undefined || fullTree === undefined) {
      throw new Error('getSpatialStructure returned undefined')
    }

    const namesByID = new Map(collect(namesTree).map((n) => [n.expressID, n]))
    const fullNodes = collect(fullTree)

    // Same tree shape.
    expect(namesByID.size).toBe(fullNodes.length)

    // Full mode still carries full records (parity with the old behavior)...
    const fullWithOwnerHistory =
      fullNodes.filter((n) => (n as any).OwnerHistory !== undefined)

    expect(fullWithOwnerHistory.length).toBeGreaterThan(0)

    // ...and wherever full mode has a Name value, names mode has the same one.
    for (const fullNode of fullNodes) {
      const fullName = (fullNode as any).Name

      if (fullName === null || fullName === undefined) {
        continue
      }

      const namesNode = namesByID.get(fullNode.expressID)!

      expect(namesNode.Name?.value).toBe(fullName.value)
    }
  }, 120000)

  test('ReleaseEntityCache frees and property access rematerialises', async () => {
    const before: any =
      await api.properties.getItemProperties(modelID, await rootID())

    api.ReleaseEntityCache(modelID)

    const after: any =
      await api.properties.getItemProperties(modelID, await rootID())

    expect(after).toEqual(before)

    // The spatial structure still resolves post-release too.
    const tree = await api.properties.getSpatialStructure(modelID, 'names')

    expect(tree?.children.length).toBeGreaterThan(0)
  }, 120000)
})

/** Get the IfcProject root express ID. */
async function rootID(): Promise<number> {
  const tree = await api.properties.getSpatialStructure(modelID)

  if (tree === undefined) {
    throw new Error('getSpatialStructure returned undefined')
  }
  return tree.expressID
}
