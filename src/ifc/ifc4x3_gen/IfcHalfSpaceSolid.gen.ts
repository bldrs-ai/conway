
import { IfcGeometricRepresentationItem } from "./index"
import { IfcSurface } from "./index"
import { IfcBoolean } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcHalfSpaceSolid extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCHALFSPACESOLID
  }
  private BaseSurface_? : IfcSurface
  private AgreementFlag_? : boolean

  public get BaseSurface() : IfcSurface {
    if ( this.BaseSurface_ === void 0 ) {
      this.BaseSurface_ = this.extractElement( 0, 0, 2, false, IfcSurface )
    }

    return this.BaseSurface_ as IfcSurface
  }

  public get AgreementFlag() : boolean {
    if ( this.AgreementFlag_ === void 0 ) {
      this.AgreementFlag_ = this.extractBoolean( 1, 0, 2, false )
    }

    return this.AgreementFlag_ as boolean
  }

  public get Dim() : number {
    return 3;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcHalfSpaceSolid.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcHalfSpaceSolid" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCHALFSPACESOLID, EntityTypesIfc4x3.IFCBOXEDHALFSPACE, EntityTypesIfc4x3.IFCPOLYGONALBOUNDEDHALFSPACE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCHALFSPACESOLID
}
