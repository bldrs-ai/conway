 
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
   *
   * @param model The model this is from
   * @param isVoid
   */
  constructor( public readonly model: IfcStepModel, public readonly isVoid: boolean = false ) {

    // So a budget enabled after extraction has started can seed from what
    // this already holds — see GeometryResidency.setBudgetBytes.
    model.geometryResidency.registerStore( this )
  }

  /**
   * Get the number of items in this.
   *
   * @return {number}
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

        const isLastReference =
          this.model.geometryResidency.releaseReference( this, key )

        if (value.type === CanonicalMeshType.BUFFER_GEOMETRY && isLastReference) {

          value.geometry.delete()
        }
      }
    }
  }

  /**
   * Add a mesh to the geometry cache.
   *
   * Builds the native float vertex mirror at add time (one GetVertexData
   * call), for two reasons that used to be one.
   *
   * The surviving reason is accounting: `noteAdded` below charges the
   * residency `getAllocationSize()`, which counts the float mirror among
   * the native's bytes. Reifying first means a geometry is charged what it
   * will actually cost, once, for its whole life — the budget does not
   * then drift as consumers read.
   *
   * The reason that is GONE, and the note is here because the old comment
   * asserted the opposite: this used to double as a deliberate FREEZE.
   * Centering (`Geometry::Normalize()`) shifts the f64 vertices but, on
   * the pinned wasm, returns a dead (0,0,0) instead of the centre, so the
   * compat layer's emitted transform never carried the shift — and a
   * consumer that first read floats after the shift got shifted vertices
   * against an unshifted transform, i.e. Share's demand-path "scatter".
   * Keeping every path on creation-frame floats made all of them
   * consistently wrong in a way that cancelled.
   *
   * `compat/web-ifc/geometry_recentre.ts` removed the premise: it measures
   * the shift `Normalize()` will not report, puts it in the transform, and
   * calls `clearReification()` so the mirror is rebuilt from the shifted
   * vertices. Refreshing the mirror after centering is now REQUIRED — it
   * is what keeps a georeferenced model's vertices off 2.6e6 m, where a
   * float32 ULP is 0.25 m (Share#1634). Do not reinstate the freeze.
   *
   * @param mesh
   */
  public add(mesh: CanonicalMesh) {

    if (mesh.type === CanonicalMeshType.BUFFER_GEOMETRY) {
      mesh.geometry.GetVertexData()
    }

    this.meshes_.set(mesh.localID, mesh)
    this.model.geometryResidency.noteAdded( this, mesh )
  }

  /**
   * Drop the mesh for a particular local ID
   *
   * @param localID The local ID of the item to delete.
   */
  public delete(localID: number) {

    const value = this.meshes_.get(localID)

    if (value !== void 0) {

      this.meshes_.delete(localID)

      // Freeing the native is the residency's call, not ours: a native can be
      // cached under more than one local ID (6 % of D3D's), and freeing one
      // entry's copy leaves its siblings pointing at freed memory with no
      // diagnostic until something reads them. releaseReference returns true
      // for the last reference — and unconditionally when no budget is
      // configured, which is exactly the behaviour this had before.
      const isLastReference =
        this.model.geometryResidency.releaseReference( this, localID )

      if (value.type === CanonicalMeshType.BUFFER_GEOMETRY && isLastReference) {

        value.geometry.delete()
      }
    }
  }

  /**
   * Get an mesh by its matching local ID.
   *
   * @param localID
   * @return {CanonicalMesh | undefined}
   */
  public getByLocalID(localID: number): CanonicalMesh | undefined {

    // Recency for the residency budget. Gated inside noteUsed on whether a
    // budget is configured at all, because this is the scene walk's hot path.
    this.model.geometryResidency.noteUsed( this, localID )

    return this.meshes_.get(localID)
  }

  /**
   * Allows iteration through this.
   *
   * @return {IterableIterator}
   */
  public [Symbol.iterator](): IterableIterator<CanonicalMesh> {
    return this.meshes_.values()
  }

  /**
   * Calculate the size of the geometry data in this.
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

  /**
   * Get the OBJs for all the curves in the cache (lazily)
   *
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

