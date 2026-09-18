
import { IfcCartesianTransformationOperator2D } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCartesianTransformationOperator2DnonUniform extends IfcCartesianTransformationOperator2D {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORM
  }
  private Scale2_? : number | null

  public get Scale2() : number | null {
    if ( this.Scale2_ === void 0 ) {
      this.Scale2_ = this.extractNumber( 4, 4, 4, true )
    }

    return this.Scale2_ as number | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCartesianTransformationOperator2DnonUniform.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCartesianTransformationOperator2DnonUniform" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORM ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR2DNONUNIFORM
}
