
import { IfcPreDefinedProperties } from "./index"
import { IfcSectionTypeEnum, IfcSectionTypeEnumDeserializeStep } from "./index"
import { IfcProfileDef } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSectionProperties extends IfcPreDefinedProperties {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSECTIONPROPERTIES
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSectionProperties.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSectionProperties" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSECTIONPROPERTIES ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSECTIONPROPERTIES
}
