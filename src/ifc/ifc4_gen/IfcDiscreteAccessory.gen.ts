
import { IfcElementComponent } from "./index"
import { IfcDiscreteAccessoryTypeEnum, IfcDiscreteAccessoryTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcdiscreteaccessory.htm */
export  class IfcDiscreteAccessory extends IfcElementComponent {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDISCRETEACCESSORY
  }
  private PredefinedType_? : IfcDiscreteAccessoryTypeEnum | null

  public get PredefinedType() : IfcDiscreteAccessoryTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcDiscreteAccessoryTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcDiscreteAccessoryTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDISCRETEACCESSORY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDISCRETEACCESSORY
}
