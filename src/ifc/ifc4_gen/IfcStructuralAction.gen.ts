
import { IfcStructuralActivity } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralaction.htm */
export abstract class IfcStructuralAction extends IfcStructuralActivity {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALACTION
  }
  private DestabilizingLoad_? : boolean | null

  public get DestabilizingLoad() : boolean | null {
    if ( this.DestabilizingLoad_ === void 0 ) {
      this.DestabilizingLoad_ = this.extractBoolean( 9, 9, 5, true )
    }

    return this.DestabilizingLoad_ as boolean | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALCURVEACTION, EntityTypesIfc.IFCSTRUCTURALPOINTACTION, EntityTypesIfc.IFCSTRUCTURALSURFACEACTION, EntityTypesIfc.IFCSTRUCTURALLINEARACTION, EntityTypesIfc.IFCSTRUCTURALPLANARACTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALACTION
}
