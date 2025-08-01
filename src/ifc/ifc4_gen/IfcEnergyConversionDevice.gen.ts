
import { IfcDistributionFlowElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcenergyconversiondevice.htm */
export  class IfcEnergyConversionDevice extends IfcDistributionFlowElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCENERGYCONVERSIONDEVICE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCENERGYCONVERSIONDEVICE, EntityTypesIfc.IFCAIRTOAIRHEATRECOVERY, EntityTypesIfc.IFCBOILER, EntityTypesIfc.IFCBURNER, EntityTypesIfc.IFCCHILLER, EntityTypesIfc.IFCCOIL, EntityTypesIfc.IFCCONDENSER, EntityTypesIfc.IFCCOOLEDBEAM, EntityTypesIfc.IFCCOOLINGTOWER, EntityTypesIfc.IFCELECTRICGENERATOR, EntityTypesIfc.IFCELECTRICMOTOR, EntityTypesIfc.IFCENGINE, EntityTypesIfc.IFCEVAPORATIVECOOLER, EntityTypesIfc.IFCEVAPORATOR, EntityTypesIfc.IFCHEATEXCHANGER, EntityTypesIfc.IFCHUMIDIFIER, EntityTypesIfc.IFCMOTORCONNECTION, EntityTypesIfc.IFCSOLARDEVICE, EntityTypesIfc.IFCTRANSFORMER, EntityTypesIfc.IFCTUBEBUNDLE, EntityTypesIfc.IFCUNITARYEQUIPMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCENERGYCONVERSIONDEVICE
}
