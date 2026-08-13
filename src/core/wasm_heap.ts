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

/** What the wasm module exposes that this needs. Deliberately narrow. */
export interface WasmHeapModule {
  _malloc( bytes: number ): number
  HEAPU8: Uint8Array
}

export type CopyableArray = Float32Array | Float64Array | Uint32Array


/**
 * Describe the heap and the request, for an error message that is actually
 * actionable.
 *
 * The buffer's kind matters: conway's MT build creates its memory with
 * `shared: true`, so the heap is a growable SharedArrayBuffer and emscripten's
 * updateMemoryViews() early-returns on every growth - the views are
 * length-tracking and auto-extend instead of being rebuilt. If a failure here
 * ever reports a plain ArrayBuffer, or a byteLength behind the pointer, that
 * assumption has broken and the message says so rather than leaving it to be
 * rediscovered.
 *
 * @param wasmModule The module whose heap is being written to.
 * @param arrayPtr The pointer _malloc returned.
 * @param numBytes The size of the intended copy.
 * @return {string} A description of the heap state.
 */
function describeHeap(
    wasmModule: WasmHeapModule, arrayPtr: number, numBytes: number ): string {

  const heap = wasmModule.HEAPU8
  const buffer = heap?.buffer as ( ArrayBuffer | SharedArrayBuffer | undefined )
  const kind = buffer === void 0 ? 'none' :
    ( typeof SharedArrayBuffer !== 'undefined' &&
      buffer instanceof SharedArrayBuffer ? 'SharedArrayBuffer' : 'ArrayBuffer' )

  return `ptr ${arrayPtr} + ${numBytes} bytes, ` +
    `heap view length ${heap?.length}, ` +
    `buffer ${kind} byteLength ${buffer?.byteLength}, ` +
    `growable ${( buffer as { growable?: boolean } )?.growable}`
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
  const arrayPtr = wasmModule._malloc( numBytes )

  // _malloc returns 0 on failure, which is a valid byteOffset, so the view
  // below would be constructed happily and this would go on to write over
  // whatever lives at address 0 - corrupting the heap instead of reporting
  // that it is exhausted.
  if ( arrayPtr === 0 && numBytes > 0 ) {

    throw new Error(
      `wasm _malloc failed for ${numBytes} bytes - ` +
      describeHeap( wasmModule, arrayPtr, numBytes ) )
  }

  const heapBuffer = wasmModule.HEAPU8.buffer

  // Checked rather than left to the TypedArray constructor, whose RangeError
  // is just "Invalid typed array length: N" - true, unactionable, and
  // indistinguishable from a dozen other causes.
  if ( arrayPtr + numBytes > heapBuffer.byteLength ) {

    throw new Error(
      'wasm heap allocation lies outside the heap view - ' +
      `the view is stale or the heap grew without it. ` +
      describeHeap( wasmModule, arrayPtr, numBytes ) )
  }

  const destination = new Uint8Array( heapBuffer, arrayPtr, numBytes )

  // Honour the source view's own window: subarray() results share their
  // parent's backing buffer, so copying `array.buffer` wholesale reads the
  // wrong bytes, and the wrong number of them, for anything that is a view.
  destination.set( new Uint8Array( array.buffer, array.byteOffset, numBytes ) )

  return arrayPtr
}
