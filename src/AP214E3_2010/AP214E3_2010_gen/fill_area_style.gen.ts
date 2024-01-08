
import { founded_item } from "./index"
import { label } from "./index"
import { fill_area_style_colour } from "./index"
import { externally_defined_tile_style } from "./index"
import { fill_area_style_tiles } from "./index"
import { externally_defined_hatch_style } from "./index"
import { fill_area_style_hatching } from "./index"
import {
  stepExtractOptional,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/fill_area_style.htm */
export  class fill_area_style extends founded_item {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.FILL_AREA_STYLE
  }
  private name_? : string
  private fill_styles_? : Array<fill_area_style_colour | externally_defined_tile_style | fill_area_style_tiles | externally_defined_hatch_style | fill_area_style_hatching>

  public get name() : string {
    if ( this.name_ === void 0 ) {
      this.name_ = this.extractString( 0, false )
    }

    return this.name_ as string
  }

  public get fill_styles() : Array<fill_area_style_colour | externally_defined_tile_style | fill_area_style_tiles | externally_defined_hatch_style | fill_area_style_hatching> {
    if ( this.fill_styles_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<fill_area_style_colour | externally_defined_tile_style | fill_area_style_tiles | externally_defined_hatch_style | fill_area_style_hatching> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof fill_area_style_colour ) && !( value1Untyped instanceof externally_defined_tile_style ) && !( value1Untyped instanceof fill_area_style_tiles ) && !( value1Untyped instanceof externally_defined_hatch_style ) && !( value1Untyped instanceof fill_area_style_hatching ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (fill_area_style_colour | externally_defined_tile_style | fill_area_style_tiles | externally_defined_hatch_style | fill_area_style_hatching)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.fill_styles_ = value
    }

    return this.fill_styles_ as Array<fill_area_style_colour | externally_defined_tile_style | fill_area_style_tiles | externally_defined_hatch_style | fill_area_style_hatching>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.FILL_AREA_STYLE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.FILL_AREA_STYLE
}
