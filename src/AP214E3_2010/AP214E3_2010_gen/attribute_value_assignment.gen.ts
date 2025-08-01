
import { label } from "./index"
import { text } from "./index"
import { attribute_value_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class attribute_value_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ATTRIBUTE_VALUE_ASSIGNMENT
  }
  private attribute_name_? : string
  private attribute_value_? : label | text
  private role_? : attribute_value_role

  public get attribute_name() : string {
    if ( this.attribute_name_ === void 0 ) {
      this.attribute_name_ = this.extractString( 0, 0, 0, false )
    }

    return this.attribute_name_ as string
  }

  public get attribute_value() : label | text {
    if ( this.attribute_value_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesAP214 > = 
        this.extractReference( 1, 0, 0, false )

      if ( !( value instanceof label ) && !( value instanceof text ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.attribute_value_ = value as (label | text)

    }

    return this.attribute_value_ as label | text
  }

  public get role() : attribute_value_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 2, 0, 0, false, attribute_value_role )
    }

    return this.role_ as attribute_value_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === attribute_value_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for attribute_value_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ATTRIBUTE_VALUE_ASSIGNMENT
}
