
import { IfcElementComponentType } from "./index"
import { IfcDiscreteAccessoryTypeEnum, IfcDiscreteAccessoryTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdiscreteaccessorytype.htm */
export  class IfcDiscreteAccessoryType extends IfcElementComponentType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDISCRETEACCESSORYTYPE
  }
  private PredefinedType_? : IfcDiscreteAccessoryTypeEnum

  public get PredefinedType() : IfcDiscreteAccessoryTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcDiscreteAccessoryTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcDiscreteAccessoryTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDISCRETEACCESSORYTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDISCRETEACCESSORYTYPE
}
