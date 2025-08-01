
import { IfcGeometricRepresentationItem } from "./index"
import { IfcClosedShell } from "./index"
import { IfcOpenShell } from "./index"
import { IfcDimensionCount } from "./index"
import {
  stepExtractOptional,
  stepExtractArrayToken,
  stepExtractArrayBegin,
  skipValue,
} from '../../step/parsing/step_deserialization_functions'

/* This is generated code, don't modify */
import EntityTypesIfc from './entity_types_ifc.gen'
import StepEntityInternalReference from '../../step/step_entity_internal_reference'
import StepEntityBase from '../../step/step_entity_base'
import StepModelBase from '../../step/step_model_base'

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcshellbasedsurfacemodel.htm */
export  class IfcShellBasedSurfaceModel extends IfcGeometricRepresentationItem {
  public get type(): EntityTypesIfc {
    return EntityTypesIfc.IFCSHELLBASEDSURFACEMODEL
  }
  private SbsmBoundary_? : Array<IfcClosedShell | IfcOpenShell>

  public get SbsmBoundary() : Array<IfcClosedShell | IfcOpenShell> {
    if ( this.SbsmBoundary_ === void 0 ) {
      
      let   cursor    = this.getOffsetCursor( 0, 0, 2 )
      const buffer    = this.buffer
      const endCursor = buffer.length

      if ( stepExtractOptional( buffer, cursor, endCursor ) === null ) {
        return []
      }

      const value : Array<IfcClosedShell | IfcOpenShell> = []

      let signedCursor0 = stepExtractArrayBegin( buffer, cursor, endCursor )
      cursor = Math.abs( signedCursor0 )

      while ( signedCursor0 >= 0 ) {
        const value1Untyped : StepEntityBase< EntityTypesIfc > | undefined = 
          this.extractBufferReference( buffer, cursor, endCursor )

        if ( !( value1Untyped instanceof IfcClosedShell ) && !( value1Untyped instanceof IfcOpenShell ) ) {
          throw new Error( 'Value in select must be populated' )
        }

        const value1 = value1Untyped as (IfcClosedShell | IfcOpenShell)
        if ( value1 === void 0 ) {
          throw new Error( 'Value in STEP was incorrectly typed' )
        }
        cursor = skipValue( buffer, cursor, endCursor )
        value.push( value1 )
        signedCursor0 = stepExtractArrayToken( buffer, cursor, endCursor )
        cursor = Math.abs( signedCursor0 )
      }

      this.SbsmBoundary_ = value
    }

    return this.SbsmBoundary_ as Array<IfcClosedShell | IfcOpenShell>
  }

  public get Dim() : number {
    return 3;
  }
  constructor(
    localID: number,
    internalReference: StepEntityInternalReference< EntityTypesIfc >,
    model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > >,
    multiReference?: StepEntityInternalReference< EntityTypesIfc >[] ) {

    super( localID, internalReference, model )
  }

  public static readonly query = 
    [ EntityTypesIfc.IFCSHELLBASEDSURFACEMODEL ]

  public static readonly expectedType: EntityTypesIfc =
    EntityTypesIfc.IFCSHELLBASEDSURFACEMODEL
}
