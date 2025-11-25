import { ConwayGeometry, GeometryObject, NativeTransform4x4, ParamsLocalPlacement } from
  '../../dependencies/conway-geom'
import { CanonicalMaterial } from '../core/canonical_material'
import { CanonicalMesh, CanonicalMeshType } from '../core/canonical_mesh'
import { Model } from '../core/model'
import { PackedMesh } from '../core/packed_mesh'
import { WalkableScene, SceneListener, SceneListenerOptions } from '../core/scene'
import {
  SceneNodeModelType,
  SceneNodeGeometry,
  SceneNodeTransform,
}
  from '../core/scene_node'
import { TriangleElementMap } from '../core/triangle_element_map'
import StepEntityBase from '../step/step_entity_base'
import EntityTypesAP214 from './AP214E3_2010_gen/entity_types_ap214.gen'
import { AP214MaterialCache } from './ap214_material_cache'
import AP214StepModel from './ap214_step_model'


/**
 *
 */
export class AP214SceneTransform implements SceneNodeTransform {

  readonly type = SceneNodeModelType.TRANSFORM


   
  /**
   *
   * @param model
   * @param transform
   * @param absoluteTransform
   * @param localID
   * @param index
   * @param nativeTransform
   * @param absoluteNativeTransform
   * @param parentIndex
   */
  constructor(
    public readonly model: Model,
    public readonly transform: ReadonlyArray<number>,
    public readonly absoluteTransform: ReadonlyArray<number>,
    public readonly localID: number,
    public readonly index: number,
    public readonly nativeTransform: NativeTransform4x4,
    public readonly absoluteNativeTransform: NativeTransform4x4,
    public readonly parentIndex?: number) { }
   
  public children: number[] = []
}

/**
 *
 */
export class AP214SceneGeometry implements SceneNodeGeometry {

  readonly type = SceneNodeModelType.GEOMETRY

  /**
   * No Spaces for AP214
   *
   * @return {boolean} Always false, no spaces.
   */
  public get isSpace(): boolean {

    return false
  }

   
  /**
   * Construct a scene geometry node
   *
   * @param model
   * @param localID
   * @param index
   * @param relatedElementLocalId
   * @param parentIndex
   * @param materialOverideLocalID
   */
  constructor(
    public readonly model: Model,
    public readonly localID: number,
    public readonly index: number,
    public readonly relatedElementLocalId?: number,
    public readonly parentIndex?: number,
    public readonly materialOverideLocalID?: number ) { }
   
}

export type AP214SceneNode = AP214SceneTransform | AP214SceneGeometry

/**
 *
 */
export class AP214SceneBuilder implements WalkableScene< StepEntityBase< EntityTypesAP214 > > {

  public roots: number[] = []

  private scene_: AP214SceneNode[] = []
  private sceneLocalIdMap_ = new Map<number, number>()
  private geometrySet_ = new Set< number >()

  private sceneStack_: AP214SceneTransform[] = []
  private currentParent_?: AP214SceneTransform

  private transformListeners_?: SceneListener[]
  private geometryListeners_?: SceneListener[]

   
  /**
   *
   * @param model
   * @param conwayGeometry
   * @param materials
   */
  public constructor(
    public readonly model: AP214StepModel,
    public readonly conwayGeometry: ConwayGeometry,
    public readonly materials: AP214MaterialCache) {

  }
   
  public get currentParent(): AP214SceneTransform | undefined {
    return this.currentParent_
  }

