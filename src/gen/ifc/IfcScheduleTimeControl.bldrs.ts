
import { IfcControl } from "./index"
import { IfcCalendarDate } from "./index"
import { IfcLocalTime } from "./index"
import { IfcDateAndTime } from "./index"
import { IfcTimeMeasure } from "./index"
import { IfcPositiveRatioMeasure } from "./index"

import EntityTypesIfc from "./entity_types_ifc.bldrs"
import StepEntityInternalReference from "../../core/step_entity_internal_reference"
import StepEntityBase from "../../core/step_entity_base"
import StepModelBase from "../../core/step_model_base"
import {stepExtractBoolean, stepExtractEnum, stepExtractString, stepExtractOptional, stepExtractBinary, stepExtractReference, stepExtractNumber, stepExtractInlineElemement, stepExtractArray, NVL, HIINDEX, SIZEOF} from '../../../dependencies/conway-ds/src/parsing/step/step_deserialization_functions';
import {IfcBaseAxis, IfcBooleanChoose, IfcBuild2Axes, IfcBuildAxes, IfcConstraintsParamBSpline, IfcConvertDirectionInto2D, IfcCorrectDimensions, IfcCorrectFillAreaStyle, IfcCorrectLocalPlacement, IfcCorrectObjectAssignment, IfcCorrectUnitAssignment, IfcCrossProduct, IfcCurveDim, IfcDeriveDimensionalExponents, IfcDimensionsForSiUnit, IfcDotProduct, IfcFirstProjAxis, IfcListToArray, IfcLoopHeadToTail, IfcMakeArrayOfArray, IfcMlsTotalThickness, IfcNormalise, IfcOrthogonalComplement, IfcPathHeadToTail, IfcSameAxis2Placement, IfcSameCartesianPoint, IfcSameDirection, IfcSameValidPrecision, IfcSameValue, IfcScalarTimesVector, IfcSecondProjAxis, IfcShapeRepresentationTypes, IfcTaperedSweptAreaProfiles, IfcTopologyRepresentationTypes, IfcUniqueDefinitionNames, IfcUniquePropertyName, IfcUniquePropertySetNames, IfcUniqueQuantityNames, IfcVectorDifference, IfcVectorSum } from "../../core/ifc/ifc_functions"

///**
// * http://www.buildingsmart-tech.org/ifc/ifc4/final/html/link/ifcscheduletimecontrol.htm */
export  class IfcScheduleTimeControl extends IfcControl 
{    
    public get type(): EntityTypesIfc
    {
        return EntityTypesIfc.IFCSCHEDULETIMECONTROL;
    }

    private ActualStart_? : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    private EarlyStart_? : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    private LateStart_? : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    private ScheduleStart_? : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    private ActualFinish_? : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    private EarlyFinish_? : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    private LateFinish_? : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    private ScheduleFinish_? : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    private ScheduleDuration_? : number | null;
    private ActualDuration_? : number | null;
    private RemainingTime_? : number | null;
    private FreeFloat_? : number | null;
    private TotalFloat_? : number | null;
    private IsCritical_? : boolean | null;
    private StatusTime_? : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    private StartFloat_? : number | null;
    private FinishFloat_? : number | null;
    private Completion_? : number | null;

