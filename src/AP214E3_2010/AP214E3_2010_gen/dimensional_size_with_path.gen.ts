
import { dimensional_size } from "./index"
import { shape_aspect } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class dimensional_size_with_path extends dimensional_size {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DIMENSIONAL_SIZE_WITH_PATH
  }
  private path_? : shape_aspect

  public get path() : shape_aspect {
    if ( this.path_ === void 0 ) {
      this.path_ = this.extractElement( 2, 2, 1, false, shape_aspect )
    }

    return this.path_ as shape_aspect
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === dimensional_size_with_path.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for dimensional_size_with_path" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DIMENSIONAL_SIZE_WITH_PATH ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DIMENSIONAL_SIZE_WITH_PATH
}
