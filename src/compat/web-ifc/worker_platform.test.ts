import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'
import { isWebPlatform, pThreadsAllowed } from '../../../dependencies/conway-geom'
import Environment, { EnvironmentType } from '../../utilities/environment'
import Logger from '../../logging/logger'
import Memory from '../../memory/memory'

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


/**
 * conway's own environment probe in a worker (codex on #759). Before the
 * fix a worker classified as UNKNOWN, so `Logger.initializeWasmCallbacks()`
 * bound no `logInfo` / `logWarning` / `logError`, and the wasm glue (which
 * looks them up on `globalThis` and skips a missing one) dropped every
 * native diagnostic: the load report and the defect tally never saw them.
 */
describe('Environment / Logger wasm callbacks in a worker', () => {
  const g = globalThis as Record<string, unknown>
  const callbackNames = ['logInfo', 'logWarning', 'logError'] as const
  let saved: Record<string, unknown>
  let savedType: EnvironmentType
  let savedVersions: PropertyDescriptor | undefined

  beforeEach(() => {
    saved = Object.fromEntries(callbackNames.map((name) => [name, g[name]]))
    savedType = Environment.environmentType
    // A worker has no Node `process.versions.node`. Hide it, so that with
    // the fix reverted the probe falls through to UNKNOWN as it does in a
    // real worker, instead of answering NODE and binding the callbacks on
    // Node's `global` (which in Jest is globalThis, and would mask the bug).
    savedVersions = Object.getOwnPropertyDescriptor(process, 'versions')
    Object.defineProperty(process, 'versions', {value: {}, configurable: true})
    for (const name of callbackNames) {
      delete g[name]
    }
    function WorkerGlobalScope(): void {}
    WorkerGlobalScope.prototype = Object.getPrototypeOf(globalThis)
    g.WorkerGlobalScope = WorkerGlobalScope
  })

  afterEach(() => {
    delete g.WorkerGlobalScope
    if (savedVersions) {
      Object.defineProperty(process, 'versions', savedVersions)
    }
    for (const name of callbackNames) {
      if (saved[name] === undefined) {
        delete g[name]
      } else {
        g[name] = saved[name]
      }
    }
    Environment.environmentType = savedType
  })

  test('a WorkerGlobalScope classifies as WORKER, ahead of the Node probe', () => {
    Environment.checkEnvironment()
    expect(Environment.environmentType).toBe(EnvironmentType.WORKER)
  })

  test('each native diagnostic callback reaches the Logger through globalThis', () => {
    Environment.checkEnvironment()
    Logger.initializeWasmCallbacks()
    const seen: Array<[string, string]> = []
    const proxy = {log: (entry: {level: string, message: string}) => seen.push([entry.level, entry.message])}
    Logger.addProxy(proxy)
    try {
      // Exactly how the glue calls them (ConwayGeomWasm*.js EM_JS bodies):
      // looked up on globalThis by name, skipped when not a function.
      for (const name of callbackNames) {
        const callback = g[name]
        expect(typeof callback).toBe('function')
        ;(callback as (message: string) => void)(`native ${name} #540`)
      }
    } finally {
      Logger.removeProxy(proxy)
    }
    expect(seen).toEqual(expect.arrayContaining([
      ['info', 'native logInfo #540'],
      ['warning', 'native logWarning #540'],
      ['error', 'native logError #540'],
    ]))
  })

  test('memory probes answer in a worker instead of reading window', () => {
    Environment.checkEnvironment()
    expect(() => Memory.checkMemoryUsage()).not.toThrow()
    expect(() => Memory.usedHeapMb()).not.toThrow()
  })
})
