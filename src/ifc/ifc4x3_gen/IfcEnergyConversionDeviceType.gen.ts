
import { IfcDistributionFlowElementType } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcEnergyConversionDeviceType extends IfcDistributionFlowElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCENERGYCONVERSIONDEVICETYPE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcEnergyConversionDeviceType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcEnergyConversionDeviceType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCAIRTOAIRHEATRECOVERYTYPE, EntityTypesIfc4x3.IFCBOILERTYPE, EntityTypesIfc4x3.IFCBURNERTYPE, EntityTypesIfc4x3.IFCCHILLERTYPE, EntityTypesIfc4x3.IFCCOILTYPE, EntityTypesIfc4x3.IFCCONDENSERTYPE, EntityTypesIfc4x3.IFCCOOLEDBEAMTYPE, EntityTypesIfc4x3.IFCCOOLINGTOWERTYPE, EntityTypesIfc4x3.IFCELECTRICGENERATORTYPE, EntityTypesIfc4x3.IFCELECTRICMOTORTYPE, EntityTypesIfc4x3.IFCENGINETYPE, EntityTypesIfc4x3.IFCEVAPORATIVECOOLERTYPE, EntityTypesIfc4x3.IFCEVAPORATORTYPE, EntityTypesIfc4x3.IFCHEATEXCHANGERTYPE, EntityTypesIfc4x3.IFCHUMIDIFIERTYPE, EntityTypesIfc4x3.IFCMOTORCONNECTIONTYPE, EntityTypesIfc4x3.IFCSOLARDEVICETYPE, EntityTypesIfc4x3.IFCTRANSFORMERTYPE, EntityTypesIfc4x3.IFCTUBEBUNDLETYPE, EntityTypesIfc4x3.IFCUNITARYEQUIPMENTTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCENERGYCONVERSIONDEVICETYPE
}
