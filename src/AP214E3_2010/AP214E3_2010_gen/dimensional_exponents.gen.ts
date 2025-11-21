

/* This is generated code, don't modify */
import EntityTypesAP214 from './entity_types_ap214.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class dimensional_exponents extends StepEntityBase< EntityTypesAP214 > {
  public get type(): EntityTypesAP214 {
    return EntityTypesAP214.DIMENSIONAL_EXPONENTS
  }
  private length_exponent_? : number
  private mass_exponent_? : number
  private time_exponent_? : number
  private electric_current_exponent_? : number
  private thermodynamic_temperature_exponent_? : number
  private amount_of_substance_exponent_? : number
  private luminous_intensity_exponent_? : number

  public get length_exponent() : number {
    if ( this.length_exponent_ === void 0 ) {
      this.length_exponent_ = this.extractNumber( 0, 0, 0, false )
    }

    return this.length_exponent_ as number
  }

  public get mass_exponent() : number {
    if ( this.mass_exponent_ === void 0 ) {
      this.mass_exponent_ = this.extractNumber( 1, 0, 0, false )
    }

    return this.mass_exponent_ as number
  }

  public get time_exponent() : number {
    if ( this.time_exponent_ === void 0 ) {
      this.time_exponent_ = this.extractNumber( 2, 0, 0, false )
    }

    return this.time_exponent_ as number
  }

  public get electric_current_exponent() : number {
    if ( this.electric_current_exponent_ === void 0 ) {
      this.electric_current_exponent_ = this.extractNumber( 3, 0, 0, false )
    }

    return this.electric_current_exponent_ as number
  }

  public get thermodynamic_temperature_exponent() : number {
    if ( this.thermodynamic_temperature_exponent_ === void 0 ) {
      this.thermodynamic_temperature_exponent_ = this.extractNumber( 4, 0, 0, false )
    }

    return this.thermodynamic_temperature_exponent_ as number
  }

  public get amount_of_substance_exponent() : number {
    if ( this.amount_of_substance_exponent_ === void 0 ) {
      this.amount_of_substance_exponent_ = this.extractNumber( 5, 0, 0, false )
    }

    return this.amount_of_substance_exponent_ as number
  }

  public get luminous_intensity_exponent() : number {
    if ( this.luminous_intensity_exponent_ === void 0 ) {
      this.luminous_intensity_exponent_ = this.extractNumber( 6, 0, 0, false )
    }

    return this.luminous_intensity_exponent_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesAP214 >,
    model: StepModelBase< EntityTypesAP214, StepEntityBase< EntityTypesAP214 > >,
    multiReference?: StepEntityInternalReference< EntityTypesAP214 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === dimensional_exponents.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for dimensional_exponents" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesAP214.DIMENSIONAL_EXPONENTS ]

  public static readonly expectedType: EntityTypesAP214 =
    EntityTypesAP214.DIMENSIONAL_EXPONENTS
}
