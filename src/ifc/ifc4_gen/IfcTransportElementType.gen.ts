
import { IfcElementType } from "./index"
import { IfcTransportElementTypeEnum, IfcTransportElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctransportelementtype.htm */
export  class IfcTransportElementType extends IfcElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTRANSPORTELEMENTTYPE
  }
  private PredefinedType_? : IfcTransportElementTypeEnum

  public get PredefinedType() : IfcTransportElementTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 5, IfcTransportElementTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcTransportElementTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTRANSPORTELEMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTRANSPORTELEMENTTYPE
}
