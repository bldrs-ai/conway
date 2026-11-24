#!/usr/bin/env node
// Writes src/ifc/ifc4x3_ifc4_compat_gen/decode_compat.gen.ts: the IFC4-under-
// IFC4X3 decode-compatibility table (see src/ifc/ifc4x3_decode_compat_derive.ts
// for the rule it implements). Reads the COMPILED derive module, so run
// `yarn build-incremental` first; `yarn code-gen-ifc4x3-compat` does both.
// ifc4x3_decode_compat_derive.test.ts recomputes the table from the same two
// vendored EXPRESS files and fails if the committed output differs.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { deriveIfc4x3DecodeCompat } =
  await import(path.join(root, 'compiled/src/ifc/ifc4x3_decode_compat_derive.js'))
const { IFC4X3_TO_IFC4_TRANSLATIONS } =
  await import(path.join(root, 'compiled/src/ifc/ifc4x3_ifc4_translation.js'))

const table = deriveIfc4x3DecodeCompat(
    fs.readFileSync(path.join(root, 'scripts/schemas/IFC4.exp'), 'utf8'),
    fs.readFileSync(path.join(root, 'scripts/schemas/IFC4X3_ADD2.exp'), 'utf8'),
    IFC4X3_TO_IFC4_TRANSLATIONS)

const out = path.join(root, 'src/ifc/ifc4x3_ifc4_compat_gen/decode_compat.gen.ts')

fs.writeFileSync(out,
    '/* This is generated code, don\'t modify. Regenerate with\n' +
    ' * `yarn code-gen-ifc4x3-compat` (scripts/gen_ifc4x3_decode_compat.mjs)\n' +
    ' * from scripts/schemas/IFC4.exp and scripts/schemas/IFC4X3_ADD2.exp. */\n' +
    'import { Ifc4x3DecodeCompat } from \'../ifc4x3_decode_compat_derive\'\n\n' +
    `const DECODE_COMPAT: Ifc4x3DecodeCompat = ${JSON.stringify(table, null, 2)}\n\n` +
    'export default DECODE_COMPAT\n')

console.log(`wrote ${path.relative(root, out)}: ${table.compatible.length} compatible, ` +
  `${Object.keys(table.incompatible).length} incompatible`)
