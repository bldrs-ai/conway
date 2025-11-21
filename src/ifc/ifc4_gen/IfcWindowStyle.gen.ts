
import { IfcTypeProduct } from "./index"
import { IfcWindowStyleConstructionEnum, IfcWindowStyleConstructionEnumDeserializeStep } from "./index"
import { IfcWindowStyleOperationEnum, IfcWindowStyleOperationEnumDeserializeStep } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcwindowstyle.htm */
export  class IfcWindowStyle extends IfcTypeProduct {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCWINDOWSTYLE
  }
  private ConstructionType_? : IfcWindowStyleConstructionEnum
  private OperationType_? : IfcWindowStyleOperationEnum
  private ParameterTakesPrecedence_? : boolean
  private Sizeable_? : boolean

  public get ConstructionType() : IfcWindowStyleConstructionEnum {
    if ( this.ConstructionType_ === void 0 ) {
      this.ConstructionType_ = this.extractLambda( 8, 8, 4, IfcWindowStyleConstructionEnumDeserializeStep, false )
    }

    return this.ConstructionType_ as IfcWindowStyleConstructionEnum
  }

  public get OperationType() : IfcWindowStyleOperationEnum {
    if ( this.OperationType_ === void 0 ) {
      this.OperationType_ = this.extractLambda( 9, 8, 4, IfcWindowStyleOperationEnumDeserializeStep, false )
    }

    return this.OperationType_ as IfcWindowStyleOperationEnum
  }

  public get ParameterTakesPrecedence() : boolean {
    if ( this.ParameterTakesPrecedence_ === void 0 ) {
      this.ParameterTakesPrecedence_ = this.extractBoolean( 10, 8, 4, false )
    }

    return this.ParameterTakesPrecedence_ as boolean
  }

  public get Sizeable() : boolean {
    if ( this.Sizeable_ === void 0 ) {
      this.Sizeable_ = this.extractBoolean( 11, 8, 4, false )
    }

    return this.Sizeable_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCWINDOWSTYLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCWINDOWSTYLE
}