  /**
   *
   * @param listener
   * @param options
   */
  addSceneListener(
      listener: SceneListener,
      options?: SceneListenerOptions ): void {

    options ??= SceneListenerOptions.defaults

    if ( !options.disableTransformEvents ) {

      this.transformListeners_ ??= []
      this.transformListeners_.push( listener )
    }

    if ( !options.disableGeometryEvents ) {

      this.geometryListeners_ ??= []
      this.geometryListeners_.push( listener )
    }

    if ( options.replayCurrentScene ) {

      const sceneStack = [...this.roots]

      const nodes = this.scene_
      const model = this.model

      while ( sceneStack.length > 0 ) {

        const nodeIndex = sceneStack.pop()!

        const node = nodes[ nodeIndex ]

        if ( node instanceof AP214SceneTransform ) {

          if ( !options.disableTransformEvents ) {

            listener.onTransformAdded( node )
          }

          sceneStack.push(...node.children)

        } else if ( node instanceof AP214SceneGeometry ) {

          const transform =
            ( node.parentIndex !== void 0 ?
              nodes[ node.parentIndex ] : void 0 ) as ( AP214SceneTransform | undefined )

          const geometry = model.geometry?.getByLocalID( node.localID )

          if ( geometry === void 0 ) {
            continue
          }

          listener.onGeometryAdded(
              node,
              transform )
        }
      }
    }
  }

  /**
   *
   * @param listener
   */
  removeSceneListener( listener: SceneListener ): void {

    const geoemtryListeners = this.geometryListeners_
    const transformListeners = this.transformListeners_

    if ( geoemtryListeners !== void 0 ) {

      const indexOfListener =  geoemtryListeners.indexOf( listener )

      if ( indexOfListener >= 0 ) {

        geoemtryListeners[ indexOfListener ] = geoemtryListeners[ geoemtryListeners.length - 1 ]
        geoemtryListeners.pop()

        if ( geoemtryListeners.length === 0 ) {

          this.geometryListeners_ = void 0
        }
      }
    }

    if ( transformListeners !== void 0 ) {

      const indexOfListener =  transformListeners.indexOf( listener )

      if ( indexOfListener >= 0 ) {

        transformListeners[ indexOfListener ] = transformListeners[ transformListeners.length - 1 ]
        transformListeners.pop()

        if ( transformListeners.length === 0 ) {

          this.transformListeners_ = void 0
        }
      }
    }
  }

  /**
   *
   * @param nodeIndex
   * @return {AP214SceneNode | undefined}
   */
  public getByNodeIndex(nodeIndex: number): AP214SceneNode | undefined {
    return this.scene_[nodeIndex]
  }

  /**
   *
   * @param localID
   * @return {AP214SceneNode | undefined}
   */
  private get(localID: number): AP214SceneNode | undefined {

    const sceneID = this.sceneLocalIdMap_.get(localID)

    return sceneID !== void 0 ? this.scene_[sceneID] : void 0
  }

  /**
   * Get the current stack deoth.
   * 
   * @return {number} The current stack depth.
   */
  public get stackLength(): number {

    return this.sceneStack_.length + ( this.currentParent_ !== void 0 ? 1 : 0 )
  }

  /**
   *
   */
  public clearParentStack(): void {

    this.sceneStack_.length = 0

    delete this.currentParent_
  }

  /**
   *
   * @param localID
   * @return {AP214SceneTransform | undefined}
   */
  public getTransform(localID: number): AP214SceneTransform | undefined {

    const result = this.get(localID)

    if (result instanceof AP214SceneTransform) {

      return result
    }

    return void 0
  }

