
import { IfcCircleProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccirclehollowprofiledef.htm */
export  class IfcCircleHollowProfileDef extends IfcCircleProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCIRCLEHOLLOWPROFILEDEF
  }
  private WallThickness_? : number

  public get WallThickness() : number {
    if ( this.WallThickness_ === void 0 ) {
      this.WallThickness_ = this.extractNumber( 4, 4, 3, false )
    }

    return this.WallThickness_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCIRCLEHOLLOWPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCIRCLEHOLLOWPROFILEDEF
}
