
import { IfcPlacement } from "./index"
import { IfcDirection } from "./index"
import {
  IfcBuildAxes,
} from '../ifc_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcaxis2placement3d.htm */
export  class IfcAxis2Placement3D extends IfcPlacement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCAXIS2PLACEMENT3D
  }
  private Axis_? : IfcDirection | null
  private RefDirection_? : IfcDirection | null

  public get Axis() : IfcDirection | null {
    if ( this.Axis_ === void 0 ) {
      this.Axis_ = this.extractElement( 1, 1, 3, true, IfcDirection )
    }

    return this.Axis_ as IfcDirection | null
  }

  public get RefDirection() : IfcDirection | null {
    if ( this.RefDirection_ === void 0 ) {
      this.RefDirection_ = this.extractElement( 2, 1, 3, true, IfcDirection )
    }

    return this.RefDirection_ as IfcDirection | null
  }

  public get P() : Array<IfcDirection> {
    return IfcBuildAxes(this?.Axis,this?.RefDirection);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCAXIS2PLACEMENT3D ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCAXIS2PLACEMENT3D
}
