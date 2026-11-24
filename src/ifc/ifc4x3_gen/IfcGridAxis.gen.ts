
import { IfcLabel } from "./index"
import { IfcCurve } from "./index"
import { IfcBoolean } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcGridAxis extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCGRIDAXIS
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcGridAxis.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcGridAxis" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCGRIDAXIS ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCGRIDAXIS
}
