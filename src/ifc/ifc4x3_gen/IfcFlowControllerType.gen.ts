
import { IfcDistributionFlowElementType } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcFlowControllerType extends IfcDistributionFlowElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCFLOWCONTROLLERTYPE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcFlowControllerType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcFlowControllerType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCAIRTERMINALBOXTYPE, EntityTypesIfc4x3.IFCDAMPERTYPE, EntityTypesIfc4x3.IFCDISTRIBUTIONBOARDTYPE, EntityTypesIfc4x3.IFCELECTRICDISTRIBUTIONBOARDTYPE, EntityTypesIfc4x3.IFCELECTRICTIMECONTROLTYPE, EntityTypesIfc4x3.IFCFLOWMETERTYPE, EntityTypesIfc4x3.IFCPROTECTIVEDEVICETYPE, EntityTypesIfc4x3.IFCSWITCHINGDEVICETYPE, EntityTypesIfc4x3.IFCVALVETYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCFLOWCONTROLLERTYPE
}
