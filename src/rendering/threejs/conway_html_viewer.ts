import * as THREE from 'three'
import { ConwayModelLoader } from '../../loaders/conway_model_loader'
import Logger from '../../logging/logger'
import ConwaySceneObject from './conway_scene_object'


const CAMERA_FOV = 75
const NEAR_RATIO = 0.05
const DEFAULT_NEAR = 0.1
const DEFAULT_FAR = 1000


let modelID = 0

let currentModel: ConwaySceneObject | undefined

let currentBoundingSphere: THREE.Sphere | undefined


const scene = new THREE.Scene()

// eslint-disable-next-line no-magic-numbers
scene.add( new THREE.HemisphereLight( 0xFFFFFF, 0x111111, 3 ) )

const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    DEFAULT_NEAR,
    DEFAULT_FAR )

const renderer = new THREE.WebGLRenderer( { antialias: true } )

/**
 * Load from a file.
 *
 * @param file
 */
async function loadFromFile( file: File ): Promise< void > {

  try {
    const buffer = await file.arrayBuffer()

    const loadResult =
      await ConwayModelLoader.loadModelWithScene( new Uint8Array( buffer ), modelID++ )

    const modelScene = loadResult[ 1 ]

    if ( currentModel !== void 0 ) {

      scene.remove( currentModel )
      currentModel = void 0
    }

    const conwaySceneObject = new ConwaySceneObject( modelScene )

    conwaySceneObject.uncork()

    scene.add( conwaySceneObject )

    currentModel = conwaySceneObject

    currentBoundingSphere =
      new THREE.Box3()
          .setFromObject( conwaySceneObject )
          .getBoundingSphere( new THREE.Sphere() )

  } catch ( e: any ) {

    Logger.error( `Error thrown loading dropped file: ${e?.message ?? '<unknown>'} `)
  }
}

/**
 * Handler for drop events.
 *
 * @param event The event to handle.
 */
export function dropHandler( event: DragEvent ): void {

  event.preventDefault();

  (async () => {

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

          await loadFromFile( file )
        }
      }
    } else if ( event.dataTransfer.files ) {

      for ( const file of event.dataTransfer.files ) {

        await loadFromFile( file )
      }
    }
  })()
}

/**
 * Initialise the viewer.
 */
export function initViewer() {

  renderer.setSize( window.innerWidth, window.innerHeight )
  document.body.appendChild( renderer.domElement )

  document.addEventListener( 'dragover', ( e ) => {
    e.preventDefault()

    if ( e.dataTransfer !== null ) {
      e.dataTransfer.dropEffect = 'copy'
    }
  })
  document.addEventListener( 'dragenter', ( e ) => e.preventDefault() )
  document.addEventListener( 'dragleave', ( e ) => e.preventDefault() )
  document.addEventListener( 'drop', ( e ) => dropHandler( e ) )

  renderer.setClearColor( THREE.Color.NAMES.aliceblue )

  renderer.setAnimationLoop( () => {

    if ( currentModel !== void 0 ) {

      currentModel.rotation.y += 0.01
    }

    camera.aspect = window.innerWidth / window.innerHeight

    if ( currentBoundingSphere !== void 0 ) {

      const sphereOffset = currentBoundingSphere.center.length()
      const offsetRadius = sphereOffset + currentBoundingSphere.radius

      const near = offsetRadius * NEAR_RATIO
      const cameraZ = offsetRadius + near

      camera.near       = near
      // eslint-disable-next-line no-magic-numbers
      camera.far        = cameraZ * 2

      camera.position.z = cameraZ
    }

    camera.updateProjectionMatrix()

    renderer.setSize( window.innerWidth, window.innerHeight )

    renderer.render( scene, camera )
  })
}
