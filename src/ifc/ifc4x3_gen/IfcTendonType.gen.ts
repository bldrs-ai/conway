
import { IfcReinforcingElementType } from "./index"
import { IfcTendonTypeEnum, IfcTendonTypeEnumDeserializeStep } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcAreaMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTendonType extends IfcReinforcingElementType {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTENDONTYPE
  }
  private PredefinedType_? : IfcTendonTypeEnum
  private NominalDiameter_? : number | null
  private CrossSectionArea_? : number | null
  private SheathDiameter_? : number | null

  public get PredefinedType() : IfcTendonTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 7, IfcTendonTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcTendonTypeEnum
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

  public get SheathDiameter() : number | null {
    if ( this.SheathDiameter_ === void 0 ) {
      this.SheathDiameter_ = this.extractNumber( 12, 9, 7, true )
    }

    return this.SheathDiameter_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTendonType.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTendonType" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTENDONTYPE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTENDONTYPE
}
