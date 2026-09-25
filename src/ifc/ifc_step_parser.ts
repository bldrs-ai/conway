import ParsingBuffer from '../parsing/parsing_buffer'
import StepParser, {
  ParseProgressCallback,
  ParseResult,
  StepHeader,
} from '../step/parsing/step_parser'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import EntitTypesIfcSearch from './ifc4_gen/entity_types_search.gen'
import IfcStepModel from './ifc_step_model'
import {
  BufferByteSource,
  ByteSource,
  ReadableByteSource,
} from '../step/parsing/byte_source'
import {
  buildColumnarIndexStreaming,
  buildColumnarIndexStreamingAsync,
} from '../step/parsing/streaming_index_builder'
import {
  StepExternalByteStore,
  WindowedStepBufferProvider,
} from '../step/step_buffer_provider'
import {
  assertNativeSchemaSupported,
  Ifc4x3CompatRouteRequired,
  selectIfcSchemaKindForHeader,
} from './ifc_schema_selection'
import {
  buildIfc4x3CompatIndex,
  buildIfc4x3CompatIndexAsync,
  IFC4X3_COMPAT_POOL_BYTES,
  ifc4x3CompatModel,
} from './ifc4x3_ifc4_compat'


/** Default moving-window size for the streaming index build (1 MiB). */
// eslint-disable-next-line no-magic-numbers
const DEFAULT_STREAM_POOL_BYTES = 1024 * 1024

/**
 * Parser for taking IFC file serialized in step and turning them into a lazily parsed model.
 */
export default class IfcStepParser extends StepParser< EntityTypesIfc > {
  /**
   * Construct the IFC step parser.
   */
  constructor() {
    super( EntitTypesIfcSearch )
  }

  /**
   * An easily accessible and re-usable instance of the parser.
   *
   * Note the parser itself is free of mutable state in the class, so there's no problems
   * with just using a single one.
   */
  public static readonly Instance = new IfcStepParser()

  /**
   * Parse data to the model
   *
   * @param input The parsing buffer, set to user data, to read.
   * @param onProgress Optional byte-cursor progress callback for the data parse.
   * @return {[ParseResult, IfcStepModel | undefined]} The parse result as well as the model,
   * if it can be extracted.
   */
  public parseDataToModel(
      input: ParsingBuffer,
      onProgress?: ParseProgressCallback ): [ParseResult, IfcStepModel | undefined] {
    const [itemIndex, parseResult] = this.parseDataBlock( input, onProgress )

    return [parseResult, new IfcStepModel( input.buffer, itemIndex.elements )]
  }

  /**
   * Cooperative variant of parseDataToModel — periodically yields to the
   * event loop mid-parse (see StepParser.parseDataBlockAsync, issue #301 §2).
   *
   * @param input The parsing buffer, set to user data, to read.
   * @param onProgress Optional byte-cursor progress callback for the data parse.
   * @return {Promise<[ParseResult, IfcStepModel | undefined]>} The parse result as well
   * as the model, if it can be extracted.
   */
  public async parseDataToModelAsync(
      input: ParsingBuffer,
      onProgress?: ParseProgressCallback ):
      Promise<[ParseResult, IfcStepModel | undefined]> {
    const [itemIndex, parseResult] = await this.parseDataBlockAsync( input, onProgress )

    return [parseResult, new IfcStepModel( input.buffer, itemIndex.elements )]
  }

