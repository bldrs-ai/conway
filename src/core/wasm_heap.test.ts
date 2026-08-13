// Covers the three ways arrayToWasmHeap used to go wrong quietly. All of them
// are cheap to exercise against a fake module, and none of them needed the
// geometry wasm - which is the point, since the real one only misbehaves under
// full-corpus memory pressure (bldrs-ai/conway#485).
import { describe, expect, test } from '@jest/globals'

import { arraysToWasmHeap, arrayToWasmHeap, WasmHeapModule } from './wasm_heap'


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
      .toThrow( /_malloc failed/ )
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
      .toThrow( /_malloc failed/ )

    expect( freed ).toEqual( [ first ] )
  } )
} )
