// conway#755 / conway#761: property reads on a spilled (windowed) source.
//
// getPropertySets used to (a) read every IfcRelDefinesByProperties record on
// every call, paging each in turn, to find the few naming the element — on a
// windowed 860 MB model every read, first or later, paged the whole file; and (b) page in only each set's own record before
// a recursive (flattened) read, so a set whose properties sat in an evicted
// window threw StepBufferNotResidentError. These pin the fix: an element ->
// relating-IDs index built in one file-order pass on first use, and recursive
// reads that page in the set's whole #ref closure first.
//
// data/windowed_property_sets.ifc puts the properties well ahead of the sets
// that reference them (some after, as forward references), nests a complex
// property two hops deep, and pads the relationship records apart so they
// span many more 512 B windows than the three kept resident here.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { IFCWALL } from './ifc2x4'
import { IfcAPI } from './ifc_api'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }

const FIXTURE = 'data/windowed_property_sets.ifc'
const CHUNK_BYTES = 512
const MAX_RESIDENT_CHUNKS = 3

// Express IDs in the fixture (see its generator's layout).
const WALL_0 = 207
const WALL_1 = 208
const WALL_7 = 220

let api: IfcAPI
let buffer: Uint8Array

beforeAll(async () => {
  api = new IfcAPI()
  await api.Init()

  buffer = new Uint8Array(fs.readFileSync(FIXTURE))
}, 120000)

/** A byte store over `bytes` that records each read's range. */
function countingStore(bytes: Uint8Array): {
  store: InMemoryStepByteStore,
  log: { offset: number, length: number }[],
} {
  const store = new InMemoryStepByteStore(bytes)
  const read = store.read.bind(store)
  const log: { offset: number, length: number }[] = []

  store.read = (offset: number, length: number) => {
    log.push({ offset, length })
    return read(offset, length)
  }
  return { store, log }
}

/** The most times any one byte was read, over `reads`. */
function maxOverlap(reads: { offset: number, length: number }[]): number {
  const edges = reads.flatMap(({ offset, length }) => [[offset, 1], [offset + length, -1]])
  edges.sort((x, y) => (x[0] - y[0]) || (x[1] - y[1]))
  let depth = 0
  let max = 0
  for (const [, delta] of edges) {
    depth += delta
    max = Math.max(max, depth)
  }
  return max
}

