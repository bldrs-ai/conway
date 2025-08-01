
import { IfcFeatureElementSubtraction } from "./index"
import { IfcOpeningElementTypeEnum, IfcOpeningElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcopeningelement.htm */
export  class IfcOpeningElement extends IfcFeatureElementSubtraction {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCOPENINGELEMENT
  }
  private PredefinedType_? : IfcOpeningElementTypeEnum | null

  public get PredefinedType() : IfcOpeningElementTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcOpeningElementTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcOpeningElementTypeEnum | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCOPENINGELEMENT, EntityTypesIfc.IFCOPENINGSTANDARDCASE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCOPENINGELEMENT
}
