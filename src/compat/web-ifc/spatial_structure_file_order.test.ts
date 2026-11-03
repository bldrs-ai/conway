// conway#752: getSpatialStructure('names') on a spilled (windowed) source.
//
// The walk used to (a) walk every subtree once per relationship kind,
// because aggregation and spatial containment share one chunk map keyed by
// the relating ID, so 2^depth walks of each subtree; and (b) page each node in
// tree order, so a model whose spatial nodes sit across the file re-read the
// same windows over and over (PSB: 21.5 GB read for an 860 MB file). These
// pin the fix: one name read per reachable node, a bounded number of window
// reads, the same tree as the resident walk, and no window views held after.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { IfcAPI } from './ifc_api'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc'
import { Node } from './properties_passthrough'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

// Tiny windows: index.ifc (18 KB) spans 36 of them, three resident at once,
// so tree-order paging thrashes the way PSB does at full scale.
const CHUNK_BYTES = 512
const MAX_RESIDENT_CHUNKS = 3

let api: IfcAPI
let buffer: Uint8Array

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array(fs.readFileSync('data/index.ifc'))
}, 120000)

/** Distinct express IDs in a spatial tree. */
function treeIDs(root: Node): Set<number> {
  const ids = new Set<number>()
  const stack: Node[] = [root]

  while (stack.length > 0) {
    const node = stack.pop()!

    ids.add(node.expressID)
    stack.push(...(node.children ?? []))
  }
  return ids
}

/** A byte store over `bytes` that counts its reads, per window offset. */
function countingStore(bytes: Uint8Array): {
  store: InMemoryStepByteStore,
  reads: () => number,
  readsByOffset: Map<number, number>,
} {
  const store = new InMemoryStepByteStore(bytes)
  const read = store.read.bind(store)
  const readsByOffset = new Map<number, number>()
  let reads = 0

  store.read = (offset: number, length: number) => {
    reads++
    readsByOffset.set(offset, (readsByOffset.get(offset) ?? 0) + 1)
    return read(offset, length)
  }
  return { store, reads: () => reads, readsByOffset }
}

describe('getSpatialStructure names mode, file-order walk (conway#752)', () => {

  test('builds each node once and reads its names once', async () => {
    const modelID = api.OpenModel(buffer, SETTINGS)
    const passthrough = api.getPassthrough(modelID) as IfcApiProxyIfc
    const read = passthrough.getLineNameAttributes.bind(passthrough)
    const calls = new Map<number, number>()

    passthrough.getLineNameAttributes = (expressID: number) => {
      calls.set(expressID, (calls.get(expressID) ?? 0) + 1)
      return read(expressID)
    }

    // newNode runs once per visit of a child, so it counts subtree walks:
    // the per-relationship-kind double walk built each node 2^depth times.
    const properties = passthrough.properties as any
    const newNode = properties.newNode
    const built = new Map<number, number>()

    properties.newNode = function(id: number) {
      built.set(id, (built.get(id) ?? 0) + 1)
      return newNode.call(this, id)
    }

    let tree
    try {
      tree = await api.properties.getSpatialStructure(modelID, 'names')
    } finally {
      delete properties.newNode
    }
    if (tree === undefined) {
      throw new Error('getSpatialStructure returned undefined')
    }
    const ids = treeIDs(tree)

    // The fixture's tree is deep enough that a per-kind double walk
    // multiplies reads (project > site > building > storey > elements).
    expect(ids.size).toBeGreaterThan(5)
    expect(new Set(calls.keys())).toEqual(ids)
    for (const [, count] of calls) {
      expect(count).toBe(1)
    }
    // Every node but the project (built by newIfcProject) is built once.
    expect(built.size).toBe(ids.size - 1)
    for (const [, count] of built) {
      expect(count).toBe(1)
    }

    api.CloseModel(modelID)
  }, 120000)

  test('a spilled walk reads each window a bounded number of times and builds the same tree', async () => {
    const resident = api.OpenModel(buffer, SETTINGS)
    const expected = await api.properties.getSpatialStructure(resident, 'names')

    api.CloseModel(resident)

    const modelID = api.OpenModel(buffer, SETTINGS)
    const { store, reads, readsByOffset } = countingStore(buffer)

    api.SpillModelSource(modelID, store, CHUNK_BYTES, MAX_RESIDENT_CHUNKS)

    const before = reads()
    readsByOffset.clear()
    const tree = await api.properties.getSpatialStructure(modelID, 'names')
    const walkReads = reads() - before
    const chunks = Math.ceil(buffer.byteLength / CHUNK_BYTES)

    expect(tree).toEqual(expected)

    // Two file-order passes (relationship rows, then node names), each
    // reading a window at most once, so no window is read more than twice.
    // On this fixture the old walk read 137 windows; one window up to 18
    // times. (Three resident windows is small enough that the names pass can
    // re-read windows the relationship pass left behind, so 2, not 1.)
    expect(walkReads).toBeGreaterThan(0)
    expect(walkReads).toBeLessThanOrEqual(2 * chunks)
    expect(Math.max(...readsByOffset.values())).toBeLessThanOrEqual(2)

    api.CloseModel(modelID)
  }, 120000)

  test('visitResidentInFileOrder visits once, in address order, and drops window views', async () => {
    const modelID = api.OpenModel(buffer, SETTINGS)
    const passthrough = api.getPassthrough(modelID) as IfcApiProxyIfc
    const model = passthrough.model[0]

    api.SpillModelSource(
        modelID, new InMemoryStepByteStore(buffer), CHUNK_BYTES, MAX_RESIDENT_CHUNKS)

    const tree = await api.properties.getSpatialStructure(modelID, 'names')
    if (tree === undefined) {
      throw new Error('getSpatialStructure returned undefined')
    }
    // Reverse of the file order, with a repeat and an unknown ID.
    const ids = [...treeIDs(tree)].sort((a, b) => b - a)
    const unknown = 0x7fffffff
    const requested = [...ids, ids[0], unknown]
    const visited: number[] = []

    await model.visitResidentInFileOrder(requested, (expressID) => {
      visited.push(expressID)
      // Resident inside the visit: a synchronous read must not throw.
      passthrough.getLineNameAttributes(expressID)
    })

    expect(visited.filter((id) => id === unknown)).toHaveLength(1)
    expect(visited.filter((id) => id === ids[0])).toHaveLength(1)
    expect(visited).toHaveLength(ids.length + 1)

    const addressOf = (expressID: number) =>
      model.recordAddress(model.resolveExpressID(expressID)!)!
    const known = visited.filter((id) => id !== unknown)
    const addresses = known.map(addressOf)

    expect(addresses).toEqual([...addresses].sort((a, b) => a - b))

    // No visited record still holds a captured window view, so the LRU can
    // evict every window the walk touched.
    const internals = model as any
    for (const expressID of known) {
      const localID = model.resolveExpressID(expressID)!
      const item = internals.complexEntries_?.get(localID) ?? internals.descriptorCache_[localID]

      expect(item?.buffer).toBeUndefined()
    }

    api.CloseModel(modelID)
  }, 120000)
})
