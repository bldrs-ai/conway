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

describe('WindowedStepBufferProvider recency stamps (Share#2139)', () => {

  const CHUNK = 16
  const CHUNKS = 64

  /** Tiny seeded LCG (Numerical Recipes constants), so runs are reproducible. */
  function makeRng(seed: number): (bound: number) => number {
    let state = seed >>> 0

    return (bound: number): number => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      return Math.floor((state / 4294967296) * bound)
    }
  }

  /**
   * The residency semantics this change replaced, as a reference model:
   * a Map whose order is recency (touch = delete + set), evicting
   * first-in-Map-order unpinned chunks down to the cap.
   */
  class ReferenceWindow {
    public readonly order = new Map<number, true>()
    public readonly pins = new Map<number, number>()

    public touch(chunk: number): void {
      this.order.delete(chunk)
      this.order.set(chunk, true)
    }

    public pin(chunk: number, delta: number): void {
      this.pins.set(chunk, (this.pins.get(chunk) ?? 0) + delta)
    }

    public trim(cap: number): void {
      while (this.order.size > cap) {
        let victim: number | undefined

        for (const candidate of this.order.keys()) {
          if ((this.pins.get(candidate) ?? 0) <= 0) {
            victim = candidate
            break
          }
        }

        if (victim === void 0) {
          break
        }

        this.order.delete(victim)
      }
    }
  }

  /** The provider's resident chunk indices, sorted (white-box read of the window). */
  function residentSet(provider: WindowedStepBufferProvider): number[] {
    const chunks = (provider as unknown as { chunks_: Map<number, Uint8Array> }).chunks_

    return [...chunks.keys()].sort((a, b) => a - b)
  }

  const scenarios: [string, number, boolean | undefined, boolean][] = [
    ['cap 4, fixed, async store', 4, false, false],
    ['cap 8, fixed, async store', 8, false, false],
    ['cap 4, adaptive, async store', 4, true, false],
    ['cap 8, adaptive, async store', 8, true, false],
    ['cap 4, fixed, sync faulting store', 4, false, true],
    ['cap 4, adaptive, sync faulting store', 4, true, true],
  ]

  test.each(scenarios)('resident set matches the Map-order LRU model: %s',
      async (_name, cap, adaptive, synchronous) => {
        const store = new InMemoryStepByteStore(makeBytes(CHUNK * CHUNKS), synchronous)
        const provider = new WindowedStepBufferProvider(store, CHUNK, cap, adaptive)
        const reference = new ReferenceWindow()
        const rng = makeRng(0x2139 + cap + (adaptive ? 1 : 0) + (synchronous ? 2 : 0))
        const pinned: number[] = []

        // Locality-biased stream so there is real recency structure to get wrong,
        // with enough requests to pass the adaptive policy's 4096-request interval.
        // Most picks sweep cap + 1 chunks cyclically, LRU's worst case, so the adaptive
        // policy sees capacity misses and grows the window.
        let sweep = 0
        const pick = (): number => rng(CHUNKS)
        const pickSweep = (): number => rng(10) === 0 ? rng(CHUNKS) : sweep++ % (cap + 1)
        let maxCap = 0

        for (let step = 0; step < 14000; ++step) {
          const op = rng(20)

          if (op < 10) {
            // ensureResident over one or two chunks.
            const first = pickSweep()
            const last = Math.min(CHUNKS - 1, first + rng(2))
            const missing: number[] = []

            for (let chunk = first; chunk <= last; ++chunk) {
              reference.pin(chunk, 1)

              if (reference.order.has(chunk)) {
                reference.touch(chunk)
              } else {
                missing.push(chunk)
              }
            }

            for (const chunk of missing) {
              reference.touch(chunk)
            }

            await provider.ensureResident(first * CHUNK, (last - first + 1) * CHUNK)
            reference.trim(provider.residencyCapChunks)

            for (let chunk = first; chunk <= last; ++chunk) {
              reference.pin(chunk, -1)
            }
          } else if (op < 16) {
            // acquire of a single chunk: a recency touch when resident, a
            // fault-in when the store can, an error otherwise.
            const chunk = pick()

            if (reference.order.has(chunk)) {
              provider.acquire(chunk * CHUNK, 4)
              reference.touch(chunk)
            } else if (synchronous) {
              provider.acquire(chunk * CHUNK, 4)
              reference.touch(chunk)
              reference.trim(provider.residencyCapChunks)
              // A fault-in that trimming itself evicts (every other chunk pinned)
              // stays evicted; see touch_.
              if (!residentSet(provider).includes(chunk)) {
                reference.order.delete(chunk)
              }
            } else {
              expect(() => provider.acquire(chunk * CHUNK, 4)).toThrow(StepBufferNotResidentError)
            }
          } else if (op < 17 || pinned.length === 0) {
            const chunk = pick()

            provider.pinRange(chunk * CHUNK, CHUNK)
            reference.pin(chunk, 1)
            pinned.push(chunk)
          } else {
            const chunk = pinned.splice(rng(pinned.length), 1)[0]

            provider.unpinRange(chunk * CHUNK, CHUNK)
            reference.pin(chunk, -1)
            provider.trimToCap()
            reference.trim(provider.residencyCapChunks)
          }

          maxCap = Math.max(maxCap, provider.residencyCapChunks)

          expect([...reference.order.keys()].sort((a, b) => a - b))
              .toEqual(residentSet(provider))
        }

        if (adaptive && !synchronous) {
          // The async adaptive variants only prove anything if the window really moved
          // (the sync ones' random faults dilute the sweep, so they may not grow).
          expect(maxCap).toBeGreaterThan(cap)
        }
      })

  test('acquire on resident chunks never deletes from the window map', async () => {
    const provider = new WindowedStepBufferProvider(
        new InMemoryStepByteStore(makeBytes(CHUNK * 8)), CHUNK, 4)

    for (let chunk = 0; chunk < 4; ++chunk) {
      await provider.ensureResident(chunk * CHUNK, 1)
    }

    const originalDelete = Map.prototype.delete
    let deletes = 0

    Map.prototype.delete = function(this: Map<unknown, unknown>, key: unknown): boolean {
      ++deletes
      return originalDelete.call(this, key)
    }

    try {
      for (let call = 0; call < 1000; ++call) {
        provider.acquire((call % 4) * CHUNK + 1, 4)
      }
    } finally {
      Map.prototype.delete = originalDelete
    }

    expect(deletes).toBe(0)
    expect(residentSet(provider)).toEqual([0, 1, 2, 3])
  })
})
