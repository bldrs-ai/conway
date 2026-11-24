
/* This is generated code, don't alter */

import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'


///**
// *  */
export class IfcIonConcentrationMeasure extends StepEntityBase< EntityTypesIfc4x3 > {    
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCIONCONCENTRATIONMEASURE
  }

  private Value_? : number;

  public get Value() : number {
    if ( this.Value_ === void 0 ) {
      this.Value_ = this.extractNumber( 0, 0, 0, false )
    }

    return this.Value_ as number
  }

  constructor(
      localID: number,
      internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
      model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
      multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {
     super( localID, internalReference, model )
  }

  public static readonly query =
    [ EntityTypesIfc4x3.IFCIONCONCENTRATIONMEASURE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCIONCONCENTRATIONMEASURE
}
