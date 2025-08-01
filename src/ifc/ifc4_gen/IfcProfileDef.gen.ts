
import { IfcProfileTypeEnum, IfcProfileTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcprofiledef.htm */
export  class IfcProfileDef extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPROFILEDEF
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCPROFILEDEF, EntityTypesIfc.IFCARBITRARYCLOSEDPROFILEDEF, EntityTypesIfc.IFCARBITRARYOPENPROFILEDEF, EntityTypesIfc.IFCCOMPOSITEPROFILEDEF, EntityTypesIfc.IFCDERIVEDPROFILEDEF, EntityTypesIfc.IFCARBITRARYPROFILEDEFWITHVOIDS, EntityTypesIfc.IFCCENTERLINEPROFILEDEF, EntityTypesIfc.IFCMIRROREDPROFILEDEF, EntityTypesIfc.IFCASYMMETRICISHAPEPROFILEDEF, EntityTypesIfc.IFCCSHAPEPROFILEDEF, EntityTypesIfc.IFCCIRCLEPROFILEDEF, EntityTypesIfc.IFCELLIPSEPROFILEDEF, EntityTypesIfc.IFCISHAPEPROFILEDEF, EntityTypesIfc.IFCLSHAPEPROFILEDEF, EntityTypesIfc.IFCRECTANGLEPROFILEDEF, EntityTypesIfc.IFCTSHAPEPROFILEDEF, EntityTypesIfc.IFCTRAPEZIUMPROFILEDEF, EntityTypesIfc.IFCUSHAPEPROFILEDEF, EntityTypesIfc.IFCZSHAPEPROFILEDEF, EntityTypesIfc.IFCCIRCLEHOLLOWPROFILEDEF, EntityTypesIfc.IFCRECTANGLEHOLLOWPROFILEDEF, EntityTypesIfc.IFCROUNDEDRECTANGLEPROFILEDEF ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPROFILEDEF
}
