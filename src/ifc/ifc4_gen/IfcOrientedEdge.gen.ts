
import { IfcEdge } from "./index"
import { IfcBoolean } from "./index"
import { IfcVertex } from "./index"
import {
  IfcBooleanChoose,
} from '../ifc_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcorientededge.htm */
export  class IfcOrientedEdge extends IfcEdge {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCORIENTEDEDGE
  }
  private EdgeElement_? : IfcEdge
  private Orientation_? : boolean

  public get EdgeElement() : IfcEdge {
    if ( this.EdgeElement_ === void 0 ) {
      this.EdgeElement_ = this.extractElement( 2, 2, 3, false, IfcEdge )
    }

    return this.EdgeElement_ as IfcEdge
  }

  public get Orientation() : boolean {
    if ( this.Orientation_ === void 0 ) {
      this.Orientation_ = this.extractBoolean( 3, 2, 3, false )
    }

    return this.Orientation_ as boolean
  }

  public get EdgeStart() : IfcVertex {
    return IfcBooleanChoose(this?.Orientation,this?.EdgeElement?.EdgeStart,this?.EdgeElement?.EdgeEnd);
  }

  public get EdgeEnd() : IfcVertex {
    return IfcBooleanChoose(this?.Orientation,this?.EdgeElement?.EdgeEnd,this?.EdgeElement?.EdgeStart);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCORIENTEDEDGE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCORIENTEDEDGE
}
