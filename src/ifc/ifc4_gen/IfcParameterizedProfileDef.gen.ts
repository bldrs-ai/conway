
import { IfcProfileDef } from "./index"
import { IfcAxis2Placement2D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcparameterizedprofiledef.htm */
export abstract class IfcParameterizedProfileDef extends IfcProfileDef {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPARAMETERIZEDPROFILEDEF
  }
  private Position_? : IfcAxis2Placement2D | null

  public get Position() : IfcAxis2Placement2D | null {
    if ( this.Position_ === void 0 ) {
      this.Position_ = this.extractElement( 2, 2, 1, true, IfcAxis2Placement2D )
    }

    return this.Position_ as IfcAxis2Placement2D | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCASYMMETRICISHAPEPROFILEDEF, EntityTypesIfc.IFCCSHAPEPROFILEDEF, EntityTypesIfc.IFCCIRCLEPROFILEDEF, EntityTypesIfc.IFCELLIPSEPROFILEDEF, EntityTypesIfc.IFCISHAPEPROFILEDEF, EntityTypesIfc.IFCLSHAPEPROFILEDEF, EntityTypesIfc.IFCRECTANGLEPROFILEDEF, EntityTypesIfc.IFCTSHAPEPROFILEDEF, EntityTypesIfc.IFCTRAPEZIUMPROFILEDEF, EntityTypesIfc.IFCUSHAPEPROFILEDEF, EntityTypesIfc.IFCZSHAPEPROFILEDEF, EntityTypesIfc.IFCCIRCLEHOLLOWPROFILEDEF, EntityTypesIfc.IFCRECTANGLEHOLLOWPROFILEDEF, EntityTypesIfc.IFCROUNDEDRECTANGLEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPARAMETERIZEDPROFILEDEF
}
