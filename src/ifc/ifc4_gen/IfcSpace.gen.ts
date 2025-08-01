
import { IfcSpatialStructureElement } from "./index"
import { IfcSpaceTypeEnum, IfcSpaceTypeEnumDeserializeStep } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcspace.htm */
export  class IfcSpace extends IfcSpatialStructureElement {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSPACE
  }
  private PredefinedType_? : IfcSpaceTypeEnum | null
  private ElevationWithFlooring_? : number | null

  public get PredefinedType() : IfcSpaceTypeEnum | null {
    if ( this.PredefinedType_ === void 0 ) {
      this.PredefinedType_ = this.extractLambda( 9, 9, 6, IfcSpaceTypeEnumDeserializeStep, true )
    }

    return this.PredefinedType_ as IfcSpaceTypeEnum | null
  }

  public get ElevationWithFlooring() : number | null {
    if ( this.ElevationWithFlooring_ === void 0 ) {
      this.ElevationWithFlooring_ = this.extractNumber( 10, 9, 6, true )
    }

    return this.ElevationWithFlooring_ as number | null
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSPACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSPACE
}
