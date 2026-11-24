
import { IfcProfileTypeEnum, IfcProfileTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcProfileDef extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPROFILEDEF
  }
  private ProfileType_? : IfcProfileTypeEnum
  private ProfileName_? : string | null

  public get ProfileType() : IfcProfileTypeEnum {
    if ( this.ProfileType_ === void 0 ) {
      this.ProfileType_ = this.extractLambda( 0, 0, 0, IfcProfileTypeEnumDeserializeStep, false )
    }

    return this.ProfileType_ as IfcProfileTypeEnum
  }

  public get ProfileName() : string | null {
    if ( this.ProfileName_ === void 0 ) {
      this.ProfileName_ = this.extractString( 1, 0, 0, true )
    }

    return this.ProfileName_ as string | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcProfileDef.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcProfileDef" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPROFILEDEF, EntityTypesIfc4x3.IFCARBITRARYCLOSEDPROFILEDEF, EntityTypesIfc4x3.IFCARBITRARYOPENPROFILEDEF, EntityTypesIfc4x3.IFCCOMPOSITEPROFILEDEF, EntityTypesIfc4x3.IFCDERIVEDPROFILEDEF, EntityTypesIfc4x3.IFCOPENCROSSPROFILEDEF, EntityTypesIfc4x3.IFCARBITRARYPROFILEDEFWITHVOIDS, EntityTypesIfc4x3.IFCCENTERLINEPROFILEDEF, EntityTypesIfc4x3.IFCMIRROREDPROFILEDEF, EntityTypesIfc4x3.IFCASYMMETRICISHAPEPROFILEDEF, EntityTypesIfc4x3.IFCCSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCCIRCLEPROFILEDEF, EntityTypesIfc4x3.IFCELLIPSEPROFILEDEF, EntityTypesIfc4x3.IFCISHAPEPROFILEDEF, EntityTypesIfc4x3.IFCLSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCRECTANGLEPROFILEDEF, EntityTypesIfc4x3.IFCTSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCTRAPEZIUMPROFILEDEF, EntityTypesIfc4x3.IFCUSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCZSHAPEPROFILEDEF, EntityTypesIfc4x3.IFCCIRCLEHOLLOWPROFILEDEF, EntityTypesIfc4x3.IFCRECTANGLEHOLLOWPROFILEDEF, EntityTypesIfc4x3.IFCROUNDEDRECTANGLEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPROFILEDEF
}
