
import { IfcProduct } from "./index"
import { IfcObjectTypeEnum, IfcObjectTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcproxy.htm */
export  class IfcProxy extends IfcProduct {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROXY
  }
  private ProxyType_? : IfcObjectTypeEnum
  private Tag_? : string | null

  public get ProxyType() : IfcObjectTypeEnum {
    if ( this.ProxyType_ === void 0 ) {
      this.ProxyType_ = this.extractLambda( 7, 7, 4, IfcObjectTypeEnumDeserializeStep, false )
    }

    return this.ProxyType_ as IfcObjectTypeEnum
  }

  public get Tag() : string | null {
    if ( this.Tag_ === void 0 ) {
      this.Tag_ = this.extractString( 8, 7, 4, true )
    }

    return this.Tag_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROXY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROXY
}
