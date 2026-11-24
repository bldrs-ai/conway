
import { IfcRelationship } from "./index"
import { IfcContext } from "./index"
import { IfcObjectDefinition } from "./index"
import { IfcPropertyDefinition } from "./index"
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
export  class IfcRelDeclares extends IfcRelationship {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELDECLARES
  }
  private RelatingContext_? : IfcContext
  private RelatedDefinitions_? : Array<IfcObjectDefinition | IfcPropertyDefinition>

  public get RelatingContext() : IfcContext {
    if ( this.RelatingContext_ === void 0 ) {
      this.RelatingContext_ = this.extractElement( 4, 4, 2, false, IfcContext )
    }

    return this.RelatingContext_ as IfcContext
  }

  public get RelatedDefinitions() : Array<IfcObjectDefinition | IfcPropertyDefinition> {
    if ( this.RelatedDefinitions_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 5, 4, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcObjectDefinition | IfcPropertyDefinition> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc4x3 > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcObjectDefinition ) && !( value1Untyped instanceof IfcPropertyDefinition ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcObjectDefinition | IfcPropertyDefinition)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.RelatedDefinitions_ = value
    }

    return this.RelatedDefinitions_ as Array<IfcObjectDefinition | IfcPropertyDefinition>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelDeclares.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelDeclares" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELDECLARES ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELDECLARES
}
