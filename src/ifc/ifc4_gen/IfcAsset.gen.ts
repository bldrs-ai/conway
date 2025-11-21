
import { IfcGroup } from "./index"
import { IfcIdentifier } from "./index"
import { IfcCostValue } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"
import { IfcDate } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcasset.htm */
export  class IfcAsset extends IfcGroup {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCASSET
  }
  private Identification_? : string | null
  private OriginalValue_? : IfcCostValue | null
  private CurrentValue_? : IfcCostValue | null
  private TotalReplacementCost_? : IfcCostValue | null
  private Owner_? : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  private User_? : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  private ResponsiblePerson_? : IfcPerson | null
  private IncorporationDate_? : string | null
  private DepreciatedValue_? : IfcCostValue | null

  public get Identification() : string | null {
    if ( this.Identification_ === void 0 ) {
      this.Identification_ = this.extractString( 5, 5, 4, true )
    }

    return this.Identification_ as string | null
  }

  public get OriginalValue() : IfcCostValue | null {
    if ( this.OriginalValue_ === void 0 ) {
      this.OriginalValue_ = this.extractElement( 6, 5, 4, true, IfcCostValue )
    }

    return this.OriginalValue_ as IfcCostValue | null
  }

  public get CurrentValue() : IfcCostValue | null {
    if ( this.CurrentValue_ === void 0 ) {
      this.CurrentValue_ = this.extractElement( 7, 5, 4, true, IfcCostValue )
    }

    return this.CurrentValue_ as IfcCostValue | null
  }

  public get TotalReplacementCost() : IfcCostValue | null {
    if ( this.TotalReplacementCost_ === void 0 ) {
      this.TotalReplacementCost_ = this.extractElement( 8, 5, 4, true, IfcCostValue )
    }

    return this.TotalReplacementCost_ as IfcCostValue | null
  }

  public get Owner() : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null {
    if ( this.Owner_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 9, 5, 4, true )

      if ( !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.Owner_ = value as (IfcOrganization | IfcPerson | IfcPersonAndOrganization)

    }

    return this.Owner_ as IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  }

  public get User() : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null {
    if ( this.User_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 10, 5, 4, true )

      if ( !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.User_ = value as (IfcOrganization | IfcPerson | IfcPersonAndOrganization)

    }

    return this.User_ as IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  }

  public get ResponsiblePerson() : IfcPerson | null {
    if ( this.ResponsiblePerson_ === void 0 ) {
      this.ResponsiblePerson_ = this.extractElement( 11, 5, 4, true, IfcPerson )
    }

    return this.ResponsiblePerson_ as IfcPerson | null
  }

  public get IncorporationDate() : string | null {
    if ( this.IncorporationDate_ === void 0 ) {
      this.IncorporationDate_ = this.extractString( 12, 5, 4, true )
    }

    return this.IncorporationDate_ as string | null
  }

  public get DepreciatedValue() : IfcCostValue | null {
    if ( this.DepreciatedValue_ === void 0 ) {
      this.DepreciatedValue_ = this.extractElement( 13, 5, 4, true, IfcCostValue )
    }

    return this.DepreciatedValue_ as IfcCostValue | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCASSET ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCASSET
}
