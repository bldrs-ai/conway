import ModelFormatDetector, {ModelFormatType } from '../../format_detection/model_format_detector'
import ParsingBuffer from '../../parsing/parsing_buffer'
import { Loadersettings } from './ifc_api'
import { IfcApiModelPassthrough } from './ifc_api_model_passthrough'
import { IfcApiProxyAP214 } from './ifc_api_proxy_ap214'
import { IfcApiProxyIfc } from './ifc_api_proxy_ifc'
import Logger from '../../logging/logger'

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
}
