/* eslint-disable no-magic-numbers */
// conway#757, the format-neutral half: the windowed provider's synchronous
// fault-in (what lets AP214's synchronous reads run over a windowed
// source), the whole-model view release that keeps such a walk inside the
// window, and the v3 sidecar's schema stamp and sampled digest.
import * as fs from 'fs'

import { describe, expect, test } from '@jest/globals'

import {
  InMemoryStepByteStore,
  StepBufferNotResidentError,
  WindowedStepBufferProvider,
} from './step_buffer_provider'
import {
  assertSidecarSchema,
  deserializeIndexSidecarToColumns,
  hashSampledBuffer,
  hashSampledSource,
  hashSource,
  IFC_SIDECAR_SCHEMA,
  IndexSidecarStaleError,
  readSidecarSourceIdentity,
  SAMPLED_HASH_BLOCKS,
  SAMPLED_HASH_EDGE_BYTES,
  SampledHashFold,
  sampledSourceSpans,
  serializeIndexSidecarFromColumns,
  SidecarSchema,
} from './parsing/index_sidecar'
import { HashingByteSource } from './parsing/source_hash'
import { BufferByteSource } from './parsing/byte_source'
import { ColumnarIndexSink } from './parsing/columnar_index'
import { buildIndexStreaming } from './parsing/streaming_index_builder'
import { ParseResult } from './parsing/step_parser'
import AP214StepParser from '../AP214E3_2010/ap214_step_parser'
import AP214StepModel, { AP214_SIDECAR_SCHEMA } from '../AP214E3_2010/ap214_step_model'
import EntityTypesAP214 from '../AP214E3_2010/AP214E3_2010_gen/entity_types_ap214.gen'
import { assertSidecarDescribesStore } from './step_index_open'


/**
 * Bytes 0..n-1, each its own index mod 251 — so a wrong window shows up as
 * a wrong byte.
 *
 * @param length The length.
 * @return {Uint8Array} The bytes.
 */
function ramp( length: number ): Uint8Array {
  return Uint8Array.from( { length }, ( _, where ) => where % 251 )
}


describe( 'WindowedStepBufferProvider: synchronous fault-in (conway#757)', () => {

  test( 'without readSync, an unpaged acquire still throws', () => {

    const provider = new WindowedStepBufferProvider(
        new InMemoryStepByteStore( ramp( 64 * 1024 ) ), 4096, 2 )

    expect( provider.faultsInSynchronously ).toBe( false )
    expect( () => provider.acquire( 10000, 16 ) ).toThrow( StepBufferNotResidentError )
  } )

  test( 'with readSync, every acquire succeeds with the right bytes, inside the cap', () => {

    const bytes = ramp( 64 * 1024 )
    const provider = new WindowedStepBufferProvider(
        new InMemoryStepByteStore( bytes, true ), 4096, 2 )

    expect( provider.faultsInSynchronously ).toBe( true )

    // Single-chunk reads and chunk-straddling ones, scattered so the LRU
    // has to evict.
    const views: Array< [ number, number, Uint8Array, number ] > = []

    for ( const [ address, length ] of [
      [ 10000, 16 ], [ 40000, 300 ], [ 4090, 20 ], [ 0, 8 ], [ 65000, 500 ], [ 12280, 9000 ],
    ] ) {

      const acquired = provider.acquire( address, length )
      const start = address - acquired.offset

      expect( Array.from( acquired.buffer.subarray( start, start + length ) ) )
          .toEqual( Array.from( bytes.subarray( address, address + length ) ) )
      expect( provider.residentChunkCount ).toBeLessThanOrEqual( 2 )

      views.push( [ address, length, acquired.buffer, start ] )
    }

    // A view of an evicted window stays valid: eviction drops the
    // provider's reference, never the bytes a caller holds.
    for ( const [ address, length, buffer, start ] of views ) {
      expect( Array.from( buffer.subarray( start, start + length ) ) )
          .toEqual( Array.from( bytes.subarray( address, address + length ) ) )
    }

    expect( provider.syncFaultCount ).toBeGreaterThan( 2 )
  } )

  test( 'a pinned window is not evicted by a fault-in', () => {

    const provider = new WindowedStepBufferProvider(
        new InMemoryStepByteStore( ramp( 64 * 1024 ), true ), 4096, 1 )

    const pinned = provider.acquire( 100, 8 ).buffer

    provider.pinRange( 100, 8 )
    provider.acquire( 30000, 8 )

    // Still resident: an acquire of it does not fault again.
    const faults = provider.syncFaultCount

    expect( provider.acquire( 100, 8 ).buffer ).toBe( pinned )
    expect( provider.syncFaultCount ).toBe( faults )
  } )
} )


