
import { IfcAddress } from "./index"
import { IfcLabel } from "./index"
import {
  stepExtractString,
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
export  class IfcPostalAddress extends IfcAddress {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPOSTALADDRESS
  }
  private InternalLocation_? : string | null
  private AddressLines_? : Array< string > | null
  private PostalBox_? : string | null
  private Town_? : string | null
  private Region_? : string | null
  private PostalCode_? : string | null
  private Country_? : string | null

  public get InternalLocation() : string | null {
    if ( this.InternalLocation_ === void 0 ) {
      this.InternalLocation_ = this.extractString( 3, 3, 1, true )
    }

    return this.InternalLocation_ as string | null
  }

  public get AddressLines() : Array< string > | null {
    if ( this.AddressLines_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 4, 3, 1 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<string> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = stepExtractString( buffer, cursor, endCursor )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.AddressLines_ = value
    }

    return this.AddressLines_ as Array< string > | null
  }

  public get PostalBox() : string | null {
    if ( this.PostalBox_ === void 0 ) {
      this.PostalBox_ = this.extractString( 5, 3, 1, true )
    }

    return this.PostalBox_ as string | null
  }

  public get Town() : string | null {
    if ( this.Town_ === void 0 ) {
      this.Town_ = this.extractString( 6, 3, 1, true )
    }

    return this.Town_ as string | null
  }

  public get Region() : string | null {
    if ( this.Region_ === void 0 ) {
      this.Region_ = this.extractString( 7, 3, 1, true )
    }

    return this.Region_ as string | null
  }

  public get PostalCode() : string | null {
    if ( this.PostalCode_ === void 0 ) {
      this.PostalCode_ = this.extractString( 8, 3, 1, true )
    }

    return this.PostalCode_ as string | null
  }

  public get Country() : string | null {
    if ( this.Country_ === void 0 ) {
      this.Country_ = this.extractString( 9, 3, 1, true )
    }

    return this.Country_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPostalAddress.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPostalAddress" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPOSTALADDRESS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPOSTALADDRESS
}
