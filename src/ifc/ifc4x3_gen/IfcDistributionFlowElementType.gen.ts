
import { IfcDistributionElementType } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcDistributionFlowElementType extends IfcDistributionElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDISTRIBUTIONFLOWELEMENTTYPE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDistributionFlowElementType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDistributionFlowElementType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDISTRIBUTIONCHAMBERELEMENTTYPE, EntityTypesIfc4x3.IFCAIRTOAIRHEATRECOVERYTYPE, EntityTypesIfc4x3.IFCBOILERTYPE, EntityTypesIfc4x3.IFCBURNERTYPE, EntityTypesIfc4x3.IFCCHILLERTYPE, EntityTypesIfc4x3.IFCCOILTYPE, EntityTypesIfc4x3.IFCCONDENSERTYPE, EntityTypesIfc4x3.IFCCOOLEDBEAMTYPE, EntityTypesIfc4x3.IFCCOOLINGTOWERTYPE, EntityTypesIfc4x3.IFCELECTRICGENERATORTYPE, EntityTypesIfc4x3.IFCELECTRICMOTORTYPE, EntityTypesIfc4x3.IFCENGINETYPE, EntityTypesIfc4x3.IFCEVAPORATIVECOOLERTYPE, EntityTypesIfc4x3.IFCEVAPORATORTYPE, EntityTypesIfc4x3.IFCHEATEXCHANGERTYPE, EntityTypesIfc4x3.IFCHUMIDIFIERTYPE, EntityTypesIfc4x3.IFCMOTORCONNECTIONTYPE, EntityTypesIfc4x3.IFCSOLARDEVICETYPE, EntityTypesIfc4x3.IFCTRANSFORMERTYPE, EntityTypesIfc4x3.IFCTUBEBUNDLETYPE, EntityTypesIfc4x3.IFCUNITARYEQUIPMENTTYPE, EntityTypesIfc4x3.IFCAIRTERMINALBOXTYPE, EntityTypesIfc4x3.IFCDAMPERTYPE, EntityTypesIfc4x3.IFCDISTRIBUTIONBOARDTYPE, EntityTypesIfc4x3.IFCELECTRICDISTRIBUTIONBOARDTYPE, EntityTypesIfc4x3.IFCELECTRICTIMECONTROLTYPE, EntityTypesIfc4x3.IFCFLOWMETERTYPE, EntityTypesIfc4x3.IFCPROTECTIVEDEVICETYPE, EntityTypesIfc4x3.IFCSWITCHINGDEVICETYPE, EntityTypesIfc4x3.IFCVALVETYPE, EntityTypesIfc4x3.IFCCABLECARRIERFITTINGTYPE, EntityTypesIfc4x3.IFCCABLEFITTINGTYPE, EntityTypesIfc4x3.IFCDUCTFITTINGTYPE, EntityTypesIfc4x3.IFCJUNCTIONBOXTYPE, EntityTypesIfc4x3.IFCPIPEFITTINGTYPE, EntityTypesIfc4x3.IFCCOMPRESSORTYPE, EntityTypesIfc4x3.IFCFANTYPE, EntityTypesIfc4x3.IFCPUMPTYPE, EntityTypesIfc4x3.IFCCABLECARRIERSEGMENTTYPE, EntityTypesIfc4x3.IFCCABLESEGMENTTYPE, EntityTypesIfc4x3.IFCCONVEYORSEGMENTTYPE, EntityTypesIfc4x3.IFCDUCTSEGMENTTYPE, EntityTypesIfc4x3.IFCPIPESEGMENTTYPE, EntityTypesIfc4x3.IFCELECTRICFLOWSTORAGEDEVICETYPE, EntityTypesIfc4x3.IFCTANKTYPE, EntityTypesIfc4x3.IFCAIRTERMINALTYPE, EntityTypesIfc4x3.IFCAUDIOVISUALAPPLIANCETYPE, EntityTypesIfc4x3.IFCCOMMUNICATIONSAPPLIANCETYPE, EntityTypesIfc4x3.IFCELECTRICAPPLIANCETYPE, EntityTypesIfc4x3.IFCFIRESUPPRESSIONTERMINALTYPE, EntityTypesIfc4x3.IFCLAMPTYPE, EntityTypesIfc4x3.IFCLIGHTFIXTURETYPE, EntityTypesIfc4x3.IFCLIQUIDTERMINALTYPE, EntityTypesIfc4x3.IFCMEDICALDEVICETYPE, EntityTypesIfc4x3.IFCMOBILETELECOMMUNICATIONSAPPLIANCETYPE, EntityTypesIfc4x3.IFCOUTLETTYPE, EntityTypesIfc4x3.IFCSANITARYTERMINALTYPE, EntityTypesIfc4x3.IFCSIGNALTYPE, EntityTypesIfc4x3.IFCSPACEHEATERTYPE, EntityTypesIfc4x3.IFCSTACKTERMINALTYPE, EntityTypesIfc4x3.IFCWASTETERMINALTYPE, EntityTypesIfc4x3.IFCDUCTSILENCERTYPE, EntityTypesIfc4x3.IFCELECTRICFLOWTREATMENTDEVICETYPE, EntityTypesIfc4x3.IFCFILTERTYPE, EntityTypesIfc4x3.IFCINTERCEPTORTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDISTRIBUTIONFLOWELEMENTTYPE
}
