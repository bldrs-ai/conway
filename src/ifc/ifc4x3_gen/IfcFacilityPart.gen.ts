
import { IfcSpatialStructureElement } from "./index"
import { IfcFacilityUsageEnum, IfcFacilityUsageEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcFacilityPart extends IfcSpatialStructureElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCFACILITYPART
  }
  private UsageType_? : IfcFacilityUsageEnum

  public get UsageType() : IfcFacilityUsageEnum {
    if ( this.UsageType_ === void 0 ) {
      this.UsageType_ = this.extractLambda( 9, 9, 6, IfcFacilityUsageEnumDeserializeStep, false )
    }

    return this.UsageType_ as IfcFacilityUsageEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcFacilityPart.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcFacilityPart" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBRIDGEPART, EntityTypesIfc4x3.IFCFACILITYPARTCOMMON, EntityTypesIfc4x3.IFCMARINEPART, EntityTypesIfc4x3.IFCRAILWAYPART, EntityTypesIfc4x3.IFCROADPART ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCFACILITYPART
}
