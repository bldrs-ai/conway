#!/usr/bin/env node
/**
 * Where a STEP/IFC file puts the records a product needs, and what that costs
 * the parse-time preview.
 *
 * conway#542. The preview channel emits a product only when its whole closure
 * sits inside the scanned PREFIX (`deferDanglingPlacements`), and Revit writes
 * per-product placements toward the file tail — so on those files early ticks
 * meet long runs of products that cannot extract, and the user sees nothing
 * until the parse is nearly done. This turns that from a code comment into a
 * number, without running the engine.
 *
 * The statistic that matters is the **prefix resolvability curve**: with the
 * first p% of the file scanned, what fraction of the records seen so far have
 * all of their `#refs` also within that prefix? A file whose references point
 * backward tracks the diagonal — everything scanned is usable. A file that
 * defers its placements falls below it, and the gap IS the preview deficit.
 *
 * Text-only: no wasm, no engine, so it runs on any file in seconds and can
 * sort a corpus by how hostile its layout is.
 *
 *   node scripts/layout_report.mjs <file.ifc> [...]
 *   node scripts/layout_report.mjs <in.ifc> --emit-tail-placements <out.ifc>
 *
 * The `--emit-tail-placements` form rewrites a file with every placement
 * record moved to the end. STEP is reference-ordered rather than
 * position-ordered, so the result is semantically identical and only the
 * layout differs — which is the controlled experiment: one model, two
 * layouts, one variable.
 */
import fs from 'fs'


/* Record types that make up a placement chain. Moving exactly these is what
 * turns a well-ordered file into a Revit-shaped one. */
const PLACEMENT_TYPES = new Set([
  'IFCLOCALPLACEMENT',
  'IFCAXIS2PLACEMENT3D',
  'IFCAXIS2PLACEMENT2D',
  'IFCCARTESIANPOINT',
  'IFCDIRECTION',
])


/**
 * Scan a STEP data section into records.
 *
 * Hand-rolled rather than regex: a STEP string literal ('...', '' escaped)
 * can contain `;` and `#`, and so can a /* *\/ comment, so a naive split
 * silently mis-slices exactly the files with the most interesting content.
 *
 * @param {string} text the whole file
 * @return {Array<object>} `{id, type, offset, refs}` in file order
 */
