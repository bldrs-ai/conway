import ParsingBuffer from '../parsing/parsing_buffer'
import StepParser, {ParseProgressCallback, ParseResult} from '../step/parsing/step_parser'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import EntitTypesIfcSearch from './ifc4_gen/entity_types_search.gen'
import IfcStepModel from './ifc_step_model'
import { ByteSource } from '../step/parsing/byte_source'
import { buildIndexStreaming } from '../step/parsing/streaming_index_builder'
import {
  StepExternalByteStore,
  WindowedStepBufferProvider,
} from '../step/step_buffer_provider'


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
   * @param source Synchronous byte source feeding the streaming parse.
   * @param store Async external store backing the windowed model.
   * @param opts Optional window sizing: `pool` (parse window),
   * `chunkBytes` / `maxResidentChunks` (model window).
   * @return {[ParseResult, IfcStepModel | undefined]} The parse result and
   * the windowed model.
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

    const { elements, result } =
      buildIndexStreaming( source, this, opts?.pool ?? DEFAULT_STREAM_POOL_BYTES )

    const provider =
      new WindowedStepBufferProvider( store, opts?.chunkBytes, opts?.maxResidentChunks )

    return [result, new IfcStepModel( void 0, elements, provider )]
  }
}
