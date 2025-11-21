
import { IfcPresentationItem } from "./index"
import { IfcColourSpecification } from "./index"
import { IfcPreDefinedColour } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifctextstylefordefinedfont.htm */
export  class IfcTextStyleForDefinedFont extends IfcPresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCTEXTSTYLEFORDEFINEDFONT
  }
  private Colour_? : IfcColourSpecification | IfcPreDefinedColour
  private BackgroundColour_? : IfcColourSpecification | IfcPreDefinedColour | null

  public get Colour() : IfcColourSpecification | IfcPreDefinedColour {
    if ( this.Colour_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc > = 
        this.extractReference( 0, 0, 1, false )

      if ( !( value instanceof IfcColourSpecification ) && !( value instanceof IfcPreDefinedColour ) ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.Colour_ = value as (IfcColourSpecification | IfcPreDefinedColour)

    }

    return this.Colour_ as IfcColourSpecification | IfcPreDefinedColour
  }

  public get BackgroundColour() : IfcColourSpecification | IfcPreDefinedColour | null {
    if ( this.BackgroundColour_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc >| null = 
        this.extractReference( 1, 0, 1, true )

      if ( !( value instanceof IfcColourSpecification ) && !( value instanceof IfcPreDefinedColour ) && value !== null ) {
        throw new Error( 'Value in STEP was incorrectly typed for field' )
      }

      this.BackgroundColour_ = value as (IfcColourSpecification | IfcPreDefinedColour)

    }

    return this.BackgroundColour_ as IfcColourSpecification | IfcPreDefinedColour | null
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCTEXTSTYLEFORDEFINEDFONT ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCTEXTSTYLEFORDEFINEDFONT
}
