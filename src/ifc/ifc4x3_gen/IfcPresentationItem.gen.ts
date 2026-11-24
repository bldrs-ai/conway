

/* This is generated code, don't modify */
import EntityTypesIfc4x3 from './entity_types_ifc4x3.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// *  */
export abstract class IfcPresentationItem extends StepEntityBase< EntityTypesIfc4x3 > {
  public get type(): EntityTypesIfc4x3 {
    return EntityTypesIfc4x3.IFCPRESENTATIONITEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc4x3 >,
    model: StepModelBase< EntityTypesIfc4x3, StepEntityBase< EntityTypesIfc4x3 > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc4x3 >[] ) {

    super( localID, internalReference, model, multiReference )

    if ( multiReference !== void 0 ) {

      const localReference =
        multiReference.find( ( item ) => item.typeID === IfcPresentationItem.expectedType )

      if ( localReference === void 0 ) {
        throw new Error( "Couldn't find multi-element reference for IfcPresentationItem" )
      }

      this.multiReference_ ??= []

      this.multiReference_.push( localReference )

      localReference.visitedMulti = true
    }
  }

  public static readonly query = 
    [ EntityTypesIfc4x3.IFCCOLOURRGBLIST, EntityTypesIfc4x3.IFCCURVESTYLEFONT, EntityTypesIfc4x3.IFCCURVESTYLEFONTANDSCALING, EntityTypesIfc4x3.IFCCURVESTYLEFONTPATTERN, EntityTypesIfc4x3.IFCINDEXEDCOLOURMAP, EntityTypesIfc4x3.IFCSURFACESTYLELIGHTING, EntityTypesIfc4x3.IFCSURFACESTYLEREFRACTION, EntityTypesIfc4x3.IFCSURFACESTYLESHADING, EntityTypesIfc4x3.IFCSURFACESTYLEWITHTEXTURES, EntityTypesIfc4x3.IFCTEXTSTYLEFORDEFINEDFONT, EntityTypesIfc4x3.IFCTEXTSTYLETEXTMODEL, EntityTypesIfc4x3.IFCTEXTUREVERTEX, EntityTypesIfc4x3.IFCTEXTUREVERTEXLIST, EntityTypesIfc4x3.IFCCOLOURRGB, EntityTypesIfc4x3.IFCDRAUGHTINGPREDEFINEDCOLOUR, EntityTypesIfc4x3.IFCDRAUGHTINGPREDEFINEDCURVEFONT, EntityTypesIfc4x3.IFCTEXTSTYLEFONTMODEL, EntityTypesIfc4x3.IFCSURFACESTYLERENDERING, EntityTypesIfc4x3.IFCBLOBTEXTURE, EntityTypesIfc4x3.IFCIMAGETEXTURE, EntityTypesIfc4x3.IFCPIXELTEXTURE, EntityTypesIfc4x3.IFCTEXTURECOORDINATEGENERATOR, EntityTypesIfc4x3.IFCTEXTUREMAP, EntityTypesIfc4x3.IFCINDEXEDPOLYGONALTEXTUREMAP, EntityTypesIfc4x3.IFCINDEXEDTRIANGLETEXTUREMAP ]

  public static readonly expectedType: EntityTypesIfc4x3 =
    EntityTypesIfc4x3.IFCPRESENTATIONITEM
}
