import { CanonicalMesh, CanonicalMeshType } from '../core/canonical_mesh'
import { ModelGeometry } from '../core/model'


/**
 *
 */
export class AP214ModelGeometry implements ModelGeometry {

  private readonly meshes_ = new Map< number, CanonicalMesh >()
  private readonly children_ = new Map< number, number[] >()

  /**
   * @return {number}
   */
  get length(): number {
    return this.meshes_.size
  }

  /**
   * Add a mesh to this geometry collection.
   *
   * @param mesh
   * @param parentLocalID
   */
  public add( mesh: CanonicalMesh, parentLocalID? : number ): void {

    this.meshes_.set( mesh.localID, mesh )

    if ( parentLocalID !== void 0 ) {

      let children = this.children_.get( parentLocalID )

      if ( children === void 0 ) {

        children = []
        this.children_.set( parentLocalID, children )
      }

      children.push( mesh.localID )
    }
  }

  /**
   * Drop the mesh for a particular local ID
   *
   * @param localID The local ID of the item to delete.
   */
  public delete( localID: number ) {

    const value = this.meshes_.get( localID )

    if ( value !== void 0 ) {

      this.meshes_.delete( localID )

      if ( value.type === CanonicalMeshType.BUFFER_GEOMETRY ) {

        value.geometry.delete()
      }
    }
  }

  /**
   * Delete the temporaries from this.
   */
  public deleteTemporaries(): void {

    for ( const [key, value] of this.meshes_ ) {

      if ( value.temporary ) {

        this.meshes_.delete( key )

        if (value.type === CanonicalMeshType.BUFFER_GEOMETRY) {

          value.geometry.delete()
        }
      }
    }
  }

  /**
   * Get the geometry children for a particular local ID.
   * 
   * @param localID The local ID to get children for.
   * @return {number[] | undefined} The children local IDs, or undefined if there are none.
   */
  public getChildrenByLocalID(localID: number): number[] | undefined {
    return this.children_.get(localID)
  }

  /**
   *
   * @param localID
   * @return {CanonicalMesh | undefined}
   */
  public getByLocalID(localID: number): CanonicalMesh | undefined {
    return this.meshes_.get(localID)
  }

  /**
   *
   * @return {IterableIterator<CanonicalMesh>}
   */
  public [Symbol.iterator](): IterableIterator<CanonicalMesh> {
    return this.meshes_.values()
  }

  /**
   *
   * @return {number} - size of the geometry data
   */
  public calculateGeometrySize(): number {
    let size:number = 0

     
    for (const [_, mesh] of this.meshes_) {
      if (mesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {
        const geometryObject = mesh.geometry

        // using * 8 here because the points are being stored as doubles
         
        const pointsDataSize = geometryObject.GetVertexDataSize() * 8

         
        const indexDataSize = geometryObject.GetIndexDataSize() * 4
        size += pointsDataSize + indexDataSize
      }
    }

    return size
  }
}
