 
import * as THREE from 'three'
import SceneObject from './scene_object'
import { ConwayModelLoader } from '../../loaders/conway_model_loader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import Logger from '../../logging/logger'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'
import { Model } from '../../core/model'


// This file is obvious numbers heavy composing a scene - CS
/* eslint-disable no-magic-numbers */

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

  /**
   * Are shadows enabled? (defualt true)
   */
  shadows?: boolean

  /**
   * Is the directional light enabled? (default true)
   */
  directionalLight?: boolean

  /**
   * Should we setup an orbit control? (default true)
   */
  orbitControl?: boolean

  /**
   * Should we add an ambient light? (default true)
   *
   * Set to false if you load an environment map and don't want
   * an extra ambient light, as the environment map itself acts as an 
   * ambient light. 
   */
  ambientLight?: boolean

  /**
   * Should we initialise the camera to the model? (default true)
   */
  initialiseCameraToModel?: boolean

  /**
   * The shadow quality to use. (default ShadowQuality.HIGH)
   */
  shadowQuality?: ShadowQuality

  /**
   * Should we use variant shadow mapping? (default false)
   */
  variantShadowMap?: boolean

  /**
   * Should we enable HDR tone mapping? (default true)
   */
  enableHDRToneMap?: boolean

  /**
   * Should we use the filmic tone mapping? (default true)
   *
   * Enables using ACES filmic tone tapping,
   * otherwise neutral tonemapping will be used.
   */
  filmicTonMap?: boolean

  /**
   * The exposure for the tonemapping. (default 0.25)
   */
  toneMapExposure?: number

  /**
   * Is ambient occlusion enabled? (default true)
   */
  ao?: boolean

  /**
   * Should we limit the CSG depth? (default false)
   *
   * This is used to limit the depth of the CSG operations
   * to avoid very deep recursions.
   */
  limitCSGDepth?: boolean

  /**
   * The maximum CSG depth to use. (default 20)
   */
  maxCSGDepth?: number
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

  enableHDRToneMap: true,
  
  filmicTonMap: true,

  ao: true,

  toneMapExposure: 0.5,

  limitCSGDepth: false,

  maxCSGDepth: 20,
}

let modelID = 0

/**
 * A default scene setup for three with a conway model that can be loaded.
 */
export class SimpleViewerScene {

  private currentModelSceneObject_?: SceneObject
  private currentModel_?: Model

  private currentRadius_: number = 1

  public orbitControls: OrbitControls =
    new OrbitControls( this.camera, this.renderer.domElement )

  public readonly light: THREE.DirectionalLight =
    new THREE.DirectionalLight( new THREE.Color( 1, 1, 1 ), 1 * Math.PI )

  // Slightly blue cast ambient sky light
  public readonly ambient: THREE.HemisphereLight =
    new THREE.HemisphereLight( 0xAAAAAD, 0x111111, 0.5 * Math.PI )

  private lightDir_: THREE.Vector3 = new THREE.Vector3( 1, 1, 1 )

  private rgbeLoader_? : RGBELoader
  private premGenerator_?: THREE.PMREMGenerator
  
  private composer_?: EffectComposer

  private ambientOclussion_: boolean

  /**
   * Should we limit the CSG depth? Othwerwise we will only limit the depth
   * of memoization.
   */
  public limitCSGDepth: boolean = false

  /**
   * The limit for CSG recursion depth (or memoization depth).
   */
  public maxCSGDepth: number = 20

  public onload?: ( scene: SimpleViewerScene, object: SceneObject ) => void

  /**
   * Get the current model scene object.
   *
   * @return {SceneObject | undefined} The current model scene object.
   */
  public get currentModelSceneObject(): SceneObject | undefined {

    return this.currentModelSceneObject_
  }

  /** 
   * Get the current model.
   *
   * @return {Model | undefined} The current model.
   */
  public get currentModel(): Model | undefined {

    return this.currentModel_
  }

  /**
   * Is ambient occlusion enabled?
   *
   * @return {boolean} True if ambient occlusion is enabled. 
   */
  public get ambientOcclusion(): boolean {
    
    return this.ambientOclussion_
  }

  /**
   * Set if ambient occlusion is enabled.
   *
   * @param value True if ambient occlusion is enabled. 
   */
  public set ambientOcclusion( value: boolean ) { 
  
    this.ambientOclussion_ = value
  }

