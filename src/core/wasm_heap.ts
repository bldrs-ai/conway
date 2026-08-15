/**
 * Copying JS-side arrays into the wasm heap.
 *
 * This lives in one place because the two geometry extractors had a copy each,
 * and the copies had drifted: one honoured the source view's window and the
 * other did not, and neither checked what _malloc returned. The failure modes
 * are quiet enough to be worth naming here.
 *
 * See bldrs-ai/conway#485 for what an uninstrumented failure on this path
 * costs: `Invalid typed array length: 80`, no context, and two sightings
 * across two models before it could even be located.
 */

import Logger from '../logging/logger'
import { wasmAddress } from './wasm_address'


/** What the wasm module exposes that this needs. Deliberately narrow. */
export interface WasmHeapModule {
  _malloc( bytes: number ): number
  _free( pointer: number ): void
  HEAPU8: Uint8Array
}

export type CopyableArray = Float32Array | Float64Array | Uint32Array


/**
 * Allocate a checked region of the current wasm heap.
 *
 * Keep this separate from copying so callers that fill an allocation in place
 * get the same exhaustion, unsigned-pointer and stale-view handling as
 * arrayToWasmHeap.
 *
 * @param wasmModule The module to allocate in.
 * @param numBytes Number of bytes required.
 * @return {number} The unsigned wasm address, owned by the caller.
 */
export function allocateWasmHeap(
    wasmModule: WasmHeapModule, numBytes: number ): number {

  const arrayPtr = wasmAddress( wasmModule._malloc( numBytes ) )

  if ( arrayPtr === 0 && numBytes > 0 ) {
    throw new Error(
      `wasm _malloc returned an unusable address for ${numBytes} bytes - ` +
      describeHeap( wasmModule, arrayPtr, numBytes ) )
  }

  const heapBuffer = wasmModule.HEAPU8.buffer

  if ( arrayPtr + numBytes > heapBuffer.byteLength ) {
    const description = describeHeap( wasmModule, arrayPtr, numBytes )

    releaseQuietly( () => wasmModule._free( arrayPtr ) )

    throw new Error(
      'wasm heap allocation lies outside the heap view - ' +
      `the view is stale or the heap grew without it. ${description}` )
  }

  return arrayPtr
}


/**
 * Describe the heap and the request, for an error message that is actually
 * actionable.
 *
 * The buffer's kind matters, and there are two kinds to tell apart, not one.
 * conway's MT build creates its memory with `shared: true`, so its heap is a
 * growable SharedArrayBuffer; single-threaded builds on emscripten 6 get a
 * resizable ArrayBuffer (see decode_utf8.ts). Both cases have length-tracking
 * views that extend by themselves, which is why emscripten's
 * updateMemoryViews() early-returns on growth rather than rebuilding them.
 *
 * So both flags are reported. They have different names on the two buffer
 * types, and printing only one makes every single-threaded failure look like
 * the assumption has broken when it has not - which would be a false alarm
 * pointing away from whatever the real cause was.
 *
 * @param wasmModule The module whose heap is being written to.
 * @param arrayPtr The pointer _malloc returned.
 * @param numBytes The size of the intended copy.
 * @return {string} A description of the heap state.
 */
function describeHeap(
    wasmModule: WasmHeapModule, arrayPtr: number, numBytes: number ): string {

  const heap = wasmModule.HEAPU8
  const buffer =
    heap?.buffer as ( ArrayBuffer | SharedArrayBuffer | undefined ) &
      { growable?: boolean, resizable?: boolean }

  const shared = typeof SharedArrayBuffer !== 'undefined' &&
    buffer instanceof SharedArrayBuffer

  const kind = buffer === void 0 ? 'none' :
    ( shared ? 'SharedArrayBuffer' : 'ArrayBuffer' )

  // Whichever flag this buffer type actually carries. Reported as one field so
  // a reader does not have to know which name goes with which kind.
  const extensible = shared ? buffer?.growable : buffer?.resizable

  return `ptr ${arrayPtr} + ${numBytes} bytes, ` +
    `heap view length ${heap?.length}, ` +
    `buffer ${kind} byteLength ${buffer?.byteLength}, ` +
    `extensible ${extensible}`
}


/**
 * Copy an array into a fresh wasm heap allocation.
 *
 * @param wasmModule The module to allocate in.
 * @param array The data to copy. May be a view into a larger buffer.
 * @return {number} Pointer to the copy, owned by the caller.
 */
