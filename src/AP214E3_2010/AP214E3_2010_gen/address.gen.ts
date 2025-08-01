
import { label } from "./index"
import { identifier } from "./index"
import {
  get_name_value,
  get_id_value,
} from '../ap214_functions'

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class address extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.ADDRESS
  }
  private internal_location_? : string | null
  private street_number_? : string | null
  private street_? : string | null
  private postal_box_? : string | null
  private town_? : string | null
  private region_? : string | null
  private postal_code_? : string | null
  private country_? : string | null
  private facsimile_number_? : string | null
  private telephone_number_? : string | null
  private electronic_mail_address_? : string | null
  private telex_number_? : string | null

  public get internal_location() : string | null {
    if ( this.internal_location_ === void 0 ) {
      this.internal_location_ = this.extractString( 0, 0, 0, true )
    }

    return this.internal_location_ as string | null
  }

  public get street_number() : string | null {
    if ( this.street_number_ === void 0 ) {
      this.street_number_ = this.extractString( 1, 0, 0, true )
    }

    return this.street_number_ as string | null
  }

  public get street() : string | null {
    if ( this.street_ === void 0 ) {
      this.street_ = this.extractString( 2, 0, 0, true )
    }

    return this.street_ as string | null
  }

  public get postal_box() : string | null {
    if ( this.postal_box_ === void 0 ) {
      this.postal_box_ = this.extractString( 3, 0, 0, true )
    }

    return this.postal_box_ as string | null
  }

  public get town() : string | null {
    if ( this.town_ === void 0 ) {
      this.town_ = this.extractString( 4, 0, 0, true )
    }

    return this.town_ as string | null
  }

  public get region() : string | null {
    if ( this.region_ === void 0 ) {
      this.region_ = this.extractString( 5, 0, 0, true )
    }

    return this.region_ as string | null
  }

  public get postal_code() : string | null {
    if ( this.postal_code_ === void 0 ) {
      this.postal_code_ = this.extractString( 6, 0, 0, true )
    }

    return this.postal_code_ as string | null
  }

  public get country() : string | null {
    if ( this.country_ === void 0 ) {
      this.country_ = this.extractString( 7, 0, 0, true )
    }

    return this.country_ as string | null
  }

  public get facsimile_number() : string | null {
    if ( this.facsimile_number_ === void 0 ) {
      this.facsimile_number_ = this.extractString( 8, 0, 0, true )
    }

    return this.facsimile_number_ as string | null
  }

  public get telephone_number() : string | null {
    if ( this.telephone_number_ === void 0 ) {
      this.telephone_number_ = this.extractString( 9, 0, 0, true )
    }

    return this.telephone_number_ as string | null
  }

  public get electronic_mail_address() : string | null {
    if ( this.electronic_mail_address_ === void 0 ) {
      this.electronic_mail_address_ = this.extractString( 10, 0, 0, true )
    }

    return this.electronic_mail_address_ as string | null
  }

  public get telex_number() : string | null {
    if ( this.telex_number_ === void 0 ) {
      this.telex_number_ = this.extractString( 11, 0, 0, true )
    }

    return this.telex_number_ as string | null
  }

  public get name() : string {
    return get_name_value(this);
  }

  public get url() : string {
    return get_id_value(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === address.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for address" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.ADDRESS ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.ADDRESS
}