  /**
   * Does this scene have an ambient light in it?
   *
   * @return {boolean} True if the scene has an ambient light. 
   */
  public get hasAmbientLight(): boolean {

    return this.scene.children.includes( this.ambient )
  }
  
  /**
   * Set if this scene has an ambient light.
   *
   * @param value True if the scene has an ambient light.
   */
  public set hasAmbientLight( value: boolean ) {
  
    if ( value !== this.hasAmbientLight ) {

      if ( value ) {
      
        this.scene.add( this.ambient )
        
      } else {
        
        this.scene.remove( this.ambient )
      }
    }
  }

  /**
   * Load an equirectangular environment map in HDR format.
   * 
   * @param url The URL to the HDR file.
   * @return {Promise< void >} A promise to await on for loading.
   */
  public async loadEquirectangularEnvironmentMapHDR( url: string ): Promise< void > {
  
    if ( this.rgbeLoader_ === void 0 ) {

      this.rgbeLoader_ = new RGBELoader()
    }

    const rgbeLoader = this.rgbeLoader_!

    const texture = await rgbeLoader.loadAsync( url )
    
    if ( this.premGenerator_ === void 0 ) {
      
      this.premGenerator_ = new THREE.PMREMGenerator( this.renderer )
    }

    texture.mapping = THREE.EquirectangularReflectionMapping

    this.scene.background = texture

    const premGenerator = this.premGenerator_!

    const premTexture = premGenerator.fromEquirectangular( texture)

    this.scene.environment = premTexture.texture
  } 

  /**
   * Set the current light direction.
   *
   * @param value The light direction (THREE.Vector3)
   */
  public set lightDirection( value: THREE.Vector3 ) {

    this.lightDir_.copy( value )

    this.light.position.copy( this.lightDir_ ).normalize().multiplyScalar( this.currentRadius_ )
  }

  /**
   * Get the current light direction.
   *
   * @return {THREE.Vector3} The current light direction.
   */
  public get lightDirection(): THREE.Vector3 {

    return this.lightDir_
  }

  /**
   * Update the shadow quality for this
   *
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

  public render(): void {
        
    const [width, height] = this.dimensionsFunction()

    const camera = this.camera

    if ( camera instanceof THREE.PerspectiveCamera ) {
      camera.aspect = width / height
    }

    camera.updateProjectionMatrix()

    const renderer = this.renderer
    const scene = this.scene

    renderer.setSize( width, height )

    if ( this.ambientOclussion_ ) {

      if ( !this.composer_ ) {

        this.setupAO( width, height, renderer.getPixelRatio())
      }

      const composer = this.composer_!

      composer.setSize( width, height )

      composer.passes.forEach( ( pass ) => { 
        pass.setSize( width, height )

        if ( pass instanceof ShaderPass ) {
    
          const pixelRatio = renderer.getPixelRatio()

          const resolution = pass.material.uniforms[ 'resolution' ].value

          resolution.x = 1 / ( width * pixelRatio )
          resolution.y = 1 / ( height * pixelRatio )      
        }        

      } )

      composer.render()
    
    } else {

      renderer.render( scene, camera )
    }
  }

  /**
   * Are shadows enabled?
   *
   * @return {boolean} True if shadows are enabled.
   */
  public get shadowsEnabled(): boolean {

    return this.light.castShadow && this.renderer.shadowMap.enabled
  }

  /**
   * Are shadows enabled?
   *
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
   *
   * @return {ShadowQuality} The current shadow quality.
   */
  public get shadowQuality(): ShadowQuality {

    return this.options.shadowQuality ?? defaultOptions.shadowQuality!
  }

