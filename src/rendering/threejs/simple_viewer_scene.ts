 
import * as THREE from 'three'
import SceneObject from './scene_object'
import { ConwayModelLoader } from '../../loaders/conway_model_loader'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Logger from '../../logging/logger'


const CAMERA_FOV = 75
const NEAR_RATIO = 0.05
const DEFAULT_NEAR = 0.1
const DEFAULT_FAR = 1000

/**
 * Shadow quality, lower values use lower resolution/faster settings,
 * higher values use high resolution/slower but more aesthetic settings.
 */
 
export const enum ShadowQuality {

    // Please learn enums exist eslist
  LOW,
  MEDIUM,
  HIGH
   
}

/**
 * The options for the simple viewer scene.
 */
export interface SimpleViewerSceneOptions {

  shadows?: boolean

  directionalLight?: boolean

  orbitControl?: boolean

  ambientLight?: boolean

  initialiseCameraToModel?: boolean

  shadowQuality?: ShadowQuality

  variantShadowMap?: boolean
}

/**
 * Default options
 */
const defaultOptions: SimpleViewerSceneOptions = {

  shadows: true,

  directionalLight: true,

  orbitControl: true,

  ambientLight: true,

  initialiseCameraToModel: true,

  shadowQuality: ShadowQuality.HIGH,

  variantShadowMap: false,
}

let modelID = 0

/**
 * A default scene setup for three with a conway model that can be loaded.
 */
export class SimpleViewerScene {

  private currentModel_?: SceneObject

  private currentRadius_: number = 1

  public orbitControls: OrbitControls =
    new OrbitControls( this.camera, this.renderer.domElement )

  public readonly light: THREE.DirectionalLight =
    new THREE.DirectionalLight( new THREE.Color( 1, 1, 1 ), 1 * Math.PI )

  // Slightly blue cast ambient sky light
  public readonly ambient: THREE.HemisphereLight =
    new THREE.HemisphereLight( 0xAAAAAD, 0x111111, 0.5 * Math.PI )

  private lightDir_: THREE.Vector3 = new THREE.Vector3( 1, 1, 1 )

  /**
   * Set the current light direction.
   */
  public set lightDirection( value: THREE.Vector3 ) {

    this.lightDir_.copy( value )

    this.light.position.copy( this.lightDir_ ).normalize().multiplyScalar( this.currentRadius_ )
  }

  /**
   * Get the current light direction.
   * @returns The current light direction.
   */
  public get lightDirection(): THREE.Vector3 {

    return this.lightDir_
  }

  /**
   * Update the shadow quality for this
   * @param light
   * @param quality
   * @param vsm
   */
  private updateShadowQuality(
      light: THREE.DirectionalLight,
      quality: ShadowQuality,
      vsm: boolean ) {

    const renderer = this.renderer

    switch ( quality ) {

      case ShadowQuality.LOW:

        renderer.shadowMap.type = THREE.BasicShadowMap

        light.shadow.mapSize.set( 1024, 1024 )
        light.shadow.map?.setSize( 1024, 1024 )
        light.shadow.bias = -0.005
        break

      case ShadowQuality.MEDIUM:

        renderer.shadowMap.type = THREE.PCFShadowMap

        light.shadow.mapSize.set( 2048, 2048 )
        light.shadow.map?.setSize( 2048, 2048 )
        light.shadow.bias = -0.0025
        break

      case ShadowQuality.HIGH:
      default:

        renderer.shadowMap.type = THREE.PCFSoftShadowMap

        light.shadow.mapSize.set( 4096, 4096 )
        light.shadow.map?.setSize( 4096, 4096 )
        light.shadow.bias = -0.002
        break
    }

    if ( vsm ) {

      renderer.shadowMap.type = THREE.VSMShadowMap
    }

    renderer.shadowMap.needsUpdate = true

    light.shadow.camera.updateProjectionMatrix()
    light.shadow.updateMatrices(light)

    light.shadow.needsUpdate = true

  }

