
import { IfcSolidModel } from "./index"
import { IfcCurve } from "./index"
import { IfcPositiveLengthMeasure } from "./index"
import { IfcParameterValue } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsweptdisksolid.htm */
export  class IfcSweptDiskSolid extends IfcSolidModel {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSWEPTDISKSOLID
  }
  private Directrix_? : IfcCurve
  private Radius_? : number
  private InnerRadius_? : number | null
  private StartParam_? : number | null
  private EndParam_? : number | null

  public get Directrix() : IfcCurve {
    if ( this.Directrix_ === void 0 ) {
      this.Directrix_ = this.extractElement( 0, 0, 3, false, IfcCurve )
    }

    return this.Directrix_ as IfcCurve
  }

  public get Radius() : number {
    if ( this.Radius_ === void 0 ) {
      this.Radius_ = this.extractNumber( 1, 0, 3, false )
    }

    return this.Radius_ as number
  }

  public get InnerRadius() : number | null {
    if ( this.InnerRadius_ === void 0 ) {
      this.InnerRadius_ = this.extractNumber( 2, 0, 3, true )
    }

    return this.InnerRadius_ as number | null
  }

  public get StartParam() : number | null {
    if ( this.StartParam_ === void 0 ) {
      this.StartParam_ = this.extractNumber( 3, 0, 3, true )
    }

    return this.StartParam_ as number | null
  }

  public get EndParam() : number | null {
    if ( this.EndParam_ === void 0 ) {
      this.EndParam_ = this.extractNumber( 4, 0, 3, true )
    }

    return this.EndParam_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSWEPTDISKSOLID, EntityTypesIfc.IFCSWEPTDISKSOLIDPOLYGONAL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSWEPTDISKSOLID
}