describe( 'StepModelBase.releaseCapturedSourceViews (conway#757)', () => {

  /**
   * A windowed AP214 model over a synchronous store with small windows.
   *
   * @param bytes The STEP file.
   * @return {AP214StepModel} The model.
   */
  function windowedModel( bytes: Uint8Array ): AP214StepModel {

    const sink = new ColumnarIndexSink< EntityTypesAP214 >()
    const built = buildIndexStreaming(
        new BufferByteSource( bytes ), AP214StepParser.Instance, 64 * 1024, void 0, sink )

    expect( built.result ).toBe( ParseResult.COMPLETE )

    const model = new AP214StepModel( void 0, sink.finalize(),
        new WindowedStepBufferProvider( new InMemoryStepByteStore( bytes, true ), 4096, 2 ) )

    model.trackCapturedSourceViews = true

    return model
  }

  test( 'reads fault in, leave views, and a release drops every one', () => {

    const bytes = new Uint8Array( fs.readFileSync( 'data/as1-oc-214.stp' ) )
    const model = windowedModel( bytes )

    expect( model.isSourceExternal ).toBe( true )
    expect( model.sourceReadsSynchronously ).toBe( true )

    // Record reads, not just descriptors: these are what capture views. The
    // checksum makes "reads the same afterwards" a claim about the bytes.
    const read = () => {
      let checksum = 0
      for ( const element of model ) {
        const bytes = element.extractLineArguments()
        for ( let where = 0; where < bytes.length; ++where ) {
          checksum = ( checksum * 31 + bytes[ where ] ) >>> 0
        }
      }
      return checksum
    }

    const names = read()

    expect( names ).toBeGreaterThan( 0 )

    const released = model.releaseCapturedSourceViews()

    // Every record read captured a view (each at most once), and a second
    // release finds nothing left.
    expect( released ).toBeGreaterThan( 0 )
    expect( model.releaseCapturedSourceViews() ).toBe( 0 )

    // And everything reads the same afterwards — views come back on demand.
    expect( read() ).toBe( names )
  } )

  test( 'a resident model captures nothing to release', () => {

    const bytes = new Uint8Array( fs.readFileSync( 'data/as1-oc-214.stp' ) )
    const sink = new ColumnarIndexSink< EntityTypesAP214 >()

    buildIndexStreaming( new BufferByteSource( bytes ), AP214StepParser.Instance,
        64 * 1024, void 0, sink )

    const model = new AP214StepModel( bytes, sink.finalize() )

    model.trackCapturedSourceViews = true

    for ( const element of model ) {
      element.extractLineArguments()
    }

    expect( model.releaseCapturedSourceViews() ).toBe( 0 )
  } )
} )


describe( 'sampled source digest (conway#758, in the v3 bump)', () => {

  test( 'spans are sorted, disjoint, inside the source, and about 0.5 MB', () => {

    for ( const length of [ 0, 1, 1000, 512 * 1024, 600 * 1024, 7 * 1024 * 1024 + 3, 2e9 ] ) {

      const spans = sampledSourceSpans( length )
      let previousEnd = 0
      let total = 0

      for ( const [ start, end ] of spans ) {
        expect( start ).toBeGreaterThanOrEqual( previousEnd )
        expect( end ).toBeGreaterThan( start )
        expect( end ).toBeLessThanOrEqual( length )
        previousEnd = end
        total += end - start
      }

      expect( total ).toBeLessThanOrEqual( Math.min( length, 600 * 1024 ) )

      if ( length > 600 * 1024 ) {
        expect( spans.length ).toBe( SAMPLED_HASH_BLOCKS + 2 )
        expect( spans[ 0 ] ).toEqual( [ 0, SAMPLED_HASH_EDGE_BYTES ] )
        expect( spans[ spans.length - 1 ][ 1 ] ).toBe( length )
      }
    }
  } )

  test( 'folded in a streaming pass, it equals the direct digest, at any read size', async () => {

    const bytes = ramp( 3 * 1024 * 1024 + 17 )
    const expected = hashSampledBuffer( bytes )

    expect( await hashSampledSource( bytes.length,
        ( offset, length ) => bytes.subarray( offset, offset + length ) ) ).toBe( expected )

    for ( const step of [ 1000, 4096, 65536, 1 << 20, bytes.length ] ) {

      const fold = new SampledHashFold( bytes.length )

      for ( let at = 0; at < bytes.length; at += step ) {
        const end = Math.min( at + step, bytes.length )
        fold.fold( bytes, at, end, at )
      }

      expect( fold.digest ).toBe( expected )
    }

    const hashing = new HashingByteSource( new BufferByteSource( bytes ) )
    const into = new Uint8Array( 300000 )

    for ( let at = 0; at < bytes.length; ) {
      at += await hashing.read( at, into.length, into, 0 )
    }

    expect( await hashing.finishAsync() ).toBe( hashSource( bytes ) )
    expect( hashing.sampledHash ).toBe( expected )
  } )

  test( 'it sees an edit inside a sampled block, misses one outside, and sees the length', () => {

    const bytes = ramp( 4 * 1024 * 1024 )
    const digest = hashSampledBuffer( bytes )
    const spans = sampledSourceSpans( bytes.length )

    const inside = bytes.slice()
    inside[ spans[ 5 ][ 0 ] + 1 ] ^= 1

    const outside = bytes.slice()
    outside[ spans[ 5 ][ 1 ] + 1 ] ^= 1

    expect( hashSampledBuffer( inside ) ).not.toBe( digest )
    // The documented miss: same length, outside every block.
    expect( hashSampledBuffer( outside ) ).toBe( digest )
    expect( hashSampledBuffer( bytes.subarray( 0, bytes.length - 1 ) ) ).not.toBe( digest )
  } )
} )


