
import { IfcSpatialStructureElementType } from "./index"
import { IfcSpaceTypeEnum, IfcSpaceTypeEnumDeserializeStep } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcspacetype.htm */
export  class IfcSpaceType extends IfcSpatialStructureElementType {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSPACETYPE
  }
  private PredefinedType_? : IfcSpaceTypeEnum
  private LongName_? : string | null

  public get PredefinedType() : IfcSpaceTypeEnum {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcSpaceTypeEnumDeserializeStep, false )
    }

    return this.PredefinedType_ as IfcSpaceTypeEnum
  }

  public get LongName() : string | null {
    if ( this.LongName_ === void 0 ) {
      this.LongName_ = this.extractString( 10, 9, 6, true )
    }

    return this.LongName_ as string | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSPACETYPE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSPACETYPE
}
