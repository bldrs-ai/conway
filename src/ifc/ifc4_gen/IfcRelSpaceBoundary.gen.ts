
import { IfcRelConnects } from "./index"
import { IfcExternalSpatialElement } from "./index"
import { IfcSpace } from "./index"
import { IfcElement } from "./index"
import { IfcConnectionGeometry } from "./index"
import { IfcPhysicalOrVirtualEnum, IfcPhysicalOrVirtualEnumDeserializeStep } from "./index"
import { IfcInternalOrExternalEnum, IfcInternalOrExternalEnumDeserializeStep } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrelspaceboundary.htm */
export  class IfcRelSpaceBoundary extends IfcRelConnects {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRELSPACEBOUNDARY
  }
  private RelatingSpace_? : IfcExternalSpatialElement | IfcSpace
  private RelatedBuildingElement_? : IfcElement
  private ConnectionGeometry_? : IfcConnectionGeometry | null
  private PhysicalOrVirtualBoundary_? : IfcPhysicalOrVirtualEnum
  private InternalOrExternalBoundary_? : IfcInternalOrExternalEnum

  public get RelatingSpace() : IfcExternalSpatialElement | IfcSpace {
    if ( this.RelatingSpace_ === void 0 ) {
      this.RelatingSpace_ = this.extractLambda( 4, (buffer, cursor, endCursor) => {

      const value : StepEntityBase< EntityTypesIfc > | undefined =
        this.extractBufferReference( buffer, cursor, endCursor )

      if ( !( value instanceof IfcExternalSpatialElement ) && !( value instanceof IfcSpace ) ) {
        return ( void 0 )
      }
      return value as (IfcExternalSpatialElement | IfcSpace)
}, false )
    }

    return this.RelatingSpace_ as IfcExternalSpatialElement | IfcSpace
  }

  public get RelatedBuildingElement() : IfcElement {
    if ( this.RelatedBuildingElement_ === void 0 ) {
      this.RelatedBuildingElement_ = this.extractElement( 5, false, IfcElement )
    }

    return this.RelatedBuildingElement_ as IfcElement
  }

  public get ConnectionGeometry() : IfcConnectionGeometry | null {
    if ( this.ConnectionGeometry_ === void 0 ) {
      this.ConnectionGeometry_ = this.extractElement( 6, true, IfcConnectionGeometry )
    }

    return this.ConnectionGeometry_ as IfcConnectionGeometry | null
  }

  public get PhysicalOrVirtualBoundary() : IfcPhysicalOrVirtualEnum {
    if ( this.PhysicalOrVirtualBoundary_ === void 0 ) {
      this.PhysicalOrVirtualBoundary_ = this.extractLambda( 7, IfcPhysicalOrVirtualEnumDeserializeStep, false )
    }

    return this.PhysicalOrVirtualBoundary_ as IfcPhysicalOrVirtualEnum
  }

  public get InternalOrExternalBoundary() : IfcInternalOrExternalEnum {
    if ( this.InternalOrExternalBoundary_ === void 0 ) {
      this.InternalOrExternalBoundary_ = this.extractLambda( 8, IfcInternalOrExternalEnumDeserializeStep, false )
    }

    return this.InternalOrExternalBoundary_ as IfcInternalOrExternalEnum
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCRELSPACEBOUNDARY, EntityTypesIfc.IFCRELSPACEBOUNDARY1STLEVEL, EntityTypesIfc.IFCRELSPACEBOUNDARY2NDLEVEL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRELSPACEBOUNDARY
}
