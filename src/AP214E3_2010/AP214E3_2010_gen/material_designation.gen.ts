
import { label } from "./index"
import { characterized_object } from "./index"
import { product_definition } from "./index"
import { product_definition_relationship } from "./index"
import { product_definition_shape } from "./index"
import { shape_aspect } from "./index"
import { shape_aspect_relationship } from "./index"
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
export  class material_designation extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.MATERIAL_DESIGNATION
  }
  private name_? : string
  private definitions_? : Array<characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship>

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, 0, 0, false )
    }

    return this.name_ as string
  }

  public get definitions() : Array<characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship> {
    if ( this.definitions_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof characterized_object ) && !( value1Untyped instanceof product_definition ) && !( value1Untyped instanceof product_definition_relationship ) && !( value1Untyped instanceof product_definition_shape ) && !( value1Untyped instanceof shape_aspect ) && !( value1Untyped instanceof shape_aspect_relationship ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.definitions_ = value
    }

    return this.definitions_ as Array<characterized_object | product_definition | product_definition_relationship | product_definition_shape | shape_aspect | shape_aspect_relationship>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === material_designation.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for material_designation" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.MATERIAL_DESIGNATION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.MATERIAL_DESIGNATION
}
