
import { IfcPresentationItem } from "./index"
import { IfcReal } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcSurfaceStyleRefraction extends IfcPresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCSURFACESTYLEREFRACTION
  }
  private RefractionIndex_? : number | null
  private DispersionFactor_? : number | null

  public get RefractionIndex() : number | null {
    if ( this.RefractionIndex_ === void 0 ) {
      this.RefractionIndex_ = this.extractNumber( 0, 0, 1, true )
    }

    return this.RefractionIndex_ as number | null
  }

  public get DispersionFactor() : number | null {
    if ( this.DispersionFactor_ === void 0 ) {
      this.DispersionFactor_ = this.extractNumber( 1, 0, 1, true )
    }

    return this.DispersionFactor_ as number | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcSurfaceStyleRefraction.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcSurfaceStyleRefraction" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCSURFACESTYLEREFRACTION ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCSURFACESTYLEREFRACTION
}
