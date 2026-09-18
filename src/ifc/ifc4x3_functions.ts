// The EXPRESS DERIVE functions the generated IFC4X3 entities call, ported
// from ifc_functions.ts (IFC4's copy) and retargeted at ifc4x3_gen — these
// functions are schema definitions, not generated code, so (like
// ifc_functions.ts/ap214_functions.ts) they are hand-authored, not
// regenerated.
//
// Three of these — IfcPointDim, IfcDimensionsForSIUnit, IfcSegmentDim — are
// referenced by generated code (IfcPoint.gen.ts, IfcSIUnit.gen.ts,
// IfcSegment.gen.ts) that does NOT import them: a generator bug specific to
// IFC4X3_ADD2.exp, first seen here since IFC4/AP214 have no DERIVE clause
// that trips it (bldrs-ai/conway#280 phase 2a). Filed for a phase-2b/
// IFC-gen-internal follow-up; the checked-in ifc4x3_gen/IfcPoint.gen.ts,
// IfcSIUnit.gen.ts and IfcSegment.gen.ts carry a hand-added import of these
// three from this file so their generated code actually compiles — see the
// comment at the top of each for why they differ from a fresh regenerate.
import {
  IfcBSplineCurve,
  IfcCompositeCurve,
  IfcConic,
  IfcIndexedPolyCurve,
  IfcLine,
  IfcOffsetCurve2D,
  IfcOffsetCurve3D,
  IfcPolyline,
  IfcSurface,
  IfcTrimmedCurve,
} from './ifc4x3_gen'
import {IfcDirection} from './ifc4x3_gen'
import {IfcParameterValue} from './ifc4x3_gen'
import {IfcUnitEnum} from './ifc4x3_gen'
import {IfcDimensionalExponents} from './ifc4x3_gen'
import {IfcColourSpecification} from './ifc4x3_gen'
import {IfcPreDefinedColour} from './ifc4x3_gen'
import {IfcExternallyDefinedHatchStyle} from './ifc4x3_gen'
import {IfcFillAreaStyleHatching} from './ifc4x3_gen'
import {IfcFillAreaStyleTiles} from './ifc4x3_gen'
import {IfcAxis2Placement2D} from './ifc4x3_gen'
import {IfcAxis2Placement3D} from './ifc4x3_gen'
import {IfcObjectPlacement} from './ifc4x3_gen'
import {IfcDerivedUnit} from './ifc4x3_gen'
import {IfcMonetaryUnit} from './ifc4x3_gen'
import {IfcNamedUnit} from './ifc4x3_gen'
import {IfcVector} from './ifc4x3_gen'
import {IfcCurve} from './ifc4x3_gen'
import {IfcDerivedUnitElement} from './ifc4x3_gen'
import {IfcSIUnitName} from './ifc4x3_gen'
import {IfcEdgeLoop} from './ifc4x3_gen'
import {IfcMaterialLayerSet} from './ifc4x3_gen'
import {IfcPath} from './ifc4x3_gen'
import {IfcCartesianPoint} from './ifc4x3_gen'
import {IfcLabel} from './ifc4x3_gen'
import {IfcRepresentationItem} from './ifc4x3_gen'
import {IfcProfileDef} from './ifc4x3_gen'
import {IfcRelDefinesByProperties} from './ifc4x3_gen'
import {IfcProperty} from './ifc4x3_gen'
import {IfcPropertySetDefinition} from './ifc4x3_gen'
import {IfcPhysicalQuantity} from './ifc4x3_gen'
import {
  IfcCartesianPointList,
  IfcCartesianPointList2D,
  IfcCompositeCurveOnSurface,
  IfcPcurve,
  IfcSurfaceCurve,
} from './ifc4x3_gen'
import {IfcPoint} from './ifc4x3_gen'
import {IfcSegment} from './ifc4x3_gen'


/**
 *
 */
export function IfcPointListDim(pointList: IfcCartesianPointList) : number {
  if ( pointList instanceof IfcCartesianPointList2D ) {
    return 2
  }

  return 3
}

/**
 *
 */
