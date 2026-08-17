/**
 * Reading and writing the wasm heap from JS, through views that are known to
 * belong to the heap as it is RIGHT NOW.
 *
 * This lives in one place because the two geometry extractors had a copy each,
 * and the copies had drifted: one honoured the source view's window and the
 * other did not, and neither checked what _malloc returned. The failure modes
 * are quiet enough to be worth naming here.
 *
 * See bldrs-ai/conway#485 for what an uninstrumented failure on this path
 * costs: `Invalid typed array length: 80`, no context, and two sightings
 * across two models before it could even be located.
 *
 * The confirmed mechanism behind #485
 * -----------------------------------
 * conway's MT builds create their memory as
 * `new WebAssembly.Memory({ initial, maximum: 65536, shared: true })` with no
 * `maxByteLength`, so `wasmMemory.buffer` is a **non-extensible**
 * SharedArrayBuffer - `growable === false`, `maxByteLength === byteLength`
 * (verified against Dist/ConwayGeomWasmNodeMT.js and by inspecting a live
 * module). A non-extensible buffer cannot grow in place, so
 * `WebAssembly.Memory.grow()` materialises a NEW SharedArrayBuffer, which the
 * `.buffer` getter hands out from then on.
 *
 * emscripten rebuilds `Module.HEAPU8` and friends over that new buffer in
 * `updateMemoryViews()` - but only on the thread that did the growing, and
 * only when its own glue passes through `growMemViews()`. Growth driven by a
 * pthread runs `updateMemoryViews()` in the WORKER's JS scope; the main
 * thread's `Module.HEAPU8` stays bound to the pre-growth buffer until some
 * main-thread glue call happens to run `growMemViews()`. `_malloc` is a raw
 * wasm export, so it is not one of those calls: it can hand back an address in
 * the newly added region while the JS-side view still ends before it. That is
 * exactly the state #498's diagnostic captured in CI - view length equal to
 * its own buffer's byteLength (so not stale relative to that buffer),
 * `extensible false` (so that buffer never grew), and the pointer past the end
 * of both.
 *
 * Which is why every view here is built through wasmHeapView(): it re-reads
 * the module's view, reconciles it against the pointer, and only then
 * constructs.
 */

import Logger from '../logging/logger'


/**
 * What the wasm module exposes that this needs. Deliberately narrow.
 *
 * Everything past `HEAPU8` is a refresh route that MAY be present; see
 * refreshHeapViews for what each one is worth and which of them conway's
 * current builds actually have.
 */
export interface WasmHeapModule {
  _malloc( bytes: number ): number
  _free( pointer: number ): void
  HEAPU8: Uint8Array

  /**
   * emscripten's own view rebuilder, if the build exports it. Not exported by
   * any conway build today.
   */
  updateMemoryViews?: () => void

  /**
   * The live `WebAssembly.Memory`, if the build exposes it. Its `.buffer`
   * getter always yields the current buffer, which makes staleness
   * unrepresentable. Not exposed by any conway build today.
   */
  wasmMemory?: { readonly buffer: ArrayBufferLike }

  /**
   * embind's `std::vector<std::string>`. Present on every conway-geom build;
   * used as a refresh route of last resort (see refreshHeapViews).
   */
  stringVector?: new () => { push_back( value: string ): void, delete(): void }
}

export type CopyableArray = Float32Array | Float64Array | Uint32Array

/**
 * The part of a typed-array constructor wasmHeapView needs: build over a
 * buffer at a byte offset, and say how wide an element is.
 */
export interface WasmHeapArrayConstructor< TArray > {
  new ( buffer: ArrayBufferLike, byteOffset: number, length: number ): TArray
  readonly BYTES_PER_ELEMENT: number
}


