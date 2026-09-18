
import { IfcRelConnectsElements } from "./index"
import { IfcInteger } from "./index"
import { IfcConnectionTypeEnum, IfcConnectionTypeEnumDeserializeStep } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
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
export  class IfcRelConnectsPathElements extends IfcRelConnectsElements {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELCONNECTSPATHELEMENTS
  }
  private RelatingPriorities_? : Array< number >
  private RelatedPriorities_? : Array< number >
  private RelatedConnectionType_? : IfcConnectionTypeEnum
  private RelatingConnectionType_? : IfcConnectionTypeEnum

  public get RelatingPriorities() : Array< number > {
    if ( this.RelatingPriorities_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 7, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatingPriorities_ = value
    }

    return this.RelatingPriorities_ as Array< number >
  }

  public get RelatedPriorities() : Array< number > {
    if ( this.RelatedPriorities_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 7, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<number> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractNumber( buffer, cursor, endCursor )

        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedPriorities_ = value
    }

    return this.RelatedPriorities_ as Array< number >
  }

  public get RelatedConnectionType() : IfcConnectionTypeEnum {
    if ( this.RelatedConnectionType_ === void 0 ) {
      this.RelatedConnectionType_ = this.extractLambda( 9, 7, 4, IfcConnectionTypeEnumDeserializeStep, false )
    }

    return this.RelatedConnectionType_ as IfcConnectionTypeEnum
  }

  public get RelatingConnectionType() : IfcConnectionTypeEnum {
    if ( this.RelatingConnectionType_ === void 0 ) {
      this.RelatingConnectionType_ = this.extractLambda( 10, 7, 4, IfcConnectionTypeEnumDeserializeStep, false )
    }

    return this.RelatingConnectionType_ as IfcConnectionTypeEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelConnectsPathElements.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelConnectsPathElements" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELCONNECTSPATHELEMENTS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELCONNECTSPATHELEMENTS
}
