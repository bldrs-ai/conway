import fs from 'fs'
import { describe, expect, test } from '@jest/globals'
import { AP214GeometryExtraction } from './ap214_geometry_extraction'
import { ParseResult } from '../step/parsing/step_parser'
import AP214StepParser from './ap214_step_parser'
import AP214StepModel from './ap214_step_model'
import ParsingBuffer from '../parsing/parsing_buffer'
import { ConwayGeometry } from '../../dependencies/conway-geom'
import { advanced_face } from './AP214E3_2010_gen'


// Reuses the #595 sphere-seam fixture purely as "a model with exactly one
// ADVANCED_FACE and no product/shape representation" - #595 itself is fixed
// (see ap214_sphere_seam_face.test.ts), so this face DOES mesh cleanly on an
// untouched extraction. That is what makes it a good fixture here: the
// "flags a dropped face" case below has to reach into the extraction and
// force the drop itself, rather than relying on a still-open defect.
const FIXTURE = 'data/issue-595-sphere-seam-loop.step'

let extraction: AP214GeometryExtraction
let model: AP214StepModel

/**
 * Parse the fixture and stand up extraction against it.
 */
async function load(): Promise<void> {

  const conwayGeometry = new ConwayGeometry()

  await conwayGeometry.initialize()

  const parser = AP214StepParser.Instance
  const buffer = new ParsingBuffer(fs.readFileSync(FIXTURE))

  parser.parseHeader(buffer)

  const [result, parsed] = parser.parseDataToModel(buffer)

  expect(result).toBe(ParseResult.COMPLETE)

  model = parsed as AP214StepModel
  model.nullOnErrors = true

  extraction = new AP214GeometryExtraction(conwayGeometry, model)
}

/**
 * Drive the fixture's one ADVANCED_FACE directly, the same way
 * ap214_sphere_seam_face.test.ts does - the fixture has no product or shape
 * representation, so the whole-model walk never reaches it.
 *
 * @return {number} The fixture's face localID, for tests that need it.
 */
function extractTheFace(): number {

  const faces = Array.from(model.types(advanced_face))

  // A zero here would mean the fixture stopped exercising the path, which
  // reads identically to a pass.
  expect(faces.length).toBe(1)

  extraction.extractFaces(faces, faces[0].localID)

  return faces[0].localID
}


describe('conway#596: per-model unaccounted-face count', () => {

  test('getUnaccountedFaceCount is undefined when tracking was never turned on', async () => {

    await load()
    extractTheFace()

    // trackFaceAccounting defaults to false - untracked extractions (every
    // caller except the digest/regression path) must not pay for this, and
    // "undefined" rather than "0" is how the count says so honestly: nothing
    // was measured, as opposed to nothing being unaccounted.
    expect(extraction.getUnaccountedFaceCount()).toBeUndefined()
  })

  test('a face that meshes cleanly is accounted for', async () => {

    await load()
    extraction.trackFaceAccounting = true
    extractTheFace()

    expect(extraction.getUnaccountedFaceCount()).toBe(0)
  })

  test('flags a face whose own extraction call landed zero triangles', async () => {

    // The conway#596 failure shape, reproduced directly rather than by
    // reaching for a real defect: the engine's own tessellation call
    // silently contributes nothing for this face, with no exception and no
    // warning - exactly what #594/#595 looked like from the digest's side
    // before they were diagnosed by other means.
    await load()
    extraction.trackFaceAccounting = true

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractionAny = extraction as any
    const originalAddOrStageFace = extractionAny.addOrStageFace.bind(extraction)
    let calls = 0

    extractionAny.addOrStageFace = () => {
      ++calls
      // Deliberately do NOT call through - this face's tessellation call
      // is issued and produces nothing, same as the underlying native
      // call silently returning zero triangles would.
    }

    try {
      extractTheFace()
    } finally {
      extractionAny.addOrStageFace = originalAddOrStageFace
    }

    // The injection has to have fired, or this test proves nothing - the
    // "a probe that never fires looks exactly like a clean model" rule.
    expect(calls).toBeGreaterThan(0)

    expect(extraction.getUnaccountedFaceCount()).toBe(1)
  })

  test('a face with zero bounds is unaccounted, not silently skipped', async () => {

    await load()
    extraction.trackFaceAccounting = true

    const faces = Array.from(model.types(advanced_face))

    expect(faces.length).toBe(1)

    // Truncate the boundary the same way a genuinely degenerate STEP
    // declaration would - extractAdvancedFace's own "no bounds" early
    // return, not an injected failure. `bounds` lazily parses from the
    // STEP buffer into a private cache on first read; pre-seeding that
    // cache is the supported way to force the empty case without a
    // fixture engineered to have zero bounds in the file itself.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(faces[0] as any).bounds_ = []

    extraction.extractFaces(faces, faces[0].localID)

    expect(extraction.getUnaccountedFaceCount()).toBe(1)
  })
})
