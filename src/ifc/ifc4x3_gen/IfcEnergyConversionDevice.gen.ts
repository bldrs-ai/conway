
import { IfcDistributionFlowElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcEnergyConversionDevice extends IfcDistributionFlowElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCENERGYCONVERSIONDEVICE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcEnergyConversionDevice.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcEnergyConversionDevice" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCENERGYCONVERSIONDEVICE, EntityTypesIfc4x3.IFCAIRTOAIRHEATRECOVERY, EntityTypesIfc4x3.IFCBOILER, EntityTypesIfc4x3.IFCBURNER, EntityTypesIfc4x3.IFCCHILLER, EntityTypesIfc4x3.IFCCOIL, EntityTypesIfc4x3.IFCCONDENSER, EntityTypesIfc4x3.IFCCOOLEDBEAM, EntityTypesIfc4x3.IFCCOOLINGTOWER, EntityTypesIfc4x3.IFCELECTRICGENERATOR, EntityTypesIfc4x3.IFCELECTRICMOTOR, EntityTypesIfc4x3.IFCENGINE, EntityTypesIfc4x3.IFCEVAPORATIVECOOLER, EntityTypesIfc4x3.IFCEVAPORATOR, EntityTypesIfc4x3.IFCHEATEXCHANGER, EntityTypesIfc4x3.IFCHUMIDIFIER, EntityTypesIfc4x3.IFCMOTORCONNECTION, EntityTypesIfc4x3.IFCSOLARDEVICE, EntityTypesIfc4x3.IFCTRANSFORMER, EntityTypesIfc4x3.IFCTUBEBUNDLE, EntityTypesIfc4x3.IFCUNITARYEQUIPMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCENERGYCONVERSIONDEVICE
}
