
import { IfcProfileDef } from "./index"
import { IfcAxis2Placement2D } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcParameterizedProfileDef extends IfcProfileDef {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPARAMETERIZEDPROFILEDEF
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcParameterizedProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcParameterizedProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCASYMMETRICISHAPEPROFILEDEF, EntityTypesIfc4x3.IFCCSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCCIRCLEPROFILEDEF, EntityTypesIfc4x3.IFCELLIPSEPROFILEDEF, EntityTypesIfc4x3.IFCISHAPEPROFILEDEF, EntityTypesIfc4x3.IFCLSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCRECTANGLEPROFILEDEF, EntityTypesIfc4x3.IFCTSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCTRAPEZIUMPROFILEDEF, EntityTypesIfc4x3.IFCUSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCZSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCCIRCLEHOLLOWPROFILEDEF, EntityTypesIfc4x3.IFCRECTANGLEHOLLOWPROFILEDEF, EntityTypesIfc4x3.IFCROUNDEDRECTANGLEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPARAMETERIZEDPROFILEDEF
}
