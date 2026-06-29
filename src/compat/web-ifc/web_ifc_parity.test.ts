/* eslint-disable */
// Parity guard for the vendored web-ifc compat constants.
//
// Conway owns the IFC name<->typecode tables (src/compat/web-ifc/ifc2x4.ts
// and types-map.ts) so the shipped package never depends on `web-ifc` at
// runtime — that coupling is exactly what the conway-web-ifc-adapter removal
// retired. This test re-introduces `web-ifc` as a **devDependency only** and
// statically diffs the vendored tables against it, so:
//
//   1. the vendored constants are proven equal to the upstream they were
//      copied from, and
//   2. when we step `web-ifc` forward to pick up upstream fixes, the bump
//      fails here with the exact set of added / removed / re-coded types
//      instead of drifting silently.
//
// Pinned to the same web-ifc version Bldrs Share's engine-comparison path
// uses (`web-ifc@0.0.35`); bump the devDependency and this header together.
//
// Static only — reads JS objects, never boots the wasm. web-ifc 0.0.35
// re-exports the `IFCxxx` name->code constants from its package root
// (web-ifc-api-node.js) but ships no type declarations for them, and its
// internal `IfcTypesMap` (code->name) is not a public export — hence the
// untyped namespace read below and the inverse-of-ifc2x4 check for the map.
import { describe, expect, test } from '@jest/globals'
import * as conwayIfc2x4 from './ifc2x4'
import { IfcTypesMap, IfcElements as IfcElementsObject } from './types-map'
import * as webIfcNamespace from 'web-ifc'

/**
 * Collect the `IFCxxx -> typecode` numeric constants from a module namespace,
 * tolerating both ESM and interop-wrapped CommonJS shapes (the constants may
 * sit on the namespace itself or under its `default`).
 */
function ifcConstants(namespace: unknown): Map<string, number> {
  const out = new Map<string, number>()
  const candidate = namespace as { default?: unknown }
  for (const source of [namespace, candidate?.default]) {
    if (source === null || typeof source !== 'object') {
      continue
    }
    for (const [name, value] of Object.entries(source as Record<string, unknown>)) {
      if (name.startsWith('IFC') && typeof value === 'number') {
        out.set(name, value)
      }
    }
  }
  return out
}

/**
 * Read web-ifc's public `IfcElements` typecode array off a module namespace,
 * tolerating the same ESM/CommonJS interop shapes as `ifcConstants`.
 */
function ifcElementsArray(namespace: unknown): number[] {
  const candidate = namespace as { IfcElements?: unknown; default?: { IfcElements?: unknown } }
  const value = candidate?.IfcElements ?? candidate?.default?.IfcElements
  return Array.isArray(value) ? (value as number[]) : []
}

describe('web-ifc compat constants parity (web-ifc@0.0.35)', () => {

  const conway = ifcConstants(conwayIfc2x4)
  const web = ifcConstants(webIfcNamespace)
  const conwayElements = (conwayIfc2x4 as { IfcElements?: number[] }).IfcElements ?? []
  const webElements = ifcElementsArray(webIfcNamespace)
  const elementsObjectEntries = Object.entries(IfcElementsObject)

  test('both sides expose non-empty tables (guards every assertion below)', () => {
    // If web-ifc reshapes its exports, or a generated table comes back empty,
    // the parity assertions below could vacuously pass. Fail loudly here
    // instead — one guard covering every collection the later tests compare.
    expect(web.size).toBeGreaterThan(0)
    expect(conway.size).toBeGreaterThan(0)
    expect(webElements.length).toBeGreaterThan(0)
    expect(conwayElements.length).toBeGreaterThan(0)
    expect(elementsObjectEntries.length).toBeGreaterThan(0)
  })

  test('ifc2x4.ts mirrors web-ifc exactly (same names, same codes)', () => {
    expect([...conway.keys()].sort()).toEqual([...web.keys()].sort())

    // Compare as name=code strings so a mismatch reports which type and both
    // values, not just "expected N".
    const conwayPairs = [...conway.entries()].sort().map(([n, c]) => `${n}=${c}`)
    const webPairs = [...web.entries()].sort().map(([n, c]) => `${n}=${c}`)
    expect(conwayPairs).toEqual(webPairs)
  })

  test('IfcTypesMap is the exact inverse of the ifc2x4 constants', () => {
    // types-map.ts (code->name) and ifc2x4.ts (name->code) are two views of
    // the same data; this keeps them from drifting apart. web-ifc does not
    // export its IfcTypesMap, so the upstream anchor is ifc2x4 (checked above)
    // and this proves the map is its faithful inverse.
    for (const [name, code] of conway) {
      expect(IfcTypesMap[code]).toBe(name)
    }

    // Bijective: every map entry round-trips back to the same constant, so the
    // distinct-name count equals the constant count.
    const mapNames = new Set(Object.values(IfcTypesMap))
    expect(mapNames.size).toBe(conway.size)
    for (const [codeText, name] of Object.entries(IfcTypesMap)) {
      expect(conway.get(name)).toBe(Number(codeText))
    }
  })

  test('ifc2x4 IfcElements array mirrors web-ifc', () => {
    // ifc2x4.ts re-exports web-ifc's IfcElements (the geometric-element
    // typecode list). Order is irrelevant to consumers, so compare as sets.
    // (Both sides are guarded non-empty above.)
    expect([...conwayElements].sort((a, b) => a - b))
        .toEqual([...webElements].sort((a, b) => a - b))
  })

  test('types-map IfcElements object is consistent with IfcTypesMap', () => {
    // The IfcElements object (code->name) is web-ifc's properties-helper map;
    // web-ifc does not export it publicly, so anchor it to IfcTypesMap (already
    // proven against ifc2x4 above): every entry must name the same type the
    // map does for that code.
    for (const [code, name] of elementsObjectEntries) {
      expect(IfcTypesMap[Number(code)]).toBe(name)
    }
  })
})
