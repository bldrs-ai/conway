
import { IfcRelSpaceBoundary1stLevel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelspaceboundary2ndlevel.htm */
export  class IfcRelSpaceBoundary2ndLevel extends IfcRelSpaceBoundary1stLevel {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELSPACEBOUNDARY2NDLEVEL
  }
  private CorrespondingBoundary_? : IfcRelSpaceBoundary2ndLevel | null

  public get CorrespondingBoundary() : IfcRelSpaceBoundary2ndLevel | null {
    if ( this.CorrespondingBoundary_ === void 0 ) {
      this.CorrespondingBoundary_ = this.extractElement( 10, 10, 5, true, IfcRelSpaceBoundary2ndLevel )
    }

    return this.CorrespondingBoundary_ as IfcRelSpaceBoundary2ndLevel | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELSPACEBOUNDARY2NDLEVEL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELSPACEBOUNDARY2NDLEVEL
}
