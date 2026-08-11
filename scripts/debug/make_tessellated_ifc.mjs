#!/usr/bin/env node
/**
 * Generate a synthetic tessellated IFC4 with a chosen number of
 * `IfcPolygonalFaceSet`s and `IfcIndexedPolygonalFace`s.
 *
 * Exists because PSB.ifc — the model conway#446's load-time work is aimed at —
 * is 861 MB and lives in test-models-private, so it is not always reachable
 * from a working sandbox. The lever this feeds (conway#446 "lever 2") is
 * bounded by *per-record entity plumbing*: resolving 9.1 M face references,
 * constructing an entity per face, and retaining a 9.1 M-element array per
 * faceset. That cost depends on record COUNT and shape, not on the geometry
 * being a real building — so a synthetic file with the same record structure
 * reproduces it faithfully enough to measure an optimisation against.
 *
 * What it does NOT reproduce: PSB's parse/index phase shape (real property
 * sets, spatial hierarchy, materials), its byte size for a given face count,
 * or anything about geometric correctness. Numbers from this file are useful
 * as a BEFORE/AFTER pair on the same file, not as a stand-in for PSB's
 * absolute timings.
 *
 * ## READ THIS BEFORE USING IT FOR LEVER 2
 *
 * As of writing it does NOT yet reproduce lever 2's dominant cost. Measured
 * on a 1M-face file (`--facesets 1000 --faces-per-set 1000`) against PSB's
 * profile in conway#446, scaling by the 9.1x face-count ratio:
 *
 *   frame                        this file   PSB      PSB/9.1 (expected)
 *   minimal_perfect_hash.get       0.33 s    3.69 s     0.41 s   ✓ matches
 *   parseDataBlockIncremental      0.19 s    2.37 s     0.26 s   ✓ matches
 *   extractIntegerArray*Into       0.15 s    1.48 s     0.16 s   ✓ matches
 *   getTypedElementByExpressID     0.002 s   6.04 s     0.66 s   ✗ ABSENT
 *
 * The parse/index frames track well. `getTypedElementByExpressID` — PSB's
 * single largest frame, and the one lever 2 exists to remove — is three
 * orders of magnitude off, so this model is not exercising the face
 * materialisation path the way PSB does.
 *
 * So: valid today for measuring parse/index work, NOT valid for measuring a
 * lever-2 change. Close that gap first (find what makes PSB's facesets
 * resolve references where these do not — the reference-list shape, the
 * `Faces` accessor's cache behaviour, or the surrounding product structure)
 * or measure against the real file. An optimisation validated here would be
 * an optimisation validated against a workload missing its own bottleneck.
 *
 * The emitted structure mirrors data/index.ifc exactly — one
 * IfcCartesianPointList3D plus N IfcIndexedPolygonalFace per faceset, all
 * facesets carried as items of one IfcShapeRepresentation on one
 * IfcBuildingElementProxy — so it takes the same extraction path.
 *
 * Usage:
 *   node scripts/debug/make_tessellated_ifc.mjs <out.ifc> [--facesets N] [--faces-per-set M]
 *
 *   --facesets N        default 200
 *   --faces-per-set M   default 500   (N x M = total IfcIndexedPolygonalFace)
 *
 * Examples:
 *   # ~100k faces, a few seconds to load — good for iterating
 *   node scripts/debug/make_tessellated_ifc.mjs /tmp/tess-100k.ifc
 *
 *   # ~1M faces, closer to PSB's shape at about a ninth its record count
 *   node scripts/debug/make_tessellated_ifc.mjs /tmp/tess-1m.ifc \
 *     --facesets 1000 --faces-per-set 1000
 */

import fs from 'node:fs'

/** Vertices per generated face. Quads, matching index.ifc's tessellation. */
const FACE_VERTICES = 4

/** Points in each faceset's shared IfcCartesianPointList3D. */
const POINTS_PER_SET = 8

/** Facesets per row before wrapping, so the model has a 2D footprint. */
const SETS_PER_ROW = 100

/** Bytes per megabyte, for the size report. */
const BYTES_PER_MB = 1024 * 1024

const DEFAULT_FACESETS = 200
const DEFAULT_FACES_PER_SET = 500

const EXIT_USAGE = 1


/**
 * Parse argv.
 *
 * @param {string[]} argv Arguments after the node binary and script path.
 * @return {object} {out, facesets, facesPerSet}
 */
function parseArgs(argv) {
  const options = {
    out: undefined,
    facesets: DEFAULT_FACESETS,
    facesPerSet: DEFAULT_FACES_PER_SET,
  }

  for (let i = 0; i < argv.length; ++i) {
    switch (argv[i]) {
      case '--facesets':
        options.facesets = Number(argv[++i])
        break
      case '--faces-per-set':
        options.facesPerSet = Number(argv[++i])
        break
      default:
        options.out = argv[i]
    }
  }

  if (options.out === undefined ||
      !Number.isFinite(options.facesets) ||
      !Number.isFinite(options.facesPerSet)) {
    throw new Error(
        'usage: make_tessellated_ifc.mjs <out.ifc> ' +
        '[--facesets N] [--faces-per-set M]')
  }

  return options
}


/**
 * Emit the file.
 *
 * @param {object} options From parseArgs.
 */
