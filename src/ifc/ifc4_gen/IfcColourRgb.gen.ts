
import { IfcColourSpecification } from "./index"
import { IfcNormalisedRatioMeasure } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifccolourrgb.htm */
export  class IfcColourRgb extends IfcColourSpecification {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCCOLOURRGB
  }
  private Red_? : number
  private Green_? : number
  private Blue_? : number

  public get Red() : number {
    if ( this.Red_ === void 0 ) {
      this.Red_ = this.extractNumber( 1, 1, 2, false )
    }

    return this.Red_ as number
  }

  public get Green() : number {
    if ( this.Green_ === void 0 ) {
      this.Green_ = this.extractNumber( 2, 1, 2, false )
    }

    return this.Green_ as number
  }

  public get Blue() : number {
    if ( this.Blue_ === void 0 ) {
      this.Blue_ = this.extractNumber( 3, 1, 2, false )
    }

    return this.Blue_ as number
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOLOURRGB ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCCOLOURRGB
}
