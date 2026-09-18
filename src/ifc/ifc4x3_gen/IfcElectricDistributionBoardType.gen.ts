
import { IfcFlowControllerType } from "./index"
import { IfcElectricDistributionBoardTypeEnum, IfcElectricDistributionBoardTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcElectricDistributionBoardType extends IfcFlowControllerType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCELECTRICDISTRIBUTIONBOARDTYPE
  }
  private PredefinedType_? : IfcElectricDistributionBoardTypeEnum

  public get PredefinedType() : IfcElectricDistributionBoardTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 8, IfcElectricDistributionBoardTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcElectricDistributionBoardTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcElectricDistributionBoardType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcElectricDistributionBoardType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCELECTRICDISTRIBUTIONBOARDTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCELECTRICDISTRIBUTIONBOARDTYPE
}
