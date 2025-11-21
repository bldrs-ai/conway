
import { IfcParameterizedProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrectangleprofiledef.htm */
export  class IfcRectangleProfileDef extends IfcParameterizedProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRECTANGLEPROFILEDEF
  }
  private XDim_? : number
  private YDim_? : number

  public get XDim() : number {
    if ( this.XDim_ === void 0 ) {
      this.XDim_ = this.extractNumber( 3, 3, 2, false )
    }

    return this.XDim_ as number
  }

  public get YDim() : number {
    if ( this.YDim_ === void 0 ) {
      this.YDim_ = this.extractNumber( 4, 3, 2, false )
    }

    return this.YDim_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRECTANGLEPROFILEDEF, EntityTypesIfc.IFCRECTANGLEHOLLOWPROFILEDEF, EntityTypesIfc.IFCROUNDEDRECTANGLEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRECTANGLEPROFILEDEF
}
