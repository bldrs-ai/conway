
import { IfcRelConnects } from "./index"
import { IfcExternalSpatialElement } from "./index"
import { IfcSpace } from "./index"
import { IfcElement } from "./index"
import { IfcConnectionGeometry } from "./index"
import { IfcPhysicalOrVirtualEnum, IfcPhysicalOrVirtualEnumDeserializeStep } from "./index"
import { IfcInternalOrExternalEnum, IfcInternalOrExternalEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelSpaceBoundary extends IfcRelConnects {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELSPACEBOUNDARY
  }
  private RelatingSpace_? : IfcExternalSpatialElement | IfcSpace
  private RelatedBuildingElement_? : IfcElement
  private ConnectionGeometry_? : IfcConnectionGeometry | null
  private PhysicalOrVirtualBoundary_? : IfcPhysicalOrVirtualEnum
  private InternalOrExternalBoundary_? : IfcInternalOrExternalEnum

  public get RelatingSpace() : IfcExternalSpatialElement | IfcSpace {
    if ( this.RelatingSpace_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 4, 4, 3, false )

      if ( !( value instanceof IfcExternalSpatialElement ) && !( value instanceof IfcSpace ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingSpace_ = value as (IfcExternalSpatialElement | IfcSpace)

    }

    return this.RelatingSpace_ as IfcExternalSpatialElement | IfcSpace
  }

  public get RelatedBuildingElement() : IfcElement {
    if ( this.RelatedBuildingElement_ === void 0 ) {
      this.RelatedBuildingElement_ = this.extractElement( 5, 4, 3, false, IfcElement )
    }

    return this.RelatedBuildingElement_ as IfcElement
  }

  public get ConnectionGeometry() : IfcConnectionGeometry | null {
    if ( this.ConnectionGeometry_ === void 0 ) {
      this.ConnectionGeometry_ = this.extractElement( 6, 4, 3, true, IfcConnectionGeometry )
    }

    return this.ConnectionGeometry_ as IfcConnectionGeometry | null
  }

  public get PhysicalOrVirtualBoundary() : IfcPhysicalOrVirtualEnum {
    if ( this.PhysicalOrVirtualBoundary_ === void 0 ) {
      this.PhysicalOrVirtualBoundary_ = this.extractLambda( 7, 4, 3, IfcPhysicalOrVirtualEnumDeserializeStep, false )
    }

    return this.PhysicalOrVirtualBoundary_ as IfcPhysicalOrVirtualEnum
  }

  public get InternalOrExternalBoundary() : IfcInternalOrExternalEnum {
    if ( this.InternalOrExternalBoundary_ === void 0 ) {
      this.InternalOrExternalBoundary_ = this.extractLambda( 8, 4, 3, IfcInternalOrExternalEnumDeserializeStep, false )
    }

    return this.InternalOrExternalBoundary_ as IfcInternalOrExternalEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelSpaceBoundary.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelSpaceBoundary" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELSPACEBOUNDARY, EntityTypesIfc4x3.IFCRELSPACEBOUNDARY1STLEVEL, EntityTypesIfc4x3.IFCRELSPACEBOUNDARY2NDLEVEL ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELSPACEBOUNDARY
}
