
import { IfcAddressTypeEnum, IfcAddressTypeEnumDeserializeStep } from "./index"
import { IfcText } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcaddress.htm */
export abstract class IfcAddress extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCADDRESS
  }
  private Purpose_? : IfcAddressTypeEnum | null
  private Description_? : string | null
  private UserDefinedPurpose_? : string | null

  public get Purpose() : IfcAddressTypeEnum | null {
    if ( this.Purpose_ === void 0 ) {
      this.Purpose_ = this.extractLambda( 0, 0, 0, IfcAddressTypeEnumDeserializeStep, true )
    }

    return this.Purpose_ as IfcAddressTypeEnum | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 0, true )
    }

    return this.Description_ as string | null
  }

  public get UserDefinedPurpose() : string | null {
    if ( this.UserDefinedPurpose_ === void 0 ) {
      this.UserDefinedPurpose_ = this.extractString( 2, 0, 0, true )
    }

    return this.UserDefinedPurpose_ as string | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPOSTALADDRESS, EntityTypesIfc.IFCTELECOMADDRESS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCADDRESS
}
