
import { IfcGeometricRepresentationItem } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcplacement.htm */
export abstract class IfcPlacement extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPLACEMENT
  }
  private Location_? : IfcCartesianPoint

  public get Location() : IfcCartesianPoint {
    if ( this.Location_ === void 0 ) {
      this.Location_ = this.extractElement( 0, 0, 2, false, IfcCartesianPoint )
    }

    return this.Location_ as IfcCartesianPoint
  }

  public get Dim() : number {
    return this?.Location?.Dim;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCAXIS1PLACEMENT, EntityTypesIfc.IFCAXIS2PLACEMENT2D, EntityTypesIfc.IFCAXIS2PLACEMENT3D ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPLACEMENT
}