  /**
   * Are shadows enabled?
   * @returns True if shadows are enabled.
   */
  public get shadowsEnabled(): boolean {

    return this.light.castShadow && this.renderer.shadowMap.enabled
  }

  /**
   * Are shadows enabled?
   * @param value True if shadows are enabled.
   */
  public set shadowsEnabled( value: boolean ) {

    const options  = this.options
    const renderer = this.renderer
    const light    = this.light

    options.shadows = value

    if ( options.shadows ?? defaultOptions.shadows ) {

      const shadowQuality = options.shadowQuality ?? defaultOptions.shadowQuality!

      renderer.shadowMap.enabled = true
      renderer.shadowMap.autoUpdate = true

      light.castShadow = true

      light.shadow.intensity = 1
      light.shadow.autoUpdate = true

      this.updateShadowQuality(
          light,
          shadowQuality,
          options.variantShadowMap ?? defaultOptions.variantShadowMap! )

    } else {

      this.renderer.shadowMap.enabled = false
      this.light.castShadow = false
    }
  }

  /**
   * Get the shadow quality for this.
   * @returns The current shadow quality.
   */
  public get shadowQuality(): ShadowQuality {

    return this.options.shadowQuality ?? defaultOptions.shadowQuality!
  }

  /**
   * Get the shadow quality for this.
   * @param value The new shadow value.
   */
  public set shadowQuality( value: ShadowQuality ) {

    this.options.shadowQuality = value

    this.updateShadowQuality(
        this.light,
        value,
        this.options.variantShadowMap ?? defaultOptions.variantShadowMap! )
  }

  /**
   * Construct the simple viewer scene
   * @param renderer
   * @param scene
   * @param camera
   * @param dimensionsFunction
   * @param options
   */
  constructor(
    public readonly renderer: THREE.WebGLRenderer,
    public readonly scene: THREE.Scene,
    public readonly camera: THREE.PerspectiveCamera | THREE.OrthographicCamera,
    public readonly dimensionsFunction: () => [number, number],
    private readonly options: SimpleViewerSceneOptions = defaultOptions ) {

    if ( options.ambientLight ?? defaultOptions.ambientLight ) {

      scene.add( this.ambient )
    }

    if ( options.directionalLight ?? defaultOptions.directionalLight ) {

      const light = this.light

      scene.add( light )

      if ( options.shadows ?? defaultOptions.shadows ) {

        const shadowQuality = options.shadowQuality ?? defaultOptions.shadowQuality!

        renderer.shadowMap.enabled = true
        renderer.shadowMap.autoUpdate = true

        light.castShadow = true

        light.shadow.intensity = 1
        light.shadow.autoUpdate = true

        this.updateShadowQuality(
            light,
            shadowQuality,
            options.variantShadowMap ?? defaultOptions.variantShadowMap! )
      }
    }
  }

