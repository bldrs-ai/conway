
import { IfcURIReference } from "./index"
import { IfcIdentifier } from "./index"
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcExternalReference extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCEXTERNALREFERENCE
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcExternalReference.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcExternalReference" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCLASSIFICATIONREFERENCE, EntityTypesIfc4x3.IFCDOCUMENTREFERENCE, EntityTypesIfc4x3.IFCEXTERNALLYDEFINEDHATCHSTYLE, EntityTypesIfc4x3.IFCEXTERNALLYDEFINEDSURFACESTYLE, EntityTypesIfc4x3.IFCEXTERNALLYDEFINEDTEXTFONT, EntityTypesIfc4x3.IFCLIBRARYREFERENCE ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCEXTERNALREFERENCE
}
