
import { IfcPreDefinedProperties } from "./index"
import { IfcAreaMeasure } from "./index"
import { IfcLabel } from "./index"
import { IfcReinforcingBarSurfaceEnum, IfcReinforcingBarSurfaceEnumDeserializeStep } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcCountMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreinforcementbarproperties.htm */
export  class IfcReinforcementBarProperties extends IfcPreDefinedProperties {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREINFORCEMENTBARPROPERTIES
  }
  private TotalCrossSectionArea_? : number
  private SteelGrade_? : string
  private BarSurface_? : IfcReinforcingBarSurfaceEnum | null
  private EffectiveDepth_? : number | null
  private NominalBarDiameter_? : number | null
  private BarCount_? : number | null

  public get TotalCrossSectionArea() : number {
    if ( this.TotalCrossSectionArea_ === void 0 ) {
      this.TotalCrossSectionArea_ = this.extractNumber( 0, 0, 2, false )
    }

    return this.TotalCrossSectionArea_ as number
  }

  public get SteelGrade() : string {
    if ( this.SteelGrade_ === void 0 ) {
      this.SteelGrade_ = this.extractString( 1, 0, 2, false )
    }

    return this.SteelGrade_ as string
  }

  public get BarSurface() : IfcReinforcingBarSurfaceEnum | null {
    if ( this.BarSurface_ === void 0 ) {
      this.BarSurface_ = this.extractLambda( 2, 0, 2, IfcReinforcingBarSurfaceEnumDeserializeStep, true )
    }

    return this.BarSurface_ as IfcReinforcingBarSurfaceEnum | null
  }

  public get EffectiveDepth() : number | null {
    if ( this.EffectiveDepth_ === void 0 ) {
      this.EffectiveDepth_ = this.extractNumber( 3, 0, 2, true )
    }

    return this.EffectiveDepth_ as number | null
  }

  public get NominalBarDiameter() : number | null {
    if ( this.NominalBarDiameter_ === void 0 ) {
      this.NominalBarDiameter_ = this.extractNumber( 4, 0, 2, true )
    }

    return this.NominalBarDiameter_ as number | null
  }

  public get BarCount() : number | null {
    if ( this.BarCount_ === void 0 ) {
      this.BarCount_ = this.extractNumber( 5, 0, 2, true )
    }

    return this.BarCount_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREINFORCEMENTBARPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREINFORCEMENTBARPROPERTIES
}
