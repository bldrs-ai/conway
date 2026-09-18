
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcConstraintEnum, IfcConstraintEnumDeserializeStep } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"
import { IfcDateTime } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcConstraint extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCCONSTRAINT
  }
  private Name_? : string
  private Description_? : string | null
  private ConstraintGrade_? : IfcConstraintEnum
  private ConstraintSource_? : string | null
  private CreatingActor_? : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  private CreationTime_? : string | null
  private UserDefinedGrade_? : string | null

  public get Name() : string {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 0, 0, 0, false )
    }

    return this.Name_ as string
  }

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 1, 0, 0, true )
    }

    return this.Description_ as string | null
  }

  public get ConstraintGrade() : IfcConstraintEnum {
    if ( this.ConstraintGrade_ === void 0 ) {
      this.ConstraintGrade_ = this.extractLambda( 2, 0, 0, IfcConstraintEnumDeserializeStep, false )
    }

    return this.ConstraintGrade_ as IfcConstraintEnum
  }

  public get ConstraintSource() : string | null {
    if ( this.ConstraintSource_ === void 0 ) {
      this.ConstraintSource_ = this.extractString( 3, 0, 0, true )
    }

    return this.ConstraintSource_ as string | null
  }

  public get CreatingActor() : IfcOrganization | IfcPerson | IfcPersonAndOrganization | null {
    if ( this.CreatingActor_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
        this.extractReference( 4, 0, 0, true )

      if ( !( value instanceof IfcOrganization ) && !( value instanceof IfcPerson ) && !( value instanceof IfcPersonAndOrganization ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.CreatingActor_ = value as (IfcOrganization | IfcPerson | IfcPersonAndOrganization)

    }

    return this.CreatingActor_ as IfcOrganization | IfcPerson | IfcPersonAndOrganization | null
  }

  public get CreationTime() : string | null {
    if ( this.CreationTime_ === void 0 ) {
      this.CreationTime_ = this.extractString( 5, 0, 0, true )
    }

    return this.CreationTime_ as string | null
  }

  public get UserDefinedGrade() : string | null {
    if ( this.UserDefinedGrade_ === void 0 ) {
      this.UserDefinedGrade_ = this.extractString( 6, 0, 0, true )
    }

    return this.UserDefinedGrade_ as string | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcConstraint.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcConstraint" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMETRIC, EntityTypesIfc4x3.IFCOBJECTIVE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCCONSTRAINT
}
