
import { IfcDateTime } from "./index"
import { IfcAbsorbedDoseMeasure } from "./index"
import { IfcAccelerationMeasure } from "./index"
import { IfcAngularVelocityMeasure } from "./index"
import { IfcAreaDensityMeasure } from "./index"
import { IfcCompoundPlaneAngleMeasure } from "./index"
import { IfcCurvatureMeasure } from "./index"
import { IfcDoseEquivalentMeasure } from "./index"
import { IfcDynamicViscosityMeasure } from "./index"
import { IfcElectricCapacitanceMeasure } from "./index"
import { IfcElectricChargeMeasure } from "./index"
import { IfcElectricConductanceMeasure } from "./index"
import { IfcElectricResistanceMeasure } from "./index"
import { IfcElectricVoltageMeasure } from "./index"
import { IfcEnergyMeasure } from "./index"
import { IfcForceMeasure } from "./index"
import { IfcFrequencyMeasure } from "./index"
import { IfcHeatFluxDensityMeasure } from "./index"
import { IfcHeatingValueMeasure } from "./index"
import { IfcIlluminanceMeasure } from "./index"
import { IfcInductanceMeasure } from "./index"
import { IfcIntegerCountRateMeasure } from "./index"
import { IfcIonConcentrationMeasure } from "./index"
import { IfcIsothermalMoistureCapacityMeasure } from "./index"
import { IfcKinematicViscosityMeasure } from "./index"
import { IfcLinearForceMeasure } from "./index"
import { IfcLinearMomentMeasure } from "./index"
import { IfcLinearStiffnessMeasure } from "./index"
import { IfcLinearVelocityMeasure } from "./index"
import { IfcLuminousFluxMeasure } from "./index"
import { IfcLuminousIntensityDistributionMeasure } from "./index"
import { IfcMagneticFluxDensityMeasure } from "./index"
import { IfcMagneticFluxMeasure } from "./index"
import { IfcMassDensityMeasure } from "./index"
import { IfcMassFlowRateMeasure } from "./index"
import { IfcMassPerLengthMeasure } from "./index"
import { IfcModulusOfElasticityMeasure } from "./index"
import { IfcModulusOfLinearSubgradeReactionMeasure } from "./index"
import { IfcModulusOfRotationalSubgradeReactionMeasure } from "./index"
import { IfcModulusOfSubgradeReactionMeasure } from "./index"
import { IfcMoistureDiffusivityMeasure } from "./index"
import { IfcMolecularWeightMeasure } from "./index"
import { IfcMomentOfInertiaMeasure } from "./index"
import { IfcMonetaryMeasure } from "./index"
import { IfcPHMeasure } from "./index"
import { IfcPlanarForceMeasure } from "./index"
import { IfcPowerMeasure } from "./index"
import { IfcPressureMeasure } from "./index"
import { IfcRadioActivityMeasure } from "./index"
import { IfcRotationalFrequencyMeasure } from "./index"
import { IfcRotationalMassMeasure } from "./index"
import { IfcRotationalStiffnessMeasure } from "./index"
import { IfcSectionModulusMeasure } from "./index"
import { IfcSectionalAreaIntegralMeasure } from "./index"
import { IfcShearModulusMeasure } from "./index"
import { IfcSoundPowerLevelMeasure } from "./index"
import { IfcSoundPowerMeasure } from "./index"
import { IfcSoundPressureLevelMeasure } from "./index"
import { IfcSoundPressureMeasure } from "./index"
import { IfcSpecificHeatCapacityMeasure } from "./index"
import { IfcTemperatureGradientMeasure } from "./index"
import { IfcTemperatureRateOfChangeMeasure } from "./index"
import { IfcThermalAdmittanceMeasure } from "./index"
import { IfcThermalConductivityMeasure } from "./index"
import { IfcThermalExpansionCoefficientMeasure } from "./index"
import { IfcThermalResistanceMeasure } from "./index"
import { IfcThermalTransmittanceMeasure } from "./index"
import { IfcTorqueMeasure } from "./index"
import { IfcVaporPermeabilityMeasure } from "./index"
import { IfcVolumetricFlowRateMeasure } from "./index"
import { IfcWarpingConstantMeasure } from "./index"
import { IfcWarpingMomentMeasure } from "./index"
import { IfcAmountOfSubstanceMeasure } from "./index"
import { IfcAreaMeasure } from "./index"
import { IfcComplexNumber } from "./index"
import { IfcContextDependentMeasure } from "./index"
import { IfcCountMeasure } from "./index"
import { IfcDescriptiveMeasure } from "./index"
import { IfcElectricCurrentMeasure } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcLuminousIntensityMeasure } from "./index"
import { IfcMassMeasure } from "./index"
import { IfcNonNegativeLengthMeasure } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"
import { IfcNumericMeasure } from "./index"
import { IfcParameterValue } from "./index"
import { IfcPlaneAngleMeasure } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcPositivePlaneAngleMeasure } from "./index"
import { IfcPositiveRatioMeasure } from "./index"
import { IfcRatioMeasure } from "./index"
import { IfcSolidAngleMeasure } from "./index"
import { IfcThermodynamicTemperatureMeasure } from "./index"
import { IfcTimeMeasure } from "./index"
import { IfcVolumeMeasure } from "./index"
import { IfcBinary } from "./index"
import { IfcBoolean } from "./index"
import { IfcDate } from "./index"
import { IfcDuration } from "./index"
import { IfcIdentifier } from "./index"
import { IfcInteger } from "./index"
import { IfcLabel } from "./index"
import { IfcLogical } from "./index"
import { IfcPositiveInteger } from "./index"
import { IfcReal } from "./index"
import { IfcText } from "./index"
import { IfcTime } from "./index"
import { IfcTimeStamp } from "./index"
import {
  stepExtractArray,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcirregulartimeseriesvalue.htm */
export  class IfcIrregularTimeSeriesValue extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCIRREGULARTIMESERIESVALUE
  }
  private TimeStamp_? : string
  private ListValues_? : Array<IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp>

  public get TimeStamp() : string {
    if ( this.TimeStamp_ === void 0 ) {
      this.TimeStamp_ = this.extractString( 0, false )
    }

    return this.TimeStamp_ as string
  }

  public get ListValues() : Array<IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp> {
    if ( this.ListValues_ === void 0 ) {
      this.ListValues_ = this.extractLambda( 1, (buffer, cursor, endCursor) => {

      let value : Array<IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp> = [];

      for ( let address of stepExtractArray( buffer, cursor, endCursor ) ) {
        value.push( (() => {
          const cursor = address
          const value : StepEntityBase< EntityTypesIfc > | undefined =
            this.extractBufferReference( buffer, cursor, endCursor )
    
          if ( !( value instanceof IfcAbsorbedDoseMeasure ) && !( value instanceof IfcAccelerationMeasure ) && !( value instanceof IfcAngularVelocityMeasure ) && !( value instanceof IfcAreaDensityMeasure ) && !( value instanceof IfcCompoundPlaneAngleMeasure ) && !( value instanceof IfcCurvatureMeasure ) && !( value instanceof IfcDoseEquivalentMeasure ) && !( value instanceof IfcDynamicViscosityMeasure ) && !( value instanceof IfcElectricCapacitanceMeasure ) && !( value instanceof IfcElectricChargeMeasure ) && !( value instanceof IfcElectricConductanceMeasure ) && !( value instanceof IfcElectricResistanceMeasure ) && !( value instanceof IfcElectricVoltageMeasure ) && !( value instanceof IfcEnergyMeasure ) && !( value instanceof IfcForceMeasure ) && !( value instanceof IfcFrequencyMeasure ) && !( value instanceof IfcHeatFluxDensityMeasure ) && !( value instanceof IfcHeatingValueMeasure ) && !( value instanceof IfcIlluminanceMeasure ) && !( value instanceof IfcInductanceMeasure ) && !( value instanceof IfcIntegerCountRateMeasure ) && !( value instanceof IfcIonConcentrationMeasure ) && !( value instanceof IfcIsothermalMoistureCapacityMeasure ) && !( value instanceof IfcKinematicViscosityMeasure ) && !( value instanceof IfcLinearForceMeasure ) && !( value instanceof IfcLinearMomentMeasure ) && !( value instanceof IfcLinearStiffnessMeasure ) && !( value instanceof IfcLinearVelocityMeasure ) && !( value instanceof IfcLuminousFluxMeasure ) && !( value instanceof IfcLuminousIntensityDistributionMeasure ) && !( value instanceof IfcMagneticFluxDensityMeasure ) && !( value instanceof IfcMagneticFluxMeasure ) && !( value instanceof IfcMassDensityMeasure ) && !( value instanceof IfcMassFlowRateMeasure ) && !( value instanceof IfcMassPerLengthMeasure ) && !( value instanceof IfcModulusOfElasticityMeasure ) && !( value instanceof IfcModulusOfLinearSubgradeReactionMeasure ) && !( value instanceof IfcModulusOfRotationalSubgradeReactionMeasure ) && !( value instanceof IfcModulusOfSubgradeReactionMeasure ) && !( value instanceof IfcMoistureDiffusivityMeasure ) && !( value instanceof IfcMolecularWeightMeasure ) && !( value instanceof IfcMomentOfInertiaMeasure ) && !( value instanceof IfcMonetaryMeasure ) && !( value instanceof IfcPHMeasure ) && !( value instanceof IfcPlanarForceMeasure ) && !( value instanceof IfcPowerMeasure ) && !( value instanceof IfcPressureMeasure ) && !( value instanceof IfcRadioActivityMeasure ) && !( value instanceof IfcRotationalFrequencyMeasure ) && !( value instanceof IfcRotationalMassMeasure ) && !( value instanceof IfcRotationalStiffnessMeasure ) && !( value instanceof IfcSectionModulusMeasure ) && !( value instanceof IfcSectionalAreaIntegralMeasure ) && !( value instanceof IfcShearModulusMeasure ) && !( value instanceof IfcSoundPowerLevelMeasure ) && !( value instanceof IfcSoundPowerMeasure ) && !( value instanceof IfcSoundPressureLevelMeasure ) && !( value instanceof IfcSoundPressureMeasure ) && !( value instanceof IfcSpecificHeatCapacityMeasure ) && !( value instanceof IfcTemperatureGradientMeasure ) && !( value instanceof IfcTemperatureRateOfChangeMeasure ) && !( value instanceof IfcThermalAdmittanceMeasure ) && !( value instanceof IfcThermalConductivityMeasure ) && !( value instanceof IfcThermalExpansionCoefficientMeasure ) && !( value instanceof IfcThermalResistanceMeasure ) && !( value instanceof IfcThermalTransmittanceMeasure ) && !( value instanceof IfcTorqueMeasure ) && !( value instanceof IfcVaporPermeabilityMeasure ) && !( value instanceof IfcVolumetricFlowRateMeasure ) && !( value instanceof IfcWarpingConstantMeasure ) && !( value instanceof IfcWarpingMomentMeasure ) && !( value instanceof IfcAmountOfSubstanceMeasure ) && !( value instanceof IfcAreaMeasure ) && !( value instanceof IfcComplexNumber ) && !( value instanceof IfcContextDependentMeasure ) && !( value instanceof IfcCountMeasure ) && !( value instanceof IfcDescriptiveMeasure ) && !( value instanceof IfcElectricCurrentMeasure ) && !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcLuminousIntensityMeasure ) && !( value instanceof IfcMassMeasure ) && !( value instanceof IfcNonNegativeLengthMeasure ) && !( value instanceof IfcNormalisedRatioMeasure ) && !( value instanceof IfcNumericMeasure ) && !( value instanceof IfcParameterValue ) && !( value instanceof IfcPlaneAngleMeasure ) && !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcPositivePlaneAngleMeasure ) && !( value instanceof IfcPositiveRatioMeasure ) && !( value instanceof IfcRatioMeasure ) && !( value instanceof IfcSolidAngleMeasure ) && !( value instanceof IfcThermodynamicTemperatureMeasure ) && !( value instanceof IfcTimeMeasure ) && !( value instanceof IfcVolumeMeasure ) && !( value instanceof IfcBinary ) && !( value instanceof IfcBoolean ) && !( value instanceof IfcDate ) && !( value instanceof IfcDateTime ) && !( value instanceof IfcDuration ) && !( value instanceof IfcIdentifier ) && !( value instanceof IfcInteger ) && !( value instanceof IfcLabel ) && !( value instanceof IfcLogical ) && !( value instanceof IfcPositiveInteger ) && !( value instanceof IfcReal ) && !( value instanceof IfcText ) && !( value instanceof IfcTime ) && !( value instanceof IfcTimeStamp ) ) {
            throw new Error( 'Value in select must be populated' )
          }
          return value as (IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp)})() )
      }
      return value }, false )
    }

    return this.ListValues_ as Array<IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCIRREGULARTIMESERIESVALUE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCIRREGULARTIMESERIESVALUE
}
