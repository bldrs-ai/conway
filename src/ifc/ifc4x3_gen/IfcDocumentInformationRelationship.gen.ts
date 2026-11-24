
import { IfcResourceLevelRelationship } from "./index"
import { IfcDocumentInformation } from "./index"
import { IfcLabel } from "./index"
import {
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
export  class IfcDocumentInformationRelationship extends IfcResourceLevelRelationship {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDOCUMENTINFORMATIONRELATIONSHIP
  }
  private RelatingDocument_? : IfcDocumentInformation
  private RelatedDocuments_? : Array<IfcDocumentInformation>
  private RelationshipType_? : string | null

  public get RelatingDocument() : IfcDocumentInformation {
    if ( this.RelatingDocument_ === void 0 ) {
      this.RelatingDocument_ = this.extractElement( 2, 2, 1, false, IfcDocumentInformation )
    }

    return this.RelatingDocument_ as IfcDocumentInformation
  }

  public get RelatedDocuments() : Array<IfcDocumentInformation> {
    if ( this.RelatedDocuments_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 2, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcDocumentInformation> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcDocumentInformation )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedDocuments_ = value
    }

    return this.RelatedDocuments_ as Array<IfcDocumentInformation>
  }

  public get RelationshipType() : string | null {
    if ( this.RelationshipType_ === void 0 ) {
      this.RelationshipType_ = this.extractString( 4, 2, 1, true )
    }

    return this.RelationshipType_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDocumentInformationRelationship.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDocumentInformationRelationship" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDOCUMENTINFORMATIONRELATIONSHIP ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDOCUMENTINFORMATIONRELATIONSHIP
}
