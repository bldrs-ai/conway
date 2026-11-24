
import { IfcRelConnectsStructuralMember } from "./index"
import { IfcConnectionGeometry } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelConnectsWithEccentricity extends IfcRelConnectsStructuralMember {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELCONNECTSWITHECCENTRICITY
  }
  private ConnectionConstraint_? : IfcConnectionGeometry

  public get ConnectionConstraint() : IfcConnectionGeometry {
    if ( this.ConnectionConstraint_ === void 0 ) {
      this.ConnectionConstraint_ = this.extractElement( 10, 10, 4, false, IfcConnectionGeometry )
    }

    return this.ConnectionConstraint_ as IfcConnectionGeometry
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelConnectsWithEccentricity.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelConnectsWithEccentricity" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELCONNECTSWITHECCENTRICITY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELCONNECTSWITHECCENTRICITY
}
