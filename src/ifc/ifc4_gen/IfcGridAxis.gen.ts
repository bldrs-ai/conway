
import { IfcLabel } from "./index"
import { IfcCurve } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcgridaxis.htm */
export  class IfcGridAxis extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCGRIDAXIS
  }
  private AxisTag_? : string | null
  private AxisCurve_? : IfcCurve
  private SameSense_? : boolean

  public get AxisTag() : string | null {
    if ( this.AxisTag_ === void 0 ) {
      this.AxisTag_ = this.extractString( 0, 0, 0, true )
    }

    return this.AxisTag_ as string | null
  }

  public get AxisCurve() : IfcCurve {
    if ( this.AxisCurve_ === void 0 ) {
      this.AxisCurve_ = this.extractElement( 1, 0, 0, false, IfcCurve )
    }

    return this.AxisCurve_ as IfcCurve
  }

  public get SameSense() : boolean {
    if ( this.SameSense_ === void 0 ) {
      this.SameSense_ = this.extractBoolean( 2, 0, 0, false )
    }

    return this.SameSense_ as boolean
  }




  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCGRIDAXIS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCGRIDAXIS
}
