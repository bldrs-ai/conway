
import { IfcBoundaryCondition } from "./index"
import { IfcBoolean } from "./index"
import { IfcModulusOfSubgradeReactionMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcBoundaryFaceCondition extends IfcBoundaryCondition {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCBOUNDARYFACECONDITION
  }
  private TranslationalStiffnessByAreaX_? : IfcBoolean | IfcModulusOfSubgradeReactionMeasure | null
  private TranslationalStiffnessByAreaY_? : IfcBoolean | IfcModulusOfSubgradeReactionMeasure | null
  private TranslationalStiffnessByAreaZ_? : IfcBoolean | IfcModulusOfSubgradeReactionMeasure | null

  public get TranslationalStiffnessByAreaX() : IfcBoolean | IfcModulusOfSubgradeReactionMeasure | null {
    if ( this.TranslationalStiffnessByAreaX_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 1, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcModulusOfSubgradeReactionMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TranslationalStiffnessByAreaX_ = value as (IfcBoolean | IfcModulusOfSubgradeReactionMeasure)

    }

    return this.TranslationalStiffnessByAreaX_ as IfcBoolean | IfcModulusOfSubgradeReactionMeasure | null
  }

  public get TranslationalStiffnessByAreaY() : IfcBoolean | IfcModulusOfSubgradeReactionMeasure | null {
    if ( this.TranslationalStiffnessByAreaY_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 2, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcModulusOfSubgradeReactionMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TranslationalStiffnessByAreaY_ = value as (IfcBoolean | IfcModulusOfSubgradeReactionMeasure)

    }

    return this.TranslationalStiffnessByAreaY_ as IfcBoolean | IfcModulusOfSubgradeReactionMeasure | null
  }

  public get TranslationalStiffnessByAreaZ() : IfcBoolean | IfcModulusOfSubgradeReactionMeasure | null {
    if ( this.TranslationalStiffnessByAreaZ_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 3, 1, 1, true )

      if ( !( value instanceof IfcBoolean ) && !( value instanceof IfcModulusOfSubgradeReactionMeasure ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.TranslationalStiffnessByAreaZ_ = value as (IfcBoolean | IfcModulusOfSubgradeReactionMeasure)

    }

    return this.TranslationalStiffnessByAreaZ_ as IfcBoolean | IfcModulusOfSubgradeReactionMeasure | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcBoundaryFaceCondition.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcBoundaryFaceCondition" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCBOUNDARYFACECONDITION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCBOUNDARYFACECONDITION
}
