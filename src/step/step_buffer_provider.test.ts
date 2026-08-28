/* eslint-disable no-magic-numbers */
// Unit tests for the STEP source-buffer residency providers.
//
// The windowed provider is exercised with deliberately tiny chunks so
// straddling records, LRU eviction, and in-flight de-duplication all
// trigger on small fixtures.
import { describe, expect, test } from '@jest/globals'

import {
  InMemoryStepByteStore,
  ResidentStepBufferProvider,
  StepBufferNotResidentError,
  StepExternalByteStore,
  stepBufferBase,
  WindowedStepBufferProvider,
} from './step_buffer_provider'


/** Build test bytes 0..n-1 mod 256 so any slice is content-checkable. */
function makeBytes(count: number): Uint8Array {
  const bytes = new Uint8Array(count)

  for (let where = 0; where < count; ++where) {
    bytes[where] = where % 256
  }
  return bytes
}

describe('ResidentStepBufferProvider', () => {

  test('acquires the whole buffer at offset 0 and is always resident', async () => {
    const bytes = makeBytes(64)
    const provider = new ResidentStepBufferProvider(bytes)

    expect(provider.byteLength).toBe(64)
    expect(provider.residentBytes).toBe(64)

    const acquisition = provider.acquire()

    expect(acquisition.buffer).toBe(bytes)
    expect(acquisition.offset).toBe(0)
    expect(stepBufferBase(acquisition.buffer)).toBe(0)

    await expect(provider.ensureResident()).resolves.toBeUndefined()
  })
})