/**
 * Describe the heap and the request, for an error message that is actually
 * actionable.
 *
 * Three of these fields exist to tell #485's two candidate mechanisms apart,
 * and the CI capture that settled it read them in this order:
 *
 * - `heap view length` BELOW `byteLength` means the view is stale relative to
 *   its own buffer - a buffer that grew in place while the view kept its
 *   original length.
 * - `heap view length` EQUAL to `byteLength`, with the pointer past both,
 *   means the view is fine for the buffer it has and the buffer itself is the
 *   old one - the heap grew into a different buffer object entirely.
 * - `extensible` settles whether the first was even possible: a non-extensible
 *   buffer can never have grown in place.
 *
 * The flag has different names on the two buffer kinds (`growable` on
 * SharedArrayBuffer, `resizable` on ArrayBuffer), so it is reported as one
 * field alongside the kind rather than making a reader know which goes with
 * which. Printing only one name would make every single-threaded failure look
 * like the shared-memory case, pointing away from whatever the real cause was.
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
    currentHeapBuffer( wasmModule ) as ( ArrayBufferLike | undefined ) &
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
 * The buffer the heap lives in as of this instant.
 *
 * `wasmMemory` is authoritative when a build exposes it - its `.buffer` getter
 * cannot be stale - and reading it is a property access, so it is worth
 * preferring even though nothing exposes it yet. Otherwise this is the
 * module's cached view's buffer, which is what everything downstream then has
 * to reconcile.
 *
 * @param wasmModule The module whose heap is wanted.
 * @return {ArrayBufferLike} The heap's backing buffer.
 */
function currentHeapBuffer( wasmModule: WasmHeapModule ): ArrayBufferLike {

  const memory = wasmModule.wasmMemory

  // Re-read HEAPU8 off the module every time rather than caching it: an
  // emscripten refresh REPLACES the property, so a cached reference is exactly
  // the stale view this module exists to avoid.
  return memory !== void 0 ? memory.buffer : wasmModule.HEAPU8?.buffer
}


/**
 * Bring the module's cached heap views back in line with the real memory.
 *
 * Only ever called once a pointer has been seen to fall outside the cached
 * view, so cost here is paid about once per growth event, not per copy.
 *
 * The routes are tried best-first, and the last one is the only one conway's
 * current builds actually have. That is a finding, not an oversight: the
 * emscripten output exposes `HEAP8/HEAPU8/HEAP32/HEAPU32/HEAPF32/HEAPF64`,
 * `_malloc` and `_free` and nothing else memory-related - no `wasmMemory`, no
 * `updateMemoryViews`, no `growMemViews`, no `GROWABLE_HEAP_*` helpers. What
 * it does have is `growMemViews()` guarding every heap access inside its own
 * JS library, and embind's `std::string` marshalling is one of those accesses
 * (`stringToUTF8` reads `(growMemViews(), HEAPU8)`). So pushing an empty
 * string into an embind vector makes emscripten notice the growth and rebuild
 * `Module.HEAPU8` for us, which is what the reconcile below then re-reads.
 * Measured at ~9us per round trip, on a path that runs after a heap growth.
 *
 * @param wasmModule The module whose views may be stale.
 */
function refreshHeapViews( wasmModule: WasmHeapModule ): void {

  if ( typeof wasmModule.updateMemoryViews === 'function' ) {

    wasmModule.updateMemoryViews()

    return
  }

  // Nothing to refresh - currentHeapBuffer already reads this live.
  if ( wasmModule.wasmMemory !== void 0 ) {
    return
  }

  const StringVector = wasmModule.stringVector

  // Absent on a module that is not conway-geom (the fakes in the tests, say),
  // in which case there is no route and the caller reports the state instead.
  if ( StringVector === void 0 ) {
    return
  }

  const scratch = new StringVector()

  // delete() re-enters the wasm runtime that may just have failed, and losing
  // the heap diagnostic to a teardown error would defeat the point.
  withRelease(
      () => scratch.push_back( '' ),
      () => scratch.delete() )
}


/**
 * Reconcile a pointer against the heap, refreshing stale views if that is what
 * is wrong, and hand back the buffer the view should be built over.
 *
 * The hot path is one property read, one add and one compare - the same test
 * that was already here - so the refresh machinery costs nothing until a
 * pointer actually lands outside.
 *
 * @param wasmModule The module the pointer belongs to.
 * @param address The pointer, already normalised to unsigned.
 * @param numBytes How many bytes past it will be touched.
 * @return {ArrayBufferLike} A buffer that contains [address, address+numBytes).
 */
function reconcileHeapBuffer(
    wasmModule: WasmHeapModule, address: number, numBytes: number ):
    ArrayBufferLike {

  const buffer = currentHeapBuffer( wasmModule )

  if ( buffer !== void 0 && address + numBytes <= buffer.byteLength ) {
    return buffer
  }

  refreshHeapViews( wasmModule )

  const refreshed = currentHeapBuffer( wasmModule )

  if ( refreshed !== void 0 && address + numBytes <= refreshed.byteLength ) {
    return refreshed
  }

  // Past here the heap really does not contain the address, so this is the
  // genuinely-impossible case #498 added the diagnostic for rather than the
  // growth race it was chasing.
  throw new Error(
      'wasm heap allocation lies outside the heap, and refreshing the module ' +
      'views did not reconcile it. ' +
      describeHeap( wasmModule, address, numBytes ) )
}


