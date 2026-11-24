
import { IfcProfileDef } from "./index"
import { IfcCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcArbitraryClosedProfileDef extends IfcProfileDef {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCARBITRARYCLOSEDPROFILEDEF
  }
  private OuterCurve_? : IfcCurve

  public get OuterCurve() : IfcCurve {
    if ( this.OuterCurve_ === void 0 ) {
      this.OuterCurve_ = this.extractElement( 2, 2, 1, false, IfcCurve )
    }

    return this.OuterCurve_ as IfcCurve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcArbitraryClosedProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcArbitraryClosedProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCARBITRARYCLOSEDPROFILEDEF, EntityTypesIfc4x3.IFCARBITRARYPROFILEDEFWITHVOIDS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCARBITRARYCLOSEDPROFILEDEF
}
