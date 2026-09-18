
import { IfcAddressTypeEnum, IfcAddressTypeEnumDeserializeStep } from "./index"
import { IfcText } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcAddress extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCADDRESS
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcAddress.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcAddress" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPOSTALADDRESS, EntityTypesIfc4x3.IFCTELECOMADDRESS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCADDRESS
}