function scanRecords(text) {
  const records = []
  const dataAt = text.indexOf('DATA;')
  let where = dataAt < 0 ? 0 : dataAt + 'DATA;'.length

  while (where < text.length) {
    // Skip to the next record's `#`, honouring strings and comments.
    while (where < text.length) {
      const ch = text[where]
      if (ch === "'") {
        ++where
        while (where < text.length) {
          if (text[where] === "'") {
            if (text[where + 1] === "'") {
              where += 2
              continue
            }
            ++where
            break
          }
          ++where
        }
        continue
      }
      if (ch === '/' && text[where + 1] === '*') {
        const end = text.indexOf('*/', where + 2)
        where = end < 0 ? text.length : end + 2
        continue
      }
      if (ch === '#') {
        break
      }
      ++where
    }
    if (where >= text.length) {
      break
    }

    const start = where
    const header = /^#(\d+)\s*=\s*([A-Za-z0-9_]*)/.exec(text.slice(start, start + 128))
    if (header === null) {
      ++where
      continue
    }

    // Walk to the record's terminating `;`, again honouring strings/comments.
    let cursor = start
    let ended = -1
    while (cursor < text.length) {
      const ch = text[cursor]
      if (ch === "'") {
        ++cursor
        while (cursor < text.length) {
          if (text[cursor] === "'") {
            if (text[cursor + 1] === "'") {
              cursor += 2
              continue
            }
            ++cursor
            break
          }
          ++cursor
        }
        continue
      }
      if (ch === '/' && text[cursor + 1] === '*') {
        const end = text.indexOf('*/', cursor + 2)
        cursor = end < 0 ? text.length : end + 2
        continue
      }
      if (ch === ';') {
        ended = cursor
        break
      }
      ++cursor
    }
    if (ended < 0) {
      break
    }

    const body = text.slice(start, ended)
    const refs = []
    // Skip the leading `#id=` when collecting references.
    const argsAt = body.indexOf('=')
    const args = argsAt < 0 ? '' : body.slice(argsAt + 1)
    for (const match of args.matchAll(/#(\d+)/g)) {
      refs.push(Number(match[1]))
    }

    records.push({
      id: Number(header[1]),
      type: (header[2] || '').toUpperCase(),
      offset: start,
      end: ended + 1,
      refs,
    })
    where = ended + 1
  }

  return records
}


/**
 * Print the prefix resolvability curve and the worst forward-reaching types.
 *
 * @param {string} path the file
 */
function report(path) {
  const text = fs.readFileSync(path, 'latin1')
  const records = scanRecords(text)
  if (records.length === 0) {
    console.log(`${path}: no records found`)
    return
  }

  const offsetOf = new Map()
  for (const record of records) {
    offsetOf.set(record.id, record.offset)
  }

  // A record is usable once itself AND every record it references have been
  // scanned — which for a prefix parse means the max offset in that set.
  let forwardRecords = 0
  const reachByType = new Map()
  for (const record of records) {
    let resolveAt = record.offset
    for (const ref of record.refs) {
      const at = offsetOf.get(ref)
      if (at !== undefined && at > resolveAt) {
        resolveAt = at
      }
    }
    record.resolveAt = resolveAt
    if (resolveAt > record.end) {
      ++forwardRecords
      const reach = resolveAt - record.offset
      const prior = reachByType.get(record.type)
      reachByType.set(record.type, {
        count: (prior?.count ?? 0) + 1,
        reach: (prior?.reach ?? 0) + reach,
      })
    }
  }

  const byOffset = records.slice().sort((a, b) => a.offset - b.offset)
  const resolveSorted = records.map((r) => r.resolveAt).sort((a, b) => a - b)
  const size = text.length

  console.log(`\n=== ${path}`)
  console.log(`    ${(size / 1e6).toFixed(1)} MB, ${records.length} records, ` +
    `${forwardRecords} (${(100 * forwardRecords / records.length).toFixed(1)}%) reference forward`)
  console.log('    prefix   scanned   usable   deficit')

  for (let pct = 10; pct <= 100; pct += 10) {
    const threshold = Math.floor(size * pct / 100)
    // Both arrays are sorted, so a binary search would do; linear filter is
    // fine at corpus sizes and keeps this readable.
    const scanned = byOffset.filter((r) => r.offset <= threshold).length
    const usable = resolveSorted.filter((at) => at <= threshold).length
    const deficit = scanned === 0 ? 0 : 100 * (scanned - usable) / scanned
    console.log(
      `    ${String(pct).padStart(5)}%  ${String(scanned).padStart(8)} ` +
      `${String(usable).padStart(8)}   ${deficit.toFixed(1).padStart(5)}%`)
  }

  const worst = [...reachByType.entries()]
    .sort((a, b) => b[1].reach - a[1].reach)
    .slice(0, 5)
  if (worst.length > 0) {
    console.log('    furthest-reaching types (total forward bytes):')
    for (const [type, stat] of worst) {
      console.log(
        `      ${type.padEnd(34)} ${String(stat.count).padStart(7)} recs  ` +
        `${(stat.reach / 1e6).toFixed(1)} MB`)
    }
  }
}


/**
 * Rewrite a file with every placement record moved to the tail.
 *
 * @param {string} inPath source
 * @param {string} outPath destination
 */
function emitTailPlacements(inPath, outPath) {
  const text = fs.readFileSync(inPath, 'latin1')
  const records = scanRecords(text)
  const head = text.slice(0, records[0].offset)
  const tailFrom = records[records.length - 1].end

  const kept = []
  const moved = []
  for (const record of records) {
    const slice = text.slice(record.offset, record.end)
    ;(PLACEMENT_TYPES.has(record.type) ? moved : kept).push(slice)
  }

  fs.writeFileSync(
    outPath,
    `${head + kept.join('\n')}\n${moved.join('\n')}\n${text.slice(tailFrom)}`,
    'latin1')
  console.log(
    `wrote ${outPath}: ${moved.length} placement records moved to the tail, ` +
    `${kept.length} kept in place`)
}


const args = process.argv.slice(2)
const emitAt = args.indexOf('--emit-tail-placements')
if (emitAt >= 0) {
  emitTailPlacements(args[0], args[emitAt + 1])
} else {
  for (const path of args) {
    report(path)
  }
}
