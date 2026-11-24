
import { IfcCartesianTransformationOperator3D } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCartesianTransformationOperator3DnonUniform extends IfcCartesianTransformationOperator3D {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM
  }
  private Scale2_? : number | null
  private Scale3_? : number | null

  public get Scale2() : number | null {
    if ( this.Scale2_ === void 0 ) {
      this.Scale2_ = this.extractNumber( 5, 5, 4, true )
    }

    return this.Scale2_ as number | null
  }

  public get Scale3() : number | null {
    if ( this.Scale3_ === void 0 ) {
      this.Scale3_ = this.extractNumber( 6, 5, 4, true )
    }

    return this.Scale3_ as number | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCartesianTransformationOperator3DnonUniform.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCartesianTransformationOperator3DnonUniform" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCARTESIANTRANSFORMATIONOPERATOR3DNONUNIFORM
}
