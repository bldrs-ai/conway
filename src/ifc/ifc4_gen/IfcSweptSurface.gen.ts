
import { IfcSurface } from "./index"
import { IfcProfileDef } from "./index"
import { IfcAxis2Placement3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsweptsurface.htm */
export abstract class IfcSweptSurface extends IfcSurface {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSWEPTSURFACE
  }
  private SweptCurve_? : IfcProfileDef
  private Position_? : IfcAxis2Placement3D | null

  public get SweptCurve() : IfcProfileDef {
    if ( this.SweptCurve_ === void 0 ) {
      this.SweptCurve_ = this.extractElement( 0, 0, 3, false, IfcProfileDef )
    }

    return this.SweptCurve_ as IfcProfileDef
  }

  public get Position() : IfcAxis2Placement3D | null {
    if ( this.Position_ === void 0 ) {
      this.Position_ = this.extractElement( 1, 0, 3, true, IfcAxis2Placement3D )
    }

    return this.Position_ as IfcAxis2Placement3D | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSURFACEOFLINEAREXTRUSION, EntityTypesIfc.IFCSURFACEOFREVOLUTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSWEPTSURFACE
}