  /**
   * Build a packed/optimised mesh model with triangle element maps.
   *
   * @return {PackedMesh< AP214StepModel >} Maps materials to a geometry object
   * and triangle element map.
   */
  public buildPackedMeshModel(): PackedMesh<AP214StepModel> {

    const materialMap = new Map<CanonicalMaterial | undefined, number>()
    const materials: CanonicalMaterial[] = []
    const primitives: [GeometryObject, number | undefined][] = []
    const triangleMaps: TriangleElementMap[] = []
    const elementMap = new Map<number, number[]>()
     
    for (const [_, nativeTransform, geometry, material, entity] of this.walk()) {
      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY) {

        const clonedGeometry = geometry.geometry.clone()

        if ( nativeTransform !== void 0 ) {
          clonedGeometry.applyTransform(nativeTransform)
        }

        const primitiveIndex = materialMap.get(material)

        if (primitiveIndex === void 0) {

          const triangleMap = new TriangleElementMap()

          let materialIndex: number | undefined

          if (material !== void 0) {
            materialIndex = materials.length
            materials.push(material)
          } else {
            materialIndex = void 0
          }

          const entityLocalId = entity?.localID

          triangleMap.addMappingRange(
              0,
               
              Math.trunc(clonedGeometry.GetIndexDataSize() / 3),
              entityLocalId ?? TriangleElementMap.NO_ELEMENT)

          const newPrimitiveIndex = primitives.length

          if (entityLocalId !== void 0) {

            let currentPrimitives = elementMap.get(entityLocalId)

            if (currentPrimitives === void 0) {

              currentPrimitives = []
              elementMap.set(entityLocalId, currentPrimitives)
            }

            if (!currentPrimitives.includes(newPrimitiveIndex)) {
              currentPrimitives.push(newPrimitiveIndex)
            }
          }

          materialMap.set(material, newPrimitiveIndex)

          primitives.push([clonedGeometry, materialIndex])
          triangleMaps.push(triangleMap)

        } else {

          const fullGeometry = primitives[primitiveIndex][0]
          const triangleMap = triangleMaps[primitiveIndex]

          const entityLocalId = entity?.localID

          triangleMap.addMappingRange(
              triangleMap.size,
               
              triangleMap.size + Math.trunc(clonedGeometry.GetIndexDataSize() / 3),
              entityLocalId ?? TriangleElementMap.NO_ELEMENT)

          if (entityLocalId !== void 0) {

            let currentPrimitives = elementMap.get(entityLocalId)

            if (currentPrimitives === void 0) {

              currentPrimitives = []
              elementMap.set(entityLocalId, currentPrimitives)
            }

            if (!currentPrimitives.includes(primitiveIndex)) {
              currentPrimitives.push(primitiveIndex)
            }
          }

          fullGeometry.appendGeometry(clonedGeometry)
        }
      }
    }

