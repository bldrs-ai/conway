
/* This is generated code, don't alter */

import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'


///**
// *  */
export class presentable_text extends StepEntityBase< EntityTypesAP214 > {    
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.PRESENTABLE_TEXT
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
      internalReference: StepEntityInternalReference< EntityTypesAP214 >,
      model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > > ) {
     super( localID, internalReference, model )
  }

  public static readonly query =
    [ EntityTypesAP214.PRESENTABLE_TEXT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.PRESENTABLE_TEXT
}
