
import { IfcArbitraryOpenProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccenterlineprofiledef.htm */
export  class IfcCenterLineProfileDef extends IfcArbitraryOpenProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCENTERLINEPROFILEDEF
  }
  private Thickness_? : number

  public get Thickness() : number {
    if ( this.Thickness_ === void 0 ) {
      this.Thickness_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.Thickness_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCENTERLINEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCENTERLINEPROFILEDEF
}
