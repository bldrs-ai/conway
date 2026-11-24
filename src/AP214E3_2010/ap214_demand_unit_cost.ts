import {
  connected_face_set,
  manifold_solid_brep,
  mapped_item,
  representation,
  representation_item,
  shell_based_surface_model,
} from './AP214E3_2010_gen/index'


/**
 * A cheap, pre-tessellation estimate of what one demand unit will cost:
 * the number of topological faces under it.
 *
 * It exists for the parse-time preview channel, whose ticks run under a
 * hard time budget but cannot preempt a unit once it starts. A STEP unit's
 * cost is wildly uneven: the PCB of the 14 MB pinball driver board is one
 * unit and tessellates in ~1.0 s in Node, its neighbours in 20–30 ms. Run
 * blind, that one unit stalled the parse it was meant to interleave with
 * for 0.8 s. Counting faces BEFORE running lets the channel pass over a
 * unit the budget cannot afford; the durable pump renders it as usual.
 *
 * Faces, not bytes or items: tessellation cost is per face (each face is
 * trimmed and triangulated on its own), while an item is anything from a
 * placement to a 1,000-face brep. The count reads list LENGTHS straight
 * off the record bytes ({@link StepEntityBase.forEachReferenceInField})
 * and never materializes a face entity, so estimating a unit the channel
 * then skips leaves no face objects behind on the throwaway prefix model.
 *
 * An estimate, not a measure: it ignores how hard each face is (a planar
 * quad and a B-spline patch count alike) and the voids of a
 * brep_with_voids. The channel converts faces to milliseconds with a rate
 * it learns from the units it does run.
 */
export class AP214DemandUnitCost {

  private readonly facesByItem_ = new Map<number, number>()

  private readonly facesByRepresentation_ = new Map<number, number>()

  /**
   * Faces under a range of a representation's items.
   *
   * @param rep The representation.
   * @param itemStart First item (inclusive); 0 when absent.
   * @param itemEnd Last item (exclusive); the whole list when absent.
   * @return {number} The estimated face count.
   */
  public representationFaces(
      rep: representation,
      itemStart?: number,
      itemEnd?: number ): number {

    const whole = itemStart === void 0 && itemEnd === void 0

    if ( whole ) {
      const memoized = this.facesByRepresentation_.get( rep.localID )

      if ( memoized !== void 0 ) {
        return memoized
      }
    }

    // Reserved first, so a mapped_item that reaches its own representation
    // again (a malformed file) counts the cycle as nothing rather than
    // recursing forever.
    if ( whole ) {
      this.facesByRepresentation_.set( rep.localID, 0 )
    }

    let items: representation_item[]

    try {
      items = rep.items
    } catch {
      // A truncated prefix or a mistyped item: the thunk reports it when the
      // unit runs; as a cost it is nothing.
      return 0
    }

    const end = Math.min( itemEnd ?? items.length, items.length )
    let faces = 0

    for ( let where = itemStart ?? 0; where < end; ++where ) {
      faces += this.itemFaces( items[ where ] )
    }

    if ( whole ) {
      this.facesByRepresentation_.set( rep.localID, faces )
    }

    return faces
  }

  /**
   * Faces under one representation item.
   *
   * @param item The item.
   * @return {number} The estimated face count (0 for anything that is not
   * a shell, a brep, a shell-based surface model or a mapped item).
   */
  public itemFaces( item: representation_item ): number {

    const memoized = this.facesByItem_.get( item.localID )

    if ( memoized !== void 0 ) {
      return memoized
    }

    let faces = 0

    try {
      if ( item instanceof manifold_solid_brep ) {
        faces = shellFaces( item.outer )
      } else if ( item instanceof shell_based_surface_model ) {
        for ( const shell of item.sbsm_boundary ) {
          faces += shellFaces( shell )
        }
      } else if ( item instanceof connected_face_set ) {
        faces = shellFaces( item )
      } else if ( item instanceof mapped_item ) {
        faces = this.representationFaces( item.mapping_source.mapped_representation )
      }
    } catch {
      // Dangling or mistyped reference (prefix truncation) — nothing to
      // estimate, and the unit's own run reports it.
      faces = 0
    }

    this.facesByItem_.set( item.localID, faces )

    return faces
  }
}

/**
 * The length of a shell's face list, read off its record without
 * resolving a face.
 *
 * `(1, 1, 2)` is the vtable address the generated
 * `connected_face_set.cfs_faces` getter reads (connected_face_set.gen.ts);
 * closed_shell and open_shell inherit that field unchanged. A
 * regeneration that moved it would make this count something else, which
 * ap214_demand_unit_cost.test.ts checks against the getter.
 *
 * @param shell The shell.
 * @return {number} Its face count.
 */
function shellFaces( shell: connected_face_set ): number {

  let faces = 0

  // eslint-disable-next-line no-magic-numbers
  shell.forEachReferenceInField( 1, 1, 2, () => {
    ++faces
    return true
  } )

  return faces
}
