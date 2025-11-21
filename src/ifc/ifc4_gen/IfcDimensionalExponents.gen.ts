

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdimensionalexponents.htm */
export  class IfcDimensionalExponents extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDIMENSIONALEXPONENTS
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDIMENSIONALEXPONENTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDIMENSIONALEXPONENTS
}
