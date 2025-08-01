
import { IfcLabel } from "./index"
import { IfcText } from "./index"
import { IfcConstraintEnum, IfcConstraintEnumDeserializeStep } from "./index"
import { IfcOrganization } from "./index"
import { IfcPerson } from "./index"
import { IfcPersonAndOrganization } from "./index"
import { IfcDateTime } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcconstraint.htm */
export abstract class IfcConstraint extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCONSTRAINT
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
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMETRIC, EntityTypesIfc.IFCOBJECTIVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCONSTRAINT
}
