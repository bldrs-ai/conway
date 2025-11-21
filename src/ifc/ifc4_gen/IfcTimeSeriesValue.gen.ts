
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
import { IfcDateTime } from "./index"
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
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctimeseriesvalue.htm */
export  class IfcTimeSeriesValue extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTIMESERIESVALUE
  }
  private ListValues_? : Array<IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp>

  public get ListValues() : Array<IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp> {
    if ( this.ListValues_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 0 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcAbsorbedDoseMeasure ) && !( value1Untyped instanceof IfcAccelerationMeasure ) && !( value1Untyped instanceof IfcAngularVelocityMeasure ) && !( value1Untyped instanceof IfcAreaDensityMeasure ) && !( value1Untyped instanceof IfcCompoundPlaneAngleMeasure ) && !( value1Untyped instanceof IfcCurvatureMeasure ) && !( value1Untyped instanceof IfcDoseEquivalentMeasure ) && !( value1Untyped instanceof IfcDynamicViscosityMeasure ) && !( value1Untyped instanceof IfcElectricCapacitanceMeasure ) && !( value1Untyped instanceof IfcElectricChargeMeasure ) && !( value1Untyped instanceof IfcElectricConductanceMeasure ) && !( value1Untyped instanceof IfcElectricResistanceMeasure ) && !( value1Untyped instanceof IfcElectricVoltageMeasure ) && !( value1Untyped instanceof IfcEnergyMeasure ) && !( value1Untyped instanceof IfcForceMeasure ) && !( value1Untyped instanceof IfcFrequencyMeasure ) && !( value1Untyped instanceof IfcHeatFluxDensityMeasure ) && !( value1Untyped instanceof IfcHeatingValueMeasure ) && !( value1Untyped instanceof IfcIlluminanceMeasure ) && !( value1Untyped instanceof IfcInductanceMeasure ) && !( value1Untyped instanceof IfcIntegerCountRateMeasure ) && !( value1Untyped instanceof IfcIonConcentrationMeasure ) && !( value1Untyped instanceof IfcIsothermalMoistureCapacityMeasure ) && !( value1Untyped instanceof IfcKinematicViscosityMeasure ) && !( value1Untyped instanceof IfcLinearForceMeasure ) && !( value1Untyped instanceof IfcLinearMomentMeasure ) && !( value1Untyped instanceof IfcLinearStiffnessMeasure ) && !( value1Untyped instanceof IfcLinearVelocityMeasure ) && !( value1Untyped instanceof IfcLuminousFluxMeasure ) && !( value1Untyped instanceof IfcLuminousIntensityDistributionMeasure ) && !( value1Untyped instanceof IfcMagneticFluxDensityMeasure ) && !( value1Untyped instanceof IfcMagneticFluxMeasure ) && !( value1Untyped instanceof IfcMassDensityMeasure ) && !( value1Untyped instanceof IfcMassFlowRateMeasure ) && !( value1Untyped instanceof IfcMassPerLengthMeasure ) && !( value1Untyped instanceof IfcModulusOfElasticityMeasure ) && !( value1Untyped instanceof IfcModulusOfLinearSubgradeReactionMeasure ) && !( value1Untyped instanceof IfcModulusOfRotationalSubgradeReactionMeasure ) && !( value1Untyped instanceof IfcModulusOfSubgradeReactionMeasure ) && !( value1Untyped instanceof IfcMoistureDiffusivityMeasure ) && !( value1Untyped instanceof IfcMolecularWeightMeasure ) && !( value1Untyped instanceof IfcMomentOfInertiaMeasure ) && !( value1Untyped instanceof IfcMonetaryMeasure ) && !( value1Untyped instanceof IfcPHMeasure ) && !( value1Untyped instanceof IfcPlanarForceMeasure ) && !( value1Untyped instanceof IfcPowerMeasure ) && !( value1Untyped instanceof IfcPressureMeasure ) && !( value1Untyped instanceof IfcRadioActivityMeasure ) && !( value1Untyped instanceof IfcRotationalFrequencyMeasure ) && !( value1Untyped instanceof IfcRotationalMassMeasure ) && !( value1Untyped instanceof IfcRotationalStiffnessMeasure ) && !( value1Untyped instanceof IfcSectionModulusMeasure ) && !( value1Untyped instanceof IfcSectionalAreaIntegralMeasure ) && !( value1Untyped instanceof IfcShearModulusMeasure ) && !( value1Untyped instanceof IfcSoundPowerLevelMeasure ) && !( value1Untyped instanceof IfcSoundPowerMeasure ) && !( value1Untyped instanceof IfcSoundPressureLevelMeasure ) && !( value1Untyped instanceof IfcSoundPressureMeasure ) && !( value1Untyped instanceof IfcSpecificHeatCapacityMeasure ) && !( value1Untyped instanceof IfcTemperatureGradientMeasure ) && !( value1Untyped instanceof IfcTemperatureRateOfChangeMeasure ) && !( value1Untyped instanceof IfcThermalAdmittanceMeasure ) && !( value1Untyped instanceof IfcThermalConductivityMeasure ) && !( value1Untyped instanceof IfcThermalExpansionCoefficientMeasure ) && !( value1Untyped instanceof IfcThermalResistanceMeasure ) && !( value1Untyped instanceof IfcThermalTransmittanceMeasure ) && !( value1Untyped instanceof IfcTorqueMeasure ) && !( value1Untyped instanceof IfcVaporPermeabilityMeasure ) && !( value1Untyped instanceof IfcVolumetricFlowRateMeasure ) && !( value1Untyped instanceof IfcWarpingConstantMeasure ) && !( value1Untyped instanceof IfcWarpingMomentMeasure ) && !( value1Untyped instanceof IfcAmountOfSubstanceMeasure ) && !( value1Untyped instanceof IfcAreaMeasure ) && !( value1Untyped instanceof IfcComplexNumber ) && !( value1Untyped instanceof IfcContextDependentMeasure ) && !( value1Untyped instanceof IfcCountMeasure ) && !( value1Untyped instanceof IfcDescriptiveMeasure ) && !( value1Untyped instanceof IfcElectricCurrentMeasure ) && !( value1Untyped instanceof IfcLengthMeasure ) && !( value1Untyped instanceof IfcLuminousIntensityMeasure ) && !( value1Untyped instanceof IfcMassMeasure ) && !( value1Untyped instanceof IfcNonNegativeLengthMeasure ) && !( value1Untyped instanceof IfcNormalisedRatioMeasure ) && !( value1Untyped instanceof IfcNumericMeasure ) && !( value1Untyped instanceof IfcParameterValue ) && !( value1Untyped instanceof IfcPlaneAngleMeasure ) && !( value1Untyped instanceof IfcPositiveLengthMeasure ) && !( value1Untyped instanceof IfcPositivePlaneAngleMeasure ) && !( value1Untyped instanceof IfcPositiveRatioMeasure ) && !( value1Untyped instanceof IfcRatioMeasure ) && !( value1Untyped instanceof IfcSolidAngleMeasure ) && !( value1Untyped instanceof IfcThermodynamicTemperatureMeasure ) && !( value1Untyped instanceof IfcTimeMeasure ) && !( value1Untyped instanceof IfcVolumeMeasure ) && !( value1Untyped instanceof IfcBinary ) && !( value1Untyped instanceof IfcBoolean ) && !( value1Untyped instanceof IfcDate ) && !( value1Untyped instanceof IfcDateTime ) && !( value1Untyped instanceof IfcDuration ) && !( value1Untyped instanceof IfcIdentifier ) && !( value1Untyped instanceof IfcInteger ) && !( value1Untyped instanceof IfcLabel ) && !( value1Untyped instanceof IfcLogical ) && !( value1Untyped instanceof IfcPositiveInteger ) && !( value1Untyped instanceof IfcReal ) && !( value1Untyped instanceof IfcText ) && !( value1Untyped instanceof IfcTime ) && !( value1Untyped instanceof IfcTimeStamp ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.ListValues_ = value
    }

    return this.ListValues_ as Array<IfcAbsorbedDoseMeasure | IfcAccelerationMeasure | IfcAngularVelocityMeasure | IfcAreaDensityMeasure | IfcCompoundPlaneAngleMeasure | IfcCurvatureMeasure | IfcDoseEquivalentMeasure | IfcDynamicViscosityMeasure | IfcElectricCapacitanceMeasure | IfcElectricChargeMeasure | IfcElectricConductanceMeasure | IfcElectricResistanceMeasure | IfcElectricVoltageMeasure | IfcEnergyMeasure | IfcForceMeasure | IfcFrequencyMeasure | IfcHeatFluxDensityMeasure | IfcHeatingValueMeasure | IfcIlluminanceMeasure | IfcInductanceMeasure | IfcIntegerCountRateMeasure | IfcIonConcentrationMeasure | IfcIsothermalMoistureCapacityMeasure | IfcKinematicViscosityMeasure | IfcLinearForceMeasure | IfcLinearMomentMeasure | IfcLinearStiffnessMeasure | IfcLinearVelocityMeasure | IfcLuminousFluxMeasure | IfcLuminousIntensityDistributionMeasure | IfcMagneticFluxDensityMeasure | IfcMagneticFluxMeasure | IfcMassDensityMeasure | IfcMassFlowRateMeasure | IfcMassPerLengthMeasure | IfcModulusOfElasticityMeasure | IfcModulusOfLinearSubgradeReactionMeasure | IfcModulusOfRotationalSubgradeReactionMeasure | IfcModulusOfSubgradeReactionMeasure | IfcMoistureDiffusivityMeasure | IfcMolecularWeightMeasure | IfcMomentOfInertiaMeasure | IfcMonetaryMeasure | IfcPHMeasure | IfcPlanarForceMeasure | IfcPowerMeasure | IfcPressureMeasure | IfcRadioActivityMeasure | IfcRotationalFrequencyMeasure | IfcRotationalMassMeasure | IfcRotationalStiffnessMeasure | IfcSectionModulusMeasure | IfcSectionalAreaIntegralMeasure | IfcShearModulusMeasure | IfcSoundPowerLevelMeasure | IfcSoundPowerMeasure | IfcSoundPressureLevelMeasure | IfcSoundPressureMeasure | IfcSpecificHeatCapacityMeasure | IfcTemperatureGradientMeasure | IfcTemperatureRateOfChangeMeasure | IfcThermalAdmittanceMeasure | IfcThermalConductivityMeasure | IfcThermalExpansionCoefficientMeasure | IfcThermalResistanceMeasure | IfcThermalTransmittanceMeasure | IfcTorqueMeasure | IfcVaporPermeabilityMeasure | IfcVolumetricFlowRateMeasure | IfcWarpingConstantMeasure | IfcWarpingMomentMeasure | IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure | IfcBinary | IfcBoolean | IfcDate | IfcDateTime | IfcDuration | IfcIdentifier | IfcInteger | IfcLabel | IfcLogical | IfcPositiveInteger | IfcReal | IfcText | IfcTime | IfcTimeStamp>
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTIMESERIESVALUE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTIMESERIESVALUE
}
