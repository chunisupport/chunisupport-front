import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const tailwindCssPath = path.resolve(process.cwd(), 'src/styles/tailwind.css')
const tailwindCssContent = readFileSync(tailwindCssPath, 'utf8')

/**
 * CSSファイルから指定されたカスタムプロパティ定義を抽出する。
 * @param css CSS全文
 * @param property 取得対象のプロパティ名
 * @returns 取得した定義値
 */
const readCustomProperty = (css: string, property: string): string => {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matched = css.match(new RegExp(`${escapedProperty}:\\s*([^;]+);`))
  assert.ok(matched, `${property} が定義されている必要があります`)
  return matched[1].trim()
}

test('既存色と同じ値でデザイントークンが定義されていること', () => {
  const expectedMappings = [
    ['--cs-color-bg', 'var(--color-white)'],
    ['--cs-color-surface', 'var(--color-white)'],
    ['--cs-color-text-muted', 'var(--color-gray-600)'],
    ['--cs-color-nav-text', 'var(--color-gray-700)'],
    ['--cs-color-border', 'var(--color-gray-300)'],
    ['--cs-color-action-primary', 'var(--color-primary-600)'],
    ['--cs-color-action-primary-hover', 'var(--color-primary-700)'],
    ['--cs-color-danger', 'var(--color-red-600)'],
    ['--cs-color-danger-bg', 'var(--color-red-50)'],
    ['--cs-color-success-bg', 'var(--color-green-50)'],
    ['--cs-color-overlay', 'rgb(0 0 0 / 30%)'],
    ['--cs-color-difficulty-basic-bg', '#00ab84'],
    ['--cs-color-difficulty-basic-text', 'var(--color-white)'],
    ['--cs-color-honor-title-normal-bg', 'var(--color-yellow-200)'],
    ['--cs-color-honor-title-normal-text', 'var(--color-gray-900)'],
    ['--cs-color-ranking-gold-bg', 'var(--color-yellow-300)'],
    ['--cs-color-ranking-silver-bg', 'var(--color-gray-300)'],
    ['--cs-color-ranking-bronze-bg', 'var(--color-orange-300)'],
    ['--cs-color-ranking-medal-text', 'var(--color-gray-900)'],
    ['--cs-color-score-rank-sssp-bg', 'var(--color-green-500)'],
    ['--cs-color-score-rank-sssp-text', 'var(--color-green-500)'],
    ['--cs-color-score-rank-sss-bg', 'var(--color-yellow-500)'],
    ['--cs-color-score-rank-sss-text', 'var(--color-yellow-500)'],
  ] as const

  for (const [tokenName, expectedValue] of expectedMappings) {
    assert.equal(readCustomProperty(tailwindCssContent, tokenName), expectedValue)
  }
})

test('Tailwind公開トークンがcsトークンへ接続されていること', () => {
  const expectedBindings = [
    ['--color-bg', 'var(--cs-color-bg)'],
    ['--color-surface', 'var(--cs-color-surface)'],
    ['--color-text-muted', 'var(--cs-color-text-muted)'],
    ['--color-nav-text', 'var(--cs-color-nav-text)'],
    ['--color-border', 'var(--cs-color-border)'],
    ['--color-action-primary', 'var(--cs-color-action-primary)'],
    ['--color-action-primary-hover', 'var(--cs-color-action-primary-hover)'],
    ['--color-danger', 'var(--cs-color-danger)'],
    ['--color-danger-bg', 'var(--cs-color-danger-bg)'],
    ['--color-success-bg', 'var(--cs-color-success-bg)'],
    ['--color-overlay', 'var(--cs-color-overlay)'],
    ['--color-difficulty-basic-bg', 'var(--cs-color-difficulty-basic-bg)'],
    ['--color-difficulty-basic-text', 'var(--cs-color-difficulty-basic-text)'],
    ['--color-honor-title-normal-bg', 'var(--cs-color-honor-title-normal-bg)'],
    ['--color-honor-title-normal-text', 'var(--cs-color-honor-title-normal-text)'],
    ['--color-ranking-gold-bg', 'var(--cs-color-ranking-gold-bg)'],
    ['--color-ranking-silver-bg', 'var(--cs-color-ranking-silver-bg)'],
    ['--color-ranking-bronze-bg', 'var(--cs-color-ranking-bronze-bg)'],
    ['--color-ranking-medal-text', 'var(--cs-color-ranking-medal-text)'],
    ['--color-score-rank-sssp-bg', 'var(--cs-color-score-rank-sssp-bg)'],
    ['--color-score-rank-sssp-text', 'var(--cs-color-score-rank-sssp-text)'],
  ] as const

  for (const [colorName, expectedValue] of expectedBindings) {
    assert.equal(readCustomProperty(tailwindCssContent, colorName), expectedValue)
  }
})

test('ダークテーマ用のcsトークンが定義されていること', () => {
  assert.match(tailwindCssContent, /\[data-theme="dark"\]\s*{/)
  assert.match(tailwindCssContent, /--cs-color-bg:\s*#03150f;/)
  assert.match(tailwindCssContent, /--cs-color-surface:\s*#082018;/)
  assert.match(tailwindCssContent, /--cs-color-border:\s*#1d4a39;/)
  assert.match(tailwindCssContent, /--cs-color-text:\s*var\(--color-gray-50\);/)
  assert.match(tailwindCssContent, /--cs-color-overlay:\s*rgb\(0 0 0 \/ 60%\);/)
})
