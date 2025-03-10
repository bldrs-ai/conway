/* eslint-disable new-cap */

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
import { BlendMode } from '../../../dependencies/conway-geom'


const identity = new Matrix4()


const eventListenerOptions = new SceneListenerOptions( true, false, true )

/**
 * A three proxy for a conway scene of a model.
 */
export default class SceneObject extends Group {

  private readonly sink_: SceneEventSink

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
   */
  constructor( public readonly target : ConwayScene ) {

    super()

    this.sink_ = new SceneEventSink( this, target )

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

/* eslint-disable no-useless-constructor, no-empty-function */

/**
 * Sink for receiving events from a target scene
 */
class SceneEventSink implements SceneListener {

  private readonly materialMap_ = new Map< CanonicalMaterial | undefined, MaterialMeshBatch >()
  private readonly instances_ = new Map< SceneNodeGeometry, GeometryInstance >()
  private readonly meshes_ = new Map< CanonicalMesh, MeshCacheItem >()

  private firstAbsolutePoint_?: Vector4
  private positionNormalization_?: Matrix4

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
   * Get the position geometry in this is relative to,
   * not this position will only be set when the first geometry is
   * passed through to this listener.
   *
   * This should be used for relative positioning to work out
   * camera relative matrices in double precision, which can then be used
   * to translate the whole group.
   *
   * @return {Vector3} The relative position.
   */
  public get relativeTo(): Vector3 {

    const firstAbsolutePoint = this.firstAbsolutePoint_

    if ( firstAbsolutePoint !== void 0 ) {

      return new Vector3( firstAbsolutePoint.x, firstAbsolutePoint.y, firstAbsolutePoint.z )
    }

    return new Vector3()
  }

  /**
   * Construct this with the group items will be attached to.
   *
   * @param group The group this will be attached to.
   * @param scene The scene this comes from.
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

    for ( const batch of this.materialMap_.values() ) {

      const batchMesh =
        new BatchedMesh(
            batch.instanceCount,
            batch.vertexCount,

            batch.indexCount,
            batch.threeMaterial )

      this.group.add( batchMesh )

      if ( batch.material.blend === BlendMode.OPAQUE && batch.material.baseColor[ 3 ] === 1 ) {

        batchMesh.castShadow = true
      }

      batchMesh.receiveShadow = true

      batch.mesh = batchMesh

      for ( const batchGeometry of batch.geometryMap.values() ) {

        try {

          batchGeometry.geometryID = batchMesh.addGeometry( batchGeometry.meshItem.geometry )

        } catch ( e: any ) {

          Logger.error( `Error adding geometry item: ${e?.message}` )
        }
      }
    }

    for ( const instance of this.instances_.values() ) {

      const batch = instance.batch
      const batched = instance.batched

      if ( batch === void 0 || batched === void 0 || batched.geometryID === void 0 ) {

        continue
      }

      const batchMesh = batch.mesh!

      instance.instanceID = batchMesh.addInstance( batched.geometryID! )
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

      const vertexBuffer =
        conwayGeometry.floatHeapSlice(
            fromGeometry.GetVertexData(),
            fromGeometry.GetVertexDataSize() )

      // eslint-disable-next-line no-magic-numbers
      const interleavedBuffer = new InterleavedBuffer( vertexBuffer, 6 )

      geometry.setIndex(
          new BufferAttribute(
              conwayGeometry.uint32HeapSlice(
                  fromGeometry.GetIndexData(),
                  fromGeometry.GetIndexDataSize() ), 1 ) )

      geometry.setAttribute(
          'position',
          // eslint-disable-next-line no-magic-numbers
          new InterleavedBufferAttribute( interleavedBuffer, 3, 0 ) )

      geometry.setAttribute(
          'normal',
          // eslint-disable-next-line no-magic-numbers
          new InterleavedBufferAttribute( interleavedBuffer, 3, 3, true ) )

      cacheItem = new MeshCacheItem( from, geometry )

      this.meshes_.set( from, cacheItem )
    }

    return cacheItem
  }


  /* eslint-disable no-empty-function */

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
    this.onGeometryUpdated( node, transform )
  }

  /**
   * Callback when geometry is updated, or its matching
   * transform node is updated (if the geometry is not top level)
   *
   * @param node
   * @param transform
   */
  onGeometryUpdated(
      node: SceneNodeGeometry,
      transform?: SceneNodeTransform ): void {

    if ( node.isSpace ) {

      return
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
        void 0

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

        transformMatrix = this.positionNormalization_
      } else {

        transformMatrix.premultiply( this.positionNormalization_ )
      }
    }

    const instances = this.instances_

    let instance = instances.get( node )

    if ( instance === void 0 ) {

      instance = new GeometryInstance( node, transformMatrix ?? identity, void 0, void 0 )

      instances.set( node, instance )
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
      } else {

        instance.geometry = void 0
      }
    }

    if (
      mesh !== void 0 &&
      ( instanceMaterial !== material || instanceMesh !== mesh ) ) {

      let batch = batches.get( material )

      if ( batch === void 0 ) {

        console.log( 'batch created' )

        const threeMaterial = new MeshPhysicalMaterial()

        threeMaterial.metalness = material.metalness ?? threeMaterial.metalness
        threeMaterial.roughness = material.roughness ?? threeMaterial.roughness

        const ior = material.ior

        const baseColor = material.baseColor

        const materialAlpha = baseColor[ 3 ]

        threeMaterial.side = material.doubleSided ? DoubleSide : FrontSide

        if ( material.blend !== BlendMode.OPAQUE && materialAlpha < 1.0 ) {

          threeMaterial.transparent        = true
          threeMaterial.opacity            = materialAlpha
          threeMaterial.premultipliedAlpha = true
          threeMaterial.depthWrite         = false
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

        threeMaterial.color.setRGB(
            baseColor[ 0 ] / baseColor[ 3 ],
            baseColor[ 1 ] / baseColor[ 3 ],
            baseColor[ 2 ] / baseColor[ 3 ],
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

        // eslint-disable-next-line no-magic-numbers
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
        const instanceID = batchMesh.addInstance( batchGeometry.geometryID! )

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
   */
  constructor(
    public readonly mesh: CanonicalMesh,
    public readonly geometry: BufferGeometry ) {}

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
