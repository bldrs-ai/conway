
import { group } from "./index"
import { label } from "./index"
import { classification_role } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class attribute_classification_assignment extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ATTRIBUTE_CLASSIFICATION_ASSIGNMENT
  }
  private assigned_class_? : group
  private attribute_name_? : string
  private role_? : classification_role

  public get assigned_class() : group {
    if ( this.assigned_class_ === void 0 ) {
      this.assigned_class_ = this.extractElement( 0, 0, 0, false, group )
    }

    return this.assigned_class_ as group
  }

  public get attribute_name() : string {
    if ( this.attribute_name_ === void 0 ) {
      this.attribute_name_ = this.extractString( 1, 0, 0, false )
    }

    return this.attribute_name_ as string
  }

  public get role() : classification_role {
    if ( this.role_ === void 0 ) {
      this.role_ = this.extractElement( 2, 0, 0, false, classification_role )
    }

    return this.role_ as classification_role
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === attribute_classification_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for attribute_classification_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ATTRIBUTE_CLASSIFICATION_ASSIGNMENT
}
