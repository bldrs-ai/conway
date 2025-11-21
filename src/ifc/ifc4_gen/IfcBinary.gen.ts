
/* This is generated code, don't alter */

import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'


///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcbinary.htm */
export class IfcBinary extends StepEntityBase< EntityTypesIfc > {    
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBINARY
  }

  private Value_? : [Uint8Array, number];

  public get Value() : [Uint8Array, number] {
    if ( this.Value_ === void 0 ) {
      this.Value_ = this.extractBinary( 0, 0, 0, false )
    }

    return this.Value_ as [Uint8Array, number]
  }

  constructor(
      localID: number,
      internalReference: StepEntityInternalReference< EntityTypesIfc >,
      model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
      multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {
     super( localID, internalReference, model )
  }

  public static readonly query =
    [ EntityTypesIfc.IFCBINARY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBINARY
}