describe('WindowedStepBufferProvider', () => {

  test('throws StepBufferNotResidentError before ensureResident', () => {
    const provider = new WindowedStepBufferProvider(
        new InMemoryStepByteStore(makeBytes(100)), 16, 4)

    expect(() => provider.acquire(0, 8)).toThrow(StepBufferNotResidentError)
  })

  test('serves a single-chunk range as a view over the chunk', async () => {
    const bytes = makeBytes(100)
    const provider = new WindowedStepBufferProvider(new InMemoryStepByteStore(bytes), 16, 4)

    await provider.ensureResident(20, 8)

    const acquisition = provider.acquire(20, 8)

    // Chunk index 1 covers [16, 32).
    expect(acquisition.offset).toBe(16)
    expect(stepBufferBase(acquisition.buffer)).toBe(16)
    expect(Array.from(acquisition.buffer.subarray(20 - 16, 28 - 16)))
        .toEqual(Array.from(bytes.subarray(20, 28)))
  })

  test('merges a straddling range into a per-record copy based at the range', async () => {
    const bytes = makeBytes(100)
    const provider = new WindowedStepBufferProvider(new InMemoryStepByteStore(bytes), 16, 8)

    // [12, 40) spans chunks 0, 1 and 2.
    await provider.ensureResident(12, 28)

    const acquisition = provider.acquire(12, 28)

    expect(acquisition.offset).toBe(12)
    expect(stepBufferBase(acquisition.buffer)).toBe(12)
    expect(acquisition.buffer.byteLength).toBe(28)
    expect(Array.from(acquisition.buffer)).toEqual(Array.from(bytes.subarray(12, 40)))
  })

  test('clamps the final short chunk', async () => {
    const bytes = makeBytes(20)
    const provider = new WindowedStepBufferProvider(new InMemoryStepByteStore(bytes), 16, 4)

    await provider.ensureResident(16, 4)

    const acquisition = provider.acquire(16, 4)

    expect(acquisition.offset).toBe(16)
    expect(acquisition.buffer.byteLength).toBe(4)
    expect(Array.from(acquisition.buffer)).toEqual(Array.from(bytes.subarray(16, 20)))
  })

  test('evicts least-recently-used chunks beyond the cap, sparing the current range', async () => {
    const bytes = makeBytes(160)
    const provider = new WindowedStepBufferProvider(new InMemoryStepByteStore(bytes), 16, 2)

    await provider.ensureResident(0, 8)    // chunk 0
    await provider.ensureResident(16, 8)   // chunk 1
    await provider.ensureResident(32, 8)   // chunk 2 → chunk 0 evicted

    expect(provider.residentChunkCount).toBe(2)
    expect(() => provider.acquire(0, 8)).toThrow(StepBufferNotResidentError)
    expect(() => provider.acquire(16, 8)).not.toThrow()
    expect(() => provider.acquire(32, 8)).not.toThrow()

    // Touch chunk 1 (recency), then load chunk 4 — chunk 2 goes, not 1.
    provider.acquire(16, 8)
    await provider.ensureResident(64, 8)

    expect(() => provider.acquire(16, 8)).not.toThrow()
    expect(() => provider.acquire(32, 8)).toThrow(StepBufferNotResidentError)
  })

  test('pinRange holds a chunk across later ensures that would evict it', async () => {
    const bytes = makeBytes(160)
    const provider = new WindowedStepBufferProvider(new InMemoryStepByteStore(bytes), 16, 2)

    await provider.ensureResident(0, 8)
    provider.pinRange(0, 8)
    await provider.ensureResident(16, 8)
    await provider.ensureResident(32, 8)
    await provider.ensureResident(48, 8)

    expect(() => provider.acquire(0, 8)).not.toThrow()

    provider.unpinRange(0, 8)
    await provider.ensureResident(64, 8)
    await provider.ensureResident(80, 8)

    expect(() => provider.acquire(0, 8)).toThrow(StepBufferNotResidentError)
  })

  test('de-duplicates concurrent in-flight chunk loads', async () => {
    const bytes = makeBytes(64)
    let reads = 0

    const countingStore: StepExternalByteStore = {
      byteLength: bytes.byteLength,
      read(offset: number, length: number): Promise< Uint8Array > {
        ++reads
        return Promise.resolve(bytes.slice(offset, offset + length))
      },
    }

    const provider = new WindowedStepBufferProvider(countingStore, 16, 4)

    await Promise.all([
      provider.ensureResident(0, 8),
      provider.ensureResident(4, 8),
      provider.ensureResident(8, 8),
    ])

    expect(reads).toBe(1)
    expect(provider.residentChunkCount).toBe(1)
  })

  test('residentBytes tracks the resident working set', async () => {
    const bytes = makeBytes(64)
    const provider = new WindowedStepBufferProvider(new InMemoryStepByteStore(bytes), 16, 2)

    expect(provider.residentBytes).toBe(0)

    await provider.ensureResident(0, 40)  // chunks 0,1,2 → cap 2 evicts one

    expect(provider.residentChunkCount).toBeLessThanOrEqual(3)
    expect(provider.residentBytes).toBeGreaterThan(0)
    expect(provider.residentBytes).toBeLessThanOrEqual(48)
  })

  test('an overlapping ensure cannot evict chunks another in-flight ensure covers', async () => {
    // Regression pin for the ensure/acquire interleave: caller A
    // ensures chunk 3, and while A's continuation hasn't acquired yet,
    // caller B's ensure (different range) triggers eviction. B must
    // not evict A's pinned chunk even when everything older than it is
    // B's own (protected) range.
    const bytes = makeBytes(160)

    let releaseRead: (() => void) | undefined
    const gate = new Promise<void>((resolve) => {
      releaseRead = resolve
    })

    const slowStore: StepExternalByteStore = {
      byteLength: bytes.byteLength,
      async read(offset: number, length: number): Promise< Uint8Array > {
        // Only chunk 3 (offset 48) is slow, so B's ensure completes
        // while A's is still in flight.
        if (offset === 48) {
          await gate
        }
        return bytes.slice(offset, offset + length)
      },
    }

    const provider = new WindowedStepBufferProvider(slowStore, 16, 2)

    const ensureA = provider.ensureResident(48, 8)   // chunk 3, gated

    releaseRead!()

    // B loads two chunks — with cap 2 this forces eviction pressure
    // right as A's chunk lands.
    await provider.ensureResident(0, 24)             // chunks 0,1
    await ensureA

    expect(() => provider.acquire(48, 8)).not.toThrow()
  })

  test('a range needed by the current ensure is never evicted by it', async () => {
    const bytes = makeBytes(160)
    // Cap of 2 but the range needs 3 chunks — all three must survive
    // long enough for the acquire that follows.
    const provider = new WindowedStepBufferProvider(new InMemoryStepByteStore(bytes), 16, 2)

    await provider.ensureResident(0, 48)

    expect(() => provider.acquire(0, 48)).not.toThrow()
  })
})


/** Store over synthesised bytes that counts the reads it serves. */
function countingStore(byteLength: number): StepExternalByteStore & {reads: number} {

  const store = {
    reads: 0,
    byteLength,
    read(offset: number, length: number): Promise< Uint8Array > {
      ++store.reads

      const bytes = new Uint8Array(length)

      for (let where = 0; where < length; ++where) {
        bytes[where] = (offset + where) % 256
      }
      return Promise.resolve(bytes)
    },
  }

  return store
}

