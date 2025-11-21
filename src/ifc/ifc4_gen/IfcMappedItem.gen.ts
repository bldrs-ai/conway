
import { IfcRepresentationItem } from "./index"
import { IfcRepresentationMap } from "./index"
import { IfcCartesianTransformationOperator } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcmappeditem.htm */
export  class IfcMappedItem extends IfcRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCMAPPEDITEM
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCMAPPEDITEM ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCMAPPEDITEM
}
