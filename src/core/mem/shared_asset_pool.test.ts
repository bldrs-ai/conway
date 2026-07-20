/* eslint-disable no-magic-numbers */
// mem: assets are stored once and refcounted — the sharing layer's rule is
// that a release never frees an asset another holder still references.
import { describe, expect, test } from '@jest/globals'

import { ChunkedPool } from './chunked_pool'
import { SharedAssetPool } from './shared_asset_pool'

describe( 'SharedAssetPool', () => {

  test( 'first retain acquires chunks and reports wasAbsent', () => {
    const assets = new SharedAssetPool<string>( new ChunkedPool( 1000, 100 ) )

    const first = assets.retain( 'rep-A', 250 )
    expect( first ).toEqual( { retained: true, wasAbsent: true } )
    expect( assets.isResident( 'rep-A' ) ).toBe( true )
    expect( assets.physicalBytesOf( 'rep-A' ) ).toBe( 300 )
    expect( assets.pool.bytesInUse ).toBe( 300 )
  } )

  test( 'a second retain shares storage instead of duplicating it', () => {
    const assets = new SharedAssetPool<string>( new ChunkedPool( 1000, 100 ) )

    assets.retain( 'rep-A', 250 )
    const second = assets.retain( 'rep-A', 250 )

    expect( second ).toEqual( { retained: true, wasAbsent: false } )
    expect( assets.refCountOf( 'rep-A' ) ).toBe( 2 )
    // Stored once: physical bytes unchanged.
    expect( assets.pool.bytesInUse ).toBe( 300 )
  } )

  test( 'release frees only on the last reference', () => {
    const assets = new SharedAssetPool<string>( new ChunkedPool( 1000, 100 ) )

    assets.retain( 'rep-A', 100 )
    assets.retain( 'rep-A', 100 )

    expect( assets.release( 'rep-A' ) ).toBe( false )
    expect( assets.isResident( 'rep-A' ) ).toBe( true )
    expect( assets.pool.bytesInUse ).toBe( 100 )

    expect( assets.release( 'rep-A' ) ).toBe( true )
    expect( assets.isResident( 'rep-A' ) ).toBe( false )
    expect( assets.pool.bytesInUse ).toBe( 0 )
  } )

  test( 'retain fails cleanly when the pool cannot fit a new asset', () => {
    const assets = new SharedAssetPool<string>( new ChunkedPool( 200, 100 ) )

    assets.retain( 'rep-A', 200 )

    const refused = assets.retain( 'rep-B', 100 )
    expect( refused ).toEqual( { retained: false, wasAbsent: true } )
    expect( assets.isResident( 'rep-B' ) ).toBe( false )

    // A retain of an already-resident asset still succeeds at full pool.
    expect( assets.retain( 'rep-A', 200 ).retained ).toBe( true )
  } )

  test( 'releasing a non-resident asset is an error, not a silent no-op', () => {
    const assets = new SharedAssetPool<string>( new ChunkedPool( 100, 100 ) )

    expect( () => assets.release( 'ghost' ) ).toThrow( /non-resident/ )
  } )
} )
