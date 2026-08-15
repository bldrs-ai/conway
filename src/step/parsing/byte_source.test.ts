/* eslint-disable no-magic-numbers */
import { describe, expect, test } from '@jest/globals'

import {
  BufferByteSource,
  StoreByteSource,
  SyncAccessHandleByteSource,
} from './byte_source'
import { InMemoryStepByteStore } from '../step_buffer_provider'
import { FileDescriptorByteSource } from './byte_source_node'


describe( 'ByteSource implementations', () => {

  const bytes = new Uint8Array( [10, 20, 30, 40, 50] )

  test( 'BufferByteSource copies a range', () => {
    const source = new BufferByteSource( bytes )
    const into = new Uint8Array( 4 )

    expect( source.read( 1, 3, into, 1 ) ).toBe( 3 )
    expect( [ ...into ] ).toEqual( [0, 20, 30, 40] )
  } )

  test( 'StoreByteSource matches BufferByteSource over the same bytes', async () => {
    const source = new StoreByteSource( new InMemoryStepByteStore( bytes ) )
    const into = new Uint8Array( 3 )

    expect( await source.read( 2, 10, into, 0 ) ).toBe( 3 )
    expect( [ ...into ] ).toEqual( [30, 40, 50] )
  } )

  test( 'SyncAccessHandleByteSource reads through the handle contract', () => {
    const handle = {
      getSize: () => bytes.length,
      read( buffer: Uint8Array, options?: { at?: number } ): number {
        const at = options?.at ?? 0
        const want = Math.min( buffer.length, bytes.length - at )

        buffer.set( bytes.subarray( at, at + want ) )
        return want
      },
    }
    const source = new SyncAccessHandleByteSource( handle )
    const into = new Uint8Array( 2 )

    expect( source.read( 3, 2, into, 0 ) ).toBe( 2 )
    expect( [ ...into ] ).toEqual( [40, 50] )
  } )

  test( 'FileDescriptorByteSource reads index.ifc without holding it', () => {
    const source = FileDescriptorByteSource.open( 'data/index.ifc' )

    try {
      const head = new Uint8Array( 15 )
      const got = source.read( 0, 15, head, 0 )

      expect( got ).toBe( 15 )
      expect( new TextDecoder().decode( head ).startsWith( 'ISO-10303-21;' ) ).toBe( true )
    } finally {
      source.close()
    }
  } )
} )
