
import { dimensional_location } from "./index"
import { tolerance_zone_definition } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class dimension_related_tolerance_zone_element extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DIMENSION_RELATED_TOLERANCE_ZONE_ELEMENT
  }
  private related_dimension_? : dimensional_location
  private related_element_? : tolerance_zone_definition

  public get related_dimension() : dimensional_location {
    if ( this.related_dimension_ === void 0 ) {
      this.related_dimension_ = this.extractElement( 0, 0, 0, false, dimensional_location )
    }

    return this.related_dimension_ as dimensional_location
  }

  public get related_element() : tolerance_zone_definition {
    if ( this.related_element_ === void 0 ) {
      this.related_element_ = this.extractElement( 1, 0, 0, false, tolerance_zone_definition )
    }

    return this.related_element_ as tolerance_zone_definition
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === dimension_related_tolerance_zone_element.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for dimension_related_tolerance_zone_element" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DIMENSION_RELATED_TOLERANCE_ZONE_ELEMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DIMENSION_RELATED_TOLERANCE_ZONE_ELEMENT
}
