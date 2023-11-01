
import { shape_aspect } from "./index"
import { geometric_tolerance } from "./index"
import { tolerance_zone_form } from "./index"
import {
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/tolerance_zone.htm */
export  class tolerance_zone extends shape_aspect {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.TOLERANCE_ZONE
  }
  private defining_tolerance_? : Array<geometric_tolerance>
  private form_? : tolerance_zone_form

  public get defining_tolerance() : Array<geometric_tolerance> {
    if ( this.defining_tolerance_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      const value : Array<geometric_tolerance> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, geometric_tolerance )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.defining_tolerance_ = value
    }

    return this.defining_tolerance_ as Array<geometric_tolerance>
  }

  public get form() : tolerance_zone_form {
    if ( this.form_ === void 0 ) {
      this.form_ = this.extractElement( 5, false, tolerance_zone_form )
    }

    return this.form_ as tolerance_zone_form
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.TOLERANCE_ZONE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.TOLERANCE_ZONE
}