describe( 'v3 sidecar: the schema stamp (conway#757)', () => {

  const bytes = new Uint8Array( fs.readFileSync( 'data/as1-oc-214.stp' ) )
  const sink = new ColumnarIndexSink< EntityTypesAP214 >()

  buildIndexStreaming( new BufferByteSource( bytes ), AP214StepParser.Instance,
      64 * 1024, void 0, sink )

  const columns = sink.finalize()
  const sidecar = serializeIndexSidecarFromColumns( columns, bytes.length, hashSource( bytes ), {
    schema: AP214_SIDECAR_SCHEMA,
    sampledHash: hashSampledBuffer( bytes ),
  } )

  test( 'the stamp and both digests round-trip, and the columns are the same', () => {

    const identity = readSidecarSourceIdentity( sidecar )

    expect( identity.schema ).toEqual( AP214_SIDECAR_SCHEMA )
    expect( identity.sampledHash ).toBe( hashSampledBuffer( bytes ) )
    expect( identity.sourceHash ).toBe( hashSource( bytes ) )

    const decoded = deserializeIndexSidecarToColumns< EntityTypesAP214 >(
        sidecar, AP214_SIDECAR_SCHEMA )

    expect( Array.from( decoded.columns.typeID ) ).toEqual(
        Array.from( columns.typeID.subarray( 0, columns.count ) ) )
    expect( Array.from( decoded.columns.address ) ).toEqual(
        Array.from( columns.address.subarray( 0, columns.count ) ) )

    // Re-serialising what was decoded is the same blob.
    expect( Buffer.from( serializeIndexSidecarFromColumns(
        decoded.columns, decoded.sourceByteLength, decoded.sourceHash,
        { schema: decoded.schema, sampledHash: decoded.sampledHash } ) )
        .equals( Buffer.from( sidecar ) ) ).toBe( true )
  } )

  test( 'a reader expecting another schema, or another enumeration size, refuses it as stale', () => {

    for ( const expected of [
      IFC_SIDECAR_SCHEMA,
      { schema: SidecarSchema.AP214, typeCount: AP214_SIDECAR_SCHEMA.typeCount + 1 },
    ] ) {

      let thrown: unknown

      try {
        deserializeIndexSidecarToColumns( sidecar, expected )
      } catch ( error ) {
        thrown = error
      }

      expect( thrown ).toBeInstanceOf( IndexSidecarStaleError )
      expect( ( thrown as IndexSidecarStaleError ).reason ).toBe( 'schema' )
    }

    expect( () => assertSidecarSchema(
        readSidecarSourceIdentity( sidecar ), AP214_SIDECAR_SCHEMA ) ).not.toThrow()
  } )

  test( 'the field-mask table round-trips', () => {

    const masks = new Map( [ [ 7, 3 ], [ 4000000000, 9 ] ] )
    const decoded = deserializeIndexSidecarToColumns( serializeIndexSidecarFromColumns(
        columns, bytes.length, 1, { schema: AP214_SIDECAR_SCHEMA, fieldMasks: masks } ) )

    expect( decoded.fieldMasks ).toEqual( masks )
    expect( deserializeIndexSidecarToColumns( sidecar ).fieldMasks ).toBeUndefined()
  } )

  test( 'a v2 blob is rejected with a reason, not reinterpreted', () => {

    const v2 = sidecar.slice()

    new DataView( v2.buffer ).setUint32( 4, 2, true )

    expect( () => readSidecarSourceIdentity( v2 ) ).toThrow( /v2 does not record which schema/ )
  } )

  test( 'the sampled verify reads the samples, and falls back to the full check without them', async () => {

    const store = new InMemoryStepByteStore( bytes )
    const identity = readSidecarSourceIdentity( sidecar )

    await assertSidecarDescribesStore( identity, store, 'sampled' )

    // A same-length edit in the first block: the sampled gate sees it.
    const edited = bytes.slice()

    edited[ 10 ] ^= 0x20

    await expect( assertSidecarDescribesStore(
        identity, new InMemoryStepByteStore( edited ), 'sampled' ) )
        .rejects.toThrow( IndexSidecarStaleError )

    // No sampled digest recorded: 'sampled' runs the full check, not none.
    const unsampled = readSidecarSourceIdentity( serializeIndexSidecarFromColumns(
        columns, bytes.length, hashSource( bytes ), { schema: AP214_SIDECAR_SCHEMA } ) )

    expect( unsampled.sampledHash ).toBeUndefined()

    const lastByte = bytes.slice()

    lastByte[ Math.floor( bytes.length / 2 ) ] ^= 0x20

    await expect( assertSidecarDescribesStore(
        unsampled, new InMemoryStepByteStore( lastByte ), 'sampled' ) )
        .rejects.toThrow( IndexSidecarStaleError )
    await assertSidecarDescribesStore( unsampled, new InMemoryStepByteStore( lastByte ), false )
  } )
} )
