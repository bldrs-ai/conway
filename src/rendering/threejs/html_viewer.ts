import Logger from '../../logging/logger'
import { SimpleViewerScene } from './simple_viewer_scene'


/**
 * Handler for drop events.
 *
 * @param event The event to handle.
 */
export function dropHandler( scene: SimpleViewerScene, event: DragEvent ): void {

  event.preventDefault();

  (async () => {

    try {
      if ( event.dataTransfer === null ) {

        return
      }

      if ( event.dataTransfer.items ) {
        for ( const item of event.dataTransfer.items ) {

          if ( item.kind === 'file' ) {

            const file = item.getAsFile()

            if ( file === null ) {

              continue
            }

            const buffer = await file.arrayBuffer()


            await scene.load( buffer )
          }
        }
      } else if ( event.dataTransfer.files ) {

        for ( const file of event.dataTransfer.files ) {

          const buffer = await file.arrayBuffer()

          await scene.load( buffer )
          break
        }
      }
    } catch ( e ) {

      Logger.error( `Error opening model file: ${e?.toString() ?? '<unknown>'}` )
    }
  })()
}

/**
 * Initialise the viewer.
 */
export function initViewer() {

  const simpleViewerScene = SimpleViewerScene.createSceneAttachedToElement( document.body )

  document.addEventListener( 'dragover', ( e ) => {
    e.preventDefault()

    if ( e.dataTransfer !== null ) {
      e.dataTransfer.dropEffect = 'copy'
    }
  })
  document.addEventListener( 'dragenter', ( e ) => e.preventDefault() )
  document.addEventListener( 'dragleave', ( e ) => e.preventDefault() )
  document.addEventListener( 'drop', ( e ) => dropHandler( simpleViewerScene, e ) )

}
