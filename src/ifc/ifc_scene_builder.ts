import { ConwayGeometry, GeometryObject, ParamsLocalPlacement } from
  '../../dependencies/conway-geom/conway_geometry'
import { CanonicalMaterial } from '../core/canonical_material'
import { CanonicalMesh, CanonicalMeshType } from '../core/canonical_mesh'
import { Model } from '../core/model'
import { NativeTransform } from '../core/native_types'
import { PackedMesh } from '../core/packed_mesh'
import { Scene } from '../core/scene'
import {
  SceneNodeModelType,
  SceneNodeGeometry,
  SceneNodeTransform,
}
  from '../core/scene_node'
import { TriangleElementMap } from '../core/triangle_element_map'
import StepEntityBase from '../step/step_entity_base'
import EntityTypesIfc from './ifc4_gen/entity_types_ifc.gen'
import { IfcMaterialCache } from './ifc_material_cache'
import IfcStepModel from './ifc_step_model'


/**
 *
 */
export class IfcSceneTransform implements SceneNodeTransform {

  readonly type = SceneNodeModelType.TRANSFORM


  /* eslint-disable no-useless-constructor, no-empty-function */
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
    public readonly nativeTransform: NativeTransform,
    public readonly absoluteNativeTransform: NativeTransform,
    public readonly parentIndex?: number) { }
  /* eslint-enable no-useless-constructor, no-empty-function */
  public children: number[] = []
}

/**
 *
 */
export class IfcSceneGeometry implements SceneNodeGeometry {

  readonly type = SceneNodeModelType.GEOMETRY

  /* eslint-disable no-useless-constructor, no-empty-function */
  /**
   * Construct a scene geometry node
   *
   * @param model
   * @param localID
   * @param index
   * @param parentIndex
   */
  constructor(
    public readonly model: Model,
    public readonly localID: number,
    public readonly index: number,
    public readonly relatedElementLocalId?: number,
    public readonly parentIndex?: number,
    public readonly isSpace: boolean = false,
    public readonly materialOverideLocalID?: number ) { }
  /* eslint-enable no-useless-constructor, no-empty-function */
}

export type IfcSceneNode = IfcSceneTransform | IfcSceneGeometry

/**
 *
 */
export class IfcSceneBuilder implements Scene< StepEntityBase< EntityTypesIfc > > {

  public roots: number[] = []

  private scene_: IfcSceneNode[] = []
  private sceneLocalIdMap_ = new Map<number, number>()
  private geometrySet_ = new Set< number >()

  private sceneStack_: IfcSceneTransform[] = []
  private currentParent_?: IfcSceneTransform

  /* eslint-disable no-useless-constructor, no-empty-function */
  /**
   *
   * @param model
   * @param conwayGeometry
   */
  public constructor(
    public readonly model: IfcStepModel,
    public readonly conwayGeometry: ConwayGeometry,
    public readonly materials: IfcMaterialCache) {

  }
  /* eslint-enable no-useless-constructor, no-empty-function */

  /**
   *
   * @param nodeIndex
   * @return {IfcSceneNode | undefined}
   */
  public getByNodeIndex(nodeIndex: number): IfcSceneNode | undefined {
    return this.scene_[nodeIndex]
  }

