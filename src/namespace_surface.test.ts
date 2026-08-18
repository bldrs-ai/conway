// Pins the conway-native plane namespaces (`@bldrs-ai/conway/stream`,
// `/demand`, `/mem`): each module must expose its plane's key runtime
// symbols. Guards the packaging contract — a refactor that moves or
// renames an export breaks embedders through these subpaths first.
import { describe, expect, test } from '@jest/globals'

import * as demand from './demand'
import * as mem from './mem'
import * as stream from './stream'

describe( 'plane namespace surface', () => {

  test( 'stream exposes the fixed-memory open plane', () => {
    expect( typeof stream.openStreamedIfcModel ).toBe( 'function' )
    expect( typeof stream.openStreamedIfcModelFromStore ).toBe( 'function' )
    expect( typeof stream.BufferByteSource ).toBe( 'function' )
    expect( typeof stream.StoreByteSource ).toBe( 'function' )
    expect( typeof stream.SyncAccessHandleByteSource ).toBe( 'function' )
    expect( typeof stream.InMemoryStepByteStore ).toBe( 'function' )
    expect( typeof stream.WindowedStepBufferProvider ).toBe( 'function' )
    expect( typeof stream.serializeIndexSidecarFromColumns ).toBe( 'function' )
    expect( typeof stream.deserializeIndexSidecarToColumns ).toBe( 'function' )
    expect( typeof stream.sidecarMatchesSource ).toBe( 'function' )
    expect( typeof stream.hashSource ).toBe( 'function' )
    expect( typeof stream.StreamingRecordDispatcher ).toBe( 'function' )
    expect( typeof stream.PrefixTypeIndex ).toBe( 'function' )
    expect( typeof stream.ColumnarIndexSink ).toBe( 'function' )
    expect( typeof stream.StepTypeIndexer ).toBe( 'function' )
    expect( typeof stream.ifcPrefixTypeIndex ).toBe( 'function' )
    expect( typeof stream.RecordFieldCursor ).toBe( 'function' )
    expect( typeof stream.IfcSpatialSkeleton ).toBe( 'function' )
  } )

  test( 'demand exposes the residency/extraction plane', () => {
    expect( typeof demand.DemandGeometryQueue ).toBe( 'function' )
    expect( typeof demand.DemandResidencyPump ).toBe( 'function' )
    expect( typeof demand.GeometryTilePool ).toBe( 'function' )
    expect( typeof demand.createWasmTileBackend ).toBe( 'function' )
    expect( typeof demand.readGeometryTilePayload ).toBe( 'function' )
    expect( typeof demand.IfcTileAssetExtractor ).toBe( 'function' )
  } )

  test( 'mem exposes the general pool primitives', () => {
    expect( typeof mem.ChunkedPool ).toBe( 'function' )
    expect( typeof mem.SharedAssetPool ).toBe( 'function' )
    expect( typeof mem.SharedByteBudget ).toBe( 'function' )
  } )
} )
