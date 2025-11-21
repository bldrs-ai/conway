
import { IfcFeatureElementSubtraction } from "./index"
import { IfcVoidingFeatureTypeEnum, IfcVoidingFeatureTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcvoidingfeature.htm */
export  class IfcVoidingFeature extends IfcFeatureElementSubtraction {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCVOIDINGFEATURE
  }
  private PredefinedType_? : IfcVoidingFeatureTypeEnum | null

  public get PredefinedType() : IfcVoidingFeatureTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 7, IfcVoidingFeatureTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcVoidingFeatureTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCVOIDINGFEATURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCVOIDINGFEATURE
}
