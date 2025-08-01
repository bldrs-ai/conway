
import { IfcRelSpaceBoundary } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelspaceboundary1stlevel.htm */
export  class IfcRelSpaceBoundary1stLevel extends IfcRelSpaceBoundary {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELSPACEBOUNDARY1STLEVEL
  }
  private ParentBoundary_? : IfcRelSpaceBoundary1stLevel | null

  public get ParentBoundary() : IfcRelSpaceBoundary1stLevel | null {
    if ( this.ParentBoundary_ === void 0 ) {
      this.ParentBoundary_ = this.extractElement( 9, 9, 4, true, IfcRelSpaceBoundary1stLevel )
    }

    return this.ParentBoundary_ as IfcRelSpaceBoundary1stLevel | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELSPACEBOUNDARY1STLEVEL, EntityTypesIfc.IFCRELSPACEBOUNDARY2NDLEVEL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELSPACEBOUNDARY1STLEVEL
}
