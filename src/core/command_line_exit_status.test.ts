import fs from 'fs'
import os from 'os'
import path from 'path'
import { execFileSync } from 'child_process'
import { describe, expect, test } from '@jest/globals'

/**
 * Subprocess tests for the exit status of the two exporter CLIs,
 * `ifc_command_line_main.ts` and `ap214_command_line_main.ts`.
 *
 * scripts/visual_diff_report.cjs runs these to export a model's GLBs, and
 * reads a non-zero exit as "this export failed" even when it left GLBs
 * behind (#795). On main before this change both CLIs exited 0 when they
 * couldn't read their input (a bare `exit()` uses `process.exitCode`, which
 * defaults to 0), and the STEP CLI's top-level catch didn't set an exit
 * code at all, where the IFC CLI's has since #713. These spawn the real
 * compiled entry points, the way the script does.
 *
 * Verified as discriminating: against main's build the unreadable-input
 * cases below exit 0 for both CLIs. Each CLI also exports a small fixture
 * here and must exit 0 and write a GLB, so a CLI that fails everything
 * can't pass.
 *
 * Not covered: the GLB-writer failure paths (generation unsuccessful, a
 * buffer/URI count mismatch, a failed file write) have no repo fixture that
 * reaches them; they set the exit code the same way.
 */

const REPO_ROOT = process.cwd()
const SUBPROCESS_TIMEOUT_MS = 60000

const CLIS = [
  {
    name: 'IFC CLI',
    entry: path.resolve(REPO_ROOT, 'compiled/src/ifc/ifc_command_line_main.js'),
    fixture: path.resolve(REPO_ROOT, 'data/index.ifc'),
  },
  {
    name: 'STEP CLI',
    entry: path.resolve(REPO_ROOT, 'compiled/src/AP214E3_2010/ap214_command_line_main.js'),
    fixture: path.resolve(REPO_ROOT, 'data/ap214-two-root-parts.step'),
  },
]

for (const { entry } of CLIS) {
  if (!fs.existsSync(entry)) {
    // Loud, not a skip: Jest runs compiled/, so a missing entry point means
    // `yarn build-incremental` didn't run, and every case would misreport.
    throw new Error(`${entry} is missing; run \`yarn build-incremental\` first.`)
  }
}

/**
 * Run a CLI to completion and return its exit code. A signal (the timeout)
 * throws instead, since that's a failure of the test, not an exit status.
 *
 * @param entry Compiled CLI entry point.
 * @param args CLI arguments.
 * @param cwd Working directory for the child.
 * @return {number} The child's exit code.
 */
function exitCodeOf(entry: string, args: string[], cwd: string): number {
  try {
    execFileSync('node', ['--experimental-specifier-resolution=node', entry, ...args], {
      cwd,
      timeout: SUBPROCESS_TIMEOUT_MS,
      stdio: 'pipe',
    })
    return 0
  } catch (err) {
    const status = (err as { status?: number | null }).status

    if (status === undefined || status === null) {
      throw new Error(`${entry} did not exit normally: ${(err as Error).message}`)
    }

    return status
  }
}

describe('exporter CLIs report failure in their exit status', () => {
  for (const { name, entry, fixture } of CLIS) {
    test(`${name}: an unreadable input exits non-zero`, () => {
      const missing = path.join(os.tmpdir(), 'conway-exit-status-missing', 'absent.model')

      expect(exitCodeOf(entry, ['-g', missing], REPO_ROOT)).not.toBe(0)
    }, SUBPROCESS_TIMEOUT_MS)

    test(`${name}: a good export exits 0 and writes a GLB`, () => {
      // The CLIs write their GLBs next to the input, so export a copy in a
      // scratch directory rather than the fixture in data/.
      const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'conway-exit-status-'))

      try {
        const copy = path.join(scratch, path.basename(fixture))
        fs.copyFileSync(fixture, copy)

        expect(exitCodeOf(entry, ['-g', copy], scratch)).toBe(0)
        expect(fs.readdirSync(scratch).some((f) => f.endsWith('.glb'))).toBe(true)
      } finally {
        fs.rmSync(scratch, { recursive: true, force: true })
      }
    }, SUBPROCESS_TIMEOUT_MS)
  }
})
