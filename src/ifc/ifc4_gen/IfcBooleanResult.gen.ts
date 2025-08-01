
import { IfcGeometricRepresentationItem } from "./index"
import { IfcBooleanOperator, IfcBooleanOperatorDeserializeStep } from "./index"
import { IfcCsgPrimitive3D } from "./index"
import { IfcHalfSpaceSolid } from "./index"
import { IfcSolidModel } from "./index"
import { IfcTessellatedFaceSet } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcbooleanresult.htm */
export  class IfcBooleanResult extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBOOLEANRESULT
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
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBOOLEANRESULT, EntityTypesIfc.IFCBOOLEANCLIPPINGRESULT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBOOLEANRESULT
}
