
import { IfcCurve } from "./index"
import { IfcAxis2Placement2D } from "./index"
import { IfcAxis2Placement3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconic.htm */
export abstract class IfcConic extends IfcCurve {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONIC
  }
  private Position_? : IfcAxis2Placement2D | IfcAxis2Placement3D

  public get Position() : IfcAxis2Placement2D | IfcAxis2Placement3D {
    if ( this.Position_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 0, 0, 3, false )

      if ( !( value instanceof IfcAxis2Placement2D ) && !( value instanceof IfcAxis2Placement3D ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.Position_ = value as (IfcAxis2Placement2D | IfcAxis2Placement3D)

    }

    return this.Position_ as IfcAxis2Placement2D | IfcAxis2Placement3D
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCIRCLE, EntityTypesIfc.IFCELLIPSE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONIC
}
