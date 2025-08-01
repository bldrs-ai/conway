
import { IfcReinforcingElement } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcAreaMeasure } from "./index"
import { IfcReinforcingBarTypeEnum, IfcReinforcingBarTypeEnumDeserializeStep } from "./index"
import { IfcReinforcingBarSurfaceEnum, IfcReinforcingBarSurfaceEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcreinforcingbar.htm */
export  class IfcReinforcingBar extends IfcReinforcingElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREINFORCINGBAR
  }
  private NominalDiameter_? : number | null
  private CrossSectionArea_? : number | null
  private BarLength_? : number | null
  private PredefinedType_? : IfcReinforcingBarTypeEnum | null
  private BarSurface_? : IfcReinforcingBarSurfaceEnum | null

  public get NominalDiameter() : number | null {
    if ( this.NominalDiameter_ === void 0 ) {
      this.NominalDiameter_ = this.extractNumber( 9, 9, 7, true )
    }

    return this.NominalDiameter_ as number | null
  }

  public get CrossSectionArea() : number | null {
    if ( this.CrossSectionArea_ === void 0 ) {
      this.CrossSectionArea_ = this.extractNumber( 10, 9, 7, true )
    }

    return this.CrossSectionArea_ as number | null
  }

  public get BarLength() : number | null {
    if ( this.BarLength_ === void 0 ) {
      this.BarLength_ = this.extractNumber( 11, 9, 7, true )
    }

    return this.BarLength_ as number | null
  }

  public get PredefinedType() : IfcReinforcingBarTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 12, 9, 7, IfcReinforcingBarTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcReinforcingBarTypeEnum | null
  }

  public get BarSurface() : IfcReinforcingBarSurfaceEnum | null {
    if ( this.BarSurface_ === void 0 ) {
      this.BarSurface_ = this.extractLambda( 13, 9, 7, IfcReinforcingBarSurfaceEnumDeserializeStep, true )
    }

    return this.BarSurface_ as IfcReinforcingBarSurfaceEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCREINFORCINGBAR ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREINFORCINGBAR
}
