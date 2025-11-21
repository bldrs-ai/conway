
import { IfcFeatureElementAddition } from "./index"
import { IfcProjectionElementTypeEnum, IfcProjectionElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcprojectionelement.htm */
export  class IfcProjectionElement extends IfcFeatureElementAddition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROJECTIONELEMENT
  }
  private PredefinedType_? : IfcProjectionElementTypeEnum | null

  public get PredefinedType() : IfcProjectionElementTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcProjectionElementTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcProjectionElementTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROJECTIONELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROJECTIONELEMENT
}
