
import { shape_aspect } from "./index"
import { label } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class dimensional_size extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DIMENSIONAL_SIZE
  }
  private applies_to_? : shape_aspect
  private name_? : string

  public get applies_to() : shape_aspect {
    if ( this.applies_to_ === void 0 ) {
      this.applies_to_ = this.extractElement( 0, 0, 0, false, shape_aspect )
    }

    return this.applies_to_ as shape_aspect
  }

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 1, 0, 0, false )
    }

    return this.name_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === dimensional_size.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for dimensional_size" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DIMENSIONAL_SIZE, EntityTypesAP214.ANGULAR_SIZE, EntityTypesAP214.DIMENSIONAL_SIZE_WITH_PATH ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DIMENSIONAL_SIZE
}
