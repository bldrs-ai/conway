
/* This is generated code, don't alter */

import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'


///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctextdecoration.htm */
export class IfcTextDecoration extends StepEntityBase< EntityTypesIfc > {    
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTEXTDECORATION
  }

  private Value_? : string;

  public get Value() : string {
    if ( this.Value_ === void 0 ) {
      this.Value_ = this.extractString( 0, false )
    }

    return this.Value_ as string
  }

  constructor(
      localID: number,
      internalReference: StepEntityInternalReference< EntityTypesIfc >,
      model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
     super( localID, internalReference, model )
  }

  public static readonly query =
    [ EntityTypesIfc.IFCTEXTDECORATION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTEXTDECORATION
}
