
import { IfcURIReference } from "./index"
import { IfcIdentifier } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcexternalreference.htm */
export abstract class IfcExternalReference extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCEXTERNALREFERENCE
  }
  private Location_? : string | null
  private Identification_? : string | null
  private Name_? : string | null

  public get Location() : string | null {
    if ( this.Location_ === void 0 ) {
      this.Location_ = this.extractString( 0, 0, 0, true )
    }

    return this.Location_ as string | null
  }

  public get Identification() : string | null {
    if ( this.Identification_ === void 0 ) {
      this.Identification_ = this.extractString( 1, 0, 0, true )
    }

    return this.Identification_ as string | null
  }

  public get Name() : string | null {
    if ( this.Name_ === void 0 ) {
      this.Name_ = this.extractString( 2, 0, 0, true )
    }

    return this.Name_ as string | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCLASSIFICATIONREFERENCE, EntityTypesIfc.IFCDOCUMENTREFERENCE, EntityTypesIfc.IFCEXTERNALLYDEFINEDHATCHSTYLE, EntityTypesIfc.IFCEXTERNALLYDEFINEDSURFACESTYLE, EntityTypesIfc.IFCEXTERNALLYDEFINEDTEXTFONT, EntityTypesIfc.IFCLIBRARYREFERENCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCEXTERNALREFERENCE
}
