/* eslint-disable no-magic-numbers */
// conway#756, engine side: `exportIfcIndexSidecar` and the typed errors the
// compat surface maps onto `undefined` / `INDEX_STALE`. The parity proof
// across every compat open lives in
// `compat/web-ifc/ifc_api_export_index_sidecar.test.ts`; this file pins the
// pieces it stands on.
import * as fs from 'fs'

import { beforeAll, describe, expect, test } from '@jest/globals'

import { BufferByteSource, StoreByteSource } from '../step/parsing/byte_source'
import {
  hashSource,
  IndexSidecarStaleError,
  IndexSidecarUnsupportedError,
  serializeIndexSidecarFromColumns,
} from '../step/parsing/index_sidecar'
import { hashSourceAsync } from '../step/parsing/source_hash'
import { ParseResult } from '../step/parsing/step_parser'
import { InMemoryStepByteStore } from '../step/step_buffer_provider'
import { exportIfcIndexSidecar } from './ifc_index_sidecar_export'
import { buildIfc4x3CompatIndex, ifc4x3CompatModel } from './ifc4x3_ifc4_compat'
import { openIfcModelFromIndex, openStreamedIfcModelFromStore } from './ifc_stream_open'

let bytes: Uint8Array

beforeAll( () => {
  bytes = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
} )


describe( 'hashSourceAsync', () => {

  test( 'equals hashSource over the whole file, at any chunk size', async () => {

    const expected = hashSource( bytes )

    for ( const chunk of [ 1, 7, 4096, bytes.length - 1, bytes.length, bytes.length * 2 ] ) {
      expect( await hashSourceAsync( new BufferByteSource( bytes ), chunk ) ).toBe( expected )
    }

    expect( await hashSourceAsync(
        new StoreByteSource( new InMemoryStepByteStore( bytes ) ) ) ).toBe( expected )
  } )

  test( 'hashes an empty source to the FNV basis, as hashSource does', async () => {

    const empty = new Uint8Array( 0 )

    expect( await hashSourceAsync( new BufferByteSource( empty ) ) ).toBe( hashSource( empty ) )
  } )
} )


describe( 'exportIfcIndexSidecar', () => {

  test( 'a windowed model exports the sidecar its parse would have', async () => {

    const opened = await openStreamedIfcModelFromStore( new InMemoryStepByteStore( bytes ) )

    expect( opened.result ).toBe( ParseResult.COMPLETE )

    const exported = await exportIfcIndexSidecar( opened.model! )

    expect( exported.sourceByteLength ).toBe( bytes.length )
    expect( exported.sourceHash ).toBe( hashSource( bytes ) )
    expect( Buffer.from( exported.sidecar ).equals( Buffer.from(
        serializeIndexSidecarFromColumns(
            opened.columns, bytes.length, hashSource( bytes ) ) ) ) ).toBe( true )
  } )

  test( 'a supplied hash skips the source pass and is what gets recorded', async () => {

    const opened = await openStreamedIfcModelFromStore( new InMemoryStepByteStore( bytes ) )
    const exported = await exportIfcIndexSidecar( opened.model!, { sourceHash: 0x12345678 } )

    expect( exported.hashMs ).toBe( 0 )
    expect( exported.sourceHash ).toBe( 0x12345678 )

    // ...and a verified open then refuses it, which is the point of the gate.
    await expect( openIfcModelFromIndex(
        new InMemoryStepByteStore( bytes ), exported.sidecar, { verifySourceHash: true } ) )
        .rejects.toBeInstanceOf( IndexSidecarStaleError )
  } )

  test( 'refuses an IFC4X3 compat-route model rather than dropping its masks', async () => {

    const source = new Uint8Array( fs.readFileSync( 'data/ifc4x3_road_entities.ifc' ) )
    const index = buildIfc4x3CompatIndex( new BufferByteSource( source ), 1024 * 1024 )

    expect( index.result ).toBe( ParseResult.COMPLETE )

    const model = ifc4x3CompatModel( source, index )

    expect( model.hasFieldMasks ).toBe( true )
    await expect( exportIfcIndexSidecar( model ) )
        .rejects.toBeInstanceOf( IndexSidecarUnsupportedError )
  } )
} )


describe( 'openIfcModelFromIndex staleness is typed', () => {

  let sidecar: Uint8Array

  beforeAll( async () => {
    const opened = await openStreamedIfcModelFromStore( new InMemoryStepByteStore( bytes ) )

    sidecar = ( await exportIfcIndexSidecar( opened.model! ) ).sidecar
  } )

  test( 'a length mismatch is an IndexSidecarStaleError("length")', async () => {

    const error = await openIfcModelFromIndex(
        new InMemoryStepByteStore( bytes.subarray( 0, bytes.length - 10 ) ), sidecar )
        .catch( ( caught ) => caught )

    expect( error ).toBeInstanceOf( IndexSidecarStaleError )
    expect( error.reason ).toBe( 'length' )
    expect( error.expected ).toBe( bytes.length )
    expect( error.actual ).toBe( bytes.length - 10 )
  } )

  test( 'a hash mismatch is an IndexSidecarStaleError("hash")', async () => {

    const rewritten = bytes.slice()

    rewritten[ rewritten.length - 3 ] ^= 0x01

    const error = await openIfcModelFromIndex(
        new InMemoryStepByteStore( rewritten ), sidecar, { verifySourceHash: true } )
        .catch( ( caught ) => caught )

    expect( error ).toBeInstanceOf( IndexSidecarStaleError )
    expect( error.reason ).toBe( 'hash' )
    expect( error.expected ).toBe( hashSource( bytes ) )
    expect( error.actual ).toBe( hashSource( rewritten ) )
  } )
} )
