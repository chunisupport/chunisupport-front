import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const tailwindCssPath = path.resolve(process.cwd(), 'src/styles/tailwind.css')
const tailwindCssContent = readFileSync(tailwindCssPath, 'utf8')

/**
 * CSSファイルから指定されたカスタムプロパティ定義を抽出する。
 * ダークモード実装時にこのテストは削除すること。
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
    ['--cs-color-surface', 'var(--color-white)'],
    ['--cs-color-text-muted', 'var(--color-gray-600)'],
    ['--cs-color-border', 'var(--color-gray-200)'],
    ['--cs-color-action-primary', 'var(--color-primary-600)'],
    ['--cs-color-action-primary-hover', 'var(--color-primary-700)'],
    ['--cs-color-danger', 'var(--color-red-600)'],
    ['--cs-color-danger-bg', 'var(--color-red-50)'],
    ['--cs-color-success-bg', 'var(--color-green-50)'],
    ['--cs-color-overlay', 'rgb(0 0 0 / 30%)'],
    ['--cs-color-honor-title-normal-bg', 'var(--color-yellow-200)'],
  ] as const

  for (const [tokenName, expectedValue] of expectedMappings) {
    assert.equal(readCustomProperty(tailwindCssContent, tokenName), expectedValue)
  }
})

test('Tailwind公開トークンがcsトークンへ接続されていること', () => {
  const expectedBindings = [
    ['--color-surface', 'var(--cs-color-surface)'],
    ['--color-text-muted', 'var(--cs-color-text-muted)'],
    ['--color-border', 'var(--cs-color-border)'],
    ['--color-action-primary', 'var(--cs-color-action-primary)'],
    ['--color-action-primary-hover', 'var(--cs-color-action-primary-hover)'],
    ['--color-danger', 'var(--cs-color-danger)'],
    ['--color-danger-bg', 'var(--cs-color-danger-bg)'],
    ['--color-success-bg', 'var(--cs-color-success-bg)'],
    ['--color-overlay', 'var(--cs-color-overlay)'],
    ['--color-honor-title-normal-bg', 'var(--cs-color-honor-title-normal-bg)'],
  ] as const

  for (const [colorName, expectedValue] of expectedBindings) {
    assert.equal(readCustomProperty(tailwindCssContent, colorName), expectedValue)
  }
})
