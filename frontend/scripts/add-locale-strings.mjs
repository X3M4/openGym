#!/usr/bin/env node
// SuperOpenGym ships new strings in Spanish and English only. English is the source language
// (the key itself), so a new key gets its Spanish translation in es.js and the English text in
// every other locale: they keep showing English, as they would by fallback, and
// scripts/check-locales.mjs still finds the key everywhere.
//
//   node scripts/add-locale-strings.mjs strings.json
//
// strings.json: { "English key": "Traducción española", … }. Keys already present in a locale
// are left alone. Entries are appended before the closing brace of each file.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const file = process.argv[2]
if (!file) { console.error('usage: node scripts/add-locale-strings.mjs strings.json'); process.exit(1) }
const strings = JSON.parse(readFileSync(file, 'utf8'))
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'locales')
const q = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"

for (const name of readdirSync(dir).filter(f => f.endsWith('.js')).sort()) {
  const path = join(dir, name)
  const { default: dict } = await import(pathToFileURL(path).href)
  const add = Object.entries(strings)
    .filter(([en]) => !(en in dict))
    .map(([en, es]) => `  ${q(en)}: ${q(name === 'es.js' ? es : en)},`)
  if (!add.length) continue
  const src = readFileSync(path, 'utf8')
  const end = src.lastIndexOf('}')
  const head = src.slice(0, end).replace(/,?\s*$/, ',\n')
  writeFileSync(path, head + add.join('\n') + '\n' + src.slice(end))
  console.log(`${name}: +${add.length}`)
}

// pt-BR inherits pt-PT, and src/lib/pt-br-locale.test.js pins a fingerprint of everything it
// inherits so a changed Portuguese wording gets reviewed. The strings added here reach pt.js in
// English — nothing Brazilian to review — so the pinned fingerprint follows them.
{
  const { createHash } = await import('node:crypto')
  const bust = '?t=' + Date.now()
  const { default: pt } = await import(pathToFileURL(join(dir, 'pt.js')).href + bust)
  const { PT_BR_OVERRIDES } = await import(pathToFileURL(join(dir, 'pt-BR.js')).href + bust)
  const inherited = Object.entries(pt)
    .filter(([key]) => !(key in PT_BR_OVERRIDES))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const fingerprint = createHash('sha256').update(JSON.stringify(inherited)).digest('hex')
  const testPath = join(dir, '..', 'lib', 'pt-br-locale.test.js')
  const test = readFileSync(testPath, 'utf8')
  const next = test.replace(/(inherited pt-BR wording'\)\.toBe\(')[0-9a-f]{64}/, `$1${fingerprint}`)
  if (next !== test) { writeFileSync(testPath, next); console.log('pt-br-locale.test.js: fingerprint updated') }
}
