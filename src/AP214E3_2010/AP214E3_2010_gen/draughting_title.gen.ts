
import { drawing_revision } from "./index"
import { drawing_sheet_revision } from "./index"
import { label } from "./index"
import { text } from "./index"
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
export  class draughting_title extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DRAUGHTING_TITLE
  }
  private items_? : Array<drawing_revision | drawing_sheet_revision>
  private language_? : string
  private contents_? : string

  public get items() : Array<drawing_revision | drawing_sheet_revision> {
    if ( this.items_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<drawing_revision | drawing_sheet_revision> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesAP214 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof drawing_revision ) && !( value1Untyped instanceof drawing_sheet_revision ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (drawing_revision | drawing_sheet_revision)
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

    return this.items_ as Array<drawing_revision | drawing_sheet_revision>
  }

  public get language() : string {
    if ( this.language_ === void 0 ) {
      this.language_ = this.extractString( 1, 0, 0, false )
    }

    return this.language_ as string
  }

  public get contents() : string {
    if ( this.contents_ === void 0 ) {
      this.contents_ = this.extractString( 2, 0, 0, false )
    }

    return this.contents_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === draughting_title.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for draughting_title" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DRAUGHTING_TITLE ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DRAUGHTING_TITLE
}
