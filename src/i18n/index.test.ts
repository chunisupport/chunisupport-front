import assert from 'node:assert/strict'
import test from 'node:test'
import { formatMessage, loadLocaleDictionary, localizedCopy, t } from './index'

test('localizedCopy は読み込んだ表示言語の文言を返すこと', async () => {
  // Given
  const copy = localizedCopy('appearance')

  // When
  const japanese = copy.themeLabel
  await loadLocaleDictionary('en')
  const english = copy.themeLabel
  await loadLocaleDictionary('ja')

  // Then
  assert.equal(japanese, '背景')
  assert.equal(english, 'Background')
})

test('t はテンプレート変数を埋め込んだ文言を返すこと', () => {
  // Given
  const username = 'chunisupport'

  // When
  const result = t('home.welcome', { username })

  // Then
  assert.equal(result, 'ようこそ、chunisupportさん')
})

test('localizedCopy のネストした文言も列挙できること', () => {
  // Given
  const copy = localizedCopy('appearance.accents')

  // When
  const keys = Object.keys(copy)

  // Then
  assert.deepEqual(keys, ['red', 'orange', 'yellow', 'green', 'blue', 'violet'])
})

test('formatMessage はテンプレート変数へ値を埋め込むこと', () => {
  // Given
  const template = '{{ count }}件'

  // When
  const result = formatMessage(template, { count: 3 })

  // Then
  assert.equal(result, '3件')
})
