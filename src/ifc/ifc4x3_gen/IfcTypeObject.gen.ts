
import { IfcObjectDefinition } from "./index"
import { IfcIdentifier } from "./index"
import { IfcPropertySetDefinition } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTypeObject extends IfcObjectDefinition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTYPEOBJECT
  }
  private ApplicableOccurrence_? : string | null
  private HasPropertySets_? : Array<IfcPropertySetDefinition> | null

  public get ApplicableOccurrence() : string | null {
    if ( this.ApplicableOccurrence_ === void 0 ) {
      this.ApplicableOccurrence_ = this.extractString( 4, 4, 2, true )
    }

    return this.ApplicableOccurrence_ as string | null
  }

  public get HasPropertySets() : Array<IfcPropertySetDefinition> | null {
    if ( this.HasPropertySets_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 5, 4, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcPropertySetDefinition> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcPropertySetDefinition )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.HasPropertySets_ = value
    }

    return this.HasPropertySets_ as Array<IfcPropertySetDefinition> | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTypeObject.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTypeObject" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTYPEOBJECT, EntityTypesIfc4x3.IFCTYPEPRODUCT, EntityTypesIfc4x3.IFCEVENTTYPE, EntityTypesIfc4x3.IFCPROCEDURETYPE, EntityTypesIfc4x3.IFCTASKTYPE, EntityTypesIfc4x3.IFCBUILTELEMENTTYPE, EntityTypesIfc4x3.IFCCIVILELEMENTTYPE, EntityTypesIfc4x3.IFCDISTRIBUTIONELEMENTTYPE, EntityTypesIfc4x3.IFCELEMENTASSEMBLYTYPE, EntityTypesIfc4x3.IFCFURNISHINGELEMENTTYPE, EntityTypesIfc4x3.IFCGEOGRAPHICELEMENTTYPE, EntityTypesIfc4x3.IFCBEAMTYPE, EntityTypesIfc4x3.IFCBEARINGTYPE, EntityTypesIfc4x3.IFCBUILDINGELEMENTPROXYTYPE, EntityTypesIfc4x3.IFCCHIMNEYTYPE, EntityTypesIfc4x3.IFCCOLUMNTYPE, EntityTypesIfc4x3.IFCCOURSETYPE, EntityTypesIfc4x3.IFCCOVERINGTYPE, EntityTypesIfc4x3.IFCCURTAINWALLTYPE, EntityTypesIfc4x3.IFCDEEPFOUNDATIONTYPE, EntityTypesIfc4x3.IFCDOORTYPE, EntityTypesIfc4x3.IFCFOOTINGTYPE, EntityTypesIfc4x3.IFCKERBTYPE, EntityTypesIfc4x3.IFCMEMBERTYPE, EntityTypesIfc4x3.IFCMOORINGDEVICETYPE, EntityTypesIfc4x3.IFCNAVIGATIONELEMENTTYPE, EntityTypesIfc4x3.IFCPAVEMENTTYPE, EntityTypesIfc4x3.IFCPLATETYPE, EntityTypesIfc4x3.IFCRAILTYPE, EntityTypesIfc4x3.IFCRAILINGTYPE, EntityTypesIfc4x3.IFCRAMPFLIGHTTYPE, EntityTypesIfc4x3.IFCRAMPTYPE, EntityTypesIfc4x3.IFCROOFTYPE, EntityTypesIfc4x3.IFCSHADINGDEVICETYPE, EntityTypesIfc4x3.IFCSLABTYPE, EntityTypesIfc4x3.IFCSTAIRFLIGHTTYPE, EntityTypesIfc4x3.IFCSTAIRTYPE, EntityTypesIfc4x3.IFCTRACKELEMENTTYPE, EntityTypesIfc4x3.IFCWALLTYPE, EntityTypesIfc4x3.IFCWINDOWTYPE, EntityTypesIfc4x3.IFCCAISSONFOUNDATIONTYPE, EntityTypesIfc4x3.IFCPILETYPE, EntityTypesIfc4x3.IFCACTUATORTYPE, EntityTypesIfc4x3.IFCALARMTYPE, EntityTypesIfc4x3.IFCCONTROLLERTYPE, EntityTypesIfc4x3.IFCFLOWINSTRUMENTTYPE, EntityTypesIfc4x3.IFCPROTECTIVEDEVICETRIPPINGUNITTYPE, EntityTypesIfc4x3.IFCSENSORTYPE, EntityTypesIfc4x3.IFCUNITARYCONTROLELEMENTTYPE, EntityTypesIfc4x3.IFCDISTRIBUTIONCHAMBERELEMENTTYPE, EntityTypesIfc4x3.IFCAIRTOAIRHEATRECOVERYTYPE, EntityTypesIfc4x3.IFCBOILERTYPE, EntityTypesIfc4x3.IFCBURNERTYPE, EntityTypesIfc4x3.IFCCHILLERTYPE, EntityTypesIfc4x3.IFCCOILTYPE, EntityTypesIfc4x3.IFCCONDENSERTYPE, EntityTypesIfc4x3.IFCCOOLEDBEAMTYPE, EntityTypesIfc4x3.IFCCOOLINGTOWERTYPE, EntityTypesIfc4x3.IFCELECTRICGENERATORTYPE, EntityTypesIfc4x3.IFCELECTRICMOTORTYPE, EntityTypesIfc4x3.IFCENGINETYPE, EntityTypesIfc4x3.IFCEVAPORATIVECOOLERTYPE, EntityTypesIfc4x3.IFCEVAPORATORTYPE, EntityTypesIfc4x3.IFCHEATEXCHANGERTYPE, EntityTypesIfc4x3.IFCHUMIDIFIERTYPE, EntityTypesIfc4x3.IFCMOTORCONNECTIONTYPE, EntityTypesIfc4x3.IFCSOLARDEVICETYPE, EntityTypesIfc4x3.IFCTRANSFORMERTYPE, EntityTypesIfc4x3.IFCTUBEBUNDLETYPE, EntityTypesIfc4x3.IFCUNITARYEQUIPMENTTYPE, EntityTypesIfc4x3.IFCAIRTERMINALBOXTYPE, EntityTypesIfc4x3.IFCDAMPERTYPE, EntityTypesIfc4x3.IFCDISTRIBUTIONBOARDTYPE, EntityTypesIfc4x3.IFCELECTRICDISTRIBUTIONBOARDTYPE, EntityTypesIfc4x3.IFCELECTRICTIMECONTROLTYPE, EntityTypesIfc4x3.IFCFLOWMETERTYPE, EntityTypesIfc4x3.IFCPROTECTIVEDEVICETYPE, EntityTypesIfc4x3.IFCSWITCHINGDEVICETYPE, EntityTypesIfc4x3.IFCVALVETYPE, EntityTypesIfc4x3.IFCCABLECARRIERFITTINGTYPE, EntityTypesIfc4x3.IFCCABLEFITTINGTYPE, EntityTypesIfc4x3.IFCDUCTFITTINGTYPE, EntityTypesIfc4x3.IFCJUNCTIONBOXTYPE, EntityTypesIfc4x3.IFCPIPEFITTINGTYPE, EntityTypesIfc4x3.IFCCOMPRESSORTYPE, EntityTypesIfc4x3.IFCFANTYPE, EntityTypesIfc4x3.IFCPUMPTYPE, EntityTypesIfc4x3.IFCCABLECARRIERSEGMENTTYPE, EntityTypesIfc4x3.IFCCABLESEGMENTTYPE, EntityTypesIfc4x3.IFCCONVEYORSEGMENTTYPE, EntityTypesIfc4x3.IFCDUCTSEGMENTTYPE, EntityTypesIfc4x3.IFCPIPESEGMENTTYPE, EntityTypesIfc4x3.IFCELECTRICFLOWSTORAGEDEVICETYPE, EntityTypesIfc4x3.IFCTANKTYPE, EntityTypesIfc4x3.IFCAIRTERMINALTYPE, EntityTypesIfc4x3.IFCAUDIOVISUALAPPLIANCETYPE, EntityTypesIfc4x3.IFCCOMMUNICATIONSAPPLIANCETYPE, EntityTypesIfc4x3.IFCELECTRICAPPLIANCETYPE, EntityTypesIfc4x3.IFCFIRESUPPRESSIONTERMINALTYPE, EntityTypesIfc4x3.IFCLAMPTYPE, EntityTypesIfc4x3.IFCLIGHTFIXTURETYPE, EntityTypesIfc4x3.IFCLIQUIDTERMINALTYPE, EntityTypesIfc4x3.IFCMEDICALDEVICETYPE, EntityTypesIfc4x3.IFCMOBILETELECOMMUNICATIONSAPPLIANCETYPE, EntityTypesIfc4x3.IFCOUTLETTYPE, EntityTypesIfc4x3.IFCSANITARYTERMINALTYPE, EntityTypesIfc4x3.IFCSIGNALTYPE, EntityTypesIfc4x3.IFCSPACEHEATERTYPE, EntityTypesIfc4x3.IFCSTACKTERMINALTYPE, EntityTypesIfc4x3.IFCWASTETERMINALTYPE, EntityTypesIfc4x3.IFCDUCTSILENCERTYPE, EntityTypesIfc4x3.IFCELECTRICFLOWTREATMENTDEVICETYPE, EntityTypesIfc4x3.IFCFILTERTYPE, EntityTypesIfc4x3.IFCINTERCEPTORTYPE, EntityTypesIfc4x3.IFCBUILDINGELEMENTPARTTYPE, EntityTypesIfc4x3.IFCDISCRETEACCESSORYTYPE, EntityTypesIfc4x3.IFCFASTENERTYPE, EntityTypesIfc4x3.IFCIMPACTPROTECTIONDEVICETYPE, EntityTypesIfc4x3.IFCMECHANICALFASTENERTYPE, EntityTypesIfc4x3.IFCSIGNTYPE, EntityTypesIfc4x3.IFCVIBRATIONDAMPERTYPE, EntityTypesIfc4x3.IFCVIBRATIONISOLATORTYPE, EntityTypesIfc4x3.IFCREINFORCINGBARTYPE, EntityTypesIfc4x3.IFCREINFORCINGMESHTYPE, EntityTypesIfc4x3.IFCTENDONANCHORTYPE, EntityTypesIfc4x3.IFCTENDONCONDUITTYPE, EntityTypesIfc4x3.IFCTENDONTYPE, EntityTypesIfc4x3.IFCFURNITURETYPE, EntityTypesIfc4x3.IFCSYSTEMFURNITUREELEMENTTYPE, EntityTypesIfc4x3.IFCTRANSPORTELEMENTTYPE, EntityTypesIfc4x3.IFCVEHICLETYPE, EntityTypesIfc4x3.IFCSPATIALZONETYPE, EntityTypesIfc4x3.IFCSPACETYPE, EntityTypesIfc4x3.IFCCONSTRUCTIONEQUIPMENTRESOURCETYPE, EntityTypesIfc4x3.IFCCONSTRUCTIONMATERIALRESOURCETYPE, EntityTypesIfc4x3.IFCCONSTRUCTIONPRODUCTRESOURCETYPE, EntityTypesIfc4x3.IFCCREWRESOURCETYPE, EntityTypesIfc4x3.IFCLABORRESOURCETYPE, EntityTypesIfc4x3.IFCSUBCONTRACTRESOURCETYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTYPEOBJECT
}
