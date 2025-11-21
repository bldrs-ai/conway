
import { IfcExternalReference } from "./index"
import { IfcText } from "./index"
import { IfcLanguageId } from "./index"
import { IfcLibraryInformation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifclibraryreference.htm */
export  class IfcLibraryReference extends IfcExternalReference {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCLIBRARYREFERENCE
  }
  private Description_? : string | null
  private Language_? : string | null
  private ReferencedLibrary_? : IfcLibraryInformation | null

  public get Description() : string | null {
    if ( this.Description_ === void 0 ) {
      this.Description_ = this.extractString( 3, 3, 1, true )
    }

    return this.Description_ as string | null
  }

  public get Language() : string | null {
    if ( this.Language_ === void 0 ) {
      this.Language_ = this.extractString( 4, 3, 1, true )
    }

    return this.Language_ as string | null
  }

  public get ReferencedLibrary() : IfcLibraryInformation | null {
    if ( this.ReferencedLibrary_ === void 0 ) {
      this.ReferencedLibrary_ = this.extractElement( 5, 3, 1, true, IfcLibraryInformation )
    }

    return this.ReferencedLibrary_ as IfcLibraryInformation | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCLIBRARYREFERENCE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCLIBRARYREFERENCE
}
