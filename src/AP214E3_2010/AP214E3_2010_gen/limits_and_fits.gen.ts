
import { label } from "./index"
import { text } from "./index"

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class limits_and_fits extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.LIMITS_AND_FITS
  }
  private form_variance_? : string
  private zone_variance_? : string
  private grade_? : string
  private source_? : string

  public get form_variance() : string {
    if ( this.form_variance_ === void 0 ) {
      this.form_variance_ = this.extractString( 0, 0, 0, false )
    }

    return this.form_variance_ as string
  }

  public get zone_variance() : string {
    if ( this.zone_variance_ === void 0 ) {
      this.zone_variance_ = this.extractString( 1, 0, 0, false )
    }

    return this.zone_variance_ as string
  }

  public get grade() : string {
    if ( this.grade_ === void 0 ) {
      this.grade_ = this.extractString( 2, 0, 0, false )
    }

    return this.grade_ as string
  }

  public get source() : string {
    if ( this.source_ === void 0 ) {
      this.source_ = this.extractString( 3, 0, 0, false )
    }

    return this.source_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === limits_and_fits.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for limits_and_fits" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.LIMITS_AND_FITS ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.LIMITS_AND_FITS
}
