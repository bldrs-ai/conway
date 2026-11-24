
import { IfcCoordinateOperation } from "./index"
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

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRigidOperation extends IfcCoordinateOperation {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRIGIDOPERATION
  }
  private FirstCoordinate_? : IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure
  private SecondCoordinate_? : IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure
  private Height_? : number | null

  public get FirstCoordinate() : IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure {
    if ( this.FirstCoordinate_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 2, 2, 1, false )

      if ( !( value instanceof IfcAmountOfSubstanceMeasure ) && !( value instanceof IfcAreaMeasure ) && !( value instanceof IfcComplexNumber ) && !( value instanceof IfcContextDependentMeasure ) && !( value instanceof IfcCountMeasure ) && !( value instanceof IfcDescriptiveMeasure ) && !( value instanceof IfcElectricCurrentMeasure ) && !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcLuminousIntensityMeasure ) && !( value instanceof IfcMassMeasure ) && !( value instanceof IfcNonNegativeLengthMeasure ) && !( value instanceof IfcNormalisedRatioMeasure ) && !( value instanceof IfcNumericMeasure ) && !( value instanceof IfcParameterValue ) && !( value instanceof IfcPlaneAngleMeasure ) && !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcPositivePlaneAngleMeasure ) && !( value instanceof IfcPositiveRatioMeasure ) && !( value instanceof IfcRatioMeasure ) && !( value instanceof IfcSolidAngleMeasure ) && !( value instanceof IfcThermodynamicTemperatureMeasure ) && !( value instanceof IfcTimeMeasure ) && !( value instanceof IfcVolumeMeasure ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.FirstCoordinate_ = value as (IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure)

    }

    return this.FirstCoordinate_ as IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure
  }

  public get SecondCoordinate() : IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure {
    if ( this.SecondCoordinate_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 3, 2, 1, false )

      if ( !( value instanceof IfcAmountOfSubstanceMeasure ) && !( value instanceof IfcAreaMeasure ) && !( value instanceof IfcComplexNumber ) && !( value instanceof IfcContextDependentMeasure ) && !( value instanceof IfcCountMeasure ) && !( value instanceof IfcDescriptiveMeasure ) && !( value instanceof IfcElectricCurrentMeasure ) && !( value instanceof IfcLengthMeasure ) && !( value instanceof IfcLuminousIntensityMeasure ) && !( value instanceof IfcMassMeasure ) && !( value instanceof IfcNonNegativeLengthMeasure ) && !( value instanceof IfcNormalisedRatioMeasure ) && !( value instanceof IfcNumericMeasure ) && !( value instanceof IfcParameterValue ) && !( value instanceof IfcPlaneAngleMeasure ) && !( value instanceof IfcPositiveLengthMeasure ) && !( value instanceof IfcPositivePlaneAngleMeasure ) && !( value instanceof IfcPositiveRatioMeasure ) && !( value instanceof IfcRatioMeasure ) && !( value instanceof IfcSolidAngleMeasure ) && !( value instanceof IfcThermodynamicTemperatureMeasure ) && !( value instanceof IfcTimeMeasure ) && !( value instanceof IfcVolumeMeasure ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SecondCoordinate_ = value as (IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure)

    }

    return this.SecondCoordinate_ as IfcAmountOfSubstanceMeasure | IfcAreaMeasure | IfcComplexNumber | IfcContextDependentMeasure | IfcCountMeasure | IfcDescriptiveMeasure | IfcElectricCurrentMeasure | IfcLengthMeasure | IfcLuminousIntensityMeasure | IfcMassMeasure | IfcNonNegativeLengthMeasure | IfcNormalisedRatioMeasure | IfcNumericMeasure | IfcParameterValue | IfcPlaneAngleMeasure | IfcPositiveLengthMeasure | IfcPositivePlaneAngleMeasure | IfcPositiveRatioMeasure | IfcRatioMeasure | IfcSolidAngleMeasure | IfcThermodynamicTemperatureMeasure | IfcTimeMeasure | IfcVolumeMeasure
  }

  public get Height() : number | null {
    if ( this.Height_ === void 0 ) {
      this.Height_ = this.extractNumber( 4, 2, 1, true )
    }

    return this.Height_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRigidOperation.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRigidOperation" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRIGIDOPERATION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRIGIDOPERATION
}
