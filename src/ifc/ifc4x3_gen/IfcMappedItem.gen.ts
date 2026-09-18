
import { IfcRepresentationItem } from "./index"
import { IfcRepresentationMap } from "./index"
import { IfcCartesianTransformationOperator } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcMappedItem extends IfcRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCMAPPEDITEM
  }
  private MappingSource_? : IfcRepresentationMap
  private MappingTarget_? : IfcCartesianTransformationOperator

  public get MappingSource() : IfcRepresentationMap {
    if ( this.MappingSource_ === void 0 ) {
      this.MappingSource_ = this.extractElement( 0, 0, 1, false, IfcRepresentationMap )
    }

    return this.MappingSource_ as IfcRepresentationMap
  }

  public get MappingTarget() : IfcCartesianTransformationOperator {
    if ( this.MappingTarget_ === void 0 ) {
      this.MappingTarget_ = this.extractElement( 1, 0, 1, false, IfcCartesianTransformationOperator )
    }

    return this.MappingTarget_ as IfcCartesianTransformationOperator
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcMappedItem.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcMappedItem" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCMAPPEDITEM ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCMAPPEDITEM
}
