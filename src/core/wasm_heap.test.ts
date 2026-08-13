// Covers the three ways arrayToWasmHeap used to go wrong quietly. All of them
// are cheap to exercise against a fake module, and none of them needed the
// geometry wasm - which is the point, since the real one only misbehaves under
// full-corpus memory pressure (bldrs-ai/conway#485).
import { describe, expect, test } from '@jest/globals'

import {
  arraysToWasmHeap, arrayToWasmHeap, freeAll, releaseQuietly, WasmHeapModule,
  withRelease,
} from './wasm_heap'


const HEAP_BYTES = 1024

// Named rather than inlined, and non-zero, since what every assertion here
// actually checks is that the right bytes landed somewhere that starts out
// zero-filled.
const PAYLOAD = Float64Array.from( [ 1, 2, 3 ] )
const TAIL = Float64Array.from( [ 7, 8 ] )

/**
 * A stand-in for the emscripten module, with a heap we control.
 *
 * @param heapBytes Size of the fake heap.
 * @param malloc What _malloc should hand back.
 * @return {WasmHeapModule} The fake module.
 */
function fakeModule(
    heapBytes: number, malloc: ( bytes: number ) => number ): WasmHeapModule {

  const heap = new Uint8Array( new ArrayBuffer( heapBytes ) )

  return { _malloc: malloc, _free: () => { /* recorded by callers that care */ }, HEAPU8: heap }
}


describe( 'arrayToWasmHeap', () => {

  test( 'copies the array and returns the pointer', () => {

    const address = 64
    const wasmModule = fakeModule( HEAP_BYTES, () => address )
    const source = PAYLOAD

    expect( arrayToWasmHeap( wasmModule, source ) ).toBe( address )

    const written = new Float64Array(
      wasmModule.HEAPU8.buffer, address, source.length )

    expect( Array.from( written ) ).toEqual( Array.from( source ) )
  } )

  // The bug the IFC path had already fixed and the AP214 path had not: a
  // subarray shares its parent's buffer, so copying `array.buffer` wholesale
  // silently writes the parent's first bytes instead of the view's.
  test( 'copies a subarray\'s own window, not its parent buffer', () => {

    const address = 32
    const wasmModule = fakeModule( HEAP_BYTES, () => address )
    const parent = Float64Array.from( [ 0, 0, ...TAIL ] )
    const view = parent.subarray( 2 )

    arrayToWasmHeap( wasmModule, view )

    const written = new Float64Array(
      wasmModule.HEAPU8.buffer, address, view.length )

    expect( Array.from( written ) ).toEqual( Array.from( TAIL ) )
  } )

  // 0 is a valid byteOffset, so this used to construct a view happily and
  // write over whatever lives at address 0 rather than reporting exhaustion.
  test( 'reports a failed malloc instead of writing to address 0', () => {

    const wasmModule = fakeModule( HEAP_BYTES, () => 0 )

    expect( () => arrayToWasmHeap( wasmModule, PAYLOAD ) )
      .toThrow( /_malloc returned an unusable address/ )
  } )

  // A >2GB address is a SUCCESSFUL allocation that arrives signed, because
  // _malloc is a raw i32 export and every target builds with 4GB max. Treating
  // it as a failure would hard-fail every copy once the heap passes 2GB, which
  // is exactly the memory-pressure case #485 is about - so it is normalised,
  // not rejected. Simulated here by a heap sized past 2GB in address terms
  // only; nothing that big is allocated.
  test( 'an address above 2GB is normalised, not read as a failure', () => {

    const signedAddress = -2147483648
    const unsignedAddress = 2147483648
    const headroom = 4096

    const wasmModule: WasmHeapModule = {
      _malloc: () => signedAddress,
      _free: () => { /* unused here */ },
      HEAPU8: { length: 0, buffer: { byteLength: unsignedAddress + headroom } } as
        unknown as Uint8Array,
    }

    // Fails on the copy rather than on the guard, which is the proof it got
    // past the "unusable address" test with the address intact.
    expect( () => arrayToWasmHeap( wasmModule, PAYLOAD ) )
      .not.toThrow( /_malloc returned an unusable address/ )
  } )

  test( 'a zero-length copy is not mistaken for a failed malloc', () => {

    const wasmModule = fakeModule( HEAP_BYTES, () => 0 )

    expect( arrayToWasmHeap( wasmModule, new Float64Array( 0 ) ) ).toBe( 0 )
  } )

  // #485's signature. The bare RangeError says "Invalid typed array length: N"
  // and nothing else; this asserts the replacement carries the state needed to
  // tell a stale view from a genuine over-allocation.
  test( 'a pointer past the end of the heap view reports the heap state', () => {

    const past = HEAP_BYTES - 8
    const wasmModule = fakeModule( HEAP_BYTES, () => past )
    const source = PAYLOAD

    expect( () => arrayToWasmHeap( wasmModule, source ) )
      .toThrow( /outside the heap view/ )

    try {
      arrayToWasmHeap( wasmModule, source )
    } catch ( error ) {
      const message = ( error as Error ).message

      expect( message ).toContain(
        `ptr ${past} + ${PAYLOAD.byteLength} bytes` )
      expect( message ).toContain( `byteLength ${HEAP_BYTES}` )
      // 'ArrayBuffer' alone would also match 'SharedArrayBuffer', so this
      // matches with the surrounding text that pins which field it is, and
      // asserts the shared spelling is absent - telling the two apart being
      // the one thing this field exists to do.
      expect( message ).toContain( 'buffer ArrayBuffer byteLength' )
      expect( message ).not.toContain( 'SharedArrayBuffer' )

      // Resizable, not growable, is the flag a plain ArrayBuffer carries.
      expect( message ).toContain( 'extensible false' )
    }
  } )

  // Here the allocation SUCCEEDED and only the view was refused, so this owns
  // a pointer no caller can reach - and it is #485's own branch, under a
  // per-record catch, so leaking would mean leaking once per record while
  // reporting that the heap is in trouble.
  test( 'frees the allocation it is refusing to view', () => {

    const past = HEAP_BYTES - 8
    const freed: number[] = []

    const wasmModule: WasmHeapModule = {
      ...fakeModule( HEAP_BYTES, () => past ),
      _free: ( pointer: number ) => {
        freed.push( pointer )
      },
    }

    expect( () => arrayToWasmHeap( wasmModule, PAYLOAD ) )
      .toThrow( /outside the heap view/ )

    expect( freed ).toEqual( [ past ] )
  } )
} )


