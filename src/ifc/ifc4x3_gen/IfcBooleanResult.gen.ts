
import { IfcGeometricRepresentationItem } from "./index"
import { IfcBooleanOperator, IfcBooleanOperatorDeserializeStep } from "./index"
import { IfcCsgPrimitive3D } from "./index"
import { IfcHalfSpaceSolid } from "./index"
import { IfcSolidModel } from "./index"
import { IfcTessellatedFaceSet } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBooleanResult extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBOOLEANRESULT
  }
  private Operator_? : IfcBooleanOperator
  private FirstOperand_? : IfcBooleanResult | IfcCsgPrimitive3D | IfcHalfSpaceSolid | IfcSolidModel | IfcTessellatedFaceSet
  private SecondOperand_? : IfcBooleanResult | IfcCsgPrimitive3D | IfcHalfSpaceSolid | IfcSolidModel | IfcTessellatedFaceSet

  public get Operator() : IfcBooleanOperator {
    if ( this.Operator_ === void 0 ) {
      this.Operator_ = this.extractLambda( 0, 0, 2, IfcBooleanOperatorDeserializeStep, false )
    }

    return this.Operator_ as IfcBooleanOperator
  }

  public get FirstOperand() : IfcBooleanResult | IfcCsgPrimitive3D | IfcHalfSpaceSolid | IfcSolidModel | IfcTessellatedFaceSet {
    if ( this.FirstOperand_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 1, 0, 2, false )

      if ( !( value instanceof IfcBooleanResult ) && !( value instanceof IfcCsgPrimitive3D ) && !( value instanceof IfcHalfSpaceSolid ) && !( value instanceof IfcSolidModel ) && !( value instanceof IfcTessellatedFaceSet ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.FirstOperand_ = value as (IfcBooleanResult | IfcCsgPrimitive3D | IfcHalfSpaceSolid | IfcSolidModel | IfcTessellatedFaceSet)

    }

    return this.FirstOperand_ as IfcBooleanResult | IfcCsgPrimitive3D | IfcHalfSpaceSolid | IfcSolidModel | IfcTessellatedFaceSet
  }

  public get SecondOperand() : IfcBooleanResult | IfcCsgPrimitive3D | IfcHalfSpaceSolid | IfcSolidModel | IfcTessellatedFaceSet {
    if ( this.SecondOperand_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 2, 0, 2, false )

      if ( !( value instanceof IfcBooleanResult ) && !( value instanceof IfcCsgPrimitive3D ) && !( value instanceof IfcHalfSpaceSolid ) && !( value instanceof IfcSolidModel ) && !( value instanceof IfcTessellatedFaceSet ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.SecondOperand_ = value as (IfcBooleanResult | IfcCsgPrimitive3D | IfcHalfSpaceSolid | IfcSolidModel | IfcTessellatedFaceSet)

    }

    return this.SecondOperand_ as IfcBooleanResult | IfcCsgPrimitive3D | IfcHalfSpaceSolid | IfcSolidModel | IfcTessellatedFaceSet
  }

  public get Dim() : number {
    return this?.FirstOperand?.Dim;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBooleanResult.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBooleanResult" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBOOLEANRESULT, EntityTypesIfc4x3.IFCBOOLEANCLIPPINGRESULT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBOOLEANRESULT
}
