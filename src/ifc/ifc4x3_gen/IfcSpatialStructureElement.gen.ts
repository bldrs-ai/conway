
import { IfcSpatialElement } from "./index"
import { IfcElementCompositionEnum, IfcElementCompositionEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcSpatialStructureElement extends IfcSpatialElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSPATIALSTRUCTUREELEMENT
  }
  private CompositionType_? : IfcElementCompositionEnum | null

  public get CompositionType() : IfcElementCompositionEnum | null {
    if ( this.CompositionType_ === void 0 ) {
      this.CompositionType_ = this.extractLambda( 8, 8, 5, IfcElementCompositionEnumDeserializeStep, true )
    }

    return this.CompositionType_ as IfcElementCompositionEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSpatialStructureElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSpatialStructureElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBUILDINGSTOREY, EntityTypesIfc4x3.IFCFACILITY, EntityTypesIfc4x3.IFCSITE, EntityTypesIfc4x3.IFCSPACE, EntityTypesIfc4x3.IFCBRIDGE, EntityTypesIfc4x3.IFCBUILDING, EntityTypesIfc4x3.IFCMARINEFACILITY, EntityTypesIfc4x3.IFCRAILWAY, EntityTypesIfc4x3.IFCROAD, EntityTypesIfc4x3.IFCBRIDGEPART, EntityTypesIfc4x3.IFCFACILITYPARTCOMMON, EntityTypesIfc4x3.IFCMARINEPART, EntityTypesIfc4x3.IFCRAILWAYPART, EntityTypesIfc4x3.IFCROADPART ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSPATIALSTRUCTUREELEMENT
}
