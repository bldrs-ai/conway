
import { IfcSpatialStructureElement } from "./index"
import { IfcCompoundPlaneAngleMeasure } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcLabel } from "./index"
import { IfcPostalAddress } from "./index"
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
export  class IfcSite extends IfcSpatialStructureElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSITE
  }
  private RefLatitude_? : Array< number > | null
  private RefLongitude_? : Array< number > | null
  private RefElevation_? : number | null
  private LandTitleNumber_? : string | null
  private SiteAddress_? : IfcPostalAddress | null

  public get RefLatitude() : Array< number > | null {
    if ( this.RefLatitude_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 9, 9, 6 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
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

      this.RefLatitude_ = value
    }

    return this.RefLatitude_ as Array< number > | null
  }

  public get RefLongitude() : Array< number > | null {
    if ( this.RefLongitude_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 10, 9, 6 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
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

      this.RefLongitude_ = value
    }

    return this.RefLongitude_ as Array< number > | null
  }

  public get RefElevation() : number | null {
    if ( this.RefElevation_ === void 0 ) {
      this.RefElevation_ = this.extractNumber( 11, 9, 6, true )
    }

    return this.RefElevation_ as number | null
  }

  public get LandTitleNumber() : string | null {
    if ( this.LandTitleNumber_ === void 0 ) {
      this.LandTitleNumber_ = this.extractString( 12, 9, 6, true )
    }

    return this.LandTitleNumber_ as string | null
  }

  public get SiteAddress() : IfcPostalAddress | null {
    if ( this.SiteAddress_ === void 0 ) {
      this.SiteAddress_ = this.extractElement( 13, 9, 6, true, IfcPostalAddress )
    }

    return this.SiteAddress_ as IfcPostalAddress | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSite.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSite" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSITE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSITE
}
