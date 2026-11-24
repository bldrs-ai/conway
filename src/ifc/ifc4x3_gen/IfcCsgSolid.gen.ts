
import { IfcSolidModel } from "./index"
import { IfcBooleanResult } from "./index"
import { IfcCsgPrimitive3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcCsgSolid extends IfcSolidModel {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCSGSOLID
  }
  private TreeRootExpression_? : IfcBooleanResult | IfcCsgPrimitive3D

  public get TreeRootExpression() : IfcBooleanResult | IfcCsgPrimitive3D {
    if ( this.TreeRootExpression_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 0, 0, 3, false )

      if ( !( value instanceof IfcBooleanResult ) && !( value instanceof IfcCsgPrimitive3D ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TreeRootExpression_ = value as (IfcBooleanResult | IfcCsgPrimitive3D)

    }

    return this.TreeRootExpression_ as IfcBooleanResult | IfcCsgPrimitive3D
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcCsgSolid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcCsgSolid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCSGSOLID ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCSGSOLID
}
