import {describe, expect, test} from '@jest/globals'
import { decodeUtf8, installResizableTextDecoderShim } from './decode_utf8'


/**
 * Build a Uint8Array view whose backing buffer is a *resizable* ArrayBuffer —
 * the shape the Emscripten 6.0.2 browser wasm heap presents, and which strict
 * browsers' TextDecoder.decode() rejects.
 *
 * @param text ASCII text to encode into the view.
 * @return A subarray view over a resizable ArrayBuffer.
 */
function resizableView(text: string): Uint8Array {
  const bytes = new TextEncoder().encode(text)
  // The 2-arg resizable-ArrayBuffer constructor (ES2024) may predate the TS lib
  // in use; construct it through a cast so this compiles regardless.
  const ResizableArrayBuffer =
    ArrayBuffer as { new(byteLength: number, options: {maxByteLength: number}): ArrayBuffer }
  // eslint-disable-next-line no-magic-numbers
  const rab = new ResizableArrayBuffer(bytes.length, {maxByteLength: bytes.length * 2})
  const view = new Uint8Array(rab)
  view.set(bytes)
  return view.subarray(0, bytes.length)
}

describe('decodeUtf8', () => {

  test('decodes a plain (non-resizable) buffer view', () => {
    const view = new TextEncoder().encode('ADVANCED_FACE')
    expect(decodeUtf8(view)).toBe('ADVANCED_FACE')
  })

  test('decodes a view over a resizable ArrayBuffer without throwing', () => {
    // A raw TextDecoder.decode() on this view throws a TypeError in Firefox and
    // Chrome ("can't be a resizable ArrayBuffer"); decodeUtf8 must not.
    const view = resizableView('SURFACE_STYLE_FILL_AREA')
    expect((view.buffer as {resizable?: boolean}).resizable).toBe(true)
    expect(decodeUtf8(view)).toBe('SURFACE_STYLE_FILL_AREA')
  })

  test('survives a strict TextDecoder that rejects resizable buffers', () => {
    // Simulate the browser: make decode() throw when the view is resizable-backed.
    const proto = TextDecoder.prototype as { decode: TextDecoder['decode'] }
    const real = proto.decode
    proto.decode = function decode(this: TextDecoder, input?: BufferSource, opts?: TextDecodeOptions): string {
      const buffer = (input as ArrayBufferView | undefined)?.buffer as
        (ArrayBuffer & {resizable?: boolean}) | undefined
      if (buffer?.resizable === true) {
        throw new TypeError("TextDecoder.decode: ArrayBufferView ... can't be a resizable ArrayBuffer")
      }
      return real.call(this, input as BufferSource, opts)
    }
    try {
      const view = resizableView('ADVANCED')
      // A decode through the now-strict prototype throws, like the browser
      // (the old, face-dropping path)…
      expect(() => new TextDecoder().decode(view)).toThrow(TypeError)
      // …decodeUtf8 copies out and succeeds.
      expect(decodeUtf8(view)).toBe('ADVANCED')
    } finally {
      proto.decode = real
    }
  })

  test('preserves non-ASCII UTF-8 through the copy path', () => {
    const view = resizableView('café — Ω')
    expect(decodeUtf8(view)).toBe('café — Ω')
  })

  test('global shim rescues decodes we do not own (e.g. the wasm glue)', () => {
    // The wasm glue's UTF8ToString / embind string returns call
    // TextDecoder.prototype.decode directly on resizable-heap views — we can't
    // route those through decodeUtf8. The global shim must intercept them.
    const proto = TextDecoder.prototype as { decode: TextDecoder['decode'] }
    const realDecode = proto.decode
    // Simulate a strict browser: the base decode throws on a resizable view.
    proto.decode = function strict(this: TextDecoder, input?: BufferSource, opts?: TextDecodeOptions): string {
      const buffer = (ArrayBuffer.isView(input) ? input.buffer : input) as
        { resizable?: boolean } | undefined
      if (buffer?.resizable === true) {
        throw new TypeError("TextDecoder.decode: ... can't be a resizable ArrayBuffer")
      }
      return realDecode.call(this, input as BufferSource, opts)
    }
    try {
      const view = resizableView('ADVANCED_FACE_STRING_VALUE')
      // Before the shim, a raw decode (the glue's path) throws.
      expect(() => proto.decode.call(new TextDecoder(), view)).toThrow(TypeError)
      // Install the shim on top of the strict base.
      installResizableTextDecoderShim()
      // Now the same raw decode is intercepted, copied out, and succeeds.
      expect(new TextDecoder().decode(view)).toBe('ADVANCED_FACE_STRING_VALUE')
    } finally {
      proto.decode = realDecode
    }
  })
})
