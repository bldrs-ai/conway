
import { IfcPresentationItem } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import {
  stepExtractOptional,
  stepExtractNumber,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccolourrgblist.htm */
export  class IfcColourRgbList extends IfcPresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOLOURRGBLIST
  }
  private ColourList_? : Array< Array< number > >

  public get ColourList() : Array< Array< number > > {
    if ( this.ColourList_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 1 )
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

      this.ColourList_ = value
    }

    return this.ColourList_ as Array< Array< number > >
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOLOURRGBLIST ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOLOURRGBLIST
}
