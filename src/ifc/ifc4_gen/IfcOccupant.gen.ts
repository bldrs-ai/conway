
import { IfcActor } from "./index"
import { IfcOccupantTypeEnum, IfcOccupantTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcoccupant.htm */
export  class IfcOccupant extends IfcActor {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCOCCUPANT
  }
  private PredefinedType_? : IfcOccupantTypeEnum | null

  public get PredefinedType() : IfcOccupantTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 6, 6, 4, IfcOccupantTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcOccupantTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCOCCUPANT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCOCCUPANT
}