/**
 * Build a typed-array view over a region of the wasm heap.
 *
 * Every view onto the heap in this repo goes through here, because the
 * property that makes a view safe - that its buffer is the heap's CURRENT
 * buffer - is not something a caller can check by looking at its own code. It
 * depends on whether some other thread grew the heap between the call that
 * produced `pointer` and this line.
 *
 * Two things beyond the reconcile are worth knowing:
 *
 * - The pointer is normalised to unsigned. Pointers reaching JS from raw i32
 *   wasm exports arrive NEGATIVE once the heap passes 2GB, and every target
 *   builds with `maximum: 65536` pages (4GB), so that is a reachable state and
 *   not a theoretical one. (This build's `applySignatureConversions` already
 *   wraps `_malloc` as `a0 => f(a0) >>> 0`; pointers from other exports and
 *   from other builds are not covered by that, so it is done here too.)
 * - A view is CONSTRUCTED rather than `subarray`d off the module's view.
 *   `subarray` silently clamps an out-of-range window, which turns "the heap
 *   moved" into a short view and then into a copy that lands somewhere else
 *   entirely; the constructor throws instead, and by then the reconcile has
 *   already made throwing the right answer.
 *
 * @param wasmModule The module owning the heap.
 * @param arrayType The typed-array constructor for the element type wanted.
 * @param pointer Byte address in the heap, signed or unsigned.
 * @param elementCount How many elements the view spans.
 * @return {TArray} A view over the live heap. Do not retain it across any
 * further call into wasm.
 */
export function wasmHeapView< TArray >(
    wasmModule: WasmHeapModule,
    arrayType: WasmHeapArrayConstructor< TArray >,
    pointer: number,
    elementCount: number ): TArray {

  const address = pointer >>> 0
  const numBytes = elementCount * arrayType.BYTES_PER_ELEMENT

  return new arrayType(
      reconcileHeapBuffer( wasmModule, address, numBytes ),
      address,
      elementCount )
}


/**
 * How many bytes of wasm heap there currently are.
 *
 * Refreshes first, unconditionally - which is the opposite of what
 * wasmHeapView does, and deliberate. There is nothing to compare a size
 * against, so lag here cannot be detected the way an out-of-range pointer can;
 * and `HEAPU8.length` on its own under-reports by a whole growth step whenever
 * the module's views are behind (see this file's header), which is the one
 * thing a high-water figure must not do. This is a reporting call - a line at
 * the end of a run - so paying microseconds for a true answer is the right
 * trade. Do not put it in a loop.
 *
 * @param wasmModule The module to measure.
 * @return {number} The heap's size in bytes, or 0 if it has no heap yet.
 */
export function wasmHeapByteLength( wasmModule: WasmHeapModule ): number {

  refreshHeapViews( wasmModule )

  return currentHeapBuffer( wasmModule )?.byteLength ?? 0
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

  // Normalised, not rejected. Pointers arriving from raw i32 wasm exports are
  // NEGATIVE at or above 2^31, and every target builds with 4GB of maximum
  // memory, so that is reachable - and it is reachable precisely under the
  // memory pressure #485 is about. wasmHeapView normalises too; doing it here
  // as well keeps the zero test, the free and the message all talking about
  // the same address.
  const arrayPtr = wasmModule._malloc( numBytes ) >>> 0

  // 0 is _malloc's failure return and also a valid byteOffset, so the view
  // below would be constructed happily and this would go on to write over
  // whatever lives at address 0 - corrupting the heap instead of reporting
  // that it is exhausted.
  if ( arrayPtr === 0 && numBytes > 0 ) {

    throw new Error(
      `wasm _malloc returned an unusable address for ${numBytes} bytes - ` +
      describeHeap( wasmModule, arrayPtr, numBytes ) )
  }

  let destination: Uint8Array

  try {

    destination = wasmHeapView( wasmModule, Uint8Array, arrayPtr, numBytes )
  } catch ( error ) {

    // The allocation SUCCEEDED and only the view is refused, so this owns a
    // pointer nobody else can reach - arraysToWasmHeap's cleanup cannot see it
    // because it was never returned. Leaking here would mean leaking once per
    // record, under a per-record catch, while reporting that the heap is in
    // trouble.
    releaseQuietly( () => wasmModule._free( arrayPtr ) )

    throw error
  }

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
