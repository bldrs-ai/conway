 

import {
  Group,
  BatchedMesh,
  Matrix4,
  Matrix4Tuple,
  BufferGeometry,
  BufferAttribute,
  InterleavedBufferAttribute,
  InterleavedBuffer,
  MeshPhysicalMaterial,
  FrontSide,
  DoubleSide,
  LinearSRGBColorSpace,
  Vector4,
  Vector3,
} from 'three'
import { Scene as ConwayScene, SceneListener, SceneListenerOptions } from '../../core/scene'
import { SceneNodeGeometry, SceneNodeTransform } from '../../core/scene_node'
import { CanonicalMesh, CanonicalMeshBuffer } from '../../core/canonical_mesh'
import { CanonicalMaterial, defaultCanonicalMaterial } from '../../core/canonical_material'
import Logger from '../../logging/logger'
import { BlendMode, Vector3 as ConwayVector3 } from '../../../dependencies/conway-geom'
import { ILocalIdSet } from '../../core/i_local_id_set'


const COMPONENT_TRANSLATION_THRESHOLD = 1024

const identity = new Matrix4()


const eventListenerOptions = new SceneListenerOptions( true, false, true )

/**
 * A three proxy for a conway scene of a model.
 */
export default class SceneObject extends Group {

  private readonly sink_: SceneEventSink

  /**
   * Set the visibility set for the elements in this scene object.
   * Note it is a set of of the local IDs of the related elements
   * (i.e. IfcProducts) that are used to control visibility.
   *
   * @return {ILocalIdSet | Set< number > | null} The visibility set to use, or null for all items.
   */
  public get visibilitySet(): ILocalIdSet | Set< number > | null {
    return this.sink_.visibilitySet
  }

  /**
   * Set the visibility set for the elements in this scene object.
   * Note it is a set of of the local IDs of the related elements
   * (i.e. IfcProducts) that are used to control visibility.
   * 
   * @param value The visibility set to use, or null for all items.
   */
  public set visibilitySet( value: ILocalIdSet | Set< number > | null ) {
    this.sink_.visibilitySet = value
  }

  /**
   * Does this have instances that aren't spaces?
   *
   * @return {boolean} Does this have non spzces?
   */
  public get hasNonSpaces(): boolean {

    return this.sink_.hasNonSpaces
  }

  /**
   * Should the spaces of this object be shown?
   *
   * @return {boolean} Whether spaces are shown.
   */
  public get showSpaces(): boolean {

    return this.sink_.showSpaces
  }

  /**
   * Should spaces of this object be shown?
   *
   * @param value The value to set (default is false)
   */
  public set showSpaces( value: boolean ) {

    this.sink_.showSpaces = value
  }
  
  /**
   * Should non-space elements of this be hidden.
   *
   * @return {boolean} True if non-spaces are hidden.
   */
  public get hideNonSpaces(): boolean {

    return this.sink_.hideNonSpaces
  }

  /**
   * Should non-space elements of this be hidden.
   *
   * @param value The value to set (default is false)
   */
  public set hideNonSpaces( value: boolean ) {

    this.sink_.hideNonSpaces = value
  }

  /**
   * Get the reference point for this in absolute space.
   *
   * Note that this should be used like an RTC reference to
   * calculate relative transforms in a high bit space or using fixed
   * point to produce an eye relative transform matrix.
   *
   * @return {Vector3} The reference point.
   */
  public get referencePoint(): Vector3 {

    return this.sink_.referencePoint
  }

  /**
   * Construct this from a conway scene.
   *
   * @param target The target scene to use.
   * @param cork Should this start corked/not creating geometry batches (defaults to true),
   * call uncork to create geometry on a corked sink.
   */
  constructor( public readonly target : ConwayScene, cork: boolean = true ) {

    super()

    this.sink_ = new SceneEventSink( this, target, cork )

    target.addSceneListener( this.sink_, eventListenerOptions )
  }

