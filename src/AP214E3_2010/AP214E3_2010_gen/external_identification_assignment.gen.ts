
import { identification_assignment } from "./index"
import { external_source } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class external_identification_assignment extends identification_assignment {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.EXTERNAL_IDENTIFICATION_ASSIGNMENT
  }
  private source_? : external_source

  public get source() : external_source {
    if ( this.source_ === void 0 ) {
      this.source_ = this.extractElement( 2, 2, 1, false, external_source )
    }

    return this.source_ as external_source
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === external_identification_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for external_identification_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query: EntityTypesAP214[] = 
    [  ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.EXTERNAL_IDENTIFICATION_ASSIGNMENT
}
