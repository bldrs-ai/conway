
import { IfcCartesianTransformationOperator } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCartesianTransformationOperator3D extends IfcCartesianTransformationOperator {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR3D
  }
  private Axis3_? : IfcDirection | null

  public get Axis3() : IfcDirection | null {
    if ( this.Axis3_ === void 0 ) {
      this.Axis3_ = this.extractElement( 4, 4, 3, true, IfcDirection )
    }

    return this.Axis3_ as IfcDirection | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCartesianTransformationOperator3D.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCartesianTransformationOperator3D" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR3D, EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR3D
}
