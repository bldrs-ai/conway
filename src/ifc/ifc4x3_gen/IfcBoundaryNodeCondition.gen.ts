
import { IfcBoundaryCondition } from "./index"
import { IfcBoolean } from "./index"
import { IfcLinearStiffnessMeasure } from "./index"
import { IfcRotationalStiffnessMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBoundaryNodeCondition extends IfcBoundaryCondition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBOUNDARYNODECONDITION
  }
  private TranslationalStiffnessX_? : IfcBoolean | IfcLinearStiffnessMeasure | null
  private TranslationalStiffnessY_? : IfcBoolean | IfcLinearStiffnessMeasure | null
  private TranslationalStiffnessZ_? : IfcBoolean | IfcLinearStiffnessMeasure | null
  private RotationalStiffnessX_? : IfcBoolean | IfcRotationalStiffnessMeasure | null
  private RotationalStiffnessY_? : IfcBoolean | IfcRotationalStiffnessMeasure | null
  private RotationalStiffnessZ_? : IfcBoolean | IfcRotationalStiffnessMeasure | null

  public get TranslationalStiffnessX() : IfcBoolean | IfcLinearStiffnessMeasure | null {
    if ( this.TranslationalStiffnessX_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 1, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcLinearStiffnessMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TranslationalStiffnessX_ = value as (IfcBoolean | IfcLinearStiffnessMeasure)

    }

    return this.TranslationalStiffnessX_ as IfcBoolean | IfcLinearStiffnessMeasure | null
  }

  public get TranslationalStiffnessY() : IfcBoolean | IfcLinearStiffnessMeasure | null {
    if ( this.TranslationalStiffnessY_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 2, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcLinearStiffnessMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TranslationalStiffnessY_ = value as (IfcBoolean | IfcLinearStiffnessMeasure)

    }

    return this.TranslationalStiffnessY_ as IfcBoolean | IfcLinearStiffnessMeasure | null
  }

  public get TranslationalStiffnessZ() : IfcBoolean | IfcLinearStiffnessMeasure | null {
    if ( this.TranslationalStiffnessZ_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 3, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcLinearStiffnessMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TranslationalStiffnessZ_ = value as (IfcBoolean | IfcLinearStiffnessMeasure)

    }

    return this.TranslationalStiffnessZ_ as IfcBoolean | IfcLinearStiffnessMeasure | null
  }

  public get RotationalStiffnessX() : IfcBoolean | IfcRotationalStiffnessMeasure | null {
    if ( this.RotationalStiffnessX_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 4, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcRotationalStiffnessMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RotationalStiffnessX_ = value as (IfcBoolean | IfcRotationalStiffnessMeasure)

    }

    return this.RotationalStiffnessX_ as IfcBoolean | IfcRotationalStiffnessMeasure | null
  }

  public get RotationalStiffnessY() : IfcBoolean | IfcRotationalStiffnessMeasure | null {
    if ( this.RotationalStiffnessY_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 5, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcRotationalStiffnessMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RotationalStiffnessY_ = value as (IfcBoolean | IfcRotationalStiffnessMeasure)

    }

    return this.RotationalStiffnessY_ as IfcBoolean | IfcRotationalStiffnessMeasure | null
  }

  public get RotationalStiffnessZ() : IfcBoolean | IfcRotationalStiffnessMeasure | null {
    if ( this.RotationalStiffnessZ_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 6, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcRotationalStiffnessMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RotationalStiffnessZ_ = value as (IfcBoolean | IfcRotationalStiffnessMeasure)

    }

    return this.RotationalStiffnessZ_ as IfcBoolean | IfcRotationalStiffnessMeasure | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBoundaryNodeCondition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBoundaryNodeCondition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBOUNDARYNODECONDITION, EntityTypesIfc4x3.IFCBOUNDARYNODECONDITIONWARPING ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBOUNDARYNODECONDITION
}
