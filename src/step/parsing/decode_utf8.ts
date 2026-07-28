/**
 * UTF-8 decoding compat for the Emscripten 6.0.2 resizable wasm heap.
 *
 * Under Emscripten 6.0.2 the browser wasm heap is exposed as a *resizable*
 * ArrayBuffer (a growable SharedArrayBuffer on the threaded build — see
 * `wasmMemory.toResizableBuffer()` in the generated glue). Strict browsers'
 * `TextDecoder.decode()` throws a TypeError when handed a view backed by such a
 * buffer ("...can't be a resizable ArrayBuffer"). Anything that decodes a heap
 * view then throws and, when that happens inside geometry extraction, the face
 * is silently dropped — producing see-through models in Chrome/Firefox, while
 * Safari (which tolerates it) and Node (whose heap is not resizable) are fine.
 *
 * Two decoders hit this:
 *   1. Our own STEP string/enum decodes — routed through `decodeUtf8` below.
 *   2. Emscripten's `UTF8ToString` / embind `std::string` returns in the wasm
 *      glue, which we do NOT own — covered by the global prototype shim, since
 *      the glue calls `TextDecoder.prototype.decode` like everyone else.
 *
 * Both copy the bytes out of a resizable/growable buffer first; plain buffers
 * (Node, Safari, pre-6 builds) keep the zero-copy fast path.
 */

const decoder = new TextDecoder()

/**
 * Whether `TextDecoder.decode()` may reject a view backed by this buffer.
 *
 * `resizable` (ArrayBuffer) and `growable` (SharedArrayBuffer) are the buffer
 * shapes strict engines refuse; both are absent (undefined) on plain buffers,
 * so this stays false — and callers stay zero-copy — everywhere except the
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
 * Copy an array-buffer view into a fresh, plain (non-resizable) `Uint8Array`.
 *
 * @param view The view to copy.
 * @return A plain-buffer copy of the view's bytes.
 */
function copyOutOfResizable(view: ArrayBufferView): Uint8Array {
  return new Uint8Array(
      view.buffer as ArrayBufferLike, view.byteOffset, view.byteLength).slice()
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

const strictUtf8Decoder = new TextDecoder('utf-8', {fatal: true})

/**
 * Decode the raw byte run of a STEP string literal.
 *
 * ISO 10303-21 says raw (non-\X\-escaped) bytes are ISO 8859-1, but modern
 * exporters routinely write UTF-8 (and some, like Onshape's ST-Developer,
 * write outright invalid sequences). The lenient default decoder mapped every
 * non-UTF-8 byte to U+FFFD, so a spec-conformant latin-1 'Küche' surfaced as
 * 'K�che' in product names and titles. Decode as strict UTF-8 first (the
 * common modern case, and unambiguous when it validates), and fall back to
 * exact ISO 8859-1 (byte = code point, which cannot fail) when it doesn't.
 *
 * @param view The bytes of the string literal's raw run.
 * @return The decoded string.
 */
export function decodeStepString(view: Uint8Array): string {
  const bytes = decodeNeedsCopy(view.buffer) ? view.slice() : view

  try {
    return strictUtf8Decoder.decode(bytes)
  } catch {
    let result = ''

    for (let where = 0; where < bytes.length; ++where) {
      result += String.fromCharCode(bytes[where])
    }

    return result
  }
}

let shimInstalled = false

/**
 * Install a global, idempotent `TextDecoder.prototype.decode` shim that copies a
 * view out of a resizable/growable buffer before decoding. This covers decodes
 * we do not own — chiefly Emscripten's `UTF8ToString` and embind `std::string`
 * returns in the wasm glue, which read straight from the resizable wasm heap and
 * would otherwise throw mid-extraction and drop geometry. A no-op where
 * `TextDecoder` is absent or the buffer is plain.
 */
export function installResizableTextDecoderShim(): void {
  if (shimInstalled || typeof TextDecoder === 'undefined') {
    return
  }
  shimInstalled = true

  const proto = TextDecoder.prototype as { decode: TextDecoder['decode'] }
  const original = proto.decode

  proto.decode = function decode(
      this: TextDecoder, input?: BufferSource, options?: TextDecodeOptions): string {
    if (input !== undefined) {
      const buffer = (ArrayBuffer.isView(input) ? input.buffer : input) as ArrayBufferLike
      if (decodeNeedsCopy(buffer)) {
        input = ArrayBuffer.isView(input) ?
          copyOutOfResizable(input) :
          new Uint8Array(input as ArrayBufferLike).slice()
      }
    }
    return original.call(this, input as BufferSource, options)
  }
}