/** Store that reports a size but never actually serves bytes. */
function sizedStore(byteLength: number): StepExternalByteStore {
  return {byteLength, read: () => Promise.resolve(new Uint8Array(0))}
}

// The adaptive residency policy from issue #616. A load whose working set
// exceeds the window re-reads the same chunks forever (D3D.ifc: 47.1 GB from
// a 213.6 MB file); a load that sweeps forwards does not, and must not pay
// for a bigger window it cannot use. These pin both sides of that split, and
// the rule that decides which callers get a policy at all.
describe('WindowedStepBufferProvider adaptive residency', () => {

  const CHUNK = 16

  // One chunk more than the cap is LRU's worst case: the chunk needed next
  // is always the one just evicted, so every request is a capacity miss.
  const THRASH_CHUNKS = 6

  // One policy evaluation interval is 4096 chunk requests.
  const PAST_ONE_INTERVAL = 4200

  /**
   * Cycle a working set through the provider, one chunk per request.
   *
   * @param provider The provider under test.
   * @param requests How many requests to issue.
   * @param workingSet How many distinct chunks to cycle over.
   * @return {Promise< void >} Resolves when done.
   */
  async function cycle(
      provider: WindowedStepBufferProvider,
      requests: number,
      workingSet: number): Promise< void > {

    for (let step = 0; step < requests; ++step) {
      await provider.ensureResident((step % workingSet) * CHUNK, 1)
    }
  }

  test('grows the cap when a thrashing working set produces capacity misses', async () => {
    const store = countingStore(CHUNK * 64)
    const provider = new WindowedStepBufferProvider(store, CHUNK, 4, true)

    expect(provider.residencyCapChunks).toBe(4)

    await cycle(provider, PAST_ONE_INTERVAL, THRASH_CHUNKS)

    expect(provider.residencyCapChunks).toBe(8)

    // The working set now fits, so a further pass over it reads nothing —
    // which is the whole point of having grown.
    const readsAfterGrowth = store.reads

    await cycle(provider, 600, THRASH_CHUNKS)

    expect(store.reads).toBe(readsAfterGrowth)
  })

  test('does not grow on a forward sweep, whose misses are all compulsory', async () => {
    const sweepChunks = 5000
    const store = countingStore(CHUNK * sweepChunks)
    const provider = new WindowedStepBufferProvider(store, CHUNK, 4, true)

    for (let chunk = 0; chunk < sweepChunks; ++chunk) {
      await provider.ensureResident(chunk * CHUNK, 1)
    }

    // More requests than an interval, and more misses than any trigger —
    // but no chunk is ever asked for twice, so no window would have helped.
    expect(store.reads).toBe(sweepChunks)
    expect(provider.residencyCapChunks).toBe(4)
  })

  test('an explicitly-capped provider is a hard budget and never grows', async () => {
    const store = countingStore(CHUNK * 64)
    const provider = new WindowedStepBufferProvider(store, CHUNK, 4)

    expect(provider.adaptiveResidencyCapChunks).toBe(4)

    await cycle(provider, PAST_ONE_INTERVAL, THRASH_CHUNKS)

    expect(provider.residencyCapChunks).toBe(4)
    expect(provider.residentChunkCount).toBeLessThanOrEqual(4)

    // Still thrashing: one read per request, exactly as before #616.
    expect(store.reads).toBe(PAST_ONE_INTERVAL)
  })

  test('bounds growth by the 256 MiB ceiling and by the store size', () => {
    const MIB = 1024 * 1024

    // 1 GB store at the shipped 4 MiB chunk — the byte ceiling binds.
    expect(new WindowedStepBufferProvider(sizedStore(1024 * MIB))
        .adaptiveResidencyCapChunks).toBe(64)

    // 100 MB store — the store binds first, so the window can at most
    // become the whole file, which is what the resident provider holds.
    expect(new WindowedStepBufferProvider(sizedStore(100 * MIB))
        .adaptiveResidencyCapChunks).toBe(25)

    // An explicit cap opts out, however large the store.
    expect(new WindowedStepBufferProvider(sizedStore(1024 * MIB), 4 * MIB, 8)
        .adaptiveResidencyCapChunks).toBe(8)
  })
})
