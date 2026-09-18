
import { IfcElement } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDistributionElement extends IfcElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDISTRIBUTIONELEMENT
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDistributionElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDistributionElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDISTRIBUTIONELEMENT, EntityTypesIfc4x3.IFCDISTRIBUTIONCONTROLELEMENT, EntityTypesIfc4x3.IFCDISTRIBUTIONFLOWELEMENT, EntityTypesIfc4x3.IFCACTUATOR, EntityTypesIfc4x3.IFCALARM, EntityTypesIfc4x3.IFCCONTROLLER, EntityTypesIfc4x3.IFCFLOWINSTRUMENT, EntityTypesIfc4x3.IFCPROTECTIVEDEVICETRIPPINGUNIT, EntityTypesIfc4x3.IFCSENSOR, EntityTypesIfc4x3.IFCUNITARYCONTROLELEMENT, EntityTypesIfc4x3.IFCDISTRIBUTIONCHAMBERELEMENT, EntityTypesIfc4x3.IFCENERGYCONVERSIONDEVICE, EntityTypesIfc4x3.IFCFLOWCONTROLLER, EntityTypesIfc4x3.IFCFLOWFITTING, EntityTypesIfc4x3.IFCFLOWMOVINGDEVICE, EntityTypesIfc4x3.IFCFLOWSEGMENT, EntityTypesIfc4x3.IFCFLOWSTORAGEDEVICE, EntityTypesIfc4x3.IFCFLOWTERMINAL, EntityTypesIfc4x3.IFCFLOWTREATMENTDEVICE, EntityTypesIfc4x3.IFCAIRTOAIRHEATRECOVERY, EntityTypesIfc4x3.IFCBOILER, EntityTypesIfc4x3.IFCBURNER, EntityTypesIfc4x3.IFCCHILLER, EntityTypesIfc4x3.IFCCOIL, EntityTypesIfc4x3.IFCCONDENSER, EntityTypesIfc4x3.IFCCOOLEDBEAM, EntityTypesIfc4x3.IFCCOOLINGTOWER, EntityTypesIfc4x3.IFCELECTRICGENERATOR, EntityTypesIfc4x3.IFCELECTRICMOTOR, EntityTypesIfc4x3.IFCENGINE, EntityTypesIfc4x3.IFCEVAPORATIVECOOLER, EntityTypesIfc4x3.IFCEVAPORATOR, EntityTypesIfc4x3.IFCHEATEXCHANGER, EntityTypesIfc4x3.IFCHUMIDIFIER, EntityTypesIfc4x3.IFCMOTORCONNECTION, EntityTypesIfc4x3.IFCSOLARDEVICE, EntityTypesIfc4x3.IFCTRANSFORMER, EntityTypesIfc4x3.IFCTUBEBUNDLE, EntityTypesIfc4x3.IFCUNITARYEQUIPMENT, EntityTypesIfc4x3.IFCAIRTERMINALBOX, EntityTypesIfc4x3.IFCDAMPER, EntityTypesIfc4x3.IFCDISTRIBUTIONBOARD, EntityTypesIfc4x3.IFCELECTRICDISTRIBUTIONBOARD, EntityTypesIfc4x3.IFCELECTRICTIMECONTROL, EntityTypesIfc4x3.IFCFLOWMETER, EntityTypesIfc4x3.IFCPROTECTIVEDEVICE, EntityTypesIfc4x3.IFCSWITCHINGDEVICE, EntityTypesIfc4x3.IFCVALVE, EntityTypesIfc4x3.IFCCABLECARRIERFITTING, EntityTypesIfc4x3.IFCCABLEFITTING, EntityTypesIfc4x3.IFCDUCTFITTING, EntityTypesIfc4x3.IFCJUNCTIONBOX, EntityTypesIfc4x3.IFCPIPEFITTING, EntityTypesIfc4x3.IFCCOMPRESSOR, EntityTypesIfc4x3.IFCFAN, EntityTypesIfc4x3.IFCPUMP, EntityTypesIfc4x3.IFCCABLECARRIERSEGMENT, EntityTypesIfc4x3.IFCCABLESEGMENT, EntityTypesIfc4x3.IFCCONVEYORSEGMENT, EntityTypesIfc4x3.IFCDUCTSEGMENT, EntityTypesIfc4x3.IFCPIPESEGMENT, EntityTypesIfc4x3.IFCELECTRICFLOWSTORAGEDEVICE, EntityTypesIfc4x3.IFCTANK, EntityTypesIfc4x3.IFCAIRTERMINAL, EntityTypesIfc4x3.IFCAUDIOVISUALAPPLIANCE, EntityTypesIfc4x3.IFCCOMMUNICATIONSAPPLIANCE, EntityTypesIfc4x3.IFCELECTRICAPPLIANCE, EntityTypesIfc4x3.IFCFIRESUPPRESSIONTERMINAL, EntityTypesIfc4x3.IFCLAMP, EntityTypesIfc4x3.IFCLIGHTFIXTURE, EntityTypesIfc4x3.IFCLIQUIDTERMINAL, EntityTypesIfc4x3.IFCMEDICALDEVICE, EntityTypesIfc4x3.IFCMOBILETELECOMMUNICATIONSAPPLIANCE, EntityTypesIfc4x3.IFCOUTLET, EntityTypesIfc4x3.IFCSANITARYTERMINAL, EntityTypesIfc4x3.IFCSIGNAL, EntityTypesIfc4x3.IFCSPACEHEATER, EntityTypesIfc4x3.IFCSTACKTERMINAL, EntityTypesIfc4x3.IFCWASTETERMINAL, EntityTypesIfc4x3.IFCDUCTSILENCER, EntityTypesIfc4x3.IFCELECTRICFLOWTREATMENTDEVICE, EntityTypesIfc4x3.IFCFILTER, EntityTypesIfc4x3.IFCINTERCEPTOR ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDISTRIBUTIONELEMENT
}
