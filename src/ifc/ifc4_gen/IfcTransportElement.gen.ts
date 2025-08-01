
import { IfcElement } from "./index"
import { IfcTransportElementTypeEnum, IfcTransportElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctransportelement.htm */
export  class IfcTransportElement extends IfcElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTRANSPORTELEMENT
  }
  private PredefinedType_? : IfcTransportElementTypeEnum | null

  public get PredefinedType() : IfcTransportElementTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 5, IfcTransportElementTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcTransportElementTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTRANSPORTELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTRANSPORTELEMENT
}
