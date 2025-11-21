
import { identifier } from "./index"
import { label } from "./index"
import { text } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class general_property extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.GENERAL_PROPERTY
  }
  private id_? : string
  private name_? : string
  private description_? : string | null

  public get id() : string {
    if ( this.id_ === void 0 ) {
      this.id_ = this.extractString( 0, 0, 0, false )
    }

    return this.id_ as string
  }

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 1, 0, 0, false )
    }

    return this.name_ as string
  }

  public get description() : string | null {
    if ( this.description_ === void 0 ) {
      this.description_ = this.extractString( 2, 0, 0, true )
    }

    return this.description_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === general_property.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for general_property" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.GENERAL_PROPERTY ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.GENERAL_PROPERTY
}
