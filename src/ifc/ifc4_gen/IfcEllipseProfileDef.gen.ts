
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcellipseprofiledef.htm */
export  class IfcEllipseProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELLIPSEPROFILEDEF
  }
  private SemiAxis1_? : number
  private SemiAxis2_? : number

  public get SemiAxis1() : number {
    if ( this.SemiAxis1_ === void 0 ) {
      this.SemiAxis1_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.SemiAxis1_ as number
  }

  public get SemiAxis2() : number {
    if ( this.SemiAxis2_ === void 0 ) {
      this.SemiAxis2_ = this.extractNumber( 4, 3, 2, false )
    }

    return this.SemiAxis2_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELLIPSEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELLIPSEPROFILEDEF
}
