
import { IfcSweptAreaSolid } from "./index"
import { IfcDirection } from "./index"
import { IfcPositiveLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcextrudedareasolid.htm */
export  class IfcExtrudedAreaSolid extends IfcSweptAreaSolid {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEXTRUDEDAREASOLID
  }
  private ExtrudedDirection_? : IfcDirection
  private Depth_? : number

  public get ExtrudedDirection() : IfcDirection {
    if ( this.ExtrudedDirection_ === void 0 ) {
      this.ExtrudedDirection_ = this.extractElement( 2, 2, 4, false, IfcDirection )
    }

    return this.ExtrudedDirection_ as IfcDirection
  }

  public get Depth() : number {
    if ( this.Depth_ === void 0 ) {
      this.Depth_ = this.extractNumber( 3, 2, 4, false )
    }

    return this.Depth_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCEXTRUDEDAREASOLID, EntityTypesIfc.IFCEXTRUDEDAREASOLIDTAPERED ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEXTRUDEDAREASOLID
}
