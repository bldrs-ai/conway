
import { IfcObjectPlacement } from "./index"
import { IfcAxis2Placement2D } from "./index"
import { IfcAxis2Placement3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclocalplacement.htm */
export  class IfcLocalPlacement extends IfcObjectPlacement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLOCALPLACEMENT
  }
  private PlacementRelTo_? : IfcObjectPlacement | null
  private RelativePlacement_? : IfcAxis2Placement2D | IfcAxis2Placement3D

  public get PlacementRelTo() : IfcObjectPlacement | null {
    if ( this.PlacementRelTo_ === void 0 ) {
      this.PlacementRelTo_ = this.extractElement( 0, 0, 1, true, IfcObjectPlacement )
    }

    return this.PlacementRelTo_ as IfcObjectPlacement | null
  }

  public get RelativePlacement() : IfcAxis2Placement2D | IfcAxis2Placement3D {
    if ( this.RelativePlacement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 1, 0, 1, false )

      if ( !( value instanceof IfcAxis2Placement2D ) && !( value instanceof IfcAxis2Placement3D ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelativePlacement_ = value as (IfcAxis2Placement2D | IfcAxis2Placement3D)

    }

    return this.RelativePlacement_ as IfcAxis2Placement2D | IfcAxis2Placement3D
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLOCALPLACEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLOCALPLACEMENT
}
