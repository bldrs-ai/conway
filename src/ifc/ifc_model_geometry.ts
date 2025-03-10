 
import { CanonicalMesh, CanonicalMeshType } from '../core/canonical_mesh'
import { ModelGeometry } from '../core/model'
import IfcStepModel from './ifc_step_model'
import { IfcBooleanResult, IfcGeometricRepresentationItem } from './ifc4_gen'
import { CanonicalMaterial, getMTLCleanName } from '../core/canonical_material'


/**
 * Geometry for an IFC model.
 */
export class IfcModelGeometry implements ModelGeometry {

  private readonly meshes_ = new Map<number, CanonicalMesh>()

  /**
   * Construct this with an IFC step model.
   * @param model The model this is from
   * @param isVoid
   */
  constructor( public readonly model: IfcStepModel, public readonly isVoid: boolean = false ) {}

  /**
   * @returns
   */
  get length(): number {
    return this.meshes_.size
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
   *
   * @param mesh
   */
  public add(mesh: CanonicalMesh) {

    this.meshes_.set(mesh.localID, mesh)
  }

  /**
   * Drop the mesh for a particular local ID
   * @param localID The local ID of the item to delete.
   */
  public delete(localID: number) {

    const value = this.meshes_.get(localID)

    if (value !== void 0) {

      this.meshes_.delete(localID)

      if (value.type === CanonicalMeshType.BUFFER_GEOMETRY) {

        value.geometry.delete()
      }
    }
  }

  /**
   *
   * @param localID
   * @returns
   */
  public getByLocalID(localID: number): CanonicalMesh | undefined {
    return this.meshes_.get(localID)
  }

  /**
   *
   * @returns
   */
  public [Symbol.iterator](): IterableIterator<CanonicalMesh> {
    return this.meshes_.values()
  }

  /**
   *
   * @returns - size of the geometry data
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

  /**
   * Get the OBJs for all the curves in the cache (lazily)
   * @yields {[IfcGeometricRepresentationItem, string]} Curves with their matching OBJ as a string
   */
  public* objs() : IterableIterator< [
    IfcGeometricRepresentationItem,
    string,
    CanonicalMaterial,
    string] | [
    IfcGeometricRepresentationItem,
    string,
    undefined,
    undefined]> {

    const model = this.model

    for ( const [localID, mesh] of this.meshes_ ) {

      const geometryItem = model.getElementByLocalID( localID )

      if ( !( geometryItem instanceof IfcGeometricRepresentationItem ) ) {
        continue
      }

      if ( mesh.type !== CanonicalMeshType.BUFFER_GEOMETRY ) {
        continue
      }

      let preamble = `# Mesh for ${geometryItem.toString()}\n`

      if ( geometryItem instanceof IfcBooleanResult ) {

        const firstOperand = geometryItem.FirstOperand.toString()
        const secondOperand = geometryItem.SecondOperand.toString()

        preamble += `# IfcBooleanResult ${firstOperand} ${secondOperand}\n`
      }

      const materials = this.isVoid ? this.model.voidMaterials : this.model.materials

      const geometryMaterial = materials.getMaterialByGeometryID( localID )

      if ( geometryMaterial !== void 0 ) {

        const materialObject = this.model.getElementByLocalID( geometryMaterial[ 1 ] )

        if ( materialObject !== void 0 ) {

          const materialName = `${geometryItem.expressID!}_${materialObject.expressID!}.mtl`

          preamble += `mtllib ${materialName}\n`
          preamble += `usemtl ${getMTLCleanName( geometryMaterial[ 0 ] )}\n`

          const objFileContents = mesh.geometry.dumpToOBJ( preamble )

          yield [geometryItem, objFileContents, geometryMaterial[ 0 ], materialName]

        }
      }

      const objFileContents = mesh.geometry.dumpToOBJ( preamble )

      yield [geometryItem, objFileContents, undefined, undefined]
    }
  }
}

