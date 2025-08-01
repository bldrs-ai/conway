
import { IfcTypeProduct } from "./index"
import { IfcDoorStyleOperationEnum, IfcDoorStyleOperationEnumDeserializeStep } from "./index"
import { IfcDoorStyleConstructionEnum, IfcDoorStyleConstructionEnumDeserializeStep } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdoorstyle.htm */
export  class IfcDoorStyle extends IfcTypeProduct {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDOORSTYLE
  }
  private OperationType_? : IfcDoorStyleOperationEnum
  private ConstructionType_? : IfcDoorStyleConstructionEnum
  private ParameterTakesPrecedence_? : boolean
  private Sizeable_? : boolean

  public get OperationType() : IfcDoorStyleOperationEnum {
    if ( this.OperationType_ === void 0 ) {
      this.OperationType_ = this.extractLambda( 8, 8, 4, IfcDoorStyleOperationEnumDeserializeStep, false )
    }

    return this.OperationType_ as IfcDoorStyleOperationEnum
  }

  public get ConstructionType() : IfcDoorStyleConstructionEnum {
    if ( this.ConstructionType_ === void 0 ) {
      this.ConstructionType_ = this.extractLambda( 9, 8, 4, IfcDoorStyleConstructionEnumDeserializeStep, false )
    }

    return this.ConstructionType_ as IfcDoorStyleConstructionEnum
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
    [ EntityTypesIfc.IFCDOORSTYLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDOORSTYLE
}
