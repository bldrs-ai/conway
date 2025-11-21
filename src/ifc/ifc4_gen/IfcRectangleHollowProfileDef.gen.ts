
import { IfcRectangleProfileDef } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrectanglehollowprofiledef.htm */
export  class IfcRectangleHollowProfileDef extends IfcRectangleProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRECTANGLEHOLLOWPROFILEDEF
  }
  private WallThickness_? : number
  private InnerFilletRadius_? : number | null
  private OuterFilletRadius_? : number | null

  public get WallThickness() : number {
    if ( this.WallThickness_ === void 0 ) {
      this.WallThickness_ = this.extractNumber( 5, 5, 3, false )
    }

    return this.WallThickness_ as number
  }

  public get InnerFilletRadius() : number | null {
    if ( this.InnerFilletRadius_ === void 0 ) {
      this.InnerFilletRadius_ = this.extractNumber( 6, 5, 3, true )
    }

    return this.InnerFilletRadius_ as number | null
  }

  public get OuterFilletRadius() : number | null {
    if ( this.OuterFilletRadius_ === void 0 ) {
      this.OuterFilletRadius_ = this.extractNumber( 7, 5, 3, true )
    }

    return this.OuterFilletRadius_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRECTANGLEHOLLOWPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRECTANGLEHOLLOWPROFILEDEF
}
