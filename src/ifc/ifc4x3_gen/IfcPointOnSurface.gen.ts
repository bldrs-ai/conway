
import { IfcPoint } from "./index"
import { IfcSurface } from "./index"
import { IfcParameterValue } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcPointOnSurface extends IfcPoint {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPOINTONSURFACE
  }
  private BasisSurface_? : IfcSurface
  private PointParameterU_? : number
  private PointParameterV_? : number

  public get BasisSurface() : IfcSurface {
    if ( this.BasisSurface_ === void 0 ) {
      this.BasisSurface_ = this.extractElement( 0, 0, 3, false, IfcSurface )
    }

    return this.BasisSurface_ as IfcSurface
  }

  public get PointParameterU() : number {
    if ( this.PointParameterU_ === void 0 ) {
      this.PointParameterU_ = this.extractNumber( 1, 0, 3, false )
    }

    return this.PointParameterU_ as number
  }

  public get PointParameterV() : number {
    if ( this.PointParameterV_ === void 0 ) {
      this.PointParameterV_ = this.extractNumber( 2, 0, 3, false )
    }

    return this.PointParameterV_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPointOnSurface.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPointOnSurface" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCPOINTONSURFACE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPOINTONSURFACE
}
