
import { IfcBuiltElementType } from "./index"
import { IfcWindowTypeEnum, IfcWindowTypeEnumDeserializeStep } from "./index"
import { IfcWindowTypePartitioningEnum, IfcWindowTypePartitioningEnumDeserializeStep } from "./index"
import { IfcBoolean } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcWindowType extends IfcBuiltElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCWINDOWTYPE
  }
  private PredefinedType_? : IfcWindowTypeEnum
  private PartitioningType_? : IfcWindowTypePartitioningEnum
  private ParameterTakesPrecedence_? : boolean | null
  private UserDefinedPartitioningType_? : string | null

  public get PredefinedType() : IfcWindowTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcWindowTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcWindowTypeEnum
  }

  public get PartitioningType() : IfcWindowTypePartitioningEnum {
    if ( this.PartitioningType_ === void 0 ) {
      this.PartitioningType_ = this.extractLambda( 10, 9, 6, IfcWindowTypePartitioningEnumDeserializeStep, false )
    }

    return this.PartitioningType_ as IfcWindowTypePartitioningEnum
  }

  public get ParameterTakesPrecedence() : boolean | null {
    if ( this.ParameterTakesPrecedence_ === void 0 ) {
      this.ParameterTakesPrecedence_ = this.extractBoolean( 11, 9, 6, true )
    }

    return this.ParameterTakesPrecedence_ as boolean | null
  }

  public get UserDefinedPartitioningType() : string | null {
    if ( this.UserDefinedPartitioningType_ === void 0 ) {
      this.UserDefinedPartitioningType_ = this.extractString( 12, 9, 6, true )
    }

    return this.UserDefinedPartitioningType_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcWindowType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcWindowType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCWINDOWTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCWINDOWTYPE
}
