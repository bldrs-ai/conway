
import { IfcGroup } from "./index"
import { IfcInventoryTypeEnum, IfcInventoryTypeEnumDeserializeStep } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"
import { IfcDate } from "./index"
import { IfcCostValue } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcinventory.htm */
export  class IfcInventory extends IfcGroup {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCINVENTORY
  }
  private PredefinedType_? : IfcInventoryTypeEnum | null
  private Jurisdiction_? : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  private ResponsiblePersons_? : Array<IfcPerson> | null
  private LastUpdateDate_? : string | null
  private CurrentValue_? : IfcCostValue | null
  private OriginalValue_? : IfcCostValue | null

  public get PredefinedType() : IfcInventoryTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 5, 5, 4, IfcInventoryTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcInventoryTypeEnum | null
  }

  public get Jurisdiction() : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null {
    if ( this.Jurisdiction_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 6, 5, 4, true )

      if ( !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.Jurisdiction_ = value as (IfcOrganization | IfcPerson | IfcPersonAndOrganization)

    }

    return this.Jurisdiction_ as IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  }

  public get ResponsiblePersons() : Array<IfcPerson> | null {
    if ( this.ResponsiblePersons_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 7, 5, 4 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return null
      }

      const value : Array<IfcPerson> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcPerson )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.ResponsiblePersons_ = value
    }

    return this.ResponsiblePersons_ as Array<IfcPerson> | null
  }

  public get LastUpdateDate() : string | null {
    if ( this.LastUpdateDate_ === void 0 ) {
      this.LastUpdateDate_ = this.extractString( 8, 5, 4, true )
    }

    return this.LastUpdateDate_ as string | null
  }

  public get CurrentValue() : IfcCostValue | null {
    if ( this.CurrentValue_ === void 0 ) {
      this.CurrentValue_ = this.extractElement( 9, 5, 4, true, IfcCostValue )
    }

    return this.CurrentValue_ as IfcCostValue | null
  }

  public get OriginalValue() : IfcCostValue | null {
    if ( this.OriginalValue_ === void 0 ) {
      this.OriginalValue_ = this.extractElement( 10, 5, 4, true, IfcCostValue )
    }

    return this.OriginalValue_ as IfcCostValue | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCINVENTORY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCINVENTORY
}
