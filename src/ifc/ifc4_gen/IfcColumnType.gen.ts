
import { IfcBuildingElementType } from "./index"
import { IfcColumnTypeEnum, IfcColumnTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccolumntype.htm */
export  class IfcColumnType extends IfcBuildingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOLUMNTYPE
  }
  private PredefinedType_? : IfcColumnTypeEnum

  public get PredefinedType() : IfcColumnTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcColumnTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcColumnTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOLUMNTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOLUMNTYPE
}
