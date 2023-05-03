
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../core/step_entity_internal_reference'
import StepEntityBase from '../../core/step_entity_base'
import StepModelBase from '../../core/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcboundarycondition.htm */
export abstract class IfcBoundaryCondition extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBOUNDARYCONDITION
  }
  private Name_? : string | null

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, true )
    }

    return this.Name_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBOUNDARYEDGECONDITION, EntityTypesIfc.IFCBOUNDARYFACECONDITION, EntityTypesIfc.IFCBOUNDARYNODECONDITION, EntityTypesIfc.IFCBOUNDARYNODECONDITIONWARPING ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBOUNDARYCONDITION
}
