
import { IfcProduct } from "./index"
import { IfcStructuralLoad } from "./index"
import { IfcGlobalOrLocalEnum, IfcGlobalOrLocalEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcstructuralactivity.htm */
export abstract class IfcStructuralActivity extends IfcProduct {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSTRUCTURALACTIVITY
  }
  private AppliedLoad_? : IfcStructuralLoad
  private GlobalOrLocal_? : IfcGlobalOrLocalEnum

  public get AppliedLoad() : IfcStructuralLoad {
    if ( this.AppliedLoad_ === void 0 ) {
      this.AppliedLoad_ = this.extractElement( 7, 7, 4, false, IfcStructuralLoad )
    }

    return this.AppliedLoad_ as IfcStructuralLoad
  }

  public get GlobalOrLocal() : IfcGlobalOrLocalEnum {
    if ( this.GlobalOrLocal_ === void 0 ) {
      this.GlobalOrLocal_ = this.extractLambda( 8, 7, 4, IfcGlobalOrLocalEnumDeserializeStep, false )
    }

    return this.GlobalOrLocal_ as IfcGlobalOrLocalEnum
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSTRUCTURALCURVEACTION, EntityTypesIfc.IFCSTRUCTURALPOINTACTION, EntityTypesIfc.IFCSTRUCTURALSURFACEACTION, EntityTypesIfc.IFCSTRUCTURALLINEARACTION, EntityTypesIfc.IFCSTRUCTURALPLANARACTION, EntityTypesIfc.IFCSTRUCTURALCURVEREACTION, EntityTypesIfc.IFCSTRUCTURALPOINTREACTION, EntityTypesIfc.IFCSTRUCTURALSURFACEREACTION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSTRUCTURALACTIVITY
}