  /**
   *
   * @param localID
   * @return {IfcSceneNode | undefined}
   */
  private get(localID: number): IfcSceneNode | undefined {

    const sceneID = this.sceneLocalIdMap_.get(localID)

    return sceneID !== void 0 ? this.scene_[sceneID] : void 0
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
   * @return {IfcSceneTransform | undefined}
   */
  public getTransform(localID: number): IfcSceneTransform | undefined {

    const result = this.get(localID)

    if (result instanceof IfcSceneTransform) {

      return result
    }

    return void 0
  }

  /**
   * Build a packed/optimised mesh model with triangle element maps.
   *
   * @return {PackedMesh< IfcStepModel >} Maps materials to a geometry object
   * and triangle element map.
   */
  public buildPackedMeshModel(): PackedMesh<IfcStepModel> {

    const materialMap = new Map<CanonicalMaterial | undefined, number>()
    const materials: CanonicalMaterial[] = []
    const primitives: [GeometryObject, number | undefined][] = []
    const triangleMaps: TriangleElementMap[] = []
    const elementMap = new Map<number, number[]>()

    // eslint-disable-next-line no-unused-vars
    for (const [_, nativeTransform, geometry, material, entity] of this.walk()) {
      if (geometry.type === CanonicalMeshType.BUFFER_GEOMETRY) {

        const clonedGeometry = geometry.geometry.clone()

        clonedGeometry.applyTransform(nativeTransform)

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
              // eslint-disable-next-line no-magic-numbers, new-cap
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
              // eslint-disable-next-line no-magic-numbers, new-cap
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

    return new PackedMesh<IfcStepModel>(
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

    return this.scene_.every( ( node ) =>
      !(node instanceof IfcSceneGeometry) ||
      node.isSpace )
  }

  /**
   * Walk the current scene.
   *
   * @yields Raw absolute matrix transform, the native absolute transform, the canonical mesh,
   * the canonical material and the associated step element as it walks the hierarchy.
   * @param walkTemporary Include temporary items.
   */
  public* walk(walkTemporary: boolean = false, includeSpaces: boolean = false):
    IterableIterator<[readonly number[] | undefined,
      NativeTransform | undefined,
      CanonicalMesh,
      CanonicalMaterial | undefined,
      StepEntityBase<EntityTypesIfc> | undefined]> {

    for (const node of this.scene_) {

      if ( node instanceof IfcSceneGeometry && ( includeSpaces || !node.isSpace ) ) {

        const parentIndex = node.parentIndex
        const geometry = node.model.geometry?.getByLocalID(node.localID)

        if (geometry === void 0) {
          // console.log(`skipping due to null geometry, express ID:
        //  ${  this.model.getElementByLocalID(node.localID)?.expressID}`)
          continue
        }

        let parentNode: IfcSceneTransform | undefined

        if (parentIndex !== void 0) {
          parentNode = this.scene_[parentIndex] as IfcSceneTransform
        }

        const material =
          this.materials.getMaterialByGeometryID(node.materialOverideLocalID ?? geometry.localID)

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
  public pushTransform(transform: IfcSceneTransform) {

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
   * @return {IfcSceneGeometry}
   */
  public addGeometry(
      localID: number,
      owningElementLocalID?: number,
      isSpace?: boolean,
      materialOverrideLocalID?: number ): IfcSceneGeometry {

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
      new IfcSceneGeometry(
          this.model,
          localID,
          nodeIndex,
          owningElementLocalID,
          parentIndex,
          isSpace,
          materialOverrideLocalID )

    this.scene_.push(result)

    return result
  }

  /**
   *
   * @param localID
   * @param transform
   * @param nativeTransform
   * @return {IfcSceneTransform}
   */
  public addTransform(
      localID: number,
      transform: ReadonlyArray<number>,
      nativeTransform: NativeTransform,
      isMappedItem:boolean = false): IfcSceneTransform {

    if (this.sceneLocalIdMap_.has(localID)) {
      const transform_ = this.getTransform(localID)

      if (transform_ !== void 0) {
        this.pushTransform(transform_)

        return transform_
      }
    }

    const nodeIndex = this.scene_.length
    let parentIndex: number | undefined

    let absoluteNativeTransform: NativeTransform

    if (this.currentParent_ !== void 0) {

      const localPlacementParameters: ParamsLocalPlacement = {
        useRelPlacement: true,
        axis2Placement: nativeTransform,
        relPlacement: this.currentParent_.absoluteNativeTransform,
      }

      absoluteNativeTransform = this.conwayGeometry
          .getLocalPlacement(localPlacementParameters)

      parentIndex = this.currentParent_.index
      this.currentParent_.children.push(nodeIndex)

    } else {

      absoluteNativeTransform = nativeTransform
      this.roots.push(nodeIndex)
    }

    const result =
      new IfcSceneTransform(
          this.model,
          transform,
          absoluteNativeTransform.getValues(),
          localID,
          nodeIndex,
          nativeTransform,
          absoluteNativeTransform,
          parentIndex)

    this.scene_.push(result)

    if (!isMappedItem) {
      this.sceneLocalIdMap_.set(localID, nodeIndex)
    }

    this.pushTransform(result)

    return result
  }
}
