
import { IfcPreDefinedProperties } from "./index"
import { IfcSectionTypeEnum, IfcSectionTypeEnumDeserializeStep } from "./index"
import { IfcProfileDef } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsectionproperties.htm */
export  class IfcSectionProperties extends IfcPreDefinedProperties {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSECTIONPROPERTIES
  }
  private SectionType_? : IfcSectionTypeEnum
  private StartProfile_? : IfcProfileDef
  private EndProfile_? : IfcProfileDef | null

  public get SectionType() : IfcSectionTypeEnum {
    if ( this.SectionType_ === void 0 ) {
      this.SectionType_ = this.extractLambda( 0, 0, 2, IfcSectionTypeEnumDeserializeStep, false )
    }

    return this.SectionType_ as IfcSectionTypeEnum
  }

  public get StartProfile() : IfcProfileDef {
    if ( this.StartProfile_ === void 0 ) {
      this.StartProfile_ = this.extractElement( 1, 0, 2, false, IfcProfileDef )
    }

    return this.StartProfile_ as IfcProfileDef
  }

  public get EndProfile() : IfcProfileDef | null {
    if ( this.EndProfile_ === void 0 ) {
      this.EndProfile_ = this.extractElement( 2, 0, 2, true, IfcProfileDef )
    }

    return this.EndProfile_ as IfcProfileDef | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSECTIONPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSECTIONPROPERTIES
}