  /**
   * Uncork the scene to batch add the geometry
   */
  public uncork(): void {

    this.sink_.uncork()
  }

  /**
   * Dispose this and remove its scene elements
   */
  public dispose(): void {

    this.target.removeSceneListener( this.sink_ )
  }
}

const normalizeMat: Matrix4 = new Matrix4(
    1, 0, 0, 0,  // First column
    0, 0, -1, 0, // Second column
    0, 1, 0, 0,  // Third column
    0, 0, 0, 1,   // Fourth column
)

const invertNormalizeMat = normalizeMat.clone().transpose()

/**
 * Sink for receiving events from a target scene
 */
class SceneEventSink implements SceneListener {

  private readonly materialMap_ = new Map< CanonicalMaterial | undefined, MaterialMeshBatch >()
  private readonly instances_ = new Map< SceneNodeGeometry, GeometryInstance >()
  private readonly meshes_ = new Map< CanonicalMesh, MeshCacheItem >()

  private nonSpaceCount_: number = 0

  private firstAbsolutePoint_?: Vector4

  private positionNormalization_?: Matrix4

  private showSpaces_: boolean = false
  private hideNonSpaces_: boolean = false

  private visibilitySet_: ILocalIdSet | Set< number > | null = null

  /**
   * Set the visibility set for this object.
   *
   * @param value The visibility set to use, or null for all items
   * to be default visibile (exception spaces).
   */
  public set visibilitySet( value: ILocalIdSet | Set< number > | null ) {

    if ( this.visibilitySet_ !== value ) {

      this.visibilitySet_ = value

      this.reconcileVisibility()
    }
  }

  /**
   * Get the visibility set for this object.
   *
   * @return {ILocalIdSet | Set< number > | null} The visibility set.
   */
  public get visibilitySet(): ILocalIdSet | Set< number > | null {
    return this.visibilitySet_
  }

  /**
   * Reconcile space visibility.
   */
  private reconcileVisibility(): void {

    const onlySpaces = this.nonSpaceCount_ === 0

    const visibilitySet = this.visibilitySet_

    for ( const [node, instance] of this.instances_.entries() ) {

      const batch = instance.batch
      const batched = instance.batched

      if (
        batch === void 0 ||
        batched === void 0 ||
        batched.geometryID === void 0 ||
        instance.instanceID === void 0 ) {

        continue
      }

      const batchMesh = batch.mesh!

      const isVisible =
        ( ( !node.isSpace && !this.hideNonSpaces_ ) ||
          ( node.isSpace && ( onlySpaces || this.showSpaces_ ) ) ) &&
        ( visibilitySet === null || (
          instance.node.relatedElementLocalId !== void 0 &&
          visibilitySet.has( instance.node.relatedElementLocalId ) ) )

      batchMesh.setVisibleAt( instance.instanceID!, isVisible )
    }
  }

  /**
   * Does this have instances that aren't spaces?
   *
   * @return {boolean}  
   */
  public get hasNonSpaces(): boolean {

    return this.nonSpaceCount_ > 0
  }

  /**
   * Should the spaces of this object be shown?
   *
   * @return {boolean} Whether spaces are shown.
   */
  public get showSpaces(): boolean {

    return this.showSpaces_
  }

  /**
   * Should spaces of this object be shown?
   *
   * @param value The value to set (default is false)
   */
  public set showSpaces( value: boolean ) {

    if ( this.showSpaces_ !== value ) {

      this.showSpaces_ = value
      this.reconcileVisibility()
    }
  }
  
  /**
   * Should non-space elements of this be hidden.
   *
   * @return {boolean} True if non-spaces are hidden.
   */
  public get hideNonSpaces(): boolean {

    return this.hideNonSpaces_
  }

  /**
   * Should non-space elements of this be hidden.
   *
   * @param value The value to set (default is false)
   */
  public set hideNonSpaces( value: boolean ) {

    if ( this.hideNonSpaces_ !== value ) {

      this.hideNonSpaces_ = value
      this.reconcileVisibility()
    }
  }

