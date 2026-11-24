
import { IfcBuiltElementType } from "./index"
import { IfcDoorTypeEnum, IfcDoorTypeEnumDeserializeStep } from "./index"
import { IfcDoorTypeOperationEnum, IfcDoorTypeOperationEnumDeserializeStep } from "./index"
import { IfcBoolean } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDoorType extends IfcBuiltElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDOORTYPE
  }
  private PredefinedType_? : IfcDoorTypeEnum
  private OperationType_? : IfcDoorTypeOperationEnum
  private ParameterTakesPrecedence_? : boolean | null
  private UserDefinedOperationType_? : string | null

  public get PredefinedType() : IfcDoorTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcDoorTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcDoorTypeEnum
  }

  public get OperationType() : IfcDoorTypeOperationEnum {
    if ( this.OperationType_ === void 0 ) {
      this.OperationType_ = this.extractLambda( 10, 9, 6, IfcDoorTypeOperationEnumDeserializeStep, false )
    }

    return this.OperationType_ as IfcDoorTypeOperationEnum
  }

  public get ParameterTakesPrecedence() : boolean | null {
    if ( this.ParameterTakesPrecedence_ === void 0 ) {
      this.ParameterTakesPrecedence_ = this.extractBoolean( 11, 9, 6, true )
    }

    return this.ParameterTakesPrecedence_ as boolean | null
  }

  public get UserDefinedOperationType() : string | null {
    if ( this.UserDefinedOperationType_ === void 0 ) {
      this.UserDefinedOperationType_ = this.extractString( 12, 9, 6, true )
    }

    return this.UserDefinedOperationType_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDoorType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDoorType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDOORTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDOORTYPE
}