describe( 'arraysToWasmHeap', () => {

  test( 'returns pointers in the order the arrays were given', () => {

    const first = 16
    const stride = 64
    let next = first

    const wasmModule = fakeModule( HEAP_BYTES, () => {
      const address = next

      next += stride

      return address
    } )

    expect( arraysToWasmHeap( wasmModule, [ PAYLOAD, TAIL ] ) )
      .toEqual( [ first, first + stride ] )
  } )

  // The point of the batch form: a caller holding several allocations frees
  // them together at the end, so a throw part-way through would strand the
  // ones already taken and the retry upstream would do it again.
  test( 'frees what it already took when a later allocation fails', () => {

    const first = 16
    const freed: number[] = []
    let call = 0

    const wasmModule: WasmHeapModule = {
      ...fakeModule( HEAP_BYTES, () => ( call++ === 0 ? first : 0 ) ),
      _free: ( pointer: number ) => {
        freed.push( pointer )
      },
    }

    expect( () => arraysToWasmHeap( wasmModule, [ PAYLOAD, TAIL ] ) )
      .toThrow( /_malloc returned an unusable address/ )

    expect( freed ).toEqual( [ first ] )
  } )
} )


describe( 'releaseQuietly', () => {

  test( 'runs the release', () => {

    let ran = false

    releaseQuietly( () => {
      ran = true
    } )

    expect( ran ).toBe( true )
  } )

  // The point: these run from finally blocks that may be unwinding because the
  // wasm runtime just failed, and every release re-enters that same runtime.
  // A throw here would replace the in-flight error, and the per-record catch
  // upstream would log a generic teardown failure instead of the heap
  // diagnostic this module exists to produce.
  test( 'does not let a failed release replace the error being unwound', () => {

    const original = new Error( 'the diagnostic worth keeping' )

    expect( () => {
      try {
        throw original
      } finally {
        releaseQuietly( () => {
          throw new Error( 'teardown blew up too' )
        } )
      }
    } ).toThrow( original )
  } )
} )


describe( 'withRelease', () => {

  test( 'releases after the body and returns its value', () => {

    const order: string[] = []

    const result = withRelease(
      () => {
        order.push( 'body' )

        return 'value'
      },
      () => {
        order.push( 'release' )
      } )

    expect( result ).toBe( 'value' )
    expect( order ).toEqual( [ 'body', 'release' ] )
  } )

  // The asymmetry this exists for. On the success path a teardown failure is a
  // real fault with nothing competing to report it, and swallowing it would let
  // a record be reported COMPLETE with its resources never reclaimed.
  test( 'propagates a release failure when the body succeeded', () => {

    expect( () => withRelease( () => 'fine', () => {
      throw new Error( 'release failed' )
    } ) ).toThrow( /release failed/ )
  } )

  test( 'keeps the body\'s error when the release fails too', () => {

    const original = new Error( 'the diagnostic worth keeping' )

    expect( () => withRelease(
      () => {
        throw original
      },
      () => {
        throw new Error( 'teardown blew up too' )
      } ) ).toThrow( original )
  } )

  test( 'still releases when the body throws', () => {

    let released = false

    expect( () => withRelease(
      () => {
        throw new Error( 'body failed' )
      },
      () => {
        released = true
      } ) ).toThrow( /body failed/ )

    expect( released ).toBe( true )
  } )
} )


describe( 'freeAll', () => {

  // Batched into one statement, the first failure abandons every pointer after
  // it - which is the whole reason this is not just four _free calls.
  test( 'frees every pointer even when one throws, and reports the first', () => {

    const freed: number[] = []
    const bad = 2

    const wasmModule: WasmHeapModule = {
      ...fakeModule( HEAP_BYTES, () => 0 ),
      _free: ( pointer: number ) => {
        if ( pointer === bad ) {
          throw new Error( 'free failed' )
        }

        freed.push( pointer )
      },
    }

    expect( () => freeAll( wasmModule, [ 1, bad, 3 ] ) ).toThrow( /free failed/ )

    expect( freed ).toEqual( [ 1, 3 ] )
  } )
} )
