

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDimensionalExponents extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDIMENSIONALEXPONENTS
  }
  private LengthExponent_? : number
  private MassExponent_? : number
  private TimeExponent_? : number
  private ElectricCurrentExponent_? : number
  private ThermodynamicTemperatureExponent_? : number
  private AmountOfSubstanceExponent_? : number
  private LuminousIntensityExponent_? : number

  public get LengthExponent() : number {
    if ( this.LengthExponent_ === void 0 ) {
      this.LengthExponent_ = this.extractNumber( 0, 0, 0, false )
    }

    return this.LengthExponent_ as number
  }

  public get MassExponent() : number {
    if ( this.MassExponent_ === void 0 ) {
      this.MassExponent_ = this.extractNumber( 1, 0, 0, false )
    }

    return this.MassExponent_ as number
  }

  public get TimeExponent() : number {
    if ( this.TimeExponent_ === void 0 ) {
      this.TimeExponent_ = this.extractNumber( 2, 0, 0, false )
    }

    return this.TimeExponent_ as number
  }

  public get ElectricCurrentExponent() : number {
    if ( this.ElectricCurrentExponent_ === void 0 ) {
      this.ElectricCurrentExponent_ = this.extractNumber( 3, 0, 0, false )
    }

    return this.ElectricCurrentExponent_ as number
  }

  public get ThermodynamicTemperatureExponent() : number {
    if ( this.ThermodynamicTemperatureExponent_ === void 0 ) {
      this.ThermodynamicTemperatureExponent_ = this.extractNumber( 4, 0, 0, false )
    }

    return this.ThermodynamicTemperatureExponent_ as number
  }

  public get AmountOfSubstanceExponent() : number {
    if ( this.AmountOfSubstanceExponent_ === void 0 ) {
      this.AmountOfSubstanceExponent_ = this.extractNumber( 5, 0, 0, false )
    }

    return this.AmountOfSubstanceExponent_ as number
  }

  public get LuminousIntensityExponent() : number {
    if ( this.LuminousIntensityExponent_ === void 0 ) {
      this.LuminousIntensityExponent_ = this.extractNumber( 6, 0, 0, false )
    }

    return this.LuminousIntensityExponent_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDimensionalExponents.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDimensionalExponents" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDIMENSIONALEXPONENTS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDIMENSIONALEXPONENTS
}
