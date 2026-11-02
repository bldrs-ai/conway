/* eslint-disable no-magic-numbers */
// conway#748: a deferred compat open no longer prepares the extraction maps
// (every relationship sweep and the styled-item map) at open. It reads the
// project's units — the proxy and the spatial imposters need the real
// linear scaling factor at open — and leaves the sweeps to the first
// geometry batch. These tests pin each half of that, and the three things
// that could go wrong once the prep moves:
//
// - the units must be read at open, and exactly once (the factor is
//   `*=`-accumulated, so a second read squares the unit prefix);
// - a windowed source must have the prep records paged before the sweeps
//   read them, or the sweeps silently do nothing and the model extracts
//   untinted with no openings cut — so the async pump pages first, and a
//   synchronous route that has not paged must fail loudly;
// - a synchronous caller arriving while the async prep is suspended between
//   two sweeps must not extract against half-built maps.
import * as fs from 'fs'

import { afterEach, beforeAll, describe, expect, jest, test } from '@jest/globals'

import { IfcGeometryExtraction } from '../../ifc/ifc_geometry_extraction'
import { AP214GeometryExtraction } from '../../AP214E3_2010/ap214_geometry_extraction'
import { InMemoryStepByteStore } from '../../step/step_buffer_provider'
import { FlatMesh, IfcAPI } from './ifc_api'

const SETTINGS = { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true }
const DEFERRED = { ...SETTINGS, DEFER_GEOMETRY: true }

/**
 * The prep's public map sweeps. (The rel-associates-material sweep is
 * private; these three bracket it in the step list.)
 */
const SWEEPS = [
  'populateMaterialDefinitionsMap',
  'populateRelVoidsMap',
  'populateStyledItemsMap',
] as const

let api: IfcAPI

beforeAll( async () => {
  api = new IfcAPI()
  await api.Init()
}, 120000 )

afterEach( () => {
  jest.restoreAllMocks()
} )

/**
 * The extraction behind an open model — the proxy keeps it private, and
 * these tests are about exactly its state.
 *
 * @param modelID The open model.
 * @return {IfcGeometryExtraction} Its geometry extraction.
 */
function extractionOf( modelID: number ): IfcGeometryExtraction {
  return ( api.getPassthrough( modelID ) as unknown as
    { conwayGeometry_: IfcGeometryExtraction } ).conwayGeometry_
}

/**
 * Pump a deferred model to completion through the async pump (Share's
 * path), capturing each placed instance's colour and its geometry's size.
 *
 * @param modelID The open model.
 * @return {Promise<string[]>} One sorted, comparable line per instance.
 */
async function pumpAsync( modelID: number ): Promise< string[] > {

  const lines: string[] = []

  const onMesh = ( mesh: FlatMesh ) => {

    for ( let where = 0; where < mesh.geometries.size(); ++where ) {

      const placed = mesh.geometries.get( where )
      const geometry = api.GetGeometry( modelID, placed.geometryExpressID )

      lines.push( JSON.stringify( [
        mesh.expressID,
        placed.color,
        geometry.GetVertexDataSize(),
        geometry.GetIndexDataSize(),
      ] ) )
    }
  }

  for ( ; ; ) {

    const { extracted, remaining } =
      await api.ExtractGeometryBatchAsync( modelID, 2, onMesh )

    if ( remaining === 0 && extracted === 0 ) {
      break
    }
  }

  return lines.sort()
}

/**
 * index.ifc with its length unit switched to millimetres, so the linear
 * scaling factor is 0.001 instead of the default 1 and both a missing read
 * (1) and a doubled one (1e-6) are visible.
 *
 * @return {Uint8Array} The edited file.
 */
function millimetreIndex(): Uint8Array {

  const text = fs.readFileSync( 'data/index.ifc', 'utf8' )
  const edited = text.replace(
      'IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)',
      'IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)' )

  expect( edited ).not.toBe( text )

  return new Uint8Array( Buffer.from( edited, 'utf8' ) )
}

