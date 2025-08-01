
import { external_identification_assignment } from "./index"
import { document_file } from "./index"
import { externally_defined_class } from "./index"
import { externally_defined_general_property } from "./index"
import { product_definition } from "./index"
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
export  class applied_external_identification_assignment extends external_identification_assignment {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.APPLIED_EXTERNAL_IDENTIFICATION_ASSIGNMENT
  }
  private items_? : Array<document_file | externally_defined_class | externally_defined_general_property | product_definition>

  public get items() : Array<document_file | externally_defined_class | externally_defined_general_property | product_definition> {
    if ( this.items_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 3, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<document_file | externally_defined_class | externally_defined_general_property | product_definition> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof document_file ) && !( value1Untyped instanceof externally_defined_class ) && !( value1Untyped instanceof externally_defined_general_property ) && !( value1Untyped instanceof product_definition ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (document_file | externally_defined_class | externally_defined_general_property | product_definition)
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

    return this.items_ as Array<document_file | externally_defined_class | externally_defined_general_property | product_definition>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === applied_external_identification_assignment.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for applied_external_identification_assignment" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.APPLIED_EXTERNAL_IDENTIFICATION_ASSIGNMENT ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.APPLIED_EXTERNAL_IDENTIFICATION_ASSIGNMENT
}
