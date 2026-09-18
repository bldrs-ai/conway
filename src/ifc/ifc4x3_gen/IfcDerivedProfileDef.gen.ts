
import { IfcProfileDef } from "./index"
import { IfcCartesianTransformationOperator2D } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcDerivedProfileDef extends IfcProfileDef {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCDERIVEDPROFILEDEF
  }
  private ParentProfile_? : IfcProfileDef
  private Operator_? : IfcCartesianTransformationOperator2D
  private Label_? : string | null

  public get ParentProfile() : IfcProfileDef {
    if ( this.ParentProfile_ === void 0 ) {
      this.ParentProfile_ = this.extractElement( 2, 2, 1, false, IfcProfileDef )
    }

    return this.ParentProfile_ as IfcProfileDef
  }

  public get Operator() : IfcCartesianTransformationOperator2D {
    if ( this.Operator_ === void 0 ) {
      this.Operator_ = this.extractElement( 3, 2, 1, false, IfcCartesianTransformationOperator2D )
    }

    return this.Operator_ as IfcCartesianTransformationOperator2D
  }

  public get Label() : string | null {
    if ( this.Label_ === void 0 ) {
      this.Label_ = this.extractString( 4, 2, 1, true )
    }

    return this.Label_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcDerivedProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcDerivedProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCDERIVEDPROFILEDEF, EntityTypesIfc4x3.IFCMIRROREDPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCDERIVEDPROFILEDEF
}
