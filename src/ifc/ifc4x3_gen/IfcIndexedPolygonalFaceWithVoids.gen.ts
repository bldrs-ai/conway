
import { IfcIndexedPolygonalFace } from "./index"
import { IfcPositiveInteger } from "./index"
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
export  class IfcIndexedPolygonalFaceWithVoids extends IfcIndexedPolygonalFace {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCINDEXEDPOLYGONALFACEWITHVOIDS
  }
  private InnerCoordIndices_? : Array< Array< number > >

  public get InnerCoordIndices() : Array< Array< number > > {
    if ( this.InnerCoordIndices_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 1, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<Array<number>> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 : Array<number> = []

        let signedCursor1 = stepExtractArrayBegin( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor1 )

        while ( signedCursor1 >= 0 ) {
          const value2 = stepExtractNumber( buffer, cursor, endCursor )

          if ( value2 === void 0 ) {
            throw new Error( 'Value in STEP was incorrectly typed' )
          }
          cursor = skipValue( buffer, cursor, endCursor )
          value1.push( value2 )
          signedCursor1 = stepExtractArrayToken( buffer, cursor, endCursor )
          cursor = Math.abs( signedCursor1 )
        }
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.InnerCoordIndices_ = value
    }

    return this.InnerCoordIndices_ as Array< Array< number > >
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcIndexedPolygonalFaceWithVoids.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcIndexedPolygonalFaceWithVoids" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCINDEXEDPOLYGONALFACEWITHVOIDS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCINDEXEDPOLYGONALFACEWITHVOIDS
}
