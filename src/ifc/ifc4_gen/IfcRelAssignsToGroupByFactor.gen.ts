
import { IfcRelAssignsToGroup } from "./index"
import { IfcRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelassignstogroupbyfactor.htm */
export  class IfcRelAssignsToGroupByFactor extends IfcRelAssignsToGroup {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELASSIGNSTOGROUPBYFACTOR
  }
  private Factor_? : number

  public get Factor() : number {
    if ( this.Factor_ === void 0 ) {
      this.Factor_ = this.extractNumber( 7, 7, 4, false )
    }

    return this.Factor_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELASSIGNSTOGROUPBYFACTOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELASSIGNSTOGROUPBYFACTOR
}
