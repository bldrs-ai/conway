
import { IfcProfileDef } from "./index"
import { IfcCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcarbitraryclosedprofiledef.htm */
export  class IfcArbitraryClosedProfileDef extends IfcProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCARBITRARYCLOSEDPROFILEDEF
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCARBITRARYCLOSEDPROFILEDEF, EntityTypesIfc.IFCARBITRARYPROFILEDEFWITHVOIDS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCARBITRARYCLOSEDPROFILEDEF
}
