
import { IfcStructuralLoadStatic } from "./index"
import { IfcLengthMeasure } from "./index"
import { IfcPlaneAngleMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralloadsingledisplacement.htm */
export  class IfcStructuralLoadSingleDisplacement extends IfcStructuralLoadStatic {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALLOADSINGLEDISPLACEMENT
  }
  private DisplacementX_? : number | null
  private DisplacementY_? : number | null
  private DisplacementZ_? : number | null
  private RotationalDisplacementRX_? : number | null
  private RotationalDisplacementRY_? : number | null
  private RotationalDisplacementRZ_? : number | null

  public get DisplacementX() : number | null {
    if ( this.DisplacementX_ === void 0 ) {
      this.DisplacementX_ = this.extractNumber( 1, 1, 3, true )
    }

    return this.DisplacementX_ as number | null
  }

  public get DisplacementY() : number | null {
    if ( this.DisplacementY_ === void 0 ) {
      this.DisplacementY_ = this.extractNumber( 2, 1, 3, true )
    }

    return this.DisplacementY_ as number | null
  }

  public get DisplacementZ() : number | null {
    if ( this.DisplacementZ_ === void 0 ) {
      this.DisplacementZ_ = this.extractNumber( 3, 1, 3, true )
    }

    return this.DisplacementZ_ as number | null
  }

  public get RotationalDisplacementRX() : number | null {
    if ( this.RotationalDisplacementRX_ === void 0 ) {
      this.RotationalDisplacementRX_ = this.extractNumber( 4, 1, 3, true )
    }

    return this.RotationalDisplacementRX_ as number | null
  }

  public get RotationalDisplacementRY() : number | null {
    if ( this.RotationalDisplacementRY_ === void 0 ) {
      this.RotationalDisplacementRY_ = this.extractNumber( 5, 1, 3, true )
    }

    return this.RotationalDisplacementRY_ as number | null
  }

  public get RotationalDisplacementRZ() : number | null {
    if ( this.RotationalDisplacementRZ_ === void 0 ) {
      this.RotationalDisplacementRZ_ = this.extractNumber( 6, 1, 3, true )
    }

    return this.RotationalDisplacementRZ_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALLOADSINGLEDISPLACEMENT, EntityTypesIfc.IFCSTRUCTURALLOADSINGLEDISPLACEMENTDISTORTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALLOADSINGLEDISPLACEMENT
}