  /**
   * Get the reference point for this in absolute space.
   *
   * Note that this should be used like an RTC reference to
   * calculate relative transforms in a high bit space or using fixed
   * point to produce an eye relative transform matrix.
   *
   * @return {Vector3} The reference point.
   */
  public get referencePoint(): Vector3 {

    const firstAbsolutePoint = this.firstAbsolutePoint_

    if ( firstAbsolutePoint === void 0 ) {

      return new Vector3( 0, 0, 0 )
    }

    return new Vector3( firstAbsolutePoint.x, firstAbsolutePoint.y, firstAbsolutePoint.z )
  }

  /**
   * Construct this with the group items will be attached to.
   *
   * @param group The group this will be attached to.
   * @param scene The scene this comes from.
   * @param cork_ Should this start corked (defaults to true), meaning
   * geometry wont be added to batches. To add geometry to batches on a 
   * corkerd scene object, call "uncork".
   */
  constructor(
    private readonly group: Group,
    private readonly scene: ConwayScene,
    private cork_: boolean = true ) {}

  /**
   * Uncork this event handler, processing all geometry into batches at once.
   *
   * Use this during initial non-progressive load to speed up batching.
   *
   * During progressive load, the cork_ parameter of the constructor should be
   * set to "false" and this doesn't need to be called (although, calling it is
   * idempotent).
   */
  public uncork(): void {

    if ( !this.cork_ ) {

      return
    }

    this.cork_ = false

    const onlySpaces = this.nonSpaceCount_ === 0

    for ( const batch of this.materialMap_.values() ) {

      const batchMesh =
        new BatchedMesh(
            batch.instanceCount,
            batch.vertexCount,
            batch.indexCount,
            batch.threeMaterial )

      batchMesh.perObjectFrustumCulled = false

      this.group.add( batchMesh )

      if ( batch.material.blend === BlendMode.OPAQUE && batch.material.baseColor[ 3 ] === 1 ) {

        batchMesh.castShadow = true
        batchMesh.sortObjects = false

      }

      batchMesh.receiveShadow = true

      batch.mesh = batchMesh

      for ( const batchGeometry of batch.geometryMap.values() ) {

        try {

          batchGeometry.geometryID = batchMesh.addGeometry( batchGeometry.meshItem.geometry )

        } catch ( e ) {

          Logger.error( `Error adding geometry item: ${(e as Error | undefined)?.message}` )
        }
      }
    }

    const visibilitySet = this.visibilitySet_

    for ( const [node, instance] of this.instances_.entries() ) {

      const batch = instance.batch
      const batched = instance.batched

      if ( batch === void 0 || batched === void 0 || batched.geometryID === void 0 ) {

        continue
      }

      const batchMesh = batch.mesh!

      instance.instanceID = batchMesh.addInstance( batched.geometryID! )

      const isVisible =
        ( ( !node.isSpace && !this.hideNonSpaces_ ) ||
          ( node.isSpace && ( onlySpaces || this.showSpaces_ ) ) ) &&
        ( visibilitySet === null || (
          instance.node.relatedElementLocalId !== void 0 &&
          visibilitySet.has( instance.node.relatedElementLocalId ) ) )

      batchMesh.setVisibleAt( instance.instanceID, isVisible )
      batchMesh.setMatrixAt( instance.instanceID, instance.transform )
    }
  }