  /**
   * {@link parseDataToModel}, routed by the already-parsed header: an
   * IFC4X3 header takes the IFC4-compatible route (ifc4x3_ifc4_compat.ts)
   * over the whole resident buffer, and anything else parses exactly as
   * before. This is what every resident-buffer entry point calls, so the
   * route is decided in one place.
   *
   * @param stepHeader The header, parsed from this same buffer.
   * @param input The parsing buffer, positioned after the header.
   * @param onProgress Optional byte-cursor progress (IFC4 path only; the
   * synchronous compat build has no progress hook).
   * @return {[ParseResult, IfcStepModel | undefined]} Result and model.
   * @throws {Ifc4x3IneligibleError} For an IFC4X3 file IFC4 cannot decode.
   */
  public parseDataToModelForHeader(
      stepHeader: StepHeader,
      input: ParsingBuffer,
      onProgress?: ParseProgressCallback ): [ParseResult, IfcStepModel | undefined] {

    if ( selectIfcSchemaKindForHeader( stepHeader ) === 'ifc4x3' ) {

      const index = buildIfc4x3CompatIndex(
          new BufferByteSource( input.buffer ), IFC4X3_COMPAT_POOL_BYTES )

      return [index.result, ifc4x3CompatModel( input.buffer, index )]
    }

    return this.parseDataToModel( input, onProgress )
  }

  /**
   * Cooperative twin of {@link parseDataToModelForHeader}.
   *
   * @param stepHeader The header, parsed from this same buffer.
   * @param input The parsing buffer, positioned after the header.
   * @param onProgress Optional byte-cursor progress.
   * @return {Promise<[ParseResult, IfcStepModel | undefined]>} Result and model.
   * @throws {Ifc4x3IneligibleError} For an IFC4X3 file IFC4 cannot decode.
   */
  public async parseDataToModelForHeaderAsync(
      stepHeader: StepHeader,
      input: ParsingBuffer,
      onProgress?: ParseProgressCallback ):
      Promise<[ParseResult, IfcStepModel | undefined]> {

    if ( selectIfcSchemaKindForHeader( stepHeader ) === 'ifc4x3' ) {

      const index = await buildIfc4x3CompatIndexAsync(
          new BufferByteSource( input.buffer ), IFC4X3_COMPAT_POOL_BYTES, onProgress )

      return [index.result, ifc4x3CompatModel( input.buffer, index )]
    }

    return this.parseDataToModelAsync( input, onProgress )
  }

  /**
   * Build a model by streaming the source through a bounded moving window
   * (see buildIndexStreaming / M0) rather than parsing one resident buffer,
   * then backing the model with a windowed provider over `store` — so the
   * source is never held fully resident in the JS heap.
   *
   * `source` serves the parse (synchronous windowed reads — on a worker this
   * is an OPFS sync-access handle; in node/tests a file descriptor or buffer)
   * and `store` serves the model's post-parse property access (asynchronous
   * windowed reads paged in on demand — OPFS `File.slice()` in the browser).
   * Both view the same file bytes, so the file-absolute addresses the index
   * records resolve identically through either.
   *
   * NOTE (M1 scope): this delivers the bounded-memory *parse*. Synchronous
   * geometry extraction still needs its record ranges resident — as after
   * `spillSourceToExternalStore` — so a caller that extracts geometry must
   * `ensureResident` first (demand-driven geometry is M3). Property / index
   * access works directly via the async surfaces.
   *
   * IFC4X3 is gated at `buildColumnarIndexStreaming`'s `onHeaderParsed`
   * hook, the same seam `openStreamedIfcModel` gates through — see that
   * function's doc-comment and `assertNativeSchemaSupported`'s (codex
   * review of #713, P1, round 5: this wrapper and its async twin were the
   * two paths that bypassed the seam by not passing the hook at all). This
   * wrapper has no caller callbacks or sink, so it takes the
   * IFC4-compatible route (ifc4x3_ifc4_compat.ts) when the hook signals a
   * 4X3 header: nothing was indexed yet, so the private build is the only
   * data parse. An ineligible file throws `Ifc4x3IneligibleError`.
   *
   * @param source Synchronous byte source feeding the streaming parse.
   * @param store Async external store backing the windowed model.
   * @param opts Optional window sizing: `pool` (parse window),
   * `chunkBytes` / `maxResidentChunks` (model window).
   * @return {[ParseResult, IfcStepModel | undefined]} The parse result and
   * the windowed model.
   * @throws {Ifc4x3IneligibleError} For an IFC4X3 file IFC4 cannot decode.
   */
  public parseStreamToModel(
      source: ByteSource,
      store: StepExternalByteStore,
      opts?: { pool?: number, chunkBytes?: number, maxResidentChunks?: number } ):
      [ParseResult, IfcStepModel | undefined] {

    if ( store.byteLength !== source.byteLength ) {
      throw new Error(
          `Streaming store byteLength ${store.byteLength} does not match ` +
          `source byteLength ${source.byteLength}` )
    }

    // Columnar build (M7): the index goes straight into SoA columns — the
    // per-record object phase never exists, so peak heap is window + columns.
    const pool = opts?.pool ?? DEFAULT_STREAM_POOL_BYTES
    let built: ReturnType< typeof buildColumnarIndexStreaming< EntityTypesIfc > >

    try {
      built = buildColumnarIndexStreaming(
          source, this, pool, void 0, void 0, assertNativeSchemaSupported )
    } catch ( error ) {

      if ( !( error instanceof Ifc4x3CompatRouteRequired ) ) {
        throw error
      }

      const index = buildIfc4x3CompatIndex( source, pool )

      return [
        index.result,
        ifc4x3CompatModel( void 0, index,
            new WindowedStepBufferProvider(
                store, opts?.chunkBytes, opts?.maxResidentChunks ) ),
      ]
    }

    const provider =
      new WindowedStepBufferProvider( store, opts?.chunkBytes, opts?.maxResidentChunks )

    return [built.result, new IfcStepModel( void 0, built.columns, provider )]
  }

