
import { IfcCurve } from "./index"
import { IfcPcurve } from "./index"
import { IfcPreferredSurfaceCurveRepresentation, IfcPreferredSurfaceCurveRepresentationDeserializeStep } from "./index"
import { IfcSurface } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'
import {
  IfcGetBasisSurface,
} from '../ifc_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcsurfacecurve.htm */
export  class IfcSurfaceCurve extends IfcCurve {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSURFACECURVE
  }
  private Curve3D_? : IfcCurve
  private AssociatedGeometry_? : Array<IfcPcurve>
  private MasterRepresentation_? : IfcPreferredSurfaceCurveRepresentation

  public get Curve3D() : IfcCurve {
    if ( this.Curve3D_ === void 0 ) {
      this.Curve3D_ = this.extractElement( 0, 0, 3, false, IfcCurve )
    }

    return this.Curve3D_ as IfcCurve
  }

  public get AssociatedGeometry() : Array<IfcPcurve> {
    if ( this.AssociatedGeometry_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 1, 0, 3 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcPcurve> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1 = this.extractBufferElement( buffer, cursor, endCursor, IfcPcurve )
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.AssociatedGeometry_ = value
    }

    return this.AssociatedGeometry_ as Array<IfcPcurve>
  }

  public get MasterRepresentation() : IfcPreferredSurfaceCurveRepresentation {
    if ( this.MasterRepresentation_ === void 0 ) {
      this.MasterRepresentation_ = this.extractLambda( 2, 0, 3, IfcPreferredSurfaceCurveRepresentationDeserializeStep, false )
    }

    return this.MasterRepresentation_ as IfcPreferredSurfaceCurveRepresentation
  }

  public get BasisSurface() : Array<IfcSurface> {
    return IfcGetBasisSurface(this);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSURFACECURVE, EntityTypesIfc.IFCINTERSECTIONCURVE, EntityTypesIfc.IFCSEAMCURVE ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSURFACECURVE
}
