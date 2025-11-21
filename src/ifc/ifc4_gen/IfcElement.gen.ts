
import { IfcProduct } from "./index"
import { IfcIdentifier } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelement.htm */
export abstract class IfcElement extends IfcProduct {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELEMENT
  }
  private Tag_? : string | null

  public get Tag() : string | null {
    if ( this.Tag_ === void 0 ) {
      this.Tag_ = this.extractString( 7, 7, 4, true )
    }

    return this.Tag_ as string | null
  }












  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCIVILELEMENT, EntityTypesIfc.IFCDISTRIBUTIONELEMENT, EntityTypesIfc.IFCELEMENTASSEMBLY, EntityTypesIfc.IFCFURNISHINGELEMENT, EntityTypesIfc.IFCGEOGRAPHICELEMENT, EntityTypesIfc.IFCTRANSPORTELEMENT, EntityTypesIfc.IFCVIRTUALELEMENT, EntityTypesIfc.IFCBEAM, EntityTypesIfc.IFCBUILDINGELEMENTPROXY, EntityTypesIfc.IFCCHIMNEY, EntityTypesIfc.IFCCOLUMN, EntityTypesIfc.IFCCOVERING, EntityTypesIfc.IFCCURTAINWALL, EntityTypesIfc.IFCDOOR, EntityTypesIfc.IFCFOOTING, EntityTypesIfc.IFCMEMBER, EntityTypesIfc.IFCPILE, EntityTypesIfc.IFCPLATE, EntityTypesIfc.IFCRAILING, EntityTypesIfc.IFCRAMP, EntityTypesIfc.IFCRAMPFLIGHT, EntityTypesIfc.IFCROOF, EntityTypesIfc.IFCSHADINGDEVICE, EntityTypesIfc.IFCSLAB, EntityTypesIfc.IFCSTAIR, EntityTypesIfc.IFCSTAIRFLIGHT, EntityTypesIfc.IFCWALL, EntityTypesIfc.IFCWINDOW, EntityTypesIfc.IFCBEAMSTANDARDCASE, EntityTypesIfc.IFCCOLUMNSTANDARDCASE, EntityTypesIfc.IFCDOORSTANDARDCASE, EntityTypesIfc.IFCMEMBERSTANDARDCASE, EntityTypesIfc.IFCPLATESTANDARDCASE, EntityTypesIfc.IFCSLABELEMENTEDCASE, EntityTypesIfc.IFCSLABSTANDARDCASE, EntityTypesIfc.IFCWALLELEMENTEDCASE, EntityTypesIfc.IFCWALLSTANDARDCASE, EntityTypesIfc.IFCWINDOWSTANDARDCASE, EntityTypesIfc.IFCDISTRIBUTIONCONTROLELEMENT, EntityTypesIfc.IFCDISTRIBUTIONFLOWELEMENT, EntityTypesIfc.IFCACTUATOR, EntityTypesIfc.IFCALARM, EntityTypesIfc.IFCCONTROLLER, EntityTypesIfc.IFCFLOWINSTRUMENT, EntityTypesIfc.IFCPROTECTIVEDEVICETRIPPINGUNIT, EntityTypesIfc.IFCSENSOR, EntityTypesIfc.IFCUNITARYCONTROLELEMENT, EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENT, EntityTypesIfc.IFCENERGYCONVERSIONDEVICE, EntityTypesIfc.IFCFLOWCONTROLLER, EntityTypesIfc.IFCFLOWFITTING, EntityTypesIfc.IFCFLOWMOVINGDEVICE, EntityTypesIfc.IFCFLOWSEGMENT, EntityTypesIfc.IFCFLOWSTORAGEDEVICE, EntityTypesIfc.IFCFLOWTERMINAL, EntityTypesIfc.IFCFLOWTREATMENTDEVICE, EntityTypesIfc.IFCAIRTOAIRHEATRECOVERY, EntityTypesIfc.IFCBOILER, EntityTypesIfc.IFCBURNER, EntityTypesIfc.IFCCHILLER, EntityTypesIfc.IFCCOIL, EntityTypesIfc.IFCCONDENSER, EntityTypesIfc.IFCCOOLEDBEAM, EntityTypesIfc.IFCCOOLINGTOWER, EntityTypesIfc.IFCELECTRICGENERATOR, EntityTypesIfc.IFCELECTRICMOTOR, EntityTypesIfc.IFCENGINE, EntityTypesIfc.IFCEVAPORATIVECOOLER, EntityTypesIfc.IFCEVAPORATOR, EntityTypesIfc.IFCHEATEXCHANGER, EntityTypesIfc.IFCHUMIDIFIER, EntityTypesIfc.IFCMOTORCONNECTION, EntityTypesIfc.IFCSOLARDEVICE, EntityTypesIfc.IFCTRANSFORMER, EntityTypesIfc.IFCTUBEBUNDLE, EntityTypesIfc.IFCUNITARYEQUIPMENT, EntityTypesIfc.IFCAIRTERMINALBOX, EntityTypesIfc.IFCDAMPER, EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARD, EntityTypesIfc.IFCELECTRICTIMECONTROL, EntityTypesIfc.IFCFLOWMETER, EntityTypesIfc.IFCPROTECTIVEDEVICE, EntityTypesIfc.IFCSWITCHINGDEVICE, EntityTypesIfc.IFCVALVE, EntityTypesIfc.IFCELECTRICDISTRIBUTIONPOINT, EntityTypesIfc.IFCCABLECARRIERFITTING, EntityTypesIfc.IFCCABLEFITTING, EntityTypesIfc.IFCDUCTFITTING, EntityTypesIfc.IFCJUNCTIONBOX, EntityTypesIfc.IFCPIPEFITTING, EntityTypesIfc.IFCCOMPRESSOR, EntityTypesIfc.IFCFAN, EntityTypesIfc.IFCPUMP, EntityTypesIfc.IFCCABLECARRIERSEGMENT, EntityTypesIfc.IFCCABLESEGMENT, EntityTypesIfc.IFCDUCTSEGMENT, EntityTypesIfc.IFCPIPESEGMENT, EntityTypesIfc.IFCELECTRICFLOWSTORAGEDEVICE, EntityTypesIfc.IFCTANK, EntityTypesIfc.IFCAIRTERMINAL, EntityTypesIfc.IFCAUDIOVISUALAPPLIANCE, EntityTypesIfc.IFCCOMMUNICATIONSAPPLIANCE, EntityTypesIfc.IFCELECTRICAPPLIANCE, EntityTypesIfc.IFCFIRESUPPRESSIONTERMINAL, EntityTypesIfc.IFCLAMP, EntityTypesIfc.IFCLIGHTFIXTURE, EntityTypesIfc.IFCMEDICALDEVICE, EntityTypesIfc.IFCOUTLET, EntityTypesIfc.IFCSANITARYTERMINAL, EntityTypesIfc.IFCSPACEHEATER, EntityTypesIfc.IFCSTACKTERMINAL, EntityTypesIfc.IFCWASTETERMINAL, EntityTypesIfc.IFCDUCTSILENCER, EntityTypesIfc.IFCFILTER, EntityTypesIfc.IFCINTERCEPTOR, EntityTypesIfc.IFCBUILDINGELEMENTPART, EntityTypesIfc.IFCDISCRETEACCESSORY, EntityTypesIfc.IFCFASTENER, EntityTypesIfc.IFCMECHANICALFASTENER, EntityTypesIfc.IFCVIBRATIONISOLATOR, EntityTypesIfc.IFCREINFORCINGBAR, EntityTypesIfc.IFCREINFORCINGMESH, EntityTypesIfc.IFCTENDON, EntityTypesIfc.IFCTENDONANCHOR, EntityTypesIfc.IFCSURFACEFEATURE, EntityTypesIfc.IFCPROJECTIONELEMENT, EntityTypesIfc.IFCOPENINGELEMENT, EntityTypesIfc.IFCVOIDINGFEATURE, EntityTypesIfc.IFCOPENINGSTANDARDCASE, EntityTypesIfc.IFCFURNITURE, EntityTypesIfc.IFCSYSTEMFURNITUREELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELEMENT
}
