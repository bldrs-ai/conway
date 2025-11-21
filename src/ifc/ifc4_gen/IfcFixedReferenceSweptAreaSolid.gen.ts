
import { IfcSweptAreaSolid } from "./index"
import { IfcCurve } from "./index"
import { IfcParameterValue } from "./index"
import { IfcDirection } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcfixedreferencesweptareasolid.htm */
export  class IfcFixedReferenceSweptAreaSolid extends IfcSweptAreaSolid {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCFIXEDREFERENCESWEPTAREASOLID
  }
  private Directrix_? : IfcCurve
  private StartParam_? : number | null
  private EndParam_? : number | null
  private FixedReference_? : IfcDirection

  public get Directrix() : IfcCurve {
    if ( this.Directrix_ === void 0 ) {
      this.Directrix_ = this.extractElement( 2, 2, 4, false, IfcCurve )
    }

    return this.Directrix_ as IfcCurve
  }

  public get StartParam() : number | null {
    if ( this.StartParam_ === void 0 ) {
      this.StartParam_ = this.extractNumber( 3, 2, 4, true )
    }

    return this.StartParam_ as number | null
  }

  public get EndParam() : number | null {
    if ( this.EndParam_ === void 0 ) {
      this.EndParam_ = this.extractNumber( 4, 2, 4, true )
    }

    return this.EndParam_ as number | null
  }

  public get FixedReference() : IfcDirection {
    if ( this.FixedReference_ === void 0 ) {
      this.FixedReference_ = this.extractElement( 5, 2, 4, false, IfcDirection )
    }

    return this.FixedReference_ as IfcDirection
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCFIXEDREFERENCESWEPTAREASOLID ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCFIXEDREFERENCESWEPTAREASOLID
}
