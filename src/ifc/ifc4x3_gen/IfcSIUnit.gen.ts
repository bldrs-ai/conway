
import { IfcNamedUnit } from "./index"
import { IfcSIPrefix, IfcSIPrefixDeserializeStep } from "./index"
import { IfcSIUnitName, IfcSIUnitNameDeserializeStep } from "./index"
import { IfcDimensionalExponents } from "./index"
// Hand-added: the generator omits this import for IfcSIUnit's DERIVE clause
// (a generator bug specific to IFC4X3_ADD2.exp — see ifc4x3_functions.ts's
// top-of-file comment). A regenerate will drop this line and re-break the
// build until that's fixed upstream.
import { IfcDimensionsForSIUnit } from '../ifc4x3_functions'

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSIUnit extends IfcNamedUnit {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSIUNIT
  }
  private Prefix_? : IfcSIPrefix | null
  private Name_? : IfcSIUnitName

  public get Prefix() : IfcSIPrefix | null {
    if ( this.Prefix_ === void 0 ) {
      this.Prefix_ = this.extractLambda( 2, 2, 1, IfcSIPrefixDeserializeStep, true )
    }

    return this.Prefix_ as IfcSIPrefix | null
  }

  public get Name() : IfcSIUnitName {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractLambda( 3, 2, 1, IfcSIUnitNameDeserializeStep, false )
    }

    return this.Name_ as IfcSIUnitName
  }

  public get Dimensions() : IfcDimensionalExponents {
    return IfcDimensionsForSIUnit(this?.Name);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSIUnit.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSIUnit" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSIUNIT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSIUNIT
}
