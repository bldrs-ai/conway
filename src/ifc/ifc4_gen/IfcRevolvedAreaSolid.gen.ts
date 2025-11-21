
import { IfcSweptAreaSolid } from "./index"
import { IfcAxis1Placement } from "./index"
import { IfcPlaneAngleMeasure } from "./index"
import { IfcLine } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrevolvedareasolid.htm */
export  class IfcRevolvedAreaSolid extends IfcSweptAreaSolid {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREVOLVEDAREASOLID
  }
  private Axis_? : IfcAxis1Placement
  private Angle_? : number

  public get Axis() : IfcAxis1Placement {
    if ( this.Axis_ === void 0 ) {
      this.Axis_ = this.extractElement( 2, 2, 4, false, IfcAxis1Placement )
    }

    return this.Axis_ as IfcAxis1Placement
  }

  public get Angle() : number {
    if ( this.Angle_ === void 0 ) {
      this.Angle_ = this.extractNumber( 3, 2, 4, false )
    }

    return this.Angle_ as number
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREVOLVEDAREASOLID, EntityTypesIfc.IFCREVOLVEDAREASOLIDTAPERED ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREVOLVEDAREASOLID
}
