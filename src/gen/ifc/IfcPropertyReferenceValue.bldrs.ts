
import { IfcSimpleProperty } from "./index"
import { IfcLabel } from "./index"
import { IfcMaterial } from "./index"
import { IfcPerson } from "./index"
import { IfcDateAndTime } from "./index"
import { IfcMaterialList } from "./index"
import { IfcOrganization } from "./index"
import { IfcCalendarDate } from "./index"
import { IfcLocalTime } from "./index"
import { IfcPersonAndOrganization } from "./index"
import { IfcMaterialLayer } from "./index"
import { IfcExternalReference } from "./index"
import { IfcTimeSeries } from "./index"
import { IfcAddress } from "./index"
import { IfcAppliedValue } from "./index"

import EntityTypesIfc from "./entity_types_ifc.bldrs"
import StepEntityInternalReference from "../../core/step_entity_internal_reference"
import StepEntityBase from "../../core/step_entity_base"
import StepModelBase from "../../core/step_model_base"
import {stepExtractBoolean, stepExtractEnum, stepExtractString, stepExtractOptional, stepExtractBinary, stepExtractReference, stepExtractNumber, stepExtractInlineElemement, stepExtractArray, NVL, HIINDEX, SIZEOF} from '../../../dependencies/conway-ds/src/parsing/step/step_deserialization_functions';
import {IfcBaseAxis, IfcBooleanChoose, IfcBuild2Axes, IfcBuildAxes, IfcConstraintsParamBSpline, IfcConvertDirectionInto2D, IfcCorrectDimensions, IfcCorrectFillAreaStyle, IfcCorrectLocalPlacement, IfcCorrectObjectAssignment, IfcCorrectUnitAssignment, IfcCrossProduct, IfcCurveDim, IfcDeriveDimensionalExponents, IfcDimensionsForSiUnit, IfcDotProduct, IfcFirstProjAxis, IfcListToArray, IfcLoopHeadToTail, IfcMakeArrayOfArray, IfcMlsTotalThickness, IfcNormalise, IfcOrthogonalComplement, IfcPathHeadToTail, IfcSameAxis2Placement, IfcSameCartesianPoint, IfcSameDirection, IfcSameValidPrecision, IfcSameValue, IfcScalarTimesVector, IfcSecondProjAxis, IfcShapeRepresentationTypes, IfcTaperedSweptAreaProfiles, IfcTopologyRepresentationTypes, IfcUniqueDefinitionNames, IfcUniquePropertyName, IfcUniquePropertySetNames, IfcUniqueQuantityNames, IfcVectorDifference, IfcVectorSum } from "../../core/ifc/ifc_functions"

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcpropertyreferencevalue.htm */
export  class IfcPropertyReferenceValue extends IfcSimpleProperty 
{    
    public get type(): EntityTypesIfc
    {
        return EntityTypesIfc.IFCPROPERTYREFERENCEVALUE;
    }

    private UsageName_? : string | null;
    private PropertyReference_? : IfcMaterial|IfcPerson|IfcDateAndTime|IfcMaterialList|IfcOrganization|IfcCalendarDate|IfcLocalTime|IfcPersonAndOrganization|IfcMaterialLayer|IfcExternalReference|IfcTimeSeries|IfcAddress|IfcAppliedValue;

    public get UsageName() : string | null
    {
        if ( this.UsageName_ === void 0 )
        {
            this.UsageName_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 2 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 2;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractString( buffer, cursor, endCursor );

            if ( value === void 0 )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed' );
                }

                return null;                
            }
            else
            {
                return value;
            } })();
        }

        return this.UsageName_ as string | null;
    }

    public get PropertyReference() : IfcMaterial|IfcPerson|IfcDateAndTime|IfcMaterialList|IfcOrganization|IfcCalendarDate|IfcLocalTime|IfcPersonAndOrganization|IfcMaterialLayer|IfcExternalReference|IfcTimeSeries|IfcAddress|IfcAppliedValue
    {
        if ( this.PropertyReference_ === void 0 )
        {
            this.PropertyReference_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 3 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 3;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcMaterial ) && !( value instanceof IfcPerson ) && !( value instanceof IfcDateAndTime ) && !( value instanceof IfcMaterialList ) && !( value instanceof IfcOrganization ) && !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcPersonAndOrganization ) && !( value instanceof IfcMaterialLayer ) && !( value instanceof IfcExternalReference ) && !( value instanceof IfcTimeSeries ) && !( value instanceof IfcAddress ) && !( value instanceof IfcAppliedValue ) )
            {                
                throw new Error( 'Value in STEP was incorrectly typed for field' );
            }

            return value as (IfcMaterial | IfcPerson | IfcDateAndTime | IfcMaterialList | IfcOrganization | IfcCalendarDate | IfcLocalTime | IfcPersonAndOrganization | IfcMaterialLayer | IfcExternalReference | IfcTimeSeries | IfcAddress | IfcAppliedValue); })();
        }

        return this.PropertyReference_ as IfcMaterial|IfcPerson|IfcDateAndTime|IfcMaterialList|IfcOrganization|IfcCalendarDate|IfcLocalTime|IfcPersonAndOrganization|IfcMaterialLayer|IfcExternalReference|IfcTimeSeries|IfcAddress|IfcAppliedValue;
    }
    constructor(localID: number, internalReference: StepEntityInternalReference< EntityTypesIfc >, model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > )
    {
        super( localID, internalReference, model );
    }
}