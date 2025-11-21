
import { IfcReinforcingElementType } from "./index"
import { IfcTendonTypeEnum, IfcTendonTypeEnumDeserializeStep } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcAreaMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctendontype.htm */
export  class IfcTendonType extends IfcReinforcingElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTENDONTYPE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTENDONTYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTENDONTYPE
}
