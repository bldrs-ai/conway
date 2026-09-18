
import { IfcReinforcingElement } from "./index"
import { IfcTendonTypeEnum, IfcTendonTypeEnumDeserializeStep } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcAreaMeasure } from "./index"
import { IfcForceMeasure } from "./index"
import { IfcPressureMeasure } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTendon extends IfcReinforcingElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTENDON
  }
  private PredefinedType_? : IfcTendonTypeEnum | null
  private NominalDiameter_? : number | null
  private CrossSectionArea_? : number | null
  private TensionForce_? : number | null
  private PreStress_? : number | null
  private FrictionCoefficient_? : number | null
  private AnchorageSlip_? : number | null
  private MinCurvatureRadius_? : number | null

  public get PredefinedType() : IfcTendonTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 7, IfcTendonTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcTendonTypeEnum | null
  }

  public get NominalDiameter() : number | null {
    if ( this.NominalDiameter_ === void 0 ) {
      this.NominalDiameter_ = this.extractNumber( 10, 9, 7, true )
    }

    return this.NominalDiameter_ as number | null
  }

  public get CrossSectionArea() : number | null {
    if ( this.CrossSectionArea_ === void 0 ) {
      this.CrossSectionArea_ = this.extractNumber( 11, 9, 7, true )
    }

    return this.CrossSectionArea_ as number | null
  }

  public get TensionForce() : number | null {
    if ( this.TensionForce_ === void 0 ) {
      this.TensionForce_ = this.extractNumber( 12, 9, 7, true )
    }

    return this.TensionForce_ as number | null
  }

  public get PreStress() : number | null {
    if ( this.PreStress_ === void 0 ) {
      this.PreStress_ = this.extractNumber( 13, 9, 7, true )
    }

    return this.PreStress_ as number | null
  }

  public get FrictionCoefficient() : number | null {
    if ( this.FrictionCoefficient_ === void 0 ) {
      this.FrictionCoefficient_ = this.extractNumber( 14, 9, 7, true )
    }

    return this.FrictionCoefficient_ as number | null
  }

  public get AnchorageSlip() : number | null {
    if ( this.AnchorageSlip_ === void 0 ) {
      this.AnchorageSlip_ = this.extractNumber( 15, 9, 7, true )
    }

    return this.AnchorageSlip_ as number | null
  }

  public get MinCurvatureRadius() : number | null {
    if ( this.MinCurvatureRadius_ === void 0 ) {
      this.MinCurvatureRadius_ = this.extractNumber( 16, 9, 7, true )
    }

    return this.MinCurvatureRadius_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTendon.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTendon" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTENDON ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTENDON
}
