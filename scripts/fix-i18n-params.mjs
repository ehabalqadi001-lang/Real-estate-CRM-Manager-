/**
 * v3 — Remove bad `const { dir } = getI18n()` insertions that landed INSIDE
 * function parameter lists (between `({` and `}: {` or `})`).
 *
 * Two patterns:
 *  A) Multi-line: the insertion is on its own line between the params
 *     function Foo({
 *       const { dir } = await getI18n()   ← remove this line
 *       searchParams,
 *     }: ...)
 *
 *  B) Inline: the insertion was glued to the first param on the same line
 *     function Foo({
 *       const { dir } = useI18n() employee }: ...)  ← strip the prefix
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const DASHBOARD = join(ROOT, 'src', 'app', 'dashboard')

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (extname(entry) === '.tsx' || extname(entry) === '.ts') files.push(full)
  }
  return files
}

const INJECT_RE = /const \{ dir \} = (?:await )?(?:getI18n|useI18n)\(\)/

let fixed = 0, skipped = 0

for (const file of walk(DASHBOARD)) {
  let src = readFileSync(file, 'utf8')
  const lines = src.split('\n')
  const out = []
  let changed = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Pattern A: standalone injection line (whole line is just the const)
    // Previous line must end with `({` (opening of destructured params)
    if (
      INJECT_RE.test(trimmed) &&
      /^const \{ dir \} = /.test(trimmed) &&
      out.length > 0 &&
      out[out.length - 1].trimEnd().endsWith('({')
    ) {
      changed = true
      continue // skip this line
    }

    // Pattern B: injection glued to params on same line
    // e.g.: `  const { dir } = useI18n() employee }: { ... }`
    if (
      INJECT_RE.test(line) &&
      /^\s+const \{ dir \} = /.test(line) &&
      out.length > 0 &&
      out[out.length - 1].trimEnd().endsWith('({')
    ) {
      // Remove just the `const { dir } = ...() ` prefix, keep rest
      const fixed_line = line.replace(/^(\s*)const \{ dir \} = (?:await )?(?:getI18n|useI18n)\(\)\s*/, '$1')
      out.push(fixed_line)
      changed = true
      continue
    }

    out.push(line)
  }

  if (changed) {
    // After removing bad insertions, check if getI18n/useI18n imports are now unused
    let result = out.join('\n')

    // Remove getI18n import if no longer used
    if (
      result.includes("import { getI18n } from '@/lib/i18n'") &&
      !result.includes('await getI18n()')
    ) {
      result = result.replace(/^import \{ getI18n \} from '@\/lib\/i18n'\n/m, '')
    }

    // Remove useI18n import if no longer used
    if (
      result.includes("import { useI18n } from '@/hooks/use-i18n'") &&
      !result.includes('useI18n()')
    ) {
      result = result.replace(/^import \{ useI18n \} from '@\/hooks\/use-i18n'\n/m, '')
    }

    writeFileSync(file, result, 'utf8')
    fixed++
    console.log('✓', file.replace(ROOT, '').replace(/\\/g, '/'))
  } else {
    skipped++
  }
}

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped`)
