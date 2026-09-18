
import { IfcDistributionFlowElementType } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcFlowTerminalType extends IfcDistributionFlowElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCFLOWTERMINALTYPE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcFlowTerminalType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcFlowTerminalType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCAIRTERMINALTYPE, EntityTypesIfc4x3.IFCAUDIOVISUALAPPLIANCETYPE, EntityTypesIfc4x3.IFCCOMMUNICATIONSAPPLIANCETYPE, EntityTypesIfc4x3.IFCELECTRICAPPLIANCETYPE, EntityTypesIfc4x3.IFCFIRESUPPRESSIONTERMINALTYPE, EntityTypesIfc4x3.IFCLAMPTYPE, EntityTypesIfc4x3.IFCLIGHTFIXTURETYPE, EntityTypesIfc4x3.IFCLIQUIDTERMINALTYPE, EntityTypesIfc4x3.IFCMEDICALDEVICETYPE, EntityTypesIfc4x3.IFCMOBILETELECOMMUNICATIONSAPPLIANCETYPE, EntityTypesIfc4x3.IFCOUTLETTYPE, EntityTypesIfc4x3.IFCSANITARYTERMINALTYPE, EntityTypesIfc4x3.IFCSIGNALTYPE, EntityTypesIfc4x3.IFCSPACEHEATERTYPE, EntityTypesIfc4x3.IFCSTACKTERMINALTYPE, EntityTypesIfc4x3.IFCWASTETERMINALTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCFLOWTERMINALTYPE
}
