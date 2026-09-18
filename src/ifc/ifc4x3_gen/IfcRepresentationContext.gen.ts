
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcRepresentationContext extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCREPRESENTATIONCONTEXT
  }
  private ContextIdentifier_? : string | null
  private ContextType_? : string | null

  public get ContextIdentifier() : string | null {
    if ( this.ContextIdentifier_ === void 0 ) {
      this.ContextIdentifier_ = this.extractString( 0, 0, 0, true )
    }

    return this.ContextIdentifier_ as string | null
  }

  public get ContextType() : string | null {
    if ( this.ContextType_ === void 0 ) {
      this.ContextType_ = this.extractString( 1, 0, 0, true )
    }

    return this.ContextType_ as string | null
  }

  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcRepresentationContext.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcRepresentationContext" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCGEOMETRICREPRESENTATIONCONTEXT, EntityTypesIfc4x3.IFCGEOMETRICREPRESENTATIONSUBCONTEXT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCREPRESENTATIONCONTEXT
}
