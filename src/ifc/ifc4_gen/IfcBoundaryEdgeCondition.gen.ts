
import { IfcBoundaryCondition } from "./index"
import { IfcBoolean } from "./index"
import { IfcModulusOfLinearSubgradeReactionMeasure } from "./index"
import { IfcModulusOfRotationalSubgradeReactionMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcboundaryedgecondition.htm */
export  class IfcBoundaryEdgeCondition extends IfcBoundaryCondition {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBOUNDARYEDGECONDITION
  }
  private TranslationalStiffnessByLengthX_? : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null
  private TranslationalStiffnessByLengthY_? : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null
  private TranslationalStiffnessByLengthZ_? : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null
  private RotationalStiffnessByLengthX_? : IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null
  private RotationalStiffnessByLengthY_? : IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null
  private RotationalStiffnessByLengthZ_? : IfcBoolean | IfcModulusOfRotationalSubgradeReactionMeasure | null

  public get TranslationalStiffnessByLengthX() : IfcBoolean | IfcModulusOfLinearSubgradeReactionMeasure | null {
    if ( this.TranslationalStiffnessByLengthX_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBOUNDARYEDGECONDITION ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBOUNDARYEDGECONDITION
}
