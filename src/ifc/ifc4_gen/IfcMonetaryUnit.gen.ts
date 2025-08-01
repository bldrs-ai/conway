
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmonetaryunit.htm */
export  class IfcMonetaryUnit extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMONETARYUNIT
  }
  private Currency_? : string

  public get Currency() : string {
    if ( this.Currency_ === void 0 ) {
      this.Currency_ = this.extractString( 0, 0, 0, false )
    }

    return this.Currency_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMONETARYUNIT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMONETARYUNIT
}
