
import { IfcNamedUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcderivedunitelement.htm */
export  class IfcDerivedUnitElement extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDERIVEDUNITELEMENT
  }
  private Unit_? : IfcNamedUnit
  private Exponent_? : number

  public get Unit() : IfcNamedUnit {
    if ( this.Unit_ === void 0 ) {
      this.Unit_ = this.extractElement( 0, 0, 0, false, IfcNamedUnit )
    }

    return this.Unit_ as IfcNamedUnit
  }

  public get Exponent() : number {
    if ( this.Exponent_ === void 0 ) {
      this.Exponent_ = this.extractNumber( 1, 0, 0, false )
    }

    return this.Exponent_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDERIVEDUNITELEMENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDERIVEDUNITELEMENT
}
