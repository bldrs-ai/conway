/**
 * UTF-8 decoding for STEP bytes that may live in the wasm heap.
 *
 * Under Emscripten 6.0.2 the browser wasm heap is exposed as a *resizable*
 * ArrayBuffer (or a growable SharedArrayBuffer on the threaded build). Strict
 * browsers' `TextDecoder.decode()` throws a TypeError when handed a view backed
 * by such a buffer ("...can't be a resizable ArrayBuffer"). When STEP entity
 * string/enum bytes are decoded straight from a heap view, that throw is caught
 * upstream as an extraction error and the affected face/style is silently
 * dropped — producing see-through geometry in Chrome/Firefox, while Safari
 * (which tolerates it) and Node (lenient) render correctly.
 *
 * `decodeUtf8` copies the view out of a resizable/growable buffer before
 * decoding; Node, Safari, and pre-6 builds keep the zero-copy fast path.
 */

const decoder = new TextDecoder()

/**
 * Whether `TextDecoder.decode()` may reject a view backed by this buffer.
 *
 * `resizable` (ArrayBuffer) and `growable` (SharedArrayBuffer) are the buffer
 * shapes strict engines refuse; both are absent (undefined) on plain buffers,
 * so this stays false — and the caller stays zero-copy — everywhere except the
 * Emscripten 6 browser heap.
 *
 * @param buffer The backing buffer of a byte view.
 * @return True when the view must be copied before decoding.
 */
function decodeNeedsCopy(buffer: ArrayBufferLike): boolean {
  const b = buffer as { resizable?: boolean; growable?: boolean }
  return b.resizable === true || b.growable === true
}

/**
 * UTF-8 decode a byte view, tolerating wasm-heap-backed resizable/growable
 * buffers that `TextDecoder.decode()` would otherwise reject.
 *
 * @param view The bytes to decode.
 * @return The decoded string.
 */
export function decodeUtf8(view: Uint8Array): string {
  return decoder.decode(decodeNeedsCopy(view.buffer) ? view.slice() : view)
}
