
import { IfcStructuralItem } from "./index"
import { IfcBoundaryCondition } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcStructuralConnection extends IfcStructuralItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSTRUCTURALCONNECTION
  }
  private AppliedCondition_? : IfcBoundaryCondition | null

  public get AppliedCondition() : IfcBoundaryCondition | null {
    if ( this.AppliedCondition_ === void 0 ) {
      this.AppliedCondition_ = this.extractElement( 7, 7, 5, true, IfcBoundaryCondition )
    }

    return this.AppliedCondition_ as IfcBoundaryCondition | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcStructuralConnection.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcStructuralConnection" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSTRUCTURALCURVECONNECTION, EntityTypesIfc4x3.IFCSTRUCTURALPOINTCONNECTION, EntityTypesIfc4x3.IFCSTRUCTURALSURFACECONNECTION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSTRUCTURALCONNECTION
}