/** Every express ID the fixture declares, plus one it does not. */
function allExpressIDs(): number[] {
  const text = new TextDecoder().decode(buffer)
  const ids = [...text.matchAll(/^#(\d+)=/gm)].map((match) => Number(match[1]))

  return [...ids, 0x7fffffff]
}

type Reads = { psets?: any[], types?: any[], materials?: any[] }

/** All three relationship kinds' reads for every ID, in ID order. */
async function readAll(modelID: number, recursive: boolean): Promise<Map<number, Reads>> {
  const reads = new Map<number, Reads>()

  for (const id of allExpressIDs()) {
    reads.set(id, {
      psets: await api.properties.getPropertySets(modelID, id, recursive),
      types: await api.properties.getTypeProperties(modelID, id, recursive),
      materials: await api.properties.getMaterialsProperties(modelID, id, recursive),
    })
  }
  return reads
}

function spilledModel(store: InMemoryStepByteStore): number {
  const modelID = api.OpenModel(buffer, SETTINGS)

  api.SpillModelSource(modelID, store, CHUNK_BYTES, MAX_RESIDENT_CHUNKS)
  return modelID
}

describe('property reads on a spilled source (conway#755, conway#761)', () => {

  test('every entity\'s property sets, read recursively, match the resident open', async () => {
    const resident = api.OpenModel(buffer, SETTINGS)
    const expected = await readAll(resident, true)
    const expectedFlat = await readAll(resident, false)

    api.CloseModel(resident)

    // The fixture exercises what it is meant to: a two-hop flatten, a wall
    // listed twice in one relationship (its set appears once), a wall with
    // sets from two relationships in type-index order, and forward refs.
    const wall1 = expected.get(WALL_1)!.psets!
    expect(wall1.map((set) => set.Name.value)).toEqual(['Common', 'Nested'])
    const nested = wall1[1].HasProperties[0]
    expect(nested.Name.value).toBe('Outer')
    expect(nested.HasProperties[0].Name.value).toBe('Inner')
    expect(nested.HasProperties[0].HasProperties[1].Name.value).toBe('P3_2')
    expect(expected.get(WALL_7)!.psets!.map((set) => set.Name.value)).toEqual(['Qto', 'Common'])
    expect(expected.get(WALL_0)!.psets![1].HasProperties.map((p: any) => p.Name.value))
        .toEqual(['F0', 'F1'])
    expect(expected.get(WALL_0)!.types![0].Name.value).toBe('Wall type')
    expect(expected.get(WALL_7)!.materials![0].Name.value).toBe('Concrete')

    const modelID = spilledModel(new InMemoryStepByteStore(buffer))

    // Seeding only each set's own record threw StepBufferNotResidentError
    // here: on the first nested property in an evicted window.
    expect(await readAll(modelID, true)).toEqual(expected)
    expect(await readAll(modelID, false)).toEqual(expectedFlat)

    api.CloseModel(modelID)
  }, 120000)

  test('building the index pages in no window and reads each byte once', async () => {
    const { store, log } = countingStore(buffer)
    const modelID = spilledModel(store)
    const provider = (api.getPassthrough(modelID) as IfcApiProxyIfc).model[0] as any

    // An ID with no sets: the read is the index build and nothing else.
    expect(await api.properties.getPropertySets(modelID, 0x7fffffff, true)).toEqual([])

    // Record spans read straight from the store. Paging the relationship
    // records' windows instead loads each of the 8 that hold one, and
    // leaves the last 3 resident.
    expect(log.length).toBeGreaterThan(0)
    expect(provider.bufferProvider_.residentChunkCount).toBe(0)
    expect(maxOverlap(log)).toBe(1)
    const read = log.reduce((sum, { length }) => sum + length, 0)
    expect(read).toBeLessThan(buffer.byteLength)

    api.CloseModel(modelID)
  }, 120000)

  test('after the first read, each read pages only its own sets', async () => {
    const { store, log } = countingStore(buffer)
    const modelID = spilledModel(store)

    const first = await api.properties.getPropertySets(modelID, WALL_1, true)
    expect(first).toHaveLength(2)

    // Every later read is a lookup plus its own sets. The old per-read scan
    // paged every relationship window again for each of these: 98 reads.
    const wallIDs = api.GetLineIDsWithType(modelID, IFCWALL)
    const walls = Array.from({ length: wallIDs.size() }, (_, i) => wallIDs.get(i))
    expect(walls).toHaveLength(12)
    const lookups = log.length
    let sets = 0
    for (const wall of walls) {
      sets += (await api.properties.getPropertySets(modelID, wall, false))!.length
    }
    const lookupReads = log.length - lookups

    expect(sets).toBeGreaterThan(walls.length)
    expect(lookupReads).toBeLessThanOrEqual(sets)

    api.CloseModel(modelID)
  }, 120000)

  test('visitRecordBytesInFileOrder visits each record once, in address order, with its own bytes', async () => {
    const { store, log } = countingStore(buffer)
    const modelID = spilledModel(store)
    const model = (api.getPassthrough(modelID) as IfcApiProxyIfc).model[0]
    const resident = api.OpenModel(buffer, SETTINGS)
    const residentModel = (api.getPassthrough(resident) as IfcApiProxyIfc).model[0]

    const ids = allExpressIDs().slice(0, -1).map((id) => model.resolveExpressID(id)!)
    // Reverse order, a repeat, and an out-of-range local ID.
    const requested = [...ids].reverse().concat([ids[3], 1 << 30])

    for (const [maxGap, maxSpan, spans] of [[Infinity, Infinity, 1], [0, Infinity, ids.length]]) {
      log.length = 0
      const visited: number[] = []
      const complex = await model.visitRecordBytesInFileOrder(requested, (localID, bytes) => {
        visited.push(localID)
        const element = residentModel.getElementByLocalID(localID)!
        expect(Array.from(bytes)).toEqual(Array.from(element.extractLineArguments()))
      }, maxGap, maxSpan)

      expect(complex).toEqual([])
      expect(visited).toEqual([...ids].sort((a, b) =>
        model.recordAddress(a)! - model.recordAddress(b)!))
      // One record per line and a newline between: a zero gap never merges.
      expect(log).toHaveLength(spans)
      expect(maxOverlap(log)).toBe(1)
    }
    expect((model as any).bufferProvider_.residentChunkCount).toBe(0)

    api.CloseModel(resident)
    api.CloseModel(modelID)
  }, 120000)

  test('a recursive read leaves no pins or window views behind', async () => {
    const modelID = spilledModel(new InMemoryStepByteStore(buffer))
    const passthrough = api.getPassthrough(modelID) as IfcApiProxyIfc
    const model = passthrough.model[0] as any

    const sets = await api.properties.getPropertySets(modelID, WALL_1, true)
    expect(sets).toHaveLength(2)

    // Every record a flatten of the sets touched is unpinned, so the LRU
    // can evict its window again, and holds no captured window view.
    expect(model.bufferProvider_.ensurePins_.size).toBe(0)
    for (let localID = 0; localID < model.count_; localID++) {
      const item = model.complexEntries_?.get(localID) ?? model.descriptorCache_[localID]

      expect(item?.buffer).toBeUndefined()
    }

    api.CloseModel(modelID)
  }, 120000)
})
