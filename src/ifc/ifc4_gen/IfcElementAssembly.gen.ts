
import { IfcElement } from "./index"
import { IfcAssemblyPlaceEnum, IfcAssemblyPlaceEnumDeserializeStep } from "./index"
import { IfcElementAssemblyTypeEnum, IfcElementAssemblyTypeEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcelementassembly.htm */
export  class IfcElementAssembly extends IfcElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCELEMENTASSEMBLY
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCELEMENTASSEMBLY ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCELEMENTASSEMBLY
}
