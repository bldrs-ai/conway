
import { IfcRelAssociates } from "./index"
import { IfcLabel } from "./index"
import { IfcConstraint } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelAssociatesConstraint extends IfcRelAssociates {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELASSOCIATESCONSTRAINT
  }
  private Intent_? : string | null
  private RelatingConstraint_? : IfcConstraint

  public get Intent() : string | null {
    if ( this.Intent_ === void 0 ) {
      this.Intent_ = this.extractString( 5, 5, 3, true )
    }

    return this.Intent_ as string | null
  }

  public get RelatingConstraint() : IfcConstraint {
    if ( this.RelatingConstraint_ === void 0 ) {
      this.RelatingConstraint_ = this.extractElement( 6, 5, 3, false, IfcConstraint )
    }

    return this.RelatingConstraint_ as IfcConstraint
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelAssociatesConstraint.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelAssociatesConstraint" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELASSOCIATESCONSTRAINT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELASSOCIATESCONSTRAINT
}
