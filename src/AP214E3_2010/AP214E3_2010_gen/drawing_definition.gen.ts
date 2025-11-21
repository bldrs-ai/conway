
import { identifier } from "./index"
import { label } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class drawing_definition extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DRAWING_DEFINITION
  }
  private drawing_number_? : string
  private drawing_type_? : string | null

  public get drawing_number() : string {
    if ( this.drawing_number_ === void 0 ) {
      this.drawing_number_ = this.extractString( 0, 0, 0, false )
    }

    return this.drawing_number_ as string
  }

  public get drawing_type() : string | null {
    if ( this.drawing_type_ === void 0 ) {
      this.drawing_type_ = this.extractString( 1, 0, 0, true )
    }

    return this.drawing_type_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === drawing_definition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for drawing_definition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DRAWING_DEFINITION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DRAWING_DEFINITION
}
