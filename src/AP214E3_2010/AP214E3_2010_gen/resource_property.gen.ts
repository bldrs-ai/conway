
import { label } from "./index"
import { text } from "./index"
import { action_resource } from "./index"
import { action_resource_requirement } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class resource_property extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.RESOURCE_PROPERTY
  }
  private name_? : string
  private description_? : string
  private resource_? : action_resource | action_resource_requirement

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 1, 0, 0, false )
    }

    return this.description_ as string
  }

  public get resource() : action_resource | action_resource_requirement {
    if ( this.resource_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 2, 0, 0, false )

      if ( !( value instanceof action_resource ) && !( value instanceof action_resource_requirement ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.resource_ = value as (action_resource | action_resource_requirement)

    }

    return this.resource_ as action_resource | action_resource_requirement
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === resource_property.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for resource_property" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.RESOURCE_PROPERTY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.RESOURCE_PROPERTY
}
