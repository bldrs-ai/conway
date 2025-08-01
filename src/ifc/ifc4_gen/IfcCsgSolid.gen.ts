
import { IfcSolidModel } from "./index"
import { IfcBooleanResult } from "./index"
import { IfcCsgPrimitive3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccsgsolid.htm */
export  class IfcCsgSolid extends IfcSolidModel {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCSGSOLID
  }
  private TreeRootExpression_? : IfcBooleanResult | IfcCsgPrimitive3D

  public get TreeRootExpression() : IfcBooleanResult | IfcCsgPrimitive3D {
    if ( this.TreeRootExpression_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCSGSOLID ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCSGSOLID
}
