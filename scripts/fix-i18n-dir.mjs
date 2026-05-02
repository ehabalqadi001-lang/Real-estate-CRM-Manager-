/**
 * v2 — Revert bad insertions from v1, then simply REMOVE dir="rtl"
 * from all dashboard pages. The <html dir> in app/layout.tsx already
 * propagates direction to all children — no per-page dir needed.
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

let fixed = 0, skipped = 0

for (const file of walk(DASHBOARD)) {
  let src = readFileSync(file, 'utf8')
  let changed = false

  // --- Remove bad import if it was auto-inserted and the file doesn't actually use it ---
  // Pattern: import was added but dir={dir} is the only usage, and no t() or numLocale used
  // Safer: remove the import only if `dir` variable was inserted in the wrong place

  // 1) Remove bad server insertion: `function Xxx{\n  const { dir } = await getI18n()\n`
  //    (the `{` is followed immediately by `\n  const { dir }` before any params)
  if (src.match(/export default async function \w+\{\n\s+const \{ dir \} = await getI18n\(\)\n/)) {
    src = src.replace(
      /(\nexport default async function \w+)\{\n\s+const \{ dir \} = await getI18n\(\)\n/g,
      '$1'
    )
    changed = true
  }

  // 2) Remove bad client insertion inside arrow/function component signature
  if (src.match(/\)\s*\{\n\s+const \{ dir \} = (await getI18n|useI18n)\(\)\n\s+\w+[,\n]/)) {
    src = src.replace(
      /\)\s*\{\n(\s+const \{ dir \} = (?:await getI18n|useI18n)\(\)\n)(\s+\w)/g,
      ') {\n$2'
    )
    changed = true
  }

  // 3) Remove any leftover standalone bad insertion inside param lists
  src = src.replace(/\n\s+const \{ dir \} = await getI18n\(\)\n(\s+\w+[^=\n]*,\s*\n\s*\}\s*\))/g, '\n$1')
  src = src.replace(/\n\s+const \{ dir \} = useI18n\(\)\n(\s+\w+[^=\n]*,\s*\n\s*\}\s*\))/g, '\n$1')

  // 4) Remove unused getI18n import if the file has dir={dir} replaced back but no actual usage
  //    (we'll handle this by just removing dir={dir} → nothing)

  // 5) Simply remove dir="rtl" and dir={dir} — rely on <html dir> from layout
  if (src.includes('dir="rtl"') || src.includes('dir={dir}')) {
    src = src.replace(/ dir="rtl"/g, '')
    src = src.replace(/ dir=\{dir\}/g, '')
    changed = true
  }

  // 6) Remove getI18n/useI18n imports if the file only imported them for dir
  //    (safe: only remove if the import exists but t() and numLocale are NOT used)
  if (src.includes("import { getI18n } from '@/lib/i18n'") && !src.includes('getI18n') ||
      (src.includes("import { getI18n } from '@/lib/i18n'") && !src.includes('= await getI18n()') && !src.includes('t(') && !src.includes('numLocale'))) {
    src = src.replace(/^import \{ getI18n \} from '@\/lib\/i18n'\n/m, '')
    changed = true
  }
  if (src.includes("import { useI18n } from '@/hooks/use-i18n'") &&
      !src.includes('useI18n()') && !src.includes('t(') && !src.includes('numLocale')) {
    src = src.replace(/^import \{ useI18n \} from '@\/hooks\/use-i18n'\n/m, '')
    changed = true
  }

  if (changed) {
    writeFileSync(file, src, 'utf8')
    fixed++
    console.log('✓', file.replace(ROOT, '').replace(/\\/g, '/'))
  } else {
    skipped++
  }
}

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped`)
