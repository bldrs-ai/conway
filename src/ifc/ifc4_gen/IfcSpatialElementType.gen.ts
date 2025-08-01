
import { IfcTypeProduct } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcspatialelementtype.htm */
export abstract class IfcSpatialElementType extends IfcTypeProduct {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSPATIALELEMENTTYPE
  }
  private ElementType_? : string | null

  public get ElementType() : string | null {
    if ( this.ElementType_ === void 0 ) {
      this.ElementType_ = this.extractString( 8, 8, 4, true )
    }

    return this.ElementType_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSPATIALZONETYPE, EntityTypesIfc.IFCSPACETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSPATIALELEMENTTYPE
}
