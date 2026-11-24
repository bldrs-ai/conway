
import { IfcSpatialStructureElement } from "./index"
import { IfcSpaceTypeEnum, IfcSpaceTypeEnumDeserializeStep } from "./index"
import { IfcLengthMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSpace extends IfcSpatialStructureElement {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSPACE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSpace.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSpace" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSPACE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSPACE
}
