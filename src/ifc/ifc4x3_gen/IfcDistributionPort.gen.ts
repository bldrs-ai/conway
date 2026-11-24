
import { IfcPort } from "./index"
import { IfcFlowDirectionEnum, IfcFlowDirectionEnumDeserializeStep } from "./index"
import { IfcDistributionPortTypeEnum, IfcDistributionPortTypeEnumDeserializeStep } from "./index"
import { IfcDistributionSystemEnum, IfcDistributionSystemEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDistributionPort extends IfcPort {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDISTRIBUTIONPORT
  }
  private FlowDirection_? : IfcFlowDirectionEnum | null
  private PredefinedType_? : IfcDistributionPortTypeEnum | null
  private SystemType_? : IfcDistributionSystemEnum | null

  public get FlowDirection() : IfcFlowDirectionEnum | null {
    if ( this.FlowDirection_ === void 0 ) {
      this.FlowDirection_ = this.extractLambda( 7, 7, 5, IfcFlowDirectionEnumDeserializeStep, true )
    }

    return this.FlowDirection_ as IfcFlowDirectionEnum | null
  }

  public get PredefinedType() : IfcDistributionPortTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 7, 5, IfcDistributionPortTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcDistributionPortTypeEnum | null
  }

  public get SystemType() : IfcDistributionSystemEnum | null {
    if ( this.SystemType_ === void 0 ) {
      this.SystemType_ = this.extractLambda( 9, 7, 5, IfcDistributionSystemEnumDeserializeStep, true )
    }

    return this.SystemType_ as IfcDistributionSystemEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDistributionPort.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDistributionPort" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDISTRIBUTIONPORT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDISTRIBUTIONPORT
}
