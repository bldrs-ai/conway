
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdistributionelement.htm */
export  class IfcDistributionElement extends IfcElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDISTRIBUTIONELEMENT
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDISTRIBUTIONELEMENT, EntityTypesIfc.IFCDISTRIBUTIONCONTROLELEMENT, EntityTypesIfc.IFCDISTRIBUTIONFLOWELEMENT, EntityTypesIfc.IFCACTUATOR, EntityTypesIfc.IFCALARM, EntityTypesIfc.IFCCONTROLLER, EntityTypesIfc.IFCFLOWINSTRUMENT, EntityTypesIfc.IFCPROTECTIVEDEVICETRIPPINGUNIT, EntityTypesIfc.IFCSENSOR, EntityTypesIfc.IFCUNITARYCONTROLELEMENT, EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENT, EntityTypesIfc.IFCENERGYCONVERSIONDEVICE, EntityTypesIfc.IFCFLOWCONTROLLER, EntityTypesIfc.IFCFLOWFITTING, EntityTypesIfc.IFCFLOWMOVINGDEVICE, EntityTypesIfc.IFCFLOWSEGMENT, EntityTypesIfc.IFCFLOWSTORAGEDEVICE, EntityTypesIfc.IFCFLOWTERMINAL, EntityTypesIfc.IFCFLOWTREATMENTDEVICE, EntityTypesIfc.IFCAIRTOAIRHEATRECOVERY, EntityTypesIfc.IFCBOILER, EntityTypesIfc.IFCBURNER, EntityTypesIfc.IFCCHILLER, EntityTypesIfc.IFCCOIL, EntityTypesIfc.IFCCONDENSER, EntityTypesIfc.IFCCOOLEDBEAM, EntityTypesIfc.IFCCOOLINGTOWER, EntityTypesIfc.IFCELECTRICGENERATOR, EntityTypesIfc.IFCELECTRICMOTOR, EntityTypesIfc.IFCENGINE, EntityTypesIfc.IFCEVAPORATIVECOOLER, EntityTypesIfc.IFCEVAPORATOR, EntityTypesIfc.IFCHEATEXCHANGER, EntityTypesIfc.IFCHUMIDIFIER, EntityTypesIfc.IFCMOTORCONNECTION, EntityTypesIfc.IFCSOLARDEVICE, EntityTypesIfc.IFCTRANSFORMER, EntityTypesIfc.IFCTUBEBUNDLE, EntityTypesIfc.IFCUNITARYEQUIPMENT, EntityTypesIfc.IFCAIRTERMINALBOX, EntityTypesIfc.IFCDAMPER, EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARD, EntityTypesIfc.IFCELECTRICTIMECONTROL, EntityTypesIfc.IFCFLOWMETER, EntityTypesIfc.IFCPROTECTIVEDEVICE, EntityTypesIfc.IFCSWITCHINGDEVICE, EntityTypesIfc.IFCVALVE, EntityTypesIfc.IFCELECTRICDISTRIBUTIONPOINT, EntityTypesIfc.IFCCABLECARRIERFITTING, EntityTypesIfc.IFCCABLEFITTING, EntityTypesIfc.IFCDUCTFITTING, EntityTypesIfc.IFCJUNCTIONBOX, EntityTypesIfc.IFCPIPEFITTING, EntityTypesIfc.IFCCOMPRESSOR, EntityTypesIfc.IFCFAN, EntityTypesIfc.IFCPUMP, EntityTypesIfc.IFCCABLECARRIERSEGMENT, EntityTypesIfc.IFCCABLESEGMENT, EntityTypesIfc.IFCDUCTSEGMENT, EntityTypesIfc.IFCPIPESEGMENT, EntityTypesIfc.IFCELECTRICFLOWSTORAGEDEVICE, EntityTypesIfc.IFCTANK, EntityTypesIfc.IFCAIRTERMINAL, EntityTypesIfc.IFCAUDIOVISUALAPPLIANCE, EntityTypesIfc.IFCCOMMUNICATIONSAPPLIANCE, EntityTypesIfc.IFCELECTRICAPPLIANCE, EntityTypesIfc.IFCFIRESUPPRESSIONTERMINAL, EntityTypesIfc.IFCLAMP, EntityTypesIfc.IFCLIGHTFIXTURE, EntityTypesIfc.IFCMEDICALDEVICE, EntityTypesIfc.IFCOUTLET, EntityTypesIfc.IFCSANITARYTERMINAL, EntityTypesIfc.IFCSPACEHEATER, EntityTypesIfc.IFCSTACKTERMINAL, EntityTypesIfc.IFCWASTETERMINAL, EntityTypesIfc.IFCDUCTSILENCER, EntityTypesIfc.IFCFILTER, EntityTypesIfc.IFCINTERCEPTOR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDISTRIBUTIONELEMENT
}
