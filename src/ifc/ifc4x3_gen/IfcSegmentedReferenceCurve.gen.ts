
import { IfcCompositeCurve } from "./index"
import { IfcBoundedCurve } from "./index"
import { IfcPlacement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSegmentedReferenceCurve extends IfcCompositeCurve {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSEGMENTEDREFERENCECURVE
  }
  private BaseCurve_? : IfcBoundedCurve
  private EndPoint_? : IfcPlacement | null

  public get BaseCurve() : IfcBoundedCurve {
    if ( this.BaseCurve_ === void 0 ) {
      this.BaseCurve_ = this.extractElement( 2, 2, 5, false, IfcBoundedCurve )
    }

    return this.BaseCurve_ as IfcBoundedCurve
  }

  public get EndPoint() : IfcPlacement | null {
    if ( this.EndPoint_ === void 0 ) {
      this.EndPoint_ = this.extractElement( 3, 2, 5, true, IfcPlacement )
    }

    return this.EndPoint_ as IfcPlacement | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSegmentedReferenceCurve.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSegmentedReferenceCurve" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSEGMENTEDREFERENCECURVE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSEGMENTEDREFERENCECURVE
}
