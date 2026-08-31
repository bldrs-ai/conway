import ModelFormatDetector, {ModelFormatType } from '../../format_detection/model_format_detector'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { Loadersettings } from './ifc_api'
import { IfcApiModelPassthrough } from './ifc_api_model_passthrough'
import { IfcApiProxyAP214 } from './ifc_api_proxy_ap214'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc'
import Logger from '../../logging/logger'
import { StepExternalByteStore } from '../../step/step_buffer_provider'
import { HEADER_PREFIX_RETRY_BYTES } from '../../ifc/ifc_stream_open'

/** Prefix used to sniff FILE_SCHEMA without paging the whole file. */
// eslint-disable-next-line no-magic-numbers
const STORE_DETECT_PREFIX_BYTES = 64 * 1024

/**
 * The factory to construct models.
 */
export class IfcApiModelPassthroughFactory {

  /**
   *
   * @param modelID
   * @param data
   * @param wasmModule
   * @param settings
   * @return {IfcApiModelPassthrough | undefined}
   */
  public static from(
      modelID: number,
      data: Uint8Array,
      wasmModule: any,
      settings?: Loadersettings ): IfcApiModelPassthrough | undefined {

    const modelFormat = ModelFormatDetector.detect( new ParsingBuffer( data ) )

    switch ( modelFormat ) {

      // AP203 reuses the AP214 engine — it succeeds often, and this
      // mirrors conway_model_loader's AP203→AP214 fall-through. The
      // standalone adapter lacked this case, so AP203 errored through the
      // shim while loading fine via the native loader. See
      // design/new/web-ifc-compat-surface.md (decision Q3).
      case ModelFormatType.AP203:

        Logger.warning( 'AP203 Step Detected, using AP214 loader' )

        // falls through
      case ModelFormatType.AP242:

        // Interim: AP242 reuses the AP214 engine for the metadata-1.0
        // product-structure/property subset. See
        // design/new/step-metadata-nist.md §"The AP242 wrinkle".
        if ( modelFormat === ModelFormatType.AP242 ) {

          Logger.warning( 'AP242 Step Detected, using AP214 loader (interim)' )
        }

        // falls through
      case ModelFormatType.AP214:

        try {

          return new IfcApiProxyAP214(modelID, data, wasmModule, settings)

        } catch ( e ) {

          if ( e instanceof Error ) {

            // eslint-disable-next-line max-len
            Logger.error( `Error loading AP214 model in passthrough factory ${modelID}:\n${e.message}\n\n${e.stack}`)
          } else {

            Logger.error( `Unknown error loading AP214 model in passthrough factory ${modelID}` )
          }

        }

        break

      case ModelFormatType.IFC:

        try {

          return new IfcApiProxyIfc(modelID, data, wasmModule, settings)

        } catch ( e ) {

          if ( e instanceof Error ) {

            // eslint-disable-next-line max-len
            Logger.error( `Error loading IFC model in passthrough factory ${modelID}:\n${e.message}\n\n${e.stack}`)
          } else {

            Logger.error( `Unknown error loading IFC model in passthrough factory ${modelID}` )
          }

        }

        break

      default:

        Logger.error( 'No type detected when constructing model')
    }
  }

