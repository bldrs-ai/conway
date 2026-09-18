
import { IfcGeometricRepresentationItem } from "./index"
import { IfcReal } from "./index"
import { IfcDimensionCount } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
  HIINDEX,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDirection extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDIRECTION
  }
  private DirectionRatios_? : Array< number >

  public get DirectionRatios() : Array< number > {
    if ( this.DirectionRatios_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 2 )
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

      this.DirectionRatios_ = value
    }

    return this.DirectionRatios_ as Array< number >
  }

  public get Dim() : number {
    return HIINDEX(this?.DirectionRatios);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDirection.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDirection" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDIRECTION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDIRECTION
}
