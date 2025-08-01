
import { IfcGeometricRepresentationItem } from "./index"
import { IfcSurface } from "./index"
import { IfcBoolean } from "./index"
import { IfcDimensionCount } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifchalfspacesolid.htm */
export  class IfcHalfSpaceSolid extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCHALFSPACESOLID
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCHALFSPACESOLID, EntityTypesIfc.IFCBOXEDHALFSPACE, EntityTypesIfc.IFCPOLYGONALBOUNDEDHALFSPACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCHALFSPACESOLID
}