  /**
   * Get the mesh cache item for a particular mesh buffer.
   *
   * @param from The mesh buffer to get the cached item for.
   * @return {MeshCacheItem} The cached items.
   */
  private getMeshItem( from: CanonicalMeshBuffer ): MeshCacheItem {

    let cacheItem = this.meshes_.get( from )

    /** Get a cached buffer item for this */
    if ( cacheItem === void 0 ) {

      const geometry       = new BufferGeometry()
      const conwayGeometry = this.scene.conwayGeometry
      const fromGeometry   = from.geometry

      const readFirstPoint = from.geometry.getPoint( 0 )
      const maxAbsComponent =
        Math.max(
            Math.abs( readFirstPoint.x ),
            Math.abs( readFirstPoint.y ),
            Math.abs( readFirstPoint.z ) )

      let reificationOffset: ConwayVector3 | undefined
      let reificationOffsetMatrix: Matrix4 | undefined
      
      // If the first point is far from the origin, reify the geometry

      if ( maxAbsComponent > COMPONENT_TRANSLATION_THRESHOLD ) {

        reificationOffset = readFirstPoint

        fromGeometry.reify( reificationOffset )

        reificationOffsetMatrix =
          new Matrix4().makeTranslation(
            readFirstPoint.x,
            readFirstPoint.y,
            readFirstPoint.z )
      }

      const vertexBuffer =
        conwayGeometry.floatHeapSlice(
            fromGeometry.GetVertexData(),
            fromGeometry.GetVertexDataSize() )

      const interleavedBuffer = new InterleavedBuffer( vertexBuffer, 6 )

      geometry.setIndex(
          new BufferAttribute(
              conwayGeometry.uint32HeapSlice(
                  fromGeometry.GetIndexData(),
                  fromGeometry.GetIndexDataSize() ), 1 ) )

      geometry.setAttribute(
          'position',
           
          new InterleavedBufferAttribute( interleavedBuffer, 3, 0 ) )

      geometry.setAttribute(
          'normal',
           
          new InterleavedBufferAttribute( interleavedBuffer, 3, 3, true ) )


      cacheItem = new MeshCacheItem( from, geometry, reificationOffset, reificationOffsetMatrix )

      this.meshes_.set( from, cacheItem )
    }

    return cacheItem
  }

  /**
   * Callback when a transform is added (not used)
   *
   * @param node
   */
  onTransformAdded( node: SceneNodeTransform ): void {

  }

  /**
   * Callback when a transform is uupdated (not used)
   *
   * @param node
   */
  onTransformUpdated( node: SceneNodeTransform ): void {

  }

  /**
   * Callback when a transform is removed (not used)
   *
   * @param node
   */
  onTransformRemoved( node: SceneNodeTransform ): void {
  }

  /**
   * Callback when geometry is added, with its matching
   * transform node (if the geometry is not top level)
   *
   * @param node
   * @param transform
   */
  onGeometryAdded(
      node: SceneNodeGeometry,
      transform?: SceneNodeTransform ): void {

    // Note we pass this through because adding and updating are
    // idempotent and this handled multiple added cases for the same
    // node.
    this.onGeometryUpdated( node, transform, true )
  }

