import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { isWebPlatform, pThreadsAllowed } from '../../../dependencies/conway-geom'

/**
 * conway in a Web Worker (bldrs-ai/conway#540).
 *
 * A worker has neither `window` nor `process`. Before #540 both arms of
 * isWebPlatform() were false there, so conway picked the Node wasm and
 * `initialize()` died on a dynamic require of `ConwayGeomWasmNode.js`; and
 * pThreadsAllowed() read `window.crossOriginIsolated`, which throws a
 * ReferenceError in an isolated worker.
 *
 * Jest runs in Node, which has no WorkerGlobalScope, so these tests fake one
 * the way `instanceof` sees it: a constructor whose prototype is already on
 * globalThis's chain. That is the whole of the check under test, with no
 * other globals touched. `process.env.PLATFORM` is cleared for the duration
 * so the old `process` arm cannot answer for the worker arm.
 */
describe('isWebPlatform / pThreadsAllowed in a worker', () => {
  const g = globalThis as Record<string, unknown>
  let saved: {platform?: string, forceSingle?: string, isolated: unknown}

  beforeEach(() => {
    saved = {
      platform: process.env.PLATFORM,
      forceSingle: process.env.FORCE_SINGLE_THREAD,
      isolated: g.crossOriginIsolated,
    }
    delete process.env.PLATFORM
  })

  afterEach(() => {
    delete g.WorkerGlobalScope
    if (saved.platform === undefined) {
      delete process.env.PLATFORM
    } else {
      process.env.PLATFORM = saved.platform
    }
    if (saved.forceSingle === undefined) {
      delete process.env.FORCE_SINGLE_THREAD
    } else {
      process.env.FORCE_SINGLE_THREAD = saved.forceSingle
    }
    if (saved.isolated === undefined) {
      delete g.crossOriginIsolated
    } else {
      g.crossOriginIsolated = saved.isolated
    }
  })

  /** Make `globalThis instanceof WorkerGlobalScope` true. */
  function enterWorkerScope(): void {
    function WorkerGlobalScope(): void {}
    WorkerGlobalScope.prototype = Object.getPrototypeOf(globalThis)
    g.WorkerGlobalScope = WorkerGlobalScope
  }

  test('plain Node is not a web platform', () => {
    expect(typeof window).toBe('undefined')
    expect(isWebPlatform()).toBe(false)
  })

  test('a WorkerGlobalScope is a web platform without window or process.env.PLATFORM', () => {
    enterWorkerScope()
    expect(isWebPlatform()).toBe(true)
  })

  test('a WorkerGlobalScope that globalThis is not an instance of does not count', () => {
    g.WorkerGlobalScope = function WorkerGlobalScope(): void {}
    expect(isWebPlatform()).toBe(false)
  })

  test('pThreadsAllowed reads crossOriginIsolated off the worker global, not window', () => {
    // The Jest setupFile forces single-thread; that early return would answer
    // before the isolation check this test is about.
    delete process.env.FORCE_SINGLE_THREAD
    expect(typeof SharedArrayBuffer).toBe('function')
    enterWorkerScope()

    g.crossOriginIsolated = false
    expect(pThreadsAllowed()).toBe(false)

    g.crossOriginIsolated = true
    expect(pThreadsAllowed()).toBe(true)
  })
})
