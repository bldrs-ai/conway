
import { drawing_revision } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class drawing_revision_sequence extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DRAWING_REVISION_SEQUENCE
  }
  private predecessor_? : drawing_revision
  private successor_? : drawing_revision

  public get predecessor() : drawing_revision {
    if ( this.predecessor_ === void 0 ) {
      this.predecessor_ = this.extractElement( 0, 0, 0, false, drawing_revision )
    }

    return this.predecessor_ as drawing_revision
  }

  public get successor() : drawing_revision {
    if ( this.successor_ === void 0 ) {
      this.successor_ = this.extractElement( 1, 0, 0, false, drawing_revision )
    }

    return this.successor_ as drawing_revision
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === drawing_revision_sequence.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for drawing_revision_sequence" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DRAWING_REVISION_SEQUENCE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DRAWING_REVISION_SEQUENCE
}
