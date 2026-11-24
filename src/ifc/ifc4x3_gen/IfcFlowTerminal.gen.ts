
import { IfcDistributionFlowElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcFlowTerminal extends IfcDistributionFlowElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCFLOWTERMINAL
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcFlowTerminal.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcFlowTerminal" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCFLOWTERMINAL, EntityTypesIfc4x3.IFCAIRTERMINAL, EntityTypesIfc4x3.IFCAUDIOVISUALAPPLIANCE, EntityTypesIfc4x3.IFCCOMMUNICATIONSAPPLIANCE, EntityTypesIfc4x3.IFCELECTRICAPPLIANCE, EntityTypesIfc4x3.IFCFIRESUPPRESSIONTERMINAL, EntityTypesIfc4x3.IFCLAMP, EntityTypesIfc4x3.IFCLIGHTFIXTURE, EntityTypesIfc4x3.IFCLIQUIDTERMINAL, EntityTypesIfc4x3.IFCMEDICALDEVICE, EntityTypesIfc4x3.IFCMOBILETELECOMMUNICATIONSAPPLIANCE, EntityTypesIfc4x3.IFCOUTLET, EntityTypesIfc4x3.IFCSANITARYTERMINAL, EntityTypesIfc4x3.IFCSIGNAL, EntityTypesIfc4x3.IFCSPACEHEATER, EntityTypesIfc4x3.IFCSTACKTERMINAL, EntityTypesIfc4x3.IFCWASTETERMINAL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCFLOWTERMINAL
}
