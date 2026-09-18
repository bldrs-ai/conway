
import { IfcRelConnects } from "./index"
import { IfcElement } from "./index"
import { IfcSpatialElement } from "./index"
import { IfcConnectionGeometry } from "./index"
import { IfcIdentifier } from "./index"
import { IfcLogical } from "./index"
import { IfcSpatialZone } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcRelInterferesElements extends IfcRelConnects {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCRELINTERFERESELEMENTS
  }
  private RelatingElement_? : IfcElement | IfcSpatialElement
  private RelatedElement_? : IfcElement | IfcSpatialElement
  private InterferenceGeometry_? : IfcConnectionGeometry | null
  private InterferenceType_? : string | null
  private ImpliedOrder_? : boolean | null
  private InterferenceSpace_? : IfcSpatialZone | null

  public get RelatingElement() : IfcElement | IfcSpatialElement {
    if ( this.RelatingElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 4, 4, 3, false )

      if ( !( value instanceof IfcElement ) && !( value instanceof IfcSpatialElement ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatingElement_ = value as (IfcElement | IfcSpatialElement)

    }

    return this.RelatingElement_ as IfcElement | IfcSpatialElement
  }

  public get RelatedElement() : IfcElement | IfcSpatialElement {
    if ( this.RelatedElement_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
        this.extractReference( 5, 4, 3, false )

      if ( !( value instanceof IfcElement ) && !( value instanceof IfcSpatialElement ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.RelatedElement_ = value as (IfcElement | IfcSpatialElement)

    }

    return this.RelatedElement_ as IfcElement | IfcSpatialElement
  }

  public get InterferenceGeometry() : IfcConnectionGeometry | null {
    if ( this.InterferenceGeometry_ === void 0 ) {
      this.InterferenceGeometry_ = this.extractElement( 6, 4, 3, true, IfcConnectionGeometry )
    }

    return this.InterferenceGeometry_ as IfcConnectionGeometry | null
  }

  public get InterferenceType() : string | null {
    if ( this.InterferenceType_ === void 0 ) {
      this.InterferenceType_ = this.extractString( 7, 4, 3, true )
    }

    return this.InterferenceType_ as string | null
  }

  public get ImpliedOrder() : boolean | null {
    if ( this.ImpliedOrder_ === void 0 ) {
      this.ImpliedOrder_ = this.extractLogical( 8, 4, 3, false )
    }

    return this.ImpliedOrder_ as boolean | null
  }

  public get InterferenceSpace() : IfcSpatialZone | null {
    if ( this.InterferenceSpace_ === void 0 ) {
      this.InterferenceSpace_ = this.extractElement( 9, 4, 3, true, IfcSpatialZone )
    }

    return this.InterferenceSpace_ as IfcSpatialZone | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRelInterferesElements.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRelInterferesElements" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCRELINTERFERESELEMENTS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCRELINTERFERESELEMENTS
}