function generate(options) {
  const { out, facesets, facesPerSet } = options

  // Written incrementally rather than joined at the end: a million faces is
  // hundreds of MB of text, and building that as one JS string is how this
  // script would OOM before conway ever saw the file.
  const sink = fs.createWriteStream(out)

  /**
   * @param {string} line One line, newline appended.
   */
  const write = (line) => sink.write(`${line}\n`)

  write('ISO-10303-21;')
  write('HEADER;')
  write(`FILE_DESCRIPTION(('ViewDefinition [Tessellation]'),'2;1');`)
  write(`FILE_NAME('${out}','',(''),(''),'conway make_tessellated_ifc','','');`)
  write(`FILE_SCHEMA(('IFC4'));`)
  write('ENDSEC;')
  write('DATA;')

  // --- Fixed scaffolding, mirroring data/index.ifc ------------------------
  write(`#1= IFCPERSON($,$,'',$,$,$,$,$);`)
  write(`#2= IFCORGANIZATION($,'',$,$,$);`)
  write('#3= IFCPERSONANDORGANIZATION(#1,#2,$);')
  write(`#4= IFCAPPLICATION(#2,'1','conway','conway');`)
  write('#5= IFCOWNERHISTORY(#3,#4,$,.ADDED.,$,$,$,0);')
  write(`#6= IFCCARTESIANPOINT((0.,0.,0.));`)
  write(`#7= IFCDIRECTION((0.,0.,1.));`)
  write(`#8= IFCDIRECTION((1.,0.,0.));`)
  write('#9= IFCAXIS2PLACEMENT3D(#6,#7,#8);')
  write('#10= IFCLOCALPLACEMENT($,#9);')
  write(`#11= IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);`)
  write(`#12= IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);`)
  write(`#13= IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);`)
  write('#14= IFCUNITASSIGNMENT((#11,#12,#13));')
  write(`#15= IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.00000000000E-5,#9,$);`)

  // --- Facesets ------------------------------------------------------------
  // IDs are assigned in one pass so the representation's item list can be
  // written after the entities it references, which STEP permits.
  const FIRST_ID = 100

  let id = FIRST_ID
  const facesetIds = []

  for (let set = 0; set < facesets; ++set) {
    const points = []

    // The 8 corners of a unit box, translated per faceset. Must be genuinely
    // 3D: an earlier version varied only z, leaving all 8 points colinear, and
    // conway rejected every face with "No basis found for brep!" — 200 meshes
    // walked with zero vertices, which would have measured the cost of
    // FAILING to tessellate rather than the cost being optimised.
    //
    // Each faceset gets its own footprint so the meshes are not coincident;
    // coincident geometry could let a dedup path collapse the work.
    const originX = set % SETS_PER_ROW
    const originY = Math.floor(set / SETS_PER_ROW)

    for (let point = 0; point < POINTS_PER_SET; ++point) {
      const x = originX + (point & 1)
      const y = originY + ((point >> 1) & 1)
      const z = (point >> 2) & 1

      points.push(`(${x}.,${y}.,${z}.)`)
    }

    const pointListId = id++

    write(`#${pointListId}= IFCCARTESIANPOINTLIST3D((${points.join(',')}));`)

    const faceIds = []

    for (let face = 0; face < facesPerSet; ++face) {
      const faceId = id++

      // Indices are 1-based into the point list, and cycle so every face is
      // a valid quad over the 8 shared points.
      const indices = []

      for (let vertex = 0; vertex < FACE_VERTICES; ++vertex) {
        indices.push(((face + vertex) % POINTS_PER_SET) + 1)
      }

      write(`#${faceId}= IFCINDEXEDPOLYGONALFACE((${indices.join(',')}));`)
      faceIds.push(`#${faceId}`)
    }

    const facesetId = id++

    write(`#${facesetId}= IFCPOLYGONALFACESET(#${pointListId},.T.,(${faceIds.join(',')}),$);`)
    facesetIds.push(`#${facesetId}`)
  }

  // --- Product carrying every faceset -------------------------------------
  const shapeId = id++

  write(`#${shapeId}= IFCSHAPEREPRESENTATION(#15,'Body','Tessellation',(${facesetIds.join(',')}));`)

  const definitionId = id++

  write(`#${definitionId}= IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeId}));`)
  write(
      `#${id++}= IFCBUILDINGELEMENTPROXY('0synthetic0000000000000',#5,'Tess',$,$,` +
      `#10,#${definitionId},$,.NOTDEFINED.);`)

  write(`#${id++}= IFCPROJECT('0synthetic0000000000001',#5,'Tess',$,$,$,$,(#15),#14);`)

  write('ENDSEC;')
  write('END-ISO-10303-21;')

  sink.end()

  return new Promise((resolve) => {
    sink.on('close', () => {
      const { size } = fs.statSync(out)

      console.log(JSON.stringify({
        out,
        facesets,
        facesPerSet,
        totalFaces: facesets * facesPerSet,
        megabytes: +(size / BYTES_PER_MB).toFixed(1),
      }))
      resolve()
    })
  })
}


try {
  await generate(parseArgs(process.argv.slice(2)))
} catch (err) {
  process.stderr.write(`Error: ${err.message}\n`)
  process.exit(EXIT_USAGE)
}