  /**
   * Callback when geometry is updated, or its matching
   * transform node is updated (if the geometry is not top level)
   *
   * @param node
   * @param transform
   * @param isAdded
   */
  onGeometryUpdated(
      node: SceneNodeGeometry,
      transform?: SceneNodeTransform,
      isAdded: boolean = false ): void {

    if ( isAdded && !node.isSpace ) {

      if ( ( this.nonSpaceCount_++ ) === 0 && !this.cork_ ) {

        this.reconcileVisibility()
      }
    }

    const model = node.model

    const mesh = model.getMeshFromGeometryNode( node )
    const materialFromNode = model.getMaterialFromGeometryNode( node )
    const material = materialFromNode ?? defaultCanonicalMaterial
    const transformTuple = (transform?.absoluteTransform as Matrix4Tuple)

    let transformMatrix =
      transformTuple !== void 0 ?
        new Matrix4(...transformTuple)
            .transpose()
            .premultiply( invertNormalizeMat ) :
        invertNormalizeMat.clone()

    if ( this.firstAbsolutePoint_ === void 0 && mesh !== void 0 ) {

      const hasVertices = mesh.geometry.getVertexCount() > 0

      if ( hasVertices ) {

        const readFirstPoint = mesh.geometry.getPoint( 0 )

        const firstPointThree =
          new Vector4( readFirstPoint.x, readFirstPoint.y, readFirstPoint.z, 1 )

        if ( transformMatrix !== void 0 ) {

          firstPointThree.applyMatrix4( transformMatrix )
        }

        this.firstAbsolutePoint_ = firstPointThree

        this.positionNormalization_ =
          new Matrix4().makeTranslation(
            -firstPointThree.x,
            -firstPointThree.y,
            -firstPointThree.z )
      }
    }

    if ( this.positionNormalization_ !== void 0 ) {

      if ( transformMatrix === void 0 ) {

        transformMatrix = this.positionNormalization_.clone()

      } else {

        transformMatrix.premultiply( this.positionNormalization_ )
      }
    }

    const instances = this.instances_

    let instance = instances.get( node )

    if ( instance === void 0 ) {

      instance = new GeometryInstance( node, transformMatrix ?? identity.clone(), void 0, void 0 )

      instances.set( node, instance )

    } else {

      instance.transform = transformMatrix ?? identity.clone()
    }

    const instanceMaterial = instance.material
    const instanceMesh     = instance.mesh

    instance.material = material
    instance.mesh = mesh

    const batches = this.materialMap_

    if ( instanceMaterial !== material ) {

      if ( instanceMaterial !== void 0 ) {

        const batch = instance.batch

        if ( batch !== void 0 && instanceMesh !== void 0 ) {

          const geometryItem = instance.batched

          if ( geometryItem !== void 0 ) {

            instance.batched = void 0

            const instanceID = instance.instanceID
            const batchMesh = batch.mesh

            if ( batchMesh !== void 0 && instanceID !== void 0 ) {

              batchMesh.deleteInstance( instanceID )

              if ( ( --geometryItem.instances ) === 0 ) {

                geometryItem.meshItem.batches.delete( batch )

                if ( geometryItem.geometryID !== void 0 ) {
                  batchMesh.deleteGeometry( geometryItem.geometryID )
                }

                batch.geometryMap.delete( instanceMesh )
              }
            }
          }
        }
      }
    }

    if ( instanceMesh !== mesh ) {

      const geometryItem = instance.batched
      const batch = instance.batch

      if ( geometryItem !== void 0 && batch !== void 0 && instanceMesh !== void 0 ) {

        instance.batched = void 0

        const instanceID = instance.instanceID
        const batchMesh = batch.mesh

        if ( batchMesh !== void 0 && instanceID !== void 0 ) {

          batchMesh.deleteInstance( instanceID )

          if ( ( --geometryItem.instances ) === 0 ) {

            geometryItem.meshItem.batches.delete( batch )
            // For there to be an instance id, the geometry ID must have been set
            batchMesh.deleteGeometry( geometryItem.geometryID! )
            batch.geometryMap.delete( instanceMesh )
          }
        }
      }

      if ( mesh !== void 0 ) {
        instance.geometry = this.getMeshItem( mesh )

        const reificationOffsetMatrix = instance.geometry.reificationOffsetMatrix

        if ( reificationOffsetMatrix !== void 0 ) {
      
          transformMatrix =
            transformTuple !== void 0 ?
              new Matrix4(...transformTuple)
                  .transpose()
                  .premultiply( invertNormalizeMat ) :
              invertNormalizeMat.clone()

          if ( this.positionNormalization_ !== void 0 ) {
            transformMatrix.premultiply( this.positionNormalization_ )
          }

          transformMatrix.multiply( reificationOffsetMatrix )

          instance.transform = transformMatrix
        }

      } else {

        instance.geometry = void 0
      }
    }

    if (
      mesh !== void 0 &&
      ( instanceMaterial !== material || instanceMesh !== mesh ) ) {

      let batch = batches.get( material )

      if ( batch === void 0 ) {

        const threeMaterial = new MeshPhysicalMaterial()

        threeMaterial.metalness = material.metalness ?? threeMaterial.metalness
        threeMaterial.roughness = material.roughness ?? threeMaterial.roughness

        const ior = material.ior

        const baseColor = material.baseColor

        const materialAlpha = baseColor[ 3 ]

        threeMaterial.side = material.doubleSided ? DoubleSide : FrontSide
        
        const ALPHA_GAMMA = 2.2

        const deGammaAlpha = Math.pow( materialAlpha, ALPHA_GAMMA )

        if ( material.blend !== BlendMode.OPAQUE && materialAlpha < 1.0 ) {

          threeMaterial.transparent        = true
          threeMaterial.thickness          = 0.01
          threeMaterial.transmission       = 1.0 - deGammaAlpha
          threeMaterial.depthWrite         = true
          threeMaterial.side               = DoubleSide
        }

        if ( ior !== void 0 ) {
          threeMaterial.ior = ior

          const IOR_OF_AIR_AT_STP = 1.000273

          // Assuming reflectivity of index
          const reflectivityRoot = ( IOR_OF_AIR_AT_STP - ior ) / ( IOR_OF_AIR_AT_STP + ior )

          threeMaterial.reflectivity = reflectivityRoot * reflectivityRoot
        }

        const specular = material.specular

        if ( specular !== void 0 ) {

          threeMaterial.specularColor.setRGB(
              specular[ 0 ],
              specular[ 1 ],
              specular[ 2 ],
              LinearSRGBColorSpace )
        }

        let r = baseColor[ 0 ] / deGammaAlpha
        let g = baseColor[ 1 ] / deGammaAlpha
        let b = baseColor[ 2 ] / deGammaAlpha

        const maxComponent = Math.max( r, g, b )

        if ( maxComponent > 1 ) {

          r /= maxComponent
          g /= maxComponent
          b /= maxComponent
        }

        threeMaterial.color.setRGB(
            r,
            g,
            b,
            LinearSRGBColorSpace )

        batch = new MaterialMeshBatch( material, threeMaterial )

        batches.set( material, batch )
      }

      instance.batch = batch

      const instanceGeometry = instance.geometry

      if ( instanceGeometry !== void 0 ) {

        let batchMesh = batch.mesh

        let batchGeometry: BatchGeometry | undefined =
          instance.batched ?? batch.geometryMap.get( mesh )

        const vertexCount = ( mesh.geometry.GetVertexDataSize() / 6 ) | 0
        const indexCount = ( mesh.geometry.GetIndexDataSize() ) | 0

        if ( this.cork_ ) {

          if ( batchGeometry === void 0 ) {

            batchGeometry = new BatchGeometry( mesh, instanceGeometry )

            batch.vertexCount += vertexCount
            batch.indexCount += indexCount

            batch.geometryMap.set( mesh, batchGeometry )
          }

          ++batch.instanceCount

          instance.batched = batchGeometry
          return
        }

        if ( batchMesh === void 0 ) {

          batchMesh =
            new BatchedMesh(
                1,
                vertexCount,

                indexCount,
                batch.threeMaterial )

          batchMesh.perObjectFrustumCulled = false

          if ( batch.material.baseColor[ 3 ] < 1 ) {

            batchMesh.castShadow = false
          } else {

            batchMesh.castShadow = true
          }

          batchMesh.receiveShadow = true

          this.group.add( batchMesh )

          batch.mesh = batchMesh

          batch.vertexCount = vertexCount
          batch.indexCount = indexCount

          const geometryID = batchMesh.addGeometry( instanceGeometry.geometry )

          batchGeometry = new BatchGeometry( mesh, instanceGeometry, geometryID )

          instance.batched = batchGeometry

          batch.geometryMap.set( mesh, batchGeometry )

        } else {

          batchGeometry = batch.geometryMap.get( mesh )

          if ( batchGeometry === void 0 ) {

            const newIndexSize =
              batch.indexCount +

              indexCount

            const newVertexSize =
             batch.vertexCount +
              vertexCount

            batch.indexCount = newIndexSize
            batch.vertexCount = newVertexSize

            batchMesh.setGeometrySize( newVertexSize, newIndexSize )

            const geometryID = batchMesh.addGeometry( instanceGeometry.geometry )

            batchGeometry = new BatchGeometry( mesh, instanceGeometry, geometryID )

            instance.batched = batchGeometry

            batch.geometryMap.set( mesh, batchGeometry )
          }

        }

        if ( batchMesh.instanceCount === batchMesh.maxInstanceCount ) {

          const GROWTH_RATE = 4

          batchMesh.setInstanceCount( batchMesh.maxInstanceCount * GROWTH_RATE )
        }

        ++batch.instanceCount

        // Geometry id must exist if the batch is uncorked.
        const instanceID    = batchMesh.addInstance( batchGeometry.geometryID! )
        const visibilitySet = this.visibilitySet_
        const onlySpaces    = this.nonSpaceCount_ === 0
        const isVisible     =
          ( ( !node.isSpace && !this.hideNonSpaces_ ) ||
            ( node.isSpace && ( onlySpaces || this.showSpaces_ ) ) ) &&
          ( visibilitySet === null || (
            instance.node.relatedElementLocalId !== void 0 &&
            visibilitySet.has( instance.node.relatedElementLocalId ) ) )

        batchMesh.setVisibleAt( instanceID, isVisible )

        instance.instanceID = instanceID
      }
    }

    if ( this.cork_ ) {

      return
    }

    if ( instance.instanceID !== void 0 ) {
      instance.batch?.mesh?.setMatrixAt( instance.instanceID, instance.transform )
    }
  }

