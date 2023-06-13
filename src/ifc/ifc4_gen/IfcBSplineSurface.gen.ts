
import { IfcBoundedSurface } from "./index"
import { IfcInteger } from "./index"
import { IfcCartesianPoint } from "./index"
import { IfcBSplineSurfaceForm, IfcBSplineSurfaceFormDeserializeStep } from "./index"
import { IfcLogical } from "./index"
import {
  stepExtractArray,
  SIZEOF,
} from '../../step/parsing/step_deserialization_functions'
import {
  IfcMakeArrayOfArray,
} from '../ifc_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcbsplinesurface.htm */
export abstract class IfcBSplineSurface extends IfcBoundedSurface {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCBSPLINESURFACE
  }
  private UDegree_? : number
  private VDegree_? : number
  private ControlPointsList_? : Array<Array<IfcCartesianPoint>>
  private SurfaceForm_? : IfcBSplineSurfaceForm
  private UClosed_? : boolean | null
  private VClosed_? : boolean | null
  private SelfIntersect_? : boolean | null

  public get UDegree() : number {
    if ( this.UDegree_ === void 0 ) {
      this.UDegree_ = this.extractNumber( 0, false )
    }

    return this.UDegree_ as number
  }

  public get VDegree() : number {
    if ( this.VDegree_ === void 0 ) {
      this.VDegree_ = this.extractNumber( 1, false )
    }

    return this.VDegree_ as number
  }

  public get ControlPointsList() : Array<Array<IfcCartesianPoint>> {
    if ( this.ControlPointsList_ === void 0 ) {
      this.ControlPointsList_ = this.extractLambda( 2, (buffer, cursor, endCursor) => {

      let value : Array<Array<IfcCartesianPoint>> = [];

      for ( let address of stepExtractArray( buffer, cursor, endCursor ) ) {
        value.push( (() => {
          const cursor = address
          let value : Array<IfcCartesianPoint> = [];
    
          for ( let address of stepExtractArray( buffer, cursor, endCursor ) ) {
            value.push( (() => {
                  const cursor = address
                   let value = this.extractBufferReference( buffer, cursor, endCursor )
            
                  if ( !( value instanceof IfcCartesianPoint ) )  {
                    throw new Error( 'Value in STEP was incorrectly typed for field' )
                  }
            
                  return value
                })() )
          }
                if ( value === void 0 ) {
            throw new Error( 'Value needs to be defined in encapsulating context' )
          }
    
          return value 
        })() )
      }
      return value }, false )
    }

    return this.ControlPointsList_ as Array<Array<IfcCartesianPoint>>
  }

  public get SurfaceForm() : IfcBSplineSurfaceForm {
    if ( this.SurfaceForm_ === void 0 ) {
      this.SurfaceForm_ = this.extractLambda( 3, IfcBSplineSurfaceFormDeserializeStep, false )
    }

    return this.SurfaceForm_ as IfcBSplineSurfaceForm
  }

  public get UClosed() : boolean | null {
    if ( this.UClosed_ === void 0 ) {
      this.UClosed_ = this.extractLogical( 4, false )
    }

    return this.UClosed_ as boolean | null
  }

  public get VClosed() : boolean | null {
    if ( this.VClosed_ === void 0 ) {
      this.VClosed_ = this.extractLogical( 5, false )
    }

    return this.VClosed_ as boolean | null
  }

  public get SelfIntersect() : boolean | null {
    if ( this.SelfIntersect_ === void 0 ) {
      this.SelfIntersect_ = this.extractLogical( 6, false )
    }

    return this.SelfIntersect_ as boolean | null
  }

  public get UUpper() : number {
    return SIZEOF(this?.ControlPointsList)-1;
  }

  public get VUpper() : number {
    return SIZEOF(this?.ControlPointsList?.[1 - 1])-1;
  }

  public get ControlPoints() : Array<Array<IfcCartesianPoint>> {
    return IfcMakeArrayOfArray(this?.ControlPointsList,0,this?.UUpper,0,this?.VUpper);
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > ) {
    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCBSPLINESURFACEWITHKNOTS, EntityTypesIfc.IFCRATIONALBSPLINESURFACEWITHKNOTS ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCBSPLINESURFACE
}
