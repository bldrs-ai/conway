
import { IfcExternalReference } from "./index"
import { IfcText } from "./index"
import { IfcLanguageId } from "./index"
import { IfcLibraryInformation } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcLibraryReference extends IfcExternalReference {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCLIBRARYREFERENCE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcLibraryReference.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcLibraryReference" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCLIBRARYREFERENCE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCLIBRARYREFERENCE
}
