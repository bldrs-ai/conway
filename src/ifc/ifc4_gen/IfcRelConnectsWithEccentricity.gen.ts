
import { IfcRelConnectsStructuralMember } from "./index"
import { IfcConnectionGeometry } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelconnectswitheccentricity.htm */
export  class IfcRelConnectsWithEccentricity extends IfcRelConnectsStructuralMember {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELCONNECTSWITHECCENTRICITY
  }
  private ConnectionConstraint_? : IfcConnectionGeometry

  public get ConnectionConstraint() : IfcConnectionGeometry {
    if ( this.ConnectionConstraint_ === void 0 ) {
      this.ConnectionConstraint_ = this.extractElement( 10, 10, 4, false, IfcConnectionGeometry )
    }

    return this.ConnectionConstraint_ as IfcConnectionGeometry
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELCONNECTSWITHECCENTRICITY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELCONNECTSWITHECCENTRICITY
}
