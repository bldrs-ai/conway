
import { IfcProfileDef } from "./index"
import { IfcCartesianTransformationOperator2D } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcderivedprofiledef.htm */
export  class IfcDerivedProfileDef extends IfcProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCDERIVEDPROFILEDEF
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCDERIVEDPROFILEDEF, EntityTypesIfc.IFCMIRROREDPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCDERIVEDPROFILEDEF
}
