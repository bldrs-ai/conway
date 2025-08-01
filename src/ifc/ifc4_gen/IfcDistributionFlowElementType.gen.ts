
import { IfcDistributionElementType } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdistributionflowelementtype.htm */
export abstract class IfcDistributionFlowElementType extends IfcDistributionElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDISTRIBUTIONFLOWELEMENTTYPE
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENTTYPE, EntityTypesIfc.IFCAIRTOAIRHEATRECOVERYTYPE, EntityTypesIfc.IFCBOILERTYPE, EntityTypesIfc.IFCBURNERTYPE, EntityTypesIfc.IFCCHILLERTYPE, EntityTypesIfc.IFCCOILTYPE, EntityTypesIfc.IFCCONDENSERTYPE, EntityTypesIfc.IFCCOOLEDBEAMTYPE, EntityTypesIfc.IFCCOOLINGTOWERTYPE, EntityTypesIfc.IFCELECTRICGENERATORTYPE, EntityTypesIfc.IFCELECTRICMOTORTYPE, EntityTypesIfc.IFCENGINETYPE, EntityTypesIfc.IFCEVAPORATIVECOOLERTYPE, EntityTypesIfc.IFCEVAPORATORTYPE, EntityTypesIfc.IFCHEATEXCHANGERTYPE, EntityTypesIfc.IFCHUMIDIFIERTYPE, EntityTypesIfc.IFCMOTORCONNECTIONTYPE, EntityTypesIfc.IFCSOLARDEVICETYPE, EntityTypesIfc.IFCTRANSFORMERTYPE, EntityTypesIfc.IFCTUBEBUNDLETYPE, EntityTypesIfc.IFCUNITARYEQUIPMENTTYPE, EntityTypesIfc.IFCAIRTERMINALBOXTYPE, EntityTypesIfc.IFCDAMPERTYPE, EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARDTYPE, EntityTypesIfc.IFCELECTRICTIMECONTROLTYPE, EntityTypesIfc.IFCFLOWMETERTYPE, EntityTypesIfc.IFCPROTECTIVEDEVICETYPE, EntityTypesIfc.IFCSWITCHINGDEVICETYPE, EntityTypesIfc.IFCVALVETYPE, EntityTypesIfc.IFCCABLECARRIERFITTINGTYPE, EntityTypesIfc.IFCCABLEFITTINGTYPE, EntityTypesIfc.IFCDUCTFITTINGTYPE, EntityTypesIfc.IFCJUNCTIONBOXTYPE, EntityTypesIfc.IFCPIPEFITTINGTYPE, EntityTypesIfc.IFCCOMPRESSORTYPE, EntityTypesIfc.IFCFANTYPE, EntityTypesIfc.IFCPUMPTYPE, EntityTypesIfc.IFCCABLECARRIERSEGMENTTYPE, EntityTypesIfc.IFCCABLESEGMENTTYPE, EntityTypesIfc.IFCDUCTSEGMENTTYPE, EntityTypesIfc.IFCPIPESEGMENTTYPE, EntityTypesIfc.IFCELECTRICFLOWSTORAGEDEVICETYPE, EntityTypesIfc.IFCTANKTYPE, EntityTypesIfc.IFCAIRTERMINALTYPE, EntityTypesIfc.IFCAUDIOVISUALAPPLIANCETYPE, EntityTypesIfc.IFCCOMMUNICATIONSAPPLIANCETYPE, EntityTypesIfc.IFCELECTRICAPPLIANCETYPE, EntityTypesIfc.IFCFIRESUPPRESSIONTERMINALTYPE, EntityTypesIfc.IFCLAMPTYPE, EntityTypesIfc.IFCLIGHTFIXTURETYPE, EntityTypesIfc.IFCMEDICALDEVICETYPE, EntityTypesIfc.IFCOUTLETTYPE, EntityTypesIfc.IFCSANITARYTERMINALTYPE, EntityTypesIfc.IFCSPACEHEATERTYPE, EntityTypesIfc.IFCSTACKTERMINALTYPE, EntityTypesIfc.IFCWASTETERMINALTYPE, EntityTypesIfc.IFCDUCTSILENCERTYPE, EntityTypesIfc.IFCFILTERTYPE, EntityTypesIfc.IFCINTERCEPTORTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDISTRIBUTIONFLOWELEMENTTYPE
}
