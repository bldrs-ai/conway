
import { IfcSegment } from "./index"
import { IfcBoolean } from "./index"
import { IfcCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCompositeCurveSegment extends IfcSegment {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCOMPOSITECURVESEGMENT
  }
  private SameSense_? : boolean
  private ParentCurve_? : IfcCurve

  public get SameSense() : boolean {
    if ( this.SameSense_ === void 0 ) {
      this.SameSense_ = this.extractBoolean( 1, 1, 3, false )
    }

    return this.SameSense_ as boolean
  }

  public get ParentCurve() : IfcCurve {
    if ( this.ParentCurve_ === void 0 ) {
      this.ParentCurve_ = this.extractElement( 2, 1, 3, false, IfcCurve )
    }

    return this.ParentCurve_ as IfcCurve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCompositeCurveSegment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCompositeCurveSegment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCOMPOSITECURVESEGMENT, EntityTypesIfc4x3.IFCREPARAMETRISEDCOMPOSITECURVESEGMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCOMPOSITECURVESEGMENT
}