describe( 'conway#748: deferred opens prepare the extraction maps lazily', () => {

  test( 'a deferred open runs no map sweep; the first batch runs each once', async () => {

    const buffer = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )

    const spies = SWEEPS.map( ( name ) =>
      jest.spyOn( IfcGeometryExtraction.prototype, name ) )

    for ( const open of [
      () => api.OpenModelStreamed( buffer, DEFERRED ),
      () => api.OpenModelStream( new InMemoryStepByteStore( buffer ), DEFERRED ),
    ] ) {

      for ( const spy of spies ) {
        spy.mockClear()
      }

      const modelID = await open()

      expect( modelID ).toBeGreaterThanOrEqual( 0 )

      // A headless read: the spatial tree and properties need no maps.
      const tree = await api.properties.getSpatialStructure( modelID, 'names' )

      expect( tree?.children.length ).toBeGreaterThan( 0 )
      expect( extractionOf( modelID ).isDemandExtractionPrepared ).toBe( false )

      for ( const spy of spies ) {
        expect( spy ).not.toHaveBeenCalled()
      }

      await api.ExtractGeometryBatchAsync( modelID, 1 )

      expect( extractionOf( modelID ).isDemandExtractionPrepared ).toBe( true )

      for ( const spy of spies ) {
        expect( spy ).toHaveBeenCalledTimes( 1 )
      }

      // Later batches do not prepare again.
      await pumpAsync( modelID )

      for ( const spy of spies ) {
        expect( spy ).toHaveBeenCalledTimes( 1 )
      }

      api.CloseModel( modelID )
    }
  }, 240000 )

  test( 'the units are read at open, and only once', async () => {

    const buffer = millimetreIndex()

    const classicID = api.OpenModel( buffer, SETTINGS )

    expect( api.GetLinearScalingFactor( classicID ) ).toBeCloseTo( 0.001, 12 )

    const spy =
      jest.spyOn( IfcGeometryExtraction.prototype, 'extractLinearScalingFactor' )

    for ( const open of [
      () => api.OpenModelStreamed( buffer, DEFERRED ),
      () => api.OpenModelStream( new InMemoryStepByteStore( buffer ), DEFERRED ),
    ] ) {

      spy.mockClear()

      const modelID = await open()

      // At open, before any geometry: the proxy's own copy, read by its
      // constructor, is the real factor rather than the default 1.
      expect( api.GetLinearScalingFactor( modelID ) ).toBeCloseTo( 0.001, 12 )

      await pumpAsync( modelID )

      // And the prep the pump ran did not read it again (0.001² = 1e-6).
      expect( spy ).toHaveBeenCalledTimes( 1 )
      expect( extractionOf( modelID ).getLinearScalingFactor() )
          .toBeCloseTo( 0.001, 12 )

      api.CloseModel( modelID )
    }

    api.CloseModel( classicID )
  }, 240000 )

  test( 'a windowed source is paged before the sweeps read it', async () => {

    // Both fixtures colour through the maps: styled items, material
    // definitions and material associations. (aggregate_master_voids is not
    // here: its cut comes through the aggregates pass's own paging, so an
    // unpaged prep leaves it unchanged and the comparison could not fail.)
    // Mismatches are collected rather than thrown at the first, so a
    // failure names every fixture the windowed prep lost.
    const mismatched: string[] = []

    for ( const fixture of [
      'data/surface_style_shading_mapped.ifc',
      'data/index.ifc',
    ] ) {

      const buffer = new Uint8Array( fs.readFileSync( fixture ) )

      const residentID = await api.OpenModelStreamed( buffer, DEFERRED )
      const resident = await pumpAsync( residentID )

      expect( resident.length ).toBeGreaterThan( 0 )

      // Opened resident and spilled before the first batch: the prep now
      // runs against 512-byte windows with three resident, so every sweep
      // reads records the LRU has dropped unless they were paged first.
      const windowedID = await api.OpenModelStreamed( buffer, DEFERRED )

      expect( extractionOf( windowedID ).isDemandExtractionPrepared ).toBe( false )
      expect( api.SpillModelSource(
          windowedID, new InMemoryStepByteStore( buffer ), 512, 3 ) ).toBe( true )

      if ( JSON.stringify( await pumpAsync( windowedID ) ) !==
          JSON.stringify( resident ) ) {
        mismatched.push( fixture )
      }

      api.CloseModel( residentID )
      api.CloseModel( windowedID )
    }

    expect( mismatched ).toEqual( [] )
  }, 240000 )

  test( 'an unpaged synchronous prep on a windowed source throws', async () => {

    const buffer = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const modelID = await api.OpenModelStreamed( buffer, DEFERRED )

    api.SpillModelSource( modelID, new InMemoryStepByteStore( buffer ), 512, 3 )

    const extraction = extractionOf( modelID )

    // Silently sweeping unpaged records would leave every map empty.
    expect( () => extraction.prepareDemandExtraction() )
        .toThrow( /paged first/ )
    expect( extraction.isDemandExtractionPrepared ).toBe( false )

    // The async pump is the supported route, and still works afterwards.
    expect( ( await pumpAsync( modelID ) ).length ).toBeGreaterThan( 0 )
    expect( extraction.isDemandExtractionPrepared ).toBe( true )

    api.CloseModel( modelID )
  }, 240000 )

  test( 'a sync prep during the async one finishes the sweeps, once each', async () => {

    const buffer = new Uint8Array( fs.readFileSync( 'data/index.ifc' ) )
    const modelID = await api.OpenModelStreamed( buffer, DEFERRED )
    const extraction = extractionOf( modelID )

    const spies = SWEEPS.map( ( name ) =>
      jest.spyOn( IfcGeometryExtraction.prototype, name ) )

    // Started, not awaited: it is suspended at its first await, before any
    // sweep — the window a synchronous caller (StreamAllMeshes from an
    // event handler, say) can land in.
    const pending = extraction.prepareDemandExtractionAsync()

    extraction.prepareDemandExtraction()

    // The sync caller ran every sweep itself, before the async prep resumed:
    // it did not take "prep in progress" for "prep done".
    expect( extraction.isDemandExtractionPrepared ).toBe( true )

    for ( const spy of spies ) {
      expect( spy ).toHaveBeenCalledTimes( 1 )
    }

    await pending

    // And the async prep, resuming, ran none of them again.
    for ( const spy of spies ) {
      expect( spy ).toHaveBeenCalledTimes( 1 )
    }

    api.CloseModel( modelID )
  }, 240000 )

  test( 'a pump whose product worklist is empty still prepares', async () => {

    // Every product here is an aggregate target — the assembly is
    // aggregated under the project, the part under the assembly — so the
    // per-product worklist is empty and all geometry comes from the
    // rel-aggregates pass, which extracts without going through
    // extractProductGeometryByLocalID's prep. The part is styled red; an
    // unprepared pass would deliver it untinted.
    const fixture = fs.readFileSync( 'data/aggregate_master_voids.ifc', 'utf8' )
        .replace( /#300=[\s\S]*?#400=[^\n]*\n/, '' )
        .replace(
            '#500=IFCRELAGGREGATES',
            "#501=IFCRELAGGREGATES('6hF0kSTOX3ovkcpuOhkPrX',$,$,$,#1,(#100));\n" +
            '#600=IFCSTYLEDITEM(#212,(#601),$);\n' +
            '#601=IFCSURFACESTYLE($,.BOTH.,(#602));\n' +
            '#602=IFCSURFACESTYLESHADING(#603,$);\n' +
            '#603=IFCCOLOURRGB($,1.,0.,0.);\n' +
            '#500=IFCRELAGGREGATES' )
    const buffer = new Uint8Array( Buffer.from( fixture, 'utf8' ) )

    expect( fixture ).toContain( '#501=' )
    expect( fixture ).not.toContain( '#300=' )

    const colours = ( modelID: number, pump: () => void ) => {
      const seen: string[] = []
      pump()
      api.StreamAllMeshes( modelID, ( mesh ) => {
        for ( let where = 0; where < mesh.geometries.size(); ++where ) {
          seen.push( JSON.stringify( mesh.geometries.get( where ).color ) )
        }
      } )
      return seen.sort()
    }

    const classicID = api.OpenModel( buffer, SETTINGS )
    const classic = colours( classicID, () => { /* extracted at open */ } )

    expect( classic ).toEqual( [ JSON.stringify( { x: 1, y: 0, z: 0, w: 1 } ) ] )

    const syncID = await api.OpenModelStreamed( buffer, DEFERRED )

    expect( colours( syncID, () => {
      while ( api.ExtractGeometryBatch( syncID, 1 ).remaining > 0 ) {
        // draining
      }
    } ) ).toEqual( classic )

    const asyncID = await api.OpenModelStreamed( buffer, DEFERRED )

    for ( ; ; ) {
      const { extracted, remaining } = await api.ExtractGeometryBatchAsync( asyncID, 1 )
      if ( remaining === 0 && extracted === 0 ) {
        break
      }
    }

    expect( colours( asyncID, () => { /* drained above */ } ) ).toEqual( classic )

    api.CloseModel( classicID )
    api.CloseModel( syncID )
    api.CloseModel( asyncID )
  }, 240000 )

  test( 'AP214: a deferred open plans no units until the first batch', async () => {

    const buffer = new Uint8Array(
        fs.readFileSync( 'data/nema-23-76mm.step' ) )

    // Runs inside the planning, exactly once per plan — unlike
    // prepareDemandExtraction itself, which every batch calls and which
    // returns at once after the first.
    const spy =
      jest.spyOn( AP214GeometryExtraction.prototype, 'populateStyledItemsMap' )

    const modelID = await api.OpenModelStreamed( buffer, DEFERRED )

    expect( modelID ).toBeGreaterThanOrEqual( 0 )

    const extraction = ( api.getPassthrough( modelID ) as unknown as
      { conwayGeometry_: AP214GeometryExtraction } ).conwayGeometry_

    expect( extraction.isDemandExtractionPrepared ).toBe( false )
    expect( spy ).not.toHaveBeenCalled()

    // Nothing extracted yet, so nothing may be freed: an unplanned model
    // reports zero units, which must not read as "drained".
    expect( api.ReleaseModelGeometry( modelID ) ).toBe( false )

    const first = api.ExtractGeometryBatch( modelID, 1 )

    expect( extraction.isDemandExtractionPrepared ).toBe( true )
    expect( first.extracted + first.remaining ).toBeGreaterThan( 0 )

    while ( api.ExtractGeometryBatch( modelID, 64 ).remaining > 0 ) {
      // draining
    }

    // Planned exactly once, by the first batch, not by the open.
    expect( spy ).toHaveBeenCalledTimes( 1 )

    api.CloseModel( modelID )
  }, 240000 )
} )