    public get ActualStart() : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null
    {
        if ( this.ActualStart_ === void 0 )
        {
            this.ActualStart_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 5 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 5;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcDateAndTime ) )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed for field' );
                }

                return null;                
            }
            else
            {
                return value as (IfcCalendarDate | IfcLocalTime | IfcDateAndTime);
            } })();
        }

        return this.ActualStart_ as IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    }

    public get EarlyStart() : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null
    {
        if ( this.EarlyStart_ === void 0 )
        {
            this.EarlyStart_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 6 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 6;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcDateAndTime ) )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed for field' );
                }

                return null;                
            }
            else
            {
                return value as (IfcCalendarDate | IfcLocalTime | IfcDateAndTime);
            } })();
        }

        return this.EarlyStart_ as IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    }

    public get LateStart() : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null
    {
        if ( this.LateStart_ === void 0 )
        {
            this.LateStart_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 7 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 7;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcDateAndTime ) )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed for field' );
                }

                return null;                
            }
            else
            {
                return value as (IfcCalendarDate | IfcLocalTime | IfcDateAndTime);
            } })();
        }

        return this.LateStart_ as IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    }

    public get ScheduleStart() : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null
    {
        if ( this.ScheduleStart_ === void 0 )
        {
            this.ScheduleStart_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 8 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 8;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcDateAndTime ) )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed for field' );
                }

                return null;                
            }
            else
            {
                return value as (IfcCalendarDate | IfcLocalTime | IfcDateAndTime);
            } })();
        }

        return this.ScheduleStart_ as IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    }

    public get ActualFinish() : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null
    {
        if ( this.ActualFinish_ === void 0 )
        {
            this.ActualFinish_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 9 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 9;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcDateAndTime ) )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed for field' );
                }

                return null;                
            }
            else
            {
                return value as (IfcCalendarDate | IfcLocalTime | IfcDateAndTime);
            } })();
        }

        return this.ActualFinish_ as IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    }

    public get EarlyFinish() : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null
    {
        if ( this.EarlyFinish_ === void 0 )
        {
            this.EarlyFinish_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 10 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 10;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcDateAndTime ) )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed for field' );
                }

                return null;                
            }
            else
            {
                return value as (IfcCalendarDate | IfcLocalTime | IfcDateAndTime);
            } })();
        }

        return this.EarlyFinish_ as IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    }

    public get LateFinish() : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null
    {
        if ( this.LateFinish_ === void 0 )
        {
            this.LateFinish_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 11 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 11;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcDateAndTime ) )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed for field' );
                }

                return null;                
            }
            else
            {
                return value as (IfcCalendarDate | IfcLocalTime | IfcDateAndTime);
            } })();
        }

        return this.LateFinish_ as IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    }

    public get ScheduleFinish() : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null
    {
        if ( this.ScheduleFinish_ === void 0 )
        {
            this.ScheduleFinish_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 12 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 12;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcDateAndTime ) )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed for field' );
                }

                return null;                
            }
            else
            {
                return value as (IfcCalendarDate | IfcLocalTime | IfcDateAndTime);
            } })();
        }

        return this.ScheduleFinish_ as IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    }

    public get ScheduleDuration() : number | null
    {
        if ( this.ScheduleDuration_ === void 0 )
        {
            this.ScheduleDuration_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 13 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 13;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractNumber( buffer, cursor, endCursor );

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

        return this.ScheduleDuration_ as number | null;
    }

    public get ActualDuration() : number | null
    {
        if ( this.ActualDuration_ === void 0 )
        {
            this.ActualDuration_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 14 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 14;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractNumber( buffer, cursor, endCursor );

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

        return this.ActualDuration_ as number | null;
    }

    public get RemainingTime() : number | null
    {
        if ( this.RemainingTime_ === void 0 )
        {
            this.RemainingTime_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 15 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 15;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractNumber( buffer, cursor, endCursor );

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

        return this.RemainingTime_ as number | null;
    }

    public get FreeFloat() : number | null
    {
        if ( this.FreeFloat_ === void 0 )
        {
            this.FreeFloat_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 16 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 16;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractNumber( buffer, cursor, endCursor );

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

        return this.FreeFloat_ as number | null;
    }

    public get TotalFloat() : number | null
    {
        if ( this.TotalFloat_ === void 0 )
        {
            this.TotalFloat_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 17 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 17;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractNumber( buffer, cursor, endCursor );

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

        return this.TotalFloat_ as number | null;
    }

    public get IsCritical() : boolean | null
    {
        if ( this.IsCritical_ === void 0 )
        {
            this.IsCritical_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 18 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 18;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractBoolean( buffer, cursor, endCursor );

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

        return this.IsCritical_ as boolean | null;
    }

    public get StatusTime() : IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null
    {
        if ( this.StatusTime_ === void 0 )
        {
            this.StatusTime_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 19 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 19;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let expressID = stepExtractReference( buffer, cursor, endCursor );
            let value : StepEntityBase< EntityTypesIfc > | undefined = expressID !== void 0 ? this.model.getElementByExpressID( expressID ) : (this.model.getInlineElementByAddress( stepExtractInlineElemement( buffer, cursor, endCursor )));           

            if ( !( value instanceof IfcCalendarDate ) && !( value instanceof IfcLocalTime ) && !( value instanceof IfcDateAndTime ) )
            {
                if ( stepExtractOptional( buffer, cursor, endCursor ) !== null )
                {
                    throw new Error( 'Value in STEP was incorrectly typed for field' );
                }

                return null;                
            }
            else
            {
                return value as (IfcCalendarDate | IfcLocalTime | IfcDateAndTime);
            } })();
        }

        return this.StatusTime_ as IfcCalendarDate|IfcLocalTime|IfcDateAndTime | null;
    }

    public get StartFloat() : number | null
    {
        if ( this.StartFloat_ === void 0 )
        {
            this.StartFloat_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 20 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 20;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractNumber( buffer, cursor, endCursor );

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

        return this.StartFloat_ as number | null;
    }

    public get FinishFloat() : number | null
    {
        if ( this.FinishFloat_ === void 0 )
        {
            this.FinishFloat_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 21 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 21;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractNumber( buffer, cursor, endCursor );

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

        return this.FinishFloat_ as number | null;
    }

    public get Completion() : number | null
    {
        if ( this.Completion_ === void 0 )
        {
            this.Completion_ = (() => { this.guaranteeVTable();

            let internalReference = this.internalReference_ as Required< StepEntityInternalReference< EntityTypesIfc > >;

            if ( 22 >= internalReference.vtableCount )
            {
                throw new Error( "Couldn't read field due to too few fields in record" ); 
            }
            
            let vtableSlot = internalReference.vtableIndex + 22;

            let cursor    = internalReference.vtable[ vtableSlot ];
            let buffer    = internalReference.buffer;
            let endCursor = buffer.length;

            let value = stepExtractNumber( buffer, cursor, endCursor );

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

        return this.Completion_ as number | null;
    }

    constructor(localID: number, internalReference: StepEntityInternalReference< EntityTypesIfc >, model: StepModelBase< EntityTypesIfc, StepEntityBase< EntityTypesIfc > > )
    {
        super( localID, internalReference, model );
    }
}