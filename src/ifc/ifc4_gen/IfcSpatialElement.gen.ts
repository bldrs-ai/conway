
import { IfcProduct } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcspatialelement.htm */
export abstract class IfcSpatialElement extends IfcProduct {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSPATIALELEMENT
  }
  private LongName_? : string | null

  public get LongName() : string | null {
    if ( this.LongName_ === void 0 ) {
      this.LongName_ = this.extractString( 7, 7, 4, true )
    }

    return this.LongName_ as string | null
  }



  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSPATIALZONE, EntityTypesIfc.IFCEXTERNALSPATIALELEMENT, EntityTypesIfc.IFCBUILDING, EntityTypesIfc.IFCBUILDINGSTOREY, EntityTypesIfc.IFCSITE, EntityTypesIfc.IFCSPACE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSPATIALELEMENT
}
