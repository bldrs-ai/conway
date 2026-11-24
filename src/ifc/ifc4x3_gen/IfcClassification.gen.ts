
import { IfcExternalInformation } from "./index"
import { IfcLabel } from "./index"
import { IfcDate } from "./index"
import { IfcText } from "./index"
import { IfcURIReference } from "./index"
import { IfcIdentifier } from "./index"
import {
  stepExtractString,
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcClassification extends IfcExternalInformation {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCLASSIFICATION
  }
  private Source_? : string | null
  private Edition_? : string | null
  private EditionDate_? : string | null
  private Name_? : string
  private Description_? : string | null
  private Specification_? : string | null
  private ReferenceTokens_? : Array< string > | null

  public get Source() : string | null {
    if ( this.Source_ === void 0 ) {
      this.Source_ = this.extractString( 0, 0, 1, true )
    }

    return this.Source_ as string | null
  }

  public get Edition() : string | null {
    if ( this.Edition_ === void 0 ) {
      this.Edition_ = this.extractString( 1, 0, 1, true )
    }

    return this.Edition_ as string | null
  }

  public get EditionDate() : string | null {
    if ( this.EditionDate_ === void 0 ) {
      this.EditionDate_ = this.extractString( 2, 0, 1, true )
    }

    return this.EditionDate_ as string | null
  }

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 3, 0, 1, false )
    }

    return this.Name_ as string
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 4, 0, 1, true )
    }

    return this.Description_ as string | null
  }

  public get Specification() : string | null {
    if ( this.Specification_ === void 0 ) {
      this.Specification_ = this.extractString( 5, 0, 1, true )
    }

    return this.Specification_ as string | null
  }

  public get ReferenceTokens() : Array< string > | null {
    if ( this.ReferenceTokens_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 6, 0, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<string> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractString( buffer, cursor, endCursor )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.ReferenceTokens_ = value
    }

    return this.ReferenceTokens_ as Array< string > | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcClassification.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcClassification" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCLASSIFICATION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCLASSIFICATION
}
