
import { IfcTopologicalRepresentationItem } from "./index"
import { IfcLoop } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfacebound.htm */
export  class IfcFaceBound extends IfcTopologicalRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFACEBOUND
  }
  private Bound_? : IfcLoop
  private Orientation_? : boolean

  public get Bound() : IfcLoop {
    if ( this.Bound_ === void 0 ) {
      this.Bound_ = this.extractElement( 0, 0, 2, false, IfcLoop )
    }

    return this.Bound_ as IfcLoop
  }

  public get Orientation() : boolean {
    if ( this.Orientation_ === void 0 ) {
      this.Orientation_ = this.extractBoolean( 1, 0, 2, false )
    }

    return this.Orientation_ as boolean
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFACEBOUND, EntityTypesIfc.IFCFACEOUTERBOUND ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFACEBOUND
}