  /**
   * Streamed-open twin of fromAsync (used by OpenModelStreamed): IFC
   * models parse through the streaming columnar indexer (no per-record
   * object phase — see IfcApiProxyIfc.createStreamed); everything else
   * behaves like fromAsync. Non-IFC formats and any streamed-open
   * failure fall back to the classic cooperative path, so this never
   * does worse than fromAsync — the safety net behind embedder
   * feature flags.
   *
   * @param modelID
   * @param data
   * @param wasmModule
   * @param settings
   * @return {Promise<IfcApiModelPassthrough | undefined>}
   */
  public static async fromStreamed(
      modelID: number,
      data: Uint8Array,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiModelPassthrough | undefined> {

    const modelFormat = ModelFormatDetector.detect( new ParsingBuffer( data ) )

    if ( modelFormat === ModelFormatType.IFC ) {

      try {

        return settings?.DEFER_GEOMETRY === true ?
          await IfcApiProxyIfc.createDeferred(modelID, data, wasmModule, settings) :
          await IfcApiProxyIfc.createStreamed(modelID, data, wasmModule, settings)

      } catch ( e ) {

        const message = e instanceof Error ? e.message : String( e )

        Logger.warning(
            `Streamed open failed for model ${modelID}, ` +
            `falling back to classic open: ${message}`)
      }
    }

    // STEP demand parity: AP214 (and the AP203/AP242 fall-throughs)
    // get the streamed columnar open — index columnar from birth, no
    // per-record object phase — and, with DEFER_GEOMETRY, the deferred
    // assembly-tree unit pump (phase 2), so STEP models stream
    // progressively through ExtractGeometryBatch just like IFC.
    if ( modelFormat === ModelFormatType.AP214 ||
      modelFormat === ModelFormatType.AP203 ||
      modelFormat === ModelFormatType.AP242 ) {

      try {

        return settings?.DEFER_GEOMETRY === true ?
          await IfcApiProxyAP214.createDeferred(modelID, data, wasmModule, settings) :
          await IfcApiProxyAP214.createStreamed(modelID, data, wasmModule, settings)

      } catch ( e ) {

        const message = e instanceof Error ? e.message : String( e )

        Logger.warning(
            `Streamed STEP open failed for model ${modelID}, ` +
            `falling back to classic open: ${message}`)
      }
    }

    return IfcApiModelPassthroughFactory.fromAsync(modelID, data, wasmModule, settings)
  }

  /**
   * Store-backed open (M1b): IFC models parse through a moving window
   * over `store` and stay windowed from birth. Non-IFC formats are not
   * implemented on this path — the caller should fall back to buffering
   * and fromStreamed.
   *
   * @param modelID
   * @param store External store holding the source bytes.
   * @param wasmModule
   * @param settings
   * @return {Promise<IfcApiModelPassthrough | undefined>}
   */
  public static async fromStore(
      modelID: number,
      store: StepExternalByteStore,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiModelPassthrough | undefined> {

    const prefixLen = Math.min( store.byteLength, STORE_DETECT_PREFIX_BYTES )
    const prefix = await store.read( 0, prefixLen )
    const modelFormat = ModelFormatDetector.detect( new ParsingBuffer( prefix ) )

    if ( modelFormat === ModelFormatType.IFC ) {

      try {

        return await IfcApiProxyIfc.createFromStore(
            modelID, store, wasmModule, settings )
      } catch ( e ) {

        const message = e instanceof Error ? e.message : String( e )

        Logger.warning(
            `Store-backed open failed for model ${modelID}: ${message}` )
      }
    } else {

      Logger.warning(
          'Store-backed open is IFC-only; use OpenModelStreamed with a buffer ' +
          `for format ${modelFormat}` )
    }
  }

  /**
   * Sniff a store's format from a bounded prefix, growing the prefix once
   * if the first read was not enough.
   *
   * `ModelFormatDetector` needs `FILE_SCHEMA`, which sits *after*
   * `FILE_DESCRIPTION` — so a long header pushes it past the 64 KiB the
   * detection read covers and the sniff comes back `undefined`. Measured on
   * `data/index.ifc` with an 80 KiB comment injected into its header: the
   * 64 KiB prefix detects `undefined`, a 4 MiB prefix detects IFC. Without
   * the retry `OpenModelFromIndex` returns −1 on a perfectly good model,
   * *before* reaching the header retry inside `openIfcModelFromIndex` —
   * so the engine function would handle the long header and the compat API
   * that advertises it would not (conway#541 review round 2).
   *
   * The second read only happens on the failure path, and is bounded by the
   * same constant the engine open grows to, imported rather than repeated
   * so the two cannot drift.
   *
   * `fromStore` reads its own 64 KiB prefix and has the same limitation —
   * and, separately, makes that read outside its own try, so a rejecting
   * store makes `OpenModelStream` reject rather than return −1. Both are
   * pre-existing on a shipped path rather than introduced here, so neither
   * is changed in this pass; both are tracked in conway#628.
   *
   * @param store The store to sniff.
   * @return {Promise<ModelFormatType | undefined>} The detected format.
   */
  private static async detectFromStore(
      store: StepExternalByteStore ): Promise<ModelFormatType | undefined> {

    const firstLength = Math.min( store.byteLength, STORE_DETECT_PREFIX_BYTES )
    const first = await store.read( 0, firstLength )
    const detected = ModelFormatDetector.detect( new ParsingBuffer( first ) )

    if ( detected !== void 0 || firstLength >= store.byteLength ) {
      return detected
    }

    const retryLength = Math.min( store.byteLength, HEADER_PREFIX_RETRY_BYTES )

    if ( retryLength <= firstLength ) {
      return detected
    }

    return ModelFormatDetector.detect(
        new ParsingBuffer( await store.read( 0, retryLength ) ) )
  }


  /**
   * Index-first open (conway#541): the caller already holds the entity
   * index — a sidecar a coordinator built during its own parse, or one
   * persisted from a previous visit — so there is nothing to parse. IFC
   * only, inheriting the store path's restriction; the format is sniffed
   * from the same bounded prefix `fromStore` reads.
   *
   * **No internal fallback.** Anything wrong with the sidecar (wrong
   * version, wrong source length, a header that will not parse) returns
   * `undefined`, so `OpenModelFromIndex` reports `-1` and the caller
   * chooses `OpenModelStream` explicitly. Falling back here would spend a
   * full parse to hide the mismatch that made it necessary.
   *
   * @param modelID
   * @param store External store holding the source bytes.
   * @param sidecar The serialised index.
   * @param wasmModule
   * @param settings
   * @return {Promise<IfcApiModelPassthrough | undefined>}
   */
  public static async fromIndex(
      modelID: number,
      store: StepExternalByteStore,
      sidecar: Uint8Array,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiModelPassthrough | undefined> {

    // Detection is INSIDE the guard, and that placement is the contract
    // rather than tidiness. `detectFromStore` reads the store — up to twice
    // on the failure path — and a store read can reject: OPFS handle
    // revoked, file truncated under us, network-backed range read failing.
    // Outside the try that rejection escapes and `OpenModelFromIndex`
    // rejects its promise instead of returning −1, breaking the contract
    // stated above at exactly the moment a caller most needs the explicit
    // `OpenModelStream` fallback (conway#541 review round 3).
    try {

      const modelFormat = await IfcApiModelPassthroughFactory.detectFromStore( store )

      if ( modelFormat !== ModelFormatType.IFC ) {

        // Deliberately a different message from the catch below: both end in
        // −1, so the log line is the only thing that separates "this is not
        // an IFC file" from "the store would not answer".
        Logger.warning(
            'Index-first open is IFC-only; use OpenModelStreamed with a buffer ' +
            `for format ${modelFormat}` )
        return
      }

      return await IfcApiProxyIfc.createFromIndex(
          modelID, store, sidecar, wasmModule, settings )
    } catch ( e ) {

      const message = e instanceof Error ? e.message : String( e )

      Logger.warning(
          `Index-first open failed for model ${modelID}: ${message}` )
    }
  }

  /**
   * Cooperative twin of from() (used by OpenModelAsync): the data parse
   * runs with periodic event-loop yields so progress UI can repaint
   * (issue #301 §2) for IFC and AP214/AP203/AP242 alike. IFC geometry
   * extraction is cooperative too; AP214's stays synchronous (thunk-tree
   * extraction has no flat product loop yet) and reports as a heartbeat.
   *
   * @param modelID
   * @param data
   * @param wasmModule
   * @param settings
   * @return {Promise<IfcApiModelPassthrough | undefined>}
   */
  public static async fromAsync(
      modelID: number,
      data: Uint8Array,
      wasmModule: any,
      settings?: Loadersettings ): Promise<IfcApiModelPassthrough | undefined> {

    const modelFormat = ModelFormatDetector.detect( new ParsingBuffer( data ) )

    try {

      switch ( modelFormat ) {

        case ModelFormatType.AP203:

          Logger.warning( 'AP203 Step Detected, using AP214 loader' )

          // falls through
        case ModelFormatType.AP242:

          if ( modelFormat === ModelFormatType.AP242 ) {

            Logger.warning( 'AP242 Step Detected, using AP214 loader (interim)' )
          }

          // falls through
        case ModelFormatType.AP214:

          return await IfcApiProxyAP214.createAsync(modelID, data, wasmModule, settings)

        case ModelFormatType.IFC:

          return await IfcApiProxyIfc.createAsync(modelID, data, wasmModule, settings)

        default:

          Logger.error( 'No type detected when constructing model')
          return void 0
      }
    } catch ( e ) {

      if ( e instanceof Error ) {

        // eslint-disable-next-line max-len
        Logger.error( `Error loading model in passthrough factory ${modelID}:\n${e.message}\n\n${e.stack}`)
      } else {

        Logger.error( `Unknown error loading model in passthrough factory ${modelID}` )
      }

    }
  }
}
