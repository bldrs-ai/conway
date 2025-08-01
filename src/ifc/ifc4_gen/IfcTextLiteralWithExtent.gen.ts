
import { IfcTextLiteral } from "./index"
import { IfcPlanarExtent } from "./index"
import { IfcBoxAlignment } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctextliteralwithextent.htm */
export  class IfcTextLiteralWithExtent extends IfcTextLiteral {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTEXTLITERALWITHEXTENT
  }
  private Extent_? : IfcPlanarExtent
  private BoxAlignment_? : string

  public get Extent() : IfcPlanarExtent {
    if ( this.Extent_ === void 0 ) {
      this.Extent_ = this.extractElement( 3, 3, 3, false, IfcPlanarExtent )
    }

    return this.Extent_ as IfcPlanarExtent
  }

  public get BoxAlignment() : string {
    if ( this.BoxAlignment_ === void 0 ) {
      this.BoxAlignment_ = this.extractString( 4, 3, 3, false )
    }

    return this.BoxAlignment_ as string
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTEXTLITERALWITHEXTENT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTEXTLITERALWITHEXTENT
}
