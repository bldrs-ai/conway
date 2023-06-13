
/* This is generated code, don't alter */

import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'


///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstrippedoptional.htm */
export class IfcStrippedOptional extends StepEntityBase< EntityTypesIfc > {    
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRIPPEDOPTIONAL
  }

  private Value_? : boolean;

  public get Value() : boolean {
    if ( this.Value_ === void 0 ) {
      this.Value_ = this.extractBoolean( 0, false )
    }

    return this.Value_ as boolean
  }

  constructor(
      localID: number,
      internalReference: StepEntityInternalReference< EntityTypesIfc >,
      model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
     super( localID, internalReference, model )
  }

  public static readonly query =
    [ EntityTypesIfc.IFCSTRIPPEDOPTIONAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRIPPEDOPTIONAL
}