export function arrayToWasmHeap(
    wasmModule: WasmHeapModule, array: CopyableArray ): number {

  const numBytes = array.length * array.BYTES_PER_ELEMENT

  // Normalised, not rejected. _malloc is bound raw from wasmExports and
  // returns i32, and every target builds with MAXIMUM_MEMORY=4GB, so a
  // perfectly good address at or above 2^31 arrives here NEGATIVE. Treating
  // that as a failure would hard-fail every copy once the heap passes 2GB -
  // which is the memory-pressure scenario #485 is about - so it is converted
  // the way emscripten's own glue does (`HEAPU32[ptr >>> 2 >>> 0]`) and used
  // in that form for the bounds test, the view, the free and the message.
  // Left signed it would also pass the bounds test below, since a negative
  // plus numBytes is not greater than byteLength.
  const arrayPtr = allocateWasmHeap( wasmModule, numBytes )
  const heapBuffer = wasmModule.HEAPU8.buffer

  const destination = new Uint8Array( heapBuffer, arrayPtr, numBytes )

  // Honour the source view's own window: subarray() results share their
  // parent's backing buffer, so copying `array.buffer` wholesale reads the
  // wrong bytes, and the wrong number of them, for anything that is a view.
  destination.set( new Uint8Array( array.buffer, array.byteOffset, numBytes ) )

  return arrayPtr
}


/**
 * Copy several arrays into the wasm heap, all or nothing.
 *
 * arrayToWasmHeap throws on a failed allocation, which is the right thing on
 * its own but turns a caller that allocates N buffers before freeing any into
 * a leak: the throw on buffer 2 strands buffer 1, the per-record catch
 * upstream moves to the next record, and the leak repeats - accelerating the
 * exhaustion being reported. Callers that hold several at once use this
 * instead, which frees what it took before letting the error out.
 *
 * @param wasmModule The module to allocate in.
 * @param arrays The data to copy, in order.
 * @return {number[]} Pointers in the same order, owned by the caller.
 */
export function arraysToWasmHeap(
    wasmModule: WasmHeapModule,
    arrays: readonly CopyableArray[] ): number[] {

  const pointers: number[] = []

  try {

    for ( const array of arrays ) {
      pointers.push( arrayToWasmHeap( wasmModule, array ) )
    }
  } catch ( error ) {

    // Individually, and quietly. One free throwing must not strand the rest,
    // and must not replace the allocation error being propagated.
    for ( const pointer of pointers ) {
      releaseQuietly( () => wasmModule._free( pointer ) )
    }

    throw error
  }

  return pointers
}


/**
 * Run a resource release so it cannot replace an exception already in flight.
 *
 * Releases here re-enter the wasm runtime - _free, embind delete(), returning
 * a pooled buffer - and they run from finally blocks that may be unwinding
 * because that runtime just failed. A throw from one of them would REPLACE the
 * original error, so the caller upstream would see a generic teardown failure
 * instead of the diagnostic that says what actually went wrong. Losing the
 * cause is strictly worse than failing to reclaim memory on a path where the
 * heap is already lost.
 *
 * Reported at debug rather than swallowed outright, so it is still findable
 * with -vv, and NOT at warning/error: this runs during teardown of an already
 * failing record, where a second message would be noise on top of the one that
 * matters.
 *
 * @param release The release step to run.
 */
export function releaseQuietly( release: () => void ): void {

  try {

    release()
  } catch ( error ) {

    Logger.debug(
      `wasm resource release failed during teardown: ${
        error instanceof Error ? error.message : error}` )
  }
}


/**
 * Run `body`, then release - propagating a release failure on success, and
 * suppressing it only when something is already being unwound.
 *
 * That asymmetry is the point. releaseQuietly on its own is right during
 * unwinding and wrong otherwise: on the success path a teardown failure is a
 * real fault with nothing competing to report it, and swallowing it would let
 * a record be reported COMPLETE while its resources were never reclaimed. So
 * the quiet treatment applies to exactly the case it was argued for.
 *
 * @param body The work that needs the resource.
 * @param release How to give the resource back.
 * @return {T} Whatever body returned.
 */
export function withRelease<T>( body: () => T, release: () => void ): T {

  let result: T

  try {

    result = body()
  } catch ( error ) {

    releaseQuietly( release )

    throw error
  }

  release()

  return result
}


/**
 * Free several pointers, independently.
 *
 * One failing free must not abandon the rest - batching them into a single
 * statement means the first failure strands every pointer after it - and it
 * must not be lost either, so the first error is re-thrown once they have all
 * been attempted. Combined with withRelease that gives the wanted behaviour on
 * both paths: everything is freed either way, and the failure surfaces on the
 * success path while staying quiet during unwinding.
 *
 * @param wasmModule The module the pointers belong to.
 * @param pointers The allocations to release.
 */
export function freeAll(
    wasmModule: WasmHeapModule, pointers: readonly number[] ): void {

  let firstFailure: unknown

  for ( const pointer of pointers ) {

    try {

      wasmModule._free( pointer )
    } catch ( error ) {

      firstFailure ??= error
    }
  }

  if ( firstFailure !== void 0 ) {
    throw firstFailure
  }
}