export function IfcBaseAxis(dim: number, axis1: IfcDirection, axis2: IfcDirection, axis3: IfcDirection) : Array<IfcDirection> {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcBooleanChoose<T>(b: boolean, choice1: T, choice2: T) : T {
  return b ? choice1 : choice2
}

/**
 *
 */
export function IfcBuild2Axes(refDirection: IfcDirection | null) : Array<IfcDirection> {
  throw ['This function is not yet implemented.']
}

/**
 *
 */
export function IfcBuildAxes(axis: IfcDirection | null, refDirection: IfcDirection | null) : Array<IfcDirection> {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcConstraintsParamBSpline(degree: number, upKnots: number, upCp: number, knotMult: number, knots: IfcParameterValue) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcConvertDirectionInto2D(direction: IfcDirection) : IfcDirection {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcCorrectDimensions(m: IfcUnitEnum, dim: IfcDimensionalExponents) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcCorrectFillAreaStyle(styles: Array<IfcColourSpecification|IfcPreDefinedColour|IfcExternallyDefinedHatchStyle|IfcFillAreaStyleHatching|IfcFillAreaStyleTiles>) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcCorrectLocalPlacement(axisPlacement: IfcAxis2Placement2D|IfcAxis2Placement3D, relPlacement: IfcObjectPlacement) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcCorrectUnitAssignment(units: Array<IfcDerivedUnit|IfcMonetaryUnit|IfcNamedUnit>) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcCrossProduct(arg1: IfcDirection, arg2: IfcDirection) : IfcVector {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcCurveDim(curve: IfcCurve) : number {
  if (curve instanceof IfcLine) {
    return curve.Pnt.Dim
  }
  if (curve instanceof IfcConic ) {
    return curve.Position.Dim
  }
  if (curve instanceof IfcPolyline ) {
    return curve.Points[0].Dim
  }
  if (curve instanceof IfcTrimmedCurve) {
    return IfcCurveDim(curve.BasisCurve)
  }
  if (curve instanceof IfcCompositeCurve) {
    return curve.Segments[0].Dim
  }
  if (curve instanceof IfcBSplineCurve) {
    return curve.ControlPointsList[0].Dim
  }
  if (curve instanceof IfcOffsetCurve2D) {
    return 2
  }
  if (curve instanceof IfcOffsetCurve3D) {
    return 3
  }
  if (curve instanceof IfcPcurve) {
    return 3
  }
  if (curve instanceof IfcIndexedPolyCurve) {
    return curve.Points.Dim
  }

  return 0
}

/**
 * DERIVE Dim : IfcDimensionCount := IfcPointDim(SELF) on IfcPoint — every
 * subtype's Dim comes from its own defining coordinates. See this file's
 * top-of-file comment: IfcPoint.gen.ts calls this without importing it
 * (generator bug), so its generated import was hand-added.
 */
export function IfcPointDim(point: IfcPoint) : number {
  throw 'This function is not yet implemented.'
}

/**
 * DERIVE Dim : IfcDimensionCount := IfcSegmentDim(SELF) on IfcSegment. See
 * this file's top-of-file comment: IfcSegment.gen.ts calls this without
 * importing it (generator bug), so its generated import was hand-added.
 */
export function IfcSegmentDim(segment: IfcSegment) : number {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcDeriveDimensionalExponents(unitElements: IfcDerivedUnitElement[]) : IfcDimensionalExponents {
  throw 'This function is not yet implemented.'
}

/**
 * DERIVE SELF\IfcNamedUnit.Dimensions := IfcDimensionsForSIUnit(SELF.Name)
 * on IfcSIUnit. See this file's top-of-file comment: IfcSIUnit.gen.ts calls
 * this without importing it (generator bug), so its generated import was
 * hand-added.
 */
export function IfcDimensionsForSIUnit(n: IfcSIUnitName) : IfcDimensionalExponents {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcDotProduct(arg1: IfcDirection, arg2: IfcDirection) : number {
  let result = 0

  for ( let argIndex = 0, end = Math.min( arg1.Dim, arg2.Dim ); argIndex < end; ++argIndex ) {
    result += arg1.DirectionRatios[argIndex] * arg2.DirectionRatios[argIndex]
  }

  return result
}

/**
 *
 */
export function IfcFirstProjAxis(zAxis: IfcDirection, arg: IfcDirection) : IfcDirection {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcGetBasisSurface(c: IfcCompositeCurveOnSurface|IfcPcurve|IfcSurfaceCurve) : Array<IfcSurface> {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcListToArray<T>(lis: Array<T>, low: number, u: number) : Array<T> {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcLoopHeadToTail(aLoop: IfcEdgeLoop) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 * Takes a 2D array
 */
export function IfcMakeArrayOfArray<T>(lis: Array<Array<T>>, low1: number, u1: number, low2: number, u2: number) : Array<Array<T>> {

  const result = [] as Array< Array< T > >

  for ( let u = low1; u < u1; ++u ) {

    const toAdd = [] as Array< T >

    for ( let v = low2; v < u2; ++v ) {

      toAdd.push( lis[ v ][ u ] )
    }

    result.push( toAdd )
  }

  return result
}

/**
 *
 */
export function IfcMlsTotalThickness(layerSet: IfcMaterialLayerSet) : number {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcNormalise(arg: IfcDirection|IfcVector) : IfcDirection|IfcVector {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcOrthogonalComplement(vec: IfcDirection) : IfcDirection {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcPathHeadToTail(aPath: IfcPath) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcSameAxis2Placement(ap1: IfcAxis2Placement2D|IfcAxis2Placement3D, ap2: IfcAxis2Placement2D|IfcAxis2Placement3D, epsilon: number) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcSameCartesianPoint(cp1: IfcCartesianPoint, cp2: IfcCartesianPoint, epsilon: number) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcSameDirection(dir1: IfcDirection, dir2: IfcDirection, epsilon: number) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcSameValidPrecision(epsilon1: number, epsilon2: number) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcSameValue(value1: number, value2: number, epsilon: number) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcScalarTimesVector(scalar: number, vec: IfcDirection|IfcVector) : IfcVector {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcSecondProjAxis(zAxis: IfcDirection, xAxis: IfcDirection, arg: IfcDirection) : IfcDirection {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcShapeRepresentationTypes(repType: IfcLabel, items: IfcRepresentationItem) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcTaperedSweptAreaProfiles(startArea: IfcProfileDef, endArea: IfcProfileDef) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcTopologyRepresentationTypes(repType: IfcLabel, items: IfcRepresentationItem) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcUniqueDefinitionNames(relations: Array<IfcRelDefinesByProperties>) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcUniquePropertyName(properties: Array<IfcProperty>) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcUniquePropertySetNames(properties: Array<IfcPropertySetDefinition>) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcUniqueQuantityNames(properties: Array<IfcPhysicalQuantity>) : boolean {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcVectorDifference(arg1: IfcDirection|IfcVector, arg2: IfcDirection|IfcVector) : IfcVector {
  throw 'This function is not yet implemented.'
}

/**
 *
 */
export function IfcVectorSum(arg1: IfcDirection|IfcVector, arg2: IfcDirection|IfcVector) : IfcVector {
  throw 'This function is not yet implemented.'
}
