
import { IfcElementType } from "./index"
import { IfcElementAssemblyTypeEnum, IfcElementAssemblyTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelementassemblytype.htm */
export  class IfcElementAssemblyType extends IfcElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELEMENTASSEMBLYTYPE
  }
  private PredefinedType_? : IfcElementAssemblyTypeEnum

  public get PredefinedType() : IfcElementAssemblyTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, IfcElementAssemblyTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcElementAssemblyTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELEMENTASSEMBLYTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELEMENTASSEMBLYTYPE
}
