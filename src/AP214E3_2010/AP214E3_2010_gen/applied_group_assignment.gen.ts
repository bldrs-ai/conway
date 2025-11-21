
import { group_assignment } from "./index"
import { geometric_representation_item } from "./index"
import { mapped_item } from "./index"
import { product_concept_feature } from "./index"
import { shape_aspect } from "./index"
import { styled_item } from "./index"
import { topological_representation_item } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class applied_group_assignment extends group_assignment {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPLIED_GROUP_ASSIGNMENT
  }
  private items_? : Array<geometric_representation_item | mapped_item | product_concept_feature | shape_aspect | styled_item | topological_representation_item>

  public get items() : Array<geometric_representation_item | mapped_item | product_concept_feature | shape_aspect | styled_item | topological_representation_item> {
    if ( this.items_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<geometric_representation_item | mapped_item | product_concept_feature | shape_aspect | styled_item | topological_representation_item> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof geometric_representation_item ) && !( value1Untyped instanceof mapped_item ) && !( value1Untyped instanceof product_concept_feature ) && !( value1Untyped instanceof shape_aspect ) && !( value1Untyped instanceof styled_item ) && !( value1Untyped instanceof topological_representation_item ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (geometric_representation_item | mapped_item | product_concept_feature | shape_aspect | styled_item | topological_representation_item)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.items_ = value
    }

    return this.items_ as Array<geometric_representation_item | mapped_item | product_concept_feature | shape_aspect | styled_item | topological_representation_item>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === applied_group_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for applied_group_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPLIED_GROUP_ASSIGNMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPLIED_GROUP_ASSIGNMENT
}
