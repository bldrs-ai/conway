
import { IfcBuiltElement } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcDoorTypeEnum, IfcDoorTypeEnumDeserializeStep } from "./index"
import { IfcDoorTypeOperationEnum, IfcDoorTypeOperationEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDoor extends IfcBuiltElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDOOR
  }
  private OverallHeight_? : number | null
  private OverallWidth_? : number | null
  private PredefinedType_? : IfcDoorTypeEnum | null
  private OperationType_? : IfcDoorTypeOperationEnum | null
  private UserDefinedOperationType_? : string | null

  public get OverallHeight() : number | null {
    if ( this.OverallHeight_ === void 0 ) {
      this.OverallHeight_ = this.extractNumber( 8, 8, 6, true )
    }

    return this.OverallHeight_ as number | null
  }

  public get OverallWidth() : number | null {
    if ( this.OverallWidth_ === void 0 ) {
      this.OverallWidth_ = this.extractNumber( 9, 8, 6, true )
    }

    return this.OverallWidth_ as number | null
  }

  public get PredefinedType() : IfcDoorTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 10, 8, 6, IfcDoorTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcDoorTypeEnum | null
  }

  public get OperationType() : IfcDoorTypeOperationEnum | null {
    if ( this.OperationType_ === void 0 ) {
      this.OperationType_ = this.extractLambda( 11, 8, 6, IfcDoorTypeOperationEnumDeserializeStep, true )
    }

    return this.OperationType_ as IfcDoorTypeOperationEnum | null
  }

  public get UserDefinedOperationType() : string | null {
    if ( this.UserDefinedOperationType_ === void 0 ) {
      this.UserDefinedOperationType_ = this.extractString( 12, 8, 6, true )
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
        multiReference.find( ( item ) => item.typeID === IfcDoor.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDoor" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDOOR ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDOOR
}
