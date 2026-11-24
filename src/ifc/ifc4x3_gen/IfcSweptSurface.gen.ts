
import { IfcSurface } from "./index"
import { IfcProfileDef } from "./index"
import { IfcAxis2Placement3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcSweptSurface extends IfcSurface {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSWEPTSURFACE
  }
  private SweptCurve_? : IfcProfileDef
  private Position_? : IfcAxis2Placement3D | null

  public get SweptCurve() : IfcProfileDef {
    if ( this.SweptCurve_ === void 0 ) {
      this.SweptCurve_ = this.extractElement( 0, 0, 3, false, IfcProfileDef )
    }

    return this.SweptCurve_ as IfcProfileDef
  }

  public get Position() : IfcAxis2Placement3D | null {
    if ( this.Position_ === void 0 ) {
      this.Position_ = this.extractElement( 1, 0, 3, true, IfcAxis2Placement3D )
    }

    return this.Position_ as IfcAxis2Placement3D | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSweptSurface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSweptSurface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSURFACEOFLINEAREXTRUSION, EntityTypesIfc4x3.IFCSURFACEOFREVOLUTION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSWEPTSURFACE
}
