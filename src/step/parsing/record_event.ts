/**
 * The streaming parse's per-record event (M2, issue #393): fired as each
 * top-level record is indexed, before the record's bytes leave the window.
 *
 * The record's raw bytes are handed over as `(buffer, byteOffset, byteLength)`
 * rather than as a `Uint8Array` slice, deliberately: a slice would be a fresh
 * object per record — 9.4 M allocations on a PSB-class file, measured at ~5.7 %
 * of parse wall-clock and ~46 MB of retained heap for handlers that never look
 * at the bytes (the spike in `scripts/m2_consumer_spike.mjs`). With the view
 * un-materialised, a handler that only wants ids pays nothing, and one that
 * wants bytes calls `buffer.subarray( byteOffset, byteOffset + byteLength )`
 * itself.
 *
 * `buffer` is the parse window, so the bytes are valid ONLY for the duration
 * of the call — the window slides and is overwritten as the parse advances.
 * A handler that needs them later must copy.
 *
 * Handlers run synchronously inside the parse loop and must stay cheap
 * (copy ids into compact structures). Anything expensive belongs on the
 * demand queue — see design/new/streaming-federated-loader.md § 2.
 */
export type RecordEventHandler<TypeIDType> = (
  localID: number,
  expressID: number,
  typeID: TypeIDType | undefined,
  buffer?: Uint8Array,
  byteOffset?: number,
  byteLength?: number ) => void
