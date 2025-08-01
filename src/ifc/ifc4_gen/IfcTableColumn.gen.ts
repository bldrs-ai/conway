
import { IfcIdentifier } from "./index"
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcDerivedUnit } from "./index"
import { IfcMonetaryUnit } from "./index"
import { IfcNamedUnit } from "./index"
import { IfcReference } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctablecolumn.htm */
export  class IfcTableColumn extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTABLECOLUMN
  }
  private Identifier_? : string | null
  private Name_? : string | null
  private Description_? : string | null
  private Unit_? : IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null
  private ReferencePath_? : IfcReference | null

  public get Identifier() : string | null {
    if ( this.Identifier_ === void 0 ) {
      this.Identifier_ = this.extractString( 0, 0, 0, true )
    }

    return this.Identifier_ as string | null
  }

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 1, 0, 0, true )
    }

    return this.Name_ as string | null
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 2, 0, 0, true )
    }

    return this.Description_ as string | null
  }

  public get Unit() : IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null {
    if ( this.Unit_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 3, 0, 0, true )

      if ( !( value instanceof IfcDerivedUnit ) && !( value instanceof IfcMonetaryUnit ) && !( value instanceof IfcNamedUnit ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.Unit_ = value as (IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit)

    }

    return this.Unit_ as IfcDerivedUnit | IfcMonetaryUnit | IfcNamedUnit | null
  }

  public get ReferencePath() : IfcReference | null {
    if ( this.ReferencePath_ === void 0 ) {
      this.ReferencePath_ = this.extractElement( 4, 0, 0, true, IfcReference )
    }

    return this.ReferencePath_ as IfcReference | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTABLECOLUMN ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTABLECOLUMN
}
