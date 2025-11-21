
import { IfcSolidModel } from "./index"
import { IfcClosedShell } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmanifoldsolidbrep.htm */
export abstract class IfcManifoldSolidBrep extends IfcSolidModel {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMANIFOLDSOLIDBREP
  }
  private Outer_? : IfcClosedShell

  public get Outer() : IfcClosedShell {
    if ( this.Outer_ === void 0 ) {
      this.Outer_ = this.extractElement( 0, 0, 3, false, IfcClosedShell )
    }

    return this.Outer_ as IfcClosedShell
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCADVANCEDBREP, EntityTypesIfc.IFCFACETEDBREP, EntityTypesIfc.IFCADVANCEDBREPWITHVOIDS, EntityTypesIfc.IFCFACETEDBREPWITHVOIDS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMANIFOLDSOLIDBREP
}
