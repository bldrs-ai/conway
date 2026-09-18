
import { IfcControl } from "./index"
import { IfcProjectOrderTypeEnum, IfcProjectOrderTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcProjectOrder extends IfcControl {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPROJECTORDER
  }
  private PredefinedType_? : IfcProjectOrderTypeEnum | null
  private Status_? : string | null
  private LongDescription_? : string | null

  public get PredefinedType() : IfcProjectOrderTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 6, 6, 4, IfcProjectOrderTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcProjectOrderTypeEnum | null
  }

  public get Status() : string | null {
    if ( this.Status_ === void 0 ) {
      this.Status_ = this.extractString( 7, 6, 4, true )
    }

    return this.Status_ as string | null
  }

  public get LongDescription() : string | null {
    if ( this.LongDescription_ === void 0 ) {
      this.LongDescription_ = this.extractString( 8, 6, 4, true )
    }

    return this.LongDescription_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcProjectOrder.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcProjectOrder" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPROJECTORDER ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPROJECTORDER
}
