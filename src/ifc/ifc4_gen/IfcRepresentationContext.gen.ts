
import { IfcLabel } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcrepresentationcontext.htm */
export abstract class IfcRepresentationContext extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCREPRESENTATIONCONTEXT
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
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCGEOMETRICREPRESENTATIONCONTEXT, EntityTypesIfc.IFCGEOMETRICREPRESENTATIONSUBCONTEXT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCREPRESENTATIONCONTEXT
}
