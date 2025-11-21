
import { IfcTypeObject } from "./index"
import { IfcRepresentationMap } from "./index"
import { IfcLabel } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctypeproduct.htm */
export  class IfcTypeProduct extends IfcTypeObject {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTYPEPRODUCT
  }
  private RepresentationMaps_? : Array<IfcRepresentationMap> | null
  private Tag_? : string | null

  public get RepresentationMaps() : Array<IfcRepresentationMap> | null {
    if ( this.RepresentationMaps_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 6, 6, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcRepresentationMap> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcRepresentationMap )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RepresentationMaps_ = value
    }

    return this.RepresentationMaps_ as Array<IfcRepresentationMap> | null
  }

  public get Tag() : string | null {
    if ( this.Tag_ === void 0 ) {
      this.Tag_ = this.extractString( 7, 6, 3, true )
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
    [ EntityTypesIfc.IFCTYPEPRODUCT, EntityTypesIfc.IFCDOORSTYLE, EntityTypesIfc.IFCWINDOWSTYLE, EntityTypesIfc.IFCCIVILELEMENTTYPE, EntityTypesIfc.IFCDISTRIBUTIONELEMENTTYPE, EntityTypesIfc.IFCELEMENTASSEMBLYTYPE, EntityTypesIfc.IFCFURNISHINGELEMENTTYPE, EntityTypesIfc.IFCGEOGRAPHICELEMENTTYPE, EntityTypesIfc.IFCTRANSPORTELEMENTTYPE, EntityTypesIfc.IFCBEAMTYPE, EntityTypesIfc.IFCBUILDINGELEMENTPROXYTYPE, EntityTypesIfc.IFCCHIMNEYTYPE, EntityTypesIfc.IFCCOLUMNTYPE, EntityTypesIfc.IFCCOVERINGTYPE, EntityTypesIfc.IFCCURTAINWALLTYPE, EntityTypesIfc.IFCDOORTYPE, EntityTypesIfc.IFCFOOTINGTYPE, EntityTypesIfc.IFCMEMBERTYPE, EntityTypesIfc.IFCPILETYPE, EntityTypesIfc.IFCPLATETYPE, EntityTypesIfc.IFCRAILINGTYPE, EntityTypesIfc.IFCRAMPFLIGHTTYPE, EntityTypesIfc.IFCRAMPTYPE, EntityTypesIfc.IFCROOFTYPE, EntityTypesIfc.IFCSHADINGDEVICETYPE, EntityTypesIfc.IFCSLABTYPE, EntityTypesIfc.IFCSTAIRFLIGHTTYPE, EntityTypesIfc.IFCSTAIRTYPE, EntityTypesIfc.IFCWALLTYPE, EntityTypesIfc.IFCWINDOWTYPE, EntityTypesIfc.IFCACTUATORTYPE, EntityTypesIfc.IFCALARMTYPE, EntityTypesIfc.IFCCONTROLLERTYPE, EntityTypesIfc.IFCFLOWINSTRUMENTTYPE, EntityTypesIfc.IFCPROTECTIVEDEVICETRIPPINGUNITTYPE, EntityTypesIfc.IFCSENSORTYPE, EntityTypesIfc.IFCUNITARYCONTROLELEMENTTYPE, EntityTypesIfc.IFCDISTRIBUTIONCHAMBERELEMENTTYPE, EntityTypesIfc.IFCAIRTOAIRHEATRECOVERYTYPE, EntityTypesIfc.IFCBOILERTYPE, EntityTypesIfc.IFCBURNERTYPE, EntityTypesIfc.IFCCHILLERTYPE, EntityTypesIfc.IFCCOILTYPE, EntityTypesIfc.IFCCONDENSERTYPE, EntityTypesIfc.IFCCOOLEDBEAMTYPE, EntityTypesIfc.IFCCOOLINGTOWERTYPE, EntityTypesIfc.IFCELECTRICGENERATORTYPE, EntityTypesIfc.IFCELECTRICMOTORTYPE, EntityTypesIfc.IFCENGINETYPE, EntityTypesIfc.IFCEVAPORATIVECOOLERTYPE, EntityTypesIfc.IFCEVAPORATORTYPE, EntityTypesIfc.IFCHEATEXCHANGERTYPE, EntityTypesIfc.IFCHUMIDIFIERTYPE, EntityTypesIfc.IFCMOTORCONNECTIONTYPE, EntityTypesIfc.IFCSOLARDEVICETYPE, EntityTypesIfc.IFCTRANSFORMERTYPE, EntityTypesIfc.IFCTUBEBUNDLETYPE, EntityTypesIfc.IFCUNITARYEQUIPMENTTYPE, EntityTypesIfc.IFCAIRTERMINALBOXTYPE, EntityTypesIfc.IFCDAMPERTYPE, EntityTypesIfc.IFCELECTRICDISTRIBUTIONBOARDTYPE, EntityTypesIfc.IFCELECTRICTIMECONTROLTYPE, EntityTypesIfc.IFCFLOWMETERTYPE, EntityTypesIfc.IFCPROTECTIVEDEVICETYPE, EntityTypesIfc.IFCSWITCHINGDEVICETYPE, EntityTypesIfc.IFCVALVETYPE, EntityTypesIfc.IFCCABLECARRIERFITTINGTYPE, EntityTypesIfc.IFCCABLEFITTINGTYPE, EntityTypesIfc.IFCDUCTFITTINGTYPE, EntityTypesIfc.IFCJUNCTIONBOXTYPE, EntityTypesIfc.IFCPIPEFITTINGTYPE, EntityTypesIfc.IFCCOMPRESSORTYPE, EntityTypesIfc.IFCFANTYPE, EntityTypesIfc.IFCPUMPTYPE, EntityTypesIfc.IFCCABLECARRIERSEGMENTTYPE, EntityTypesIfc.IFCCABLESEGMENTTYPE, EntityTypesIfc.IFCDUCTSEGMENTTYPE, EntityTypesIfc.IFCPIPESEGMENTTYPE, EntityTypesIfc.IFCELECTRICFLOWSTORAGEDEVICETYPE, EntityTypesIfc.IFCTANKTYPE, EntityTypesIfc.IFCAIRTERMINALTYPE, EntityTypesIfc.IFCAUDIOVISUALAPPLIANCETYPE, EntityTypesIfc.IFCCOMMUNICATIONSAPPLIANCETYPE, EntityTypesIfc.IFCELECTRICAPPLIANCETYPE, EntityTypesIfc.IFCFIRESUPPRESSIONTERMINALTYPE, EntityTypesIfc.IFCLAMPTYPE, EntityTypesIfc.IFCLIGHTFIXTURETYPE, EntityTypesIfc.IFCMEDICALDEVICETYPE, EntityTypesIfc.IFCOUTLETTYPE, EntityTypesIfc.IFCSANITARYTERMINALTYPE, EntityTypesIfc.IFCSPACEHEATERTYPE, EntityTypesIfc.IFCSTACKTERMINALTYPE, EntityTypesIfc.IFCWASTETERMINALTYPE, EntityTypesIfc.IFCDUCTSILENCERTYPE, EntityTypesIfc.IFCFILTERTYPE, EntityTypesIfc.IFCINTERCEPTORTYPE, EntityTypesIfc.IFCBUILDINGELEMENTPARTTYPE, EntityTypesIfc.IFCDISCRETEACCESSORYTYPE, EntityTypesIfc.IFCFASTENERTYPE, EntityTypesIfc.IFCMECHANICALFASTENERTYPE, EntityTypesIfc.IFCVIBRATIONISOLATORTYPE, EntityTypesIfc.IFCREINFORCINGBARTYPE, EntityTypesIfc.IFCREINFORCINGMESHTYPE, EntityTypesIfc.IFCTENDONANCHORTYPE, EntityTypesIfc.IFCTENDONTYPE, EntityTypesIfc.IFCFURNITURETYPE, EntityTypesIfc.IFCSYSTEMFURNITUREELEMENTTYPE, EntityTypesIfc.IFCSPATIALZONETYPE, EntityTypesIfc.IFCSPACETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTYPEPRODUCT
}
