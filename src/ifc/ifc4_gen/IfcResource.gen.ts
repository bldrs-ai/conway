
import { IfcObject } from "./index"
import { IfcIdentifier } from "./index"
import { IfcText } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcresource.htm */
export abstract class IfcResource extends IfcObject {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCRESOURCE
  }
  private Identification_? : string | null
  private LongDescription_? : string | null

  public get Identification() : string | null {
    if ( this.Identification_ === void 0 ) {
      this.Identification_ = this.extractString( 5, true )
    }

    return this.Identification_ as string | null
  }

  public get LongDescription() : string | null {
    if ( this.LongDescription_ === void 0 ) {
      this.LongDescription_ = this.extractString( 6, true )
    }

    return this.LongDescription_ as string | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCONSTRUCTIONEQUIPMENTRESOURCE, EntityTypesIfc.IFCCONSTRUCTIONMATERIALRESOURCE, EntityTypesIfc.IFCCONSTRUCTIONPRODUCTRESOURCE, EntityTypesIfc.IFCCREWRESOURCE, EntityTypesIfc.IFCLABORRESOURCE, EntityTypesIfc.IFCSUBCONTRACTRESOURCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCRESOURCE
}
