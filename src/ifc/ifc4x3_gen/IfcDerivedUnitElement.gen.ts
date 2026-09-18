
import { IfcNamedUnit } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDerivedUnitElement extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDERIVEDUNITELEMENT
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDerivedUnitElement.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDerivedUnitElement" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDERIVEDUNITELEMENT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDERIVEDUNITELEMENT
}
