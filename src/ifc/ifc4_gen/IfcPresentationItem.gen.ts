

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpresentationitem.htm */
export abstract class IfcPresentationItem extends StepEntityBase< EntityTypesIfc > {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCPRESENTATIONITEM
  }


  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCCOLOURRGBLIST, EntityTypesIfc.IFCCURVESTYLEFONT, EntityTypesIfc.IFCCURVESTYLEFONTANDSCALING, EntityTypesIfc.IFCCURVESTYLEFONTPATTERN, EntityTypesIfc.IFCINDEXEDCOLOURMAP, EntityTypesIfc.IFCSURFACESTYLELIGHTING, EntityTypesIfc.IFCSURFACESTYLEREFRACTION, EntityTypesIfc.IFCSURFACESTYLESHADING, EntityTypesIfc.IFCSURFACESTYLEWITHTEXTURES, EntityTypesIfc.IFCTEXTSTYLEFORDEFINEDFONT, EntityTypesIfc.IFCTEXTSTYLETEXTMODEL, EntityTypesIfc.IFCTEXTUREVERTEX, EntityTypesIfc.IFCTEXTUREVERTEXLIST, EntityTypesIfc.IFCCOLOURRGB, EntityTypesIfc.IFCDRAUGHTINGPREDEFINEDCOLOUR, EntityTypesIfc.IFCDRAUGHTINGPREDEFINEDCURVEFONT, EntityTypesIfc.IFCTEXTSTYLEFONTMODEL, EntityTypesIfc.IFCSURFACESTYLERENDERING, EntityTypesIfc.IFCBLOBTEXTURE, EntityTypesIfc.IFCIMAGETEXTURE, EntityTypesIfc.IFCPIXELTEXTURE, EntityTypesIfc.IFCTEXTURECOORDINATEGENERATOR, EntityTypesIfc.IFCTEXTUREMAP, EntityTypesIfc.IFCINDEXEDTRIANGLETEXTUREMAP ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCPRESENTATIONITEM
}