  /**
   * Cooperative twin of {@link parseStreamToModel}: the index build
   * yields to the event loop and can fill windows from an async
   * {@link ReadableByteSource} (an OPFS `File.slice()` store). The
   * model is still windowed — geometry extract must
   * `ensureResident` first.
   *
   * Routes IFC4X3 the same way as {@link parseStreamToModel}; see its
   * doc-comment.
   *
   * @param source Sync or async byte source feeding the parse.
   * @param store Async external store backing the windowed model.
   * @param opts Optional window sizing plus parse progress.
   * @return {Promise<[ParseResult, IfcStepModel | undefined]>} The
   * parse result and the windowed model.
   * @throws {Ifc4x3IneligibleError} For an IFC4X3 file IFC4 cannot decode.
   */
  public async parseStreamToModelAsync(
      source: ReadableByteSource,
      store: StepExternalByteStore,
      opts?: {
        pool?: number
        chunkBytes?: number
        maxResidentChunks?: number
        onProgress?: ( absoluteByteCursor: number ) => void
      } ):
      Promise<[ParseResult, IfcStepModel | undefined]> {

    if ( store.byteLength !== source.byteLength ) {
      throw new Error(
          `Streaming store byteLength ${store.byteLength} does not match ` +
          `source byteLength ${source.byteLength}` )
    }

    const pool = opts?.pool ?? DEFAULT_STREAM_POOL_BYTES
    let built: Awaited< ReturnType< typeof buildColumnarIndexStreamingAsync< EntityTypesIfc > > >

    try {
      built = await buildColumnarIndexStreamingAsync(
          source, this, pool, void 0, opts?.onProgress, void 0, void 0,
          assertNativeSchemaSupported )
    } catch ( error ) {

      if ( !( error instanceof Ifc4x3CompatRouteRequired ) ) {
        throw error
      }

      const index = await buildIfc4x3CompatIndexAsync( source, pool, opts?.onProgress )

      return [
        index.result,
        ifc4x3CompatModel( void 0, index,
            new WindowedStepBufferProvider(
                store, opts?.chunkBytes, opts?.maxResidentChunks ) ),
      ]
    }

    const provider =
      new WindowedStepBufferProvider( store, opts?.chunkBytes, opts?.maxResidentChunks )

    return [built.result, new IfcStepModel( void 0, built.columns, provider )]
  }
}
