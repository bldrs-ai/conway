
import { IfcElement } from "./index"
import { IfcGeographicElementTypeEnum, IfcGeographicElementTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcgeographicelement.htm */
export  class IfcGeographicElement extends IfcElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCGEOGRAPHICELEMENT
  }
  private PredefinedType_? : IfcGeographicElementTypeEnum | null

  public get PredefinedType() : IfcGeographicElementTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 8, 8, 5, IfcGeographicElementTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcGeographicElementTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCGEOGRAPHICELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCGEOGRAPHICELEMENT
}
