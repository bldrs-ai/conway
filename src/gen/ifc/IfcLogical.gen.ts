
/* This is generated code, don't alter */

import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'


///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclogical.htm */
export class IfcLogical extends StepEntityBase< EntityTypesIfc > {    
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLOGICAL
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
    [ EntityTypesIfc.IFCLOGICAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLOGICAL
}
