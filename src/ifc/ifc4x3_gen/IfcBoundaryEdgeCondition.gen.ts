
import { IfcBoundaryCondition } from "./index"
import { IfcBoolean } from "./index"
import { IfcModulusOfLinearSubgradeReactionMeasure } from "./index"
import { IfcModulusOfRotationalSubgradeReactionMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBoundaryEdgeCondition extends IfcBoundaryCondition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBOUNDARYEDGECONDITION
  }
  private TranslationalStiffnessByLengthX_? : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null
  private TranslationalStiffnessByLengthY_? : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null
  private TranslationalStiffnessByLengthZ_? : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null
  private RotationalStiffnessByLengthX_? : IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null
  private RotationalStiffnessByLengthY_? : IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null
  private RotationalStiffnessByLengthZ_? : IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null

  public get TranslationalStiffnessByLengthX() : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null {
    if ( this.TranslationalStiffnessByLengthX_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 1, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcModulusOfLinearSubgradeReactionMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TranslationalStiffnessByLengthX_ = value as (IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure)

    }

    return this.TranslationalStiffnessByLengthX_ as IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null
  }

  public get TranslationalStiffnessByLengthY() : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null {
    if ( this.TranslationalStiffnessByLengthY_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 2, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcModulusOfLinearSubgradeReactionMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TranslationalStiffnessByLengthY_ = value as (IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure)

    }

    return this.TranslationalStiffnessByLengthY_ as IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null
  }

  public get TranslationalStiffnessByLengthZ() : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null {
    if ( this.TranslationalStiffnessByLengthZ_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 3, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcModulusOfLinearSubgradeReactionMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TranslationalStiffnessByLengthZ_ = value as (IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure)

    }

    return this.TranslationalStiffnessByLengthZ_ as IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null
  }

  public get RotationalStiffnessByLengthX() : IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null {
    if ( this.RotationalStiffnessByLengthX_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 4, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcModulusOfRotationalSubgradeReactionMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RotationalStiffnessByLengthX_ = value as (IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure)

    }

    return this.RotationalStiffnessByLengthX_ as IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null
  }

  public get RotationalStiffnessByLengthY() : IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null {
    if ( this.RotationalStiffnessByLengthY_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 5, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcModulusOfRotationalSubgradeReactionMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RotationalStiffnessByLengthY_ = value as (IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure)

    }

    return this.RotationalStiffnessByLengthY_ as IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null
  }

  public get RotationalStiffnessByLengthZ() : IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null {
    if ( this.RotationalStiffnessByLengthZ_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 6, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcModulusOfRotationalSubgradeReactionMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RotationalStiffnessByLengthZ_ = value as (IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure)

    }

    return this.RotationalStiffnessByLengthZ_ as IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBoundaryEdgeCondition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBoundaryEdgeCondition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBOUNDARYEDGECONDITION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBOUNDARYEDGECONDITION
}
