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
  _free( pointer: number ): void
  HEAPU8: Uint8Array
}

export type CopyableArray = Float32Array | Float64Array | Uint32Array


/**
 * Describe the heap and the request, for an error message that is actually
 * actionable.
 *
 * The buffer's kind matters, and there are two kinds to tell apart, not one.
 * conway's MT build creates its memory with `shared: true`, so its heap is a
 * *growable* SharedArrayBuffer; single-threaded builds on emscripten 6 get a
 * *resizable* ArrayBuffer (see decode_utf8.ts). Both cases have length-tracking
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

    const description = describeHeap( wasmModule, arrayPtr, numBytes )

    // The allocation SUCCEEDED and only the view is refused, so this owns a
    // pointer nobody else can reach - arraysToWasmHeap's cleanup cannot see it
    // because it was never returned. Leaking here would mean leaking once per
    // record, under a per-record catch, while reporting that the heap is in
    // trouble.
    wasmModule._free( arrayPtr )

    throw new Error(
      'wasm heap allocation lies outside the heap view - ' +
      `the view is stale or the heap grew without it. ${description}` )
  }

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

    for ( const pointer of pointers ) {
      wasmModule._free( pointer )
    }

    throw error
  }

  return pointers
}
