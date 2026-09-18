
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcRepresentation } from "./index"
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
export abstract class IfcProductRepresentation extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPRODUCTREPRESENTATION
  }
  private Name_? : string | null
  private Description_? : string | null
  private Representations_? : Array<IfcRepresentation>

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 0, true )
    }

    return this.Name_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 0, true )
    }

    return this.Description_ as string | null
  }

  public get Representations() : Array<IfcRepresentation> {
    if ( this.Representations_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 2, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcRepresentation> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcRepresentation )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.Representations_ = value
    }

    return this.Representations_ as Array<IfcRepresentation>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcProductRepresentation.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcProductRepresentation" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMATERIALDEFINITIONREPRESENTATION, EntityTypesIfc4x3.IFCPRODUCTDEFINITIONSHAPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPRODUCTREPRESENTATION
}
