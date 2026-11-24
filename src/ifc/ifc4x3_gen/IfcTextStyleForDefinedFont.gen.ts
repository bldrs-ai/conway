
import { IfcPresentationItem } from "./index"
import { IfcColourSpecification } from "./index"
import { IfcPreDefinedColour } from "./index"

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export  class IfcTextStyleForDefinedFont extends IfcPresentationItem {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCTEXTSTYLEFORDEFINEDFONT
  }
  private Colour_? : IfcColourSpecification | IfcPreDefinedColour
  private BackgroundColour_? : IfcColourSpecification | IfcPreDefinedColour | null

  public get Colour() : IfcColourSpecification | IfcPreDefinedColour {
    if ( this.Colour_ === void 0 ) {
      
      const value : StepEntityBase< EntityTypesIfc4x3 > = 
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
      
      const value : StepEntityBase< EntityTypesIfc4x3 >| null = 
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
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcTextStyleForDefinedFont.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcTextStyleForDefinedFont" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCTEXTSTYLEFORDEFINEDFONT ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCTEXTSTYLEFORDEFINEDFONT
}
