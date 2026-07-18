#!/usr/bin/env node
/**
 * Render before/after images for models whose regression digests changed.
 *
 * Driven by the run-ifc-regression job: it git-diffs the regenerated digest
 * CSVs against the pinned test-models commit and hands the list of changed
 * models here. For each model this script exports GLBs with TWO conway
 * builds — "base" (what main ships today, normally the latest published
 * @bldrs-ai/conway) and "candidate" (this PR's tarball) — and renders both
 * through scripts/render_glb.cjs with a shared camera, so a reviewer sees
 * the actual geometric consequence of a digest change instead of a hash.
 *
 * Usage:
 *   visual_diff_report.cjs --models <changed_models.txt> \
 *     --base <package root> --cand <package root> --out <dir> [--max N]
 *
 * <changed_models.txt>: one absolute model path per line.
 * <package root>: a directory containing compiled/src/... (an unpacked npm
 * package or a built working tree).
 *
 * Outputs into --out: <slug>-before.png / <slug>-after.png per model plus
 * report.md, a markdown table body with RAW_URL_BASE placeholders the
 * workflow substitutes once it knows the assets commit SHA.
 */
'use strict'

const { execFileSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { max: 16 }
  for (let i = 0; i < args.length; i += 2) {
    opts[args[i].replace(/^--/, '')] = args[i + 1]
  }
  opts.max = parseInt(opts.max, 10)
  // The exporter children run with cwd set to a scratch dir, so a relative
  // --base/--cand (as the workflow passes) would make Node resolve the CLI
  // entry point against the scratch dir and die with ERR_MODULE_NOT_FOUND.
  for (const key of ['models', 'base', 'cand', 'out']) {
    if (opts[key]) {
      opts[key] = path.resolve(opts[key])
    }
  }
  return opts
}

/** Model file → the CLI entry point (relative to a package root) for it. */
function cliFor(modelPath) {
  const ext = path.extname(modelPath).toLowerCase()
  if (ext === '.ifc') {
    return 'compiled/src/ifc/ifc_command_line_main.js'
  }
  return 'compiled/src/AP214E3_2010/ap214_command_line_main.js'
}

/**
 * Export a model to GLB with one engine. Runs the CLI in a scratch cwd
 * (the exporter writes output files into cwd) and returns ALL non-Draco
 * GLB chunk paths (large models export as several chunk files that only
 * form the whole model together — rendering just one silently drops the
 * rest), or an empty list if the export produced nothing.
 */
function exportGlb(packageRoot, modelPath, scratchDir) {
  fs.mkdirSync(scratchDir, { recursive: true })
  const cli = path.join(packageRoot, cliFor(modelPath))
  let diagnostic = ''
  try {
    execFileSync(
        process.execPath,
        ['--experimental-specifier-resolution=node', cli, '-g', modelPath],
        { cwd: scratchDir, stdio: 'pipe', timeout: 10 * 60 * 1000 },
    )
  } catch (err) {
    // Fall through to the GLB scan: some models exit non-zero after still
    // writing usable geometry (per-element extraction errors).
    diagnostic = childFailureDiagnostic(err, `exporter (${path.basename(String(modelPath))})`)
  }
  const glbs = fs.readdirSync(scratchDir)
      .filter((f) => f.endsWith('.glb') && !f.includes('draco'))
      .map((f) => path.join(scratchDir, f))
      .sort()
  return { glbs, diagnostic }
}

/**
 * One meaningful line from a failed child's stderr — prefer the first
 * error-ish line over the last line, which for an uncaught exception is
 * just the "Node.js vX.Y.Z" crash footer. Also echoes the full child
 * stderr into our own stderr so the CI job log has the complete stack.
 */
function childFailureDiagnostic(err, label) {
  const stderr = (err.stderr || '').toString().trim()
  if (stderr) {
    process.stderr.write(`--- ${label} stderr ---\n${stderr}\n---\n`)
  }
  const lines = stderr.split('\n').filter(Boolean)
  return lines.find((l) => /error|cannot|not found|bad option|unexpected/i.test(l)) ||
      lines.pop() || String(err.code || err.signal || '')
}

