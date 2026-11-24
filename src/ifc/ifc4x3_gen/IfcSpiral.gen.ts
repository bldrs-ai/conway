
import { IfcCurve } from "./index"
import { IfcAxis2Placement2D } from "./index"
import { IfcAxis2Placement3D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcSpiral extends IfcCurve {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSPIRAL
  }
  private Position_? : IfcAxis2Placement2D | IfcAxis2Placement3D

  public get Position() : IfcAxis2Placement2D | IfcAxis2Placement3D {
    if ( this.Position_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSpiral.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSpiral" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCLOTHOID, EntityTypesIfc4x3.IFCCOSINESPIRAL, EntityTypesIfc4x3.IFCSECONDORDERPOLYNOMIALSPIRAL, EntityTypesIfc4x3.IFCSEVENTHORDERPOLYNOMIALSPIRAL, EntityTypesIfc4x3.IFCSINESPIRAL, EntityTypesIfc4x3.IFCTHIRDORDERPOLYNOMIALSPIRAL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSPIRAL
}