  /**
   * Callback when a geometry node is removed.
   *
   * @param node
   */
  onGeometryRemoved( node: SceneNodeGeometry ): void {

    // TODO - CS
  }

}

/**
 * A mesh geometry for a particular material
 */
class BatchGeometry {

  /**
   * The number of instances
   */
  public instances: number = 0

  /**
   *
   * @param mesh
   * @param meshItem
   * @param geometryID
   */
  constructor(
    public readonly mesh: CanonicalMesh,
    public readonly meshItem: MeshCacheItem,
    public geometryID?: number ) {
  }
}

/**
 * Batch mesh for a particular material.
 */
class MaterialMeshBatch {

  public mesh?: BatchedMesh

  public readonly geometryMap = new Map< CanonicalMesh, BatchGeometry >()

  public vertexCount: number = 0

  public indexCount: number = 0

  public instanceCount: number = 0

  /**
   *
   * @param material The material this corresponds to.
   * @param threeMaterial
   */
  constructor(
    public readonly material: CanonicalMaterial,
    public readonly threeMaterial: MeshPhysicalMaterial ) {

  }
}


/**
 * Cache item for buffer geometry for a mesh
 */
class MeshCacheItem {

  public readonly batches = new Set< MaterialMeshBatch >()
  
  /**
   *
   * @param mesh The mesh for this cache item.
   * @param geometry The geometry for this cache item
   * @param reificationOffset The reification offset for this cache item.
   * @param reificationOffsetMatrix The reification offset matrix for this cache item.
   */
  constructor(
    public readonly mesh: CanonicalMesh,
    public readonly geometry: BufferGeometry,
    public reificationOffset?: ConwayVector3,
    public reificationOffsetMatrix?: Matrix4 ) {}
}

/**
 * Index data for a geometry node.
 */
class GeometryInstance {

  /** The current instance ID */
  public instanceID?: number

  public batch?: MaterialMeshBatch

  public geometry?: MeshCacheItem

  public batched?: BatchGeometry

  /**
   *
   * @param node
   * @param transform
   * @param mesh
   * @param material
   */
  constructor(
    public readonly node: SceneNodeGeometry,
    public transform: Matrix4,
    public mesh?: CanonicalMesh,
    public material?: CanonicalMaterial ) {}

}