function slugify(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_-]+/g, '_')
}

function main() {
  const opts = parseArgs()
  const models = fs.readFileSync(opts.models, 'utf8')
      .split('\n').map((l) => l.trim()).filter(Boolean)
  fs.mkdirSync(opts.out, { recursive: true })

  const renderScript = path.join(__dirname, 'render_glb.cjs')
  const rows = []
  const skipped = models.length > opts.max ? models.slice(opts.max) : []
  const selected = models.slice(0, opts.max)

  for (const model of selected) {
    const name = path.basename(model)
    const slug = slugify(name)
    const work = fs.mkdtempSync(path.join(os.tmpdir(), `vdiff-${slug}-`))
    process.stderr.write(`visual-diff: ${name}\n`)

    const base = exportGlb(opts.base, model, path.join(work, 'base'))
    const cand = exportGlb(opts.cand, model, path.join(work, 'cand'))

    if (base.glbs.length === 0 && cand.glbs.length === 0) {
      const why = (base.diagnostic || cand.diagnostic || '')
          .replace(/\|/g, '\\|').slice(0, 200)
      rows.push(`| \`${name}\` | _no geometry from both engines_` +
          `${why ? ` — \`${why}\`` : ''} | |`)
      fs.rmSync(work, { recursive: true, force: true })
      continue
    }

    /**
     * Render one side alone (auto-framed on itself). Returns the markdown
     * cell: an image on success, the failure reason otherwise.
     */
    const renderSingle = (side, sideName, suffix) => {
      if (side.glbs.length === 0) {
        const why = (side.diagnostic || '').replace(/\|/g, '\\|').slice(0, 200)
        return `_no geometry from ${sideName} engine_${why ? ` — \`${why}\`` : ''}`
      }
      try {
        execFileSync(process.execPath, [
          renderScript, side.glbs.join(','),
          path.join(opts.out, `${slug}-${suffix}.png`),
        ], { stdio: 'pipe', timeout: 5 * 60 * 1000 })
        return `![${suffix}](RAW_URL_BASE/${slug}-${suffix}.png)`
      } catch (err) {
        const why = childFailureDiagnostic(err, `render ${suffix} (${name})`)
            .replace(/\|/g, '\\|').slice(0, 200)
        return `_render failed_${why ? ` — \`${why}\`` : ''}`
      }
    }

    if (base.glbs.length > 0 && cand.glbs.length > 0) {
      try {
        execFileSync(process.execPath, [
          renderScript, '--pair', base.glbs.join(','), cand.glbs.join(','),
          path.join(opts.out, slug),
        ], { stdio: 'pipe', timeout: 5 * 60 * 1000 })
        rows.push(
            `| \`${name}\` ` +
            `| ![before](RAW_URL_BASE/${slug}-before.png) ` +
            `| ![after](RAW_URL_BASE/${slug}-after.png) |`)
        fs.rmSync(work, { recursive: true, force: true })
        continue
      } catch (err) {
        // One side's GLB can be unloadable (seen in practice: conway's GLB
        // writer used to emit truncated JSON for partial-geometry models —
        // supercap*, nist_ftc_08). Fall through and render each side on its
        // own so the healthy build still gets a picture; the cameras are no
        // longer shared, so the pair loses scale comparability.
        childFailureDiagnostic(err, `pair render (${name})`)
      }
    }

    rows.push(
        `| \`${name}\` ` +
        `| ${renderSingle(base, 'base', 'before')} ` +
        `| ${renderSingle(cand, 'candidate', 'after')} |`)
    fs.rmSync(work, { recursive: true, force: true })
  }

  let report = '| model | base (main) | candidate (this PR) |\n| --- | --- | --- |\n'
  report += rows.join('\n') + '\n'
  if (skipped.length > 0) {
    report += `\n_${skipped.length} more changed model(s) not rendered ` +
        `(cap ${opts.max}): ${skipped.map((m) => path.basename(m)).join(', ')}_\n`
  }
  fs.writeFileSync(path.join(opts.out, 'report.md'), report)
  process.stderr.write(`visual-diff: wrote ${rows.length} row(s)\n`)
}

main()
