
import { IfcAddress } from "./index"
import { IfcLabel } from "./index"
import { IfcURIReference } from "./index"
import {
  stepExtractString,
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctelecomaddress.htm */
export  class IfcTelecomAddress extends IfcAddress {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTELECOMADDRESS
  }
  private TelephoneNumbers_? : Array< string > | null
  private FacsimileNumbers_? : Array< string > | null
  private PagerNumber_? : string | null
  private ElectronicMailAddresses_? : Array< string > | null
  private WWWHomePageURL_? : string | null
  private MessagingIDs_? : Array< string > | null

  public get TelephoneNumbers() : Array< string > | null {
    if ( this.TelephoneNumbers_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 3, 3, 1 )
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

      this.TelephoneNumbers_ = value
    }

    return this.TelephoneNumbers_ as Array< string > | null
  }

  public get FacsimileNumbers() : Array< string > | null {
    if ( this.FacsimileNumbers_ === void 0 ) {
      
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

      this.FacsimileNumbers_ = value
    }

    return this.FacsimileNumbers_ as Array< string > | null
  }

  public get PagerNumber() : string | null {
    if ( this.PagerNumber_ === void 0 ) {
      this.PagerNumber_ = this.extractString( 5, 3, 1, true )
    }

    return this.PagerNumber_ as string | null
  }

  public get ElectronicMailAddresses() : Array< string > | null {
    if ( this.ElectronicMailAddresses_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 6, 3, 1 )
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

      this.ElectronicMailAddresses_ = value
    }

    return this.ElectronicMailAddresses_ as Array< string > | null
  }

  public get WWWHomePageURL() : string | null {
    if ( this.WWWHomePageURL_ === void 0 ) {
      this.WWWHomePageURL_ = this.extractString( 7, 3, 1, true )
    }

    return this.WWWHomePageURL_ as string | null
  }

  public get MessagingIDs() : Array< string > | null {
    if ( this.MessagingIDs_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 8, 3, 1 )
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

      this.MessagingIDs_ = value
    }

    return this.MessagingIDs_ as Array< string > | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTELECOMADDRESS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTELECOMADDRESS
}