    return new PackedMesh<AP214StepModel>(
        this.model,
        materials,
        primitives,
        triangleMaps,
        elementMap)
  }

  /**
   * Are all the geometry nodes in the scene spaces
   *
   * @return {boolean} Are all the geometry nodes in the scene spaces
   */
  public isAllSpaces(): boolean {

    return false
  }

  /**
   * Walk the current scene.
   *
   * @yields Raw absolute matrix transform, the native absolute transform, the canonical mesh,
   * @param includeSpaces
   * the canonical material and the associated step element as it walks the hierarchy.
   */
  public* walk(includeSpaces: boolean = false):
    IterableIterator<[readonly number[] | undefined,
      NativeTransform4x4 | undefined,
      CanonicalMesh,
      CanonicalMaterial | undefined,
      StepEntityBase<EntityTypesAP214> | undefined]> {

    for (const node of this.scene_) {

      if ( node instanceof AP214SceneGeometry ) {

        const parentIndex = node.parentIndex
        const geometry = node.model.geometry?.getByLocalID(node.localID)

        if (geometry === void 0) {
          // console.log(`skipping due to null geometry, express ID:
        //  ${  this.model.getElementByLocalID(node.localID)?.expressID}`)
          continue
        }

        let parentNode: AP214SceneTransform | undefined

        if (parentIndex !== void 0) {
          parentNode = this.scene_[parentIndex] as AP214SceneTransform
        }

        const material = this.materials.getMaterialByGeometryID(geometry.localID)

        yield [
          parentNode?.absoluteTransform,
          parentNode?.absoluteNativeTransform,
          geometry,
          material !== void 0 ? material[0] : void 0,
          node.relatedElementLocalId !== void 0 ?
            this.model.getElementByLocalID(node.relatedElementLocalId) : void 0,
        ]
      }
    }
  }

  /**
   *
   */
  public popTransform(): void {

    this.currentParent_ = this.sceneStack_.pop()
    
  }

  /**
   *
   * @param transform
   */
  public pushTransform(transform: AP214SceneTransform) {

    if (this.currentParent_ !== void 0) {
      this.sceneStack_.push(this.currentParent_)
    }

    this.currentParent_ = transform
  }

  /**
   * Does this scene have a particular piece of geometry?
   *
   * @param localID The local ID of the geometry
   * @return {boolean} True if the scene has this geometry.
   */
  public hasGeometry(localID: number): boolean {

    return this.geometrySet_.has( localID )
  }

  /**
   *
   * @param localID
   * @param owningElementLocalID
   * @param materialOverridLocalID
   * @return {AP214SceneGeometry}
   */
  public addGeometry(
      localID: number,
      owningElementLocalID?: number,
      materialOverridLocalID?: number ): AP214SceneGeometry {

    const nodeIndex = this.scene_.length

    let parentIndex: number | undefined

    this.geometrySet_.add( localID )

    if (this.currentParent_ !== void 0) {

      parentIndex = this.currentParent_.index
      this.currentParent_.children.push(nodeIndex)

    } else {

      this.roots.push(nodeIndex)
    }

    const result =
      new AP214SceneGeometry(
          this.model,
          localID,
          nodeIndex,
          owningElementLocalID,
          parentIndex,
          materialOverridLocalID )

    this.scene_.push(result)

    const geometryChildren = this.model.geometry?.getChildrenByLocalID(localID)

    if ( geometryChildren !== void 0 ) {

      for ( const childLocalID of geometryChildren ) {

        this.addGeometry( childLocalID, owningElementLocalID )
      }
    }

    const geoemtryListeners = this.geometryListeners_

    if ( geoemtryListeners !== void 0 ) {

      const transform =
      ( parentIndex !== void 0 ?
        this.scene_[ parentIndex ] : void 0 ) as ( AP214SceneTransform | undefined )

      const geometry = this.model.geometry?.getByLocalID(localID)

      if ( geometry === void 0 ) {
        return result
      }

      for ( const listener of geoemtryListeners ) {

        listener.onGeometryAdded( result, transform )
      }
    }

    return result
  }

  /**
   * Add a transform node and make the current transform stack parent its parent.
   *
   * Items added will be made the top of the transform stack.
   *
   * To prevent a node being used as a parent, pop it subsequently.
   *
   * @param localID The local ID of the transform.
   * @param transform The transform matrix.
   * @param nativeTransform The native transform matrix.
   * @param mappedItem Whether the transform is a mapped item.
   * @return The added transform node.
   */
  public addTransform(
      localID: number,
      transform: ReadonlyArray<number>,
      nativeTransform: NativeTransform4x4,
      mappedItem: boolean = false ): AP214SceneTransform {

    if ( !mappedItem && this.sceneLocalIdMap_.has(localID)) {
      const transform_ = this.getTransform(localID)

      if (transform_ !== void 0) {
        this.pushTransform(transform_)

        return transform_
      }
    }

    const nodeIndex = this.scene_.length
    let parentIndex: number | undefined

    let absoluteNativeTransform: NativeTransform4x4

    if (this.currentParent_ !== void 0) {

      const localPlacementParameters: ParamsLocalPlacement = {
        useRelPlacement: true,
        axis2Placement: nativeTransform,
        relPlacement: this.currentParent_.absoluteNativeTransform,
      }

      absoluteNativeTransform = this.conwayGeometry
          .getLocalPlacement(localPlacementParameters)

    //  console.log( absoluteNativeTransform.getValues() )

      parentIndex = this.currentParent_.index
      this.currentParent_.children.push(nodeIndex)

    } else {

      absoluteNativeTransform = nativeTransform
      this.roots.push(nodeIndex)
    }

    const result =
      new AP214SceneTransform(
          this.model,
          transform,
          absoluteNativeTransform.getValues(),
          localID,
          nodeIndex,
          nativeTransform,
          absoluteNativeTransform,
          parentIndex)

    this.scene_.push(result)

    if ( !mappedItem ) { 
      this.sceneLocalIdMap_.set(localID, nodeIndex)
    }

    const transformListeners = this.transformListeners_

    if ( transformListeners !== void 0 ) {

      for ( const listener of transformListeners ) {

        listener.onTransformAdded( result )
      }
    }

    this.pushTransform(result)

    return result
  }
}
