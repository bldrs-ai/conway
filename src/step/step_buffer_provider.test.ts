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