  /**
   * Load a new model, replacing any current model in the scene,
   * uses promises/exceptions for error handling
   * @param buffer The buffer to load the model from
   * @returns A promise to await on for loading.
   */
  public async load( buffer: ArrayBuffer ): Promise< void > {

    try {

      const loadResult =
        await ConwayModelLoader.loadModelWithScene( new Uint8Array( buffer ), modelID++ )

      const modelScene = loadResult[ 1 ]

      const scene = this.scene

      const currentModel = this.currentModel_

      if ( currentModel !== void 0 ) {

        scene.remove( currentModel )
        this.currentModel_ = void 0
      }

      const conwaySceneObject = new SceneObject( modelScene )

      conwaySceneObject.uncork()

      scene.add( conwaySceneObject )

      conwaySceneObject.castShadow = true
      conwaySceneObject.receiveShadow = true

      this.currentModel_ = conwaySceneObject

      const currentBoundingBox = new THREE.Box3().setFromObject( conwaySceneObject )

      const currentBoundingSphere =
        currentBoundingBox
            .getBoundingSphere( new THREE.Sphere() )

      const sphereRadius = currentBoundingSphere.radius

      conwaySceneObject.position.copy( currentBoundingSphere.center.clone().negate() )

      const light = this.light

      this.currentRadius_ = sphereRadius

      light.position.copy( this.lightDir_ ).normalize().multiplyScalar( sphereRadius )

      light.shadow.camera.near = 0.1 * sphereRadius
      light.shadow.camera.far = ( 2.1 * sphereRadius )
      light.shadow.camera.top = sphereRadius
      light.shadow.camera.bottom = -sphereRadius
      light.shadow.camera.left = -sphereRadius
      light.shadow.camera.right = sphereRadius

      light.shadow.camera.updateProjectionMatrix()
      light.updateMatrix()

      light.shadow.autoUpdate = false
      light.shadow.needsUpdate = true

      this.renderer.shadowMap.needsUpdate = true

      // Enable this to see the shadow frustum
      // const shadowHelper = new THREE.CameraHelper( light.shadow.camera )

      // scene.add( shadowHelper )

      if ( this.options.initialiseCameraToModel ?? defaultOptions.initialiseCameraToModel ) {

        const camera = this.camera

        camera.position.set( 0, sphereRadius * 0.25, sphereRadius )

        const near = sphereRadius * NEAR_RATIO
        const cameraZ = sphereRadius + near

        camera.near       = near
        camera.far        = cameraZ * 4

        const [width, height] = this.dimensionsFunction()

        if ( camera instanceof THREE.PerspectiveCamera ) {
          camera.aspect = width / height
        }

        camera.lookAt( new THREE.Vector3( 0, 0, -sphereRadius * 0.25 ) )

      }

      if ( this.options.orbitControl ?? defaultOptions.orbitControl ) {

        this.orbitControls.update()
      }

    } catch ( e: any ) {

      Logger.error( `Error thrown loading dropped file: ${e?.message ?? '<unknown>'} `)

      throw e
    }
  }

  /**
   * Create a simple viewer scene, including the required
   * threejs artefacts and attach it to a DOM element.
   * @param element The element to attach to.
   * @param useElementDimensions If true use the width and height of the element,
   * if false use the window dimensions.
   * @param options The scene viewer options for attaching this element.
   * @returns The created scene.
   */
  public static createSceneAttachedToElement(
      element: HTMLElement,
      useElementDimensions: boolean = false,
      options: SimpleViewerSceneOptions = defaultOptions ): SimpleViewerScene {

    const dimensionsFunction: () => [number, number] =
        useElementDimensions ?
        () => {

          return [element.clientWidth, element.clientHeight]
        } :
        () => {

          return [window.innerWidth, window.innerHeight]
        }

    const [startingWidth, startingHeight] = dimensionsFunction()

    const renderer = new THREE.WebGLRenderer( { antialias: true } )
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        startingWidth / startingHeight,
        DEFAULT_NEAR,
        DEFAULT_FAR )

    renderer.sortObjects = true
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize( startingWidth, startingHeight )

    element.appendChild( renderer.domElement )

    renderer.setClearColor( THREE.Color.NAMES.cornflowerblue )

    if ( useElementDimensions ) {

      element.addEventListener( 'resize', ( e ) => {

        renderer.setPixelRatio( window.devicePixelRatio )
        renderer.setSize( element.clientWidth, element.clientHeight )
      } )
    } else {

      element.addEventListener( 'resize', ( e ) => {

        renderer.setPixelRatio( window.devicePixelRatio )
        renderer.setSize( window.innerWidth, window.innerHeight )
      } )
    }

    renderer.setAnimationLoop( () => {

      const [width, height] = dimensionsFunction()

      camera.aspect = width / height

      camera.updateProjectionMatrix()

      renderer.setSize( width, height )
      renderer.render( scene, camera )
    })

    return new SimpleViewerScene( renderer, scene, camera, dimensionsFunction, options )
  }
}