  /**
   * Get the shadow quality for this.
   *
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
   *
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

    this.limitCSGDepth = options.limitCSGDepth ?? !!defaultOptions.limitCSGDepth
    this.maxCSGDepth = options.maxCSGDepth ?? defaultOptions.maxCSGDepth ?? this.maxCSGDepth

    this.ambientOclussion_ = options.ao ?? !!defaultOptions.ao

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

    if ( options.enableHDRToneMap ?? !!defaultOptions.enableHDRToneMap ) {
        
      renderer.toneMapping         = 
        options.filmicTonMap ?? !!defaultOptions.filmicTonMap ?
          THREE.ACESFilmicToneMapping :
          THREE.NeutralToneMapping

      renderer.toneMappingExposure =
        options.toneMapExposure ?? defaultOptions.toneMapExposure!
    }
  }

  /**
   * Sets up ambient occlusion for the scene.
   *
   * @param width The width of the scene.
   * @param height The height of the scene.
   * @param pixelRatio The pixel ratio of the scene.
   */
  private setupAO( width: number, height: number, pixelRatio: number ): void {

    const renderer = this.renderer

    const composer = new EffectComposer( renderer )

    composer.setSize( width, height )
    composer.setPixelRatio( pixelRatio )

    this.composer_ = composer

    const renderPass = new RenderPass( this.scene, this.camera )
    
    renderPass.setSize( width, height )

    composer.addPass( renderPass )
  
    const gtaoPass = new GTAOPass( this.scene, this.camera )

    gtaoPass.setSize( width, height )

    gtaoPass.blendIntensity = 0.5

    composer.addPass( gtaoPass )    

    const outputPass = new OutputPass()
    
    outputPass.setSize( width, height )

    composer.addPass( outputPass )

    const fxaaPass = new ShaderPass( FXAAShader )

    fxaaPass.setSize( width, height )

    composer.addPass( fxaaPass )
  }

  /**
   * Load a new model, replacing any current model in the scene,
   * uses promises/exceptions for error handling
   *
   * @param buffer The buffer to load the model from
   * @return {Promise< void >} A promise to await on for loading.
   */
  public async load( buffer: ArrayBuffer ): Promise< void > {

    try {

      const loadResult =
        await ConwayModelLoader.loadModelWithScene(
          new Uint8Array( buffer ),
          this.limitCSGDepth,
          this.maxCSGDepth,
          modelID++ )

      const model = loadResult[ 0 ]
      const modelScene = loadResult[ 1 ]

      const scene = this.scene

      const currentModelSceneObject = this.currentModelSceneObject_

      if ( currentModelSceneObject !== void 0 ) {

        scene.remove( currentModelSceneObject )
        this.currentModelSceneObject_ = void 0
        this.currentModel_ = void 0
      }

      const conwaySceneObject = new SceneObject( modelScene )

      conwaySceneObject.uncork()

      conwaySceneObject.castShadow = true
      conwaySceneObject.receiveShadow = true

      this.currentModelSceneObject_ = conwaySceneObject
      this.currentModel_ = model

      const currentBoundingBox = new THREE.Box3().setFromObject( conwaySceneObject )

      const currentBoundingSphere =
        currentBoundingBox
            .getBoundingSphere( new THREE.Sphere() )

      const sphereRadius = currentBoundingSphere.radius

      conwaySceneObject.position.copy( currentBoundingSphere.center.clone().negate() )
      
      scene.add( conwaySceneObject )

      // Add this to the scene to see the bounding box.
      // const conwaySceneObjectHelper = new THREE.BoxHelper( conwaySceneObject )

      // scene.add( conwaySceneObjectHelper )

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

      if ( this.onload !== void 0 ) {

        this.onload( this, conwaySceneObject )
      }

    } catch ( e ) {

      Logger.error(
        `Error thrown loading dropped file: ${(e as Error | undefined)?.message ?? '<unknown>'} `)

      throw e
    }
  }

  /**
   * Create a simple viewer scene, including the required
   * threejs artefacts and attach it to a DOM element.
   *
   * @param element The element to attach to.
   * @param useElementDimensions If true use the width and height of the element,
   * if false use the window dimensions.
   * @param options The scene viewer options for attaching this element.
   * @return {SimpleViewerScene} The created scene.
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

    const renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } )
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
        CAMERA_FOV,
        startingWidth / startingHeight,
        DEFAULT_NEAR,
        DEFAULT_FAR )

    renderer.sortObjects = true

    let pixelRatio = window.devicePixelRatio

    let worstCaseTextureSize = Math.max( window.innerWidth, window.innerHeight ) * pixelRatio

    while ( worstCaseTextureSize > renderer.capabilities.maxTextureSize && pixelRatio > 1) {

      pixelRatio /= 2
      pixelRatio  = Math.min( pixelRatio, 1 )

      worstCaseTextureSize = Math.max( window.innerWidth, window.innerHeight ) * pixelRatio
    }

    renderer.setPixelRatio( pixelRatio )
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

    const result = new SimpleViewerScene( renderer, scene, camera, dimensionsFunction, options )

    renderer.setAnimationLoop( () => {

      result.render()
    })

    return result
  }
}
