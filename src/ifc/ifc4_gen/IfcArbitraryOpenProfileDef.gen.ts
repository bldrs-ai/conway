
import { IfcProfileDef } from "./index"
import { IfcBoundedCurve } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcarbitraryopenprofiledef.htm */
export  class IfcArbitraryOpenProfileDef extends IfcProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCARBITRARYOPENPROFILEDEF
  }
  private Curve_? : IfcBoundedCurve

  public get Curve() : IfcBoundedCurve {
    if ( this.Curve_ === void 0 ) {
      this.Curve_ = this.extractElement( 2, 2, 1, false, IfcBoundedCurve )
    }

    return this.Curve_ as IfcBoundedCurve
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCARBITRARYOPENPROFILEDEF, EntityTypesIfc.IFCCENTERLINEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCARBITRARYOPENPROFILEDEF
}
