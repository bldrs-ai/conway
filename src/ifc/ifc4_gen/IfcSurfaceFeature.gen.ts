
import { IfcFeatureElement } from "./index"
import { IfcSurfaceFeatureTypeEnum, IfcSurfaceFeatureTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsurfacefeature.htm */
export  class IfcSurfaceFeature extends IfcFeatureElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSURFACEFEATURE
  }
  private PredefinedType_? : IfcSurfaceFeatureTypeEnum | null

  public get PredefinedType() : IfcSurfaceFeatureTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 6, IfcSurfaceFeatureTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSurfaceFeatureTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSURFACEFEATURE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSURFACEFEATURE
}
