
import { IfcPresentationItem } from "./index"
import { IfcTessellatedFaceSet } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import { IfcColourRgbList } from "./index"
import { IfcPositiveInteger } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcindexedcolourmap.htm */
export  class IfcIndexedColourMap extends IfcPresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCINDEXEDCOLOURMAP
  }
  private MappedTo_? : IfcTessellatedFaceSet
  private Opacity_? : number | null
  private Colours_? : IfcColourRgbList
  private ColourIndex_? : Array< number >

  public get MappedTo() : IfcTessellatedFaceSet {
    if ( this.MappedTo_ === void 0 ) {
      this.MappedTo_ = this.extractElement( 0, 0, 1, false, IfcTessellatedFaceSet )
    }

    return this.MappedTo_ as IfcTessellatedFaceSet
  }

  public get Opacity() : number | null {
    if ( this.Opacity_ === void 0 ) {
      this.Opacity_ = this.extractNumber( 1, 0, 1, true )
    }

    return this.Opacity_ as number | null
  }

  public get Colours() : IfcColourRgbList {
    if ( this.Colours_ === void 0 ) {
      this.Colours_ = this.extractElement( 2, 0, 1, false, IfcColourRgbList )
    }

    return this.Colours_ as IfcColourRgbList
  }

  public get ColourIndex() : Array< number > {
    if ( this.ColourIndex_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 0, 1 )
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

      this.ColourIndex_ = value
    }

    return this.ColourIndex_ as Array< number >
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCINDEXEDCOLOURMAP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCINDEXEDCOLOURMAP
}
