
import { IfcElement } from "./index"
import { IfcAssemblyPlaceEnum, IfcAssemblyPlaceEnumDeserializeStep } from "./index"
import { IfcElementAssemblyTypeEnum, IfcElementAssemblyTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcElementAssembly extends IfcElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCELEMENTASSEMBLY
  }
  private AssemblyPlace_? : IfcAssemblyPlaceEnum | null
  private PredefinedType_? : IfcElementAssemblyTypeEnum | null

  public get AssemblyPlace() : IfcAssemblyPlaceEnum | null {
    if ( this.AssemblyPlace_ === void 0 ) {
      this.AssemblyPlace_ = this.extractLambda( 8, 8, 5, IfcAssemblyPlaceEnumDeserializeStep, true )
    }

    return this.AssemblyPlace_ as IfcAssemblyPlaceEnum | null
  }

  public get PredefinedType() : IfcElementAssemblyTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 8, 5, IfcElementAssemblyTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcElementAssemblyTypeEnum | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcElementAssembly.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcElementAssembly" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCELEMENTASSEMBLY ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCELEMENTASSEMBLY
}
