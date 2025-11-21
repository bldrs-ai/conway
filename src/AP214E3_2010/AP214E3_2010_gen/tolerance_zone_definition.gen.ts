
import { tolerance_zone } from "./index"
import { shape_aspect } from "./index"
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
export  class tolerance_zone_definition extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.TOLERANCE_ZONE_DEFINITION
  }
  private zone_? : tolerance_zone
  private boundaries_? : Array<shape_aspect>

  public get zone() : tolerance_zone {
    if ( this.zone_ === void 0 ) {
      this.zone_ = this.extractElement( 0, 0, 0, false, tolerance_zone )
    }

    return this.zone_ as tolerance_zone
  }

  public get boundaries() : Array<shape_aspect> {
    if ( this.boundaries_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<shape_aspect> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, shape_aspect )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.boundaries_ = value
    }

    return this.boundaries_ as Array<shape_aspect>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === tolerance_zone_definition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for tolerance_zone_definition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.TOLERANCE_ZONE_DEFINITION, EntityTypesAP214.PROJECTED_ZONE_DEFINITION, EntityTypesAP214.RUNOUT_ZONE_DEFINITION ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.TOLERANCE_ZONE_DEFINITION
}
