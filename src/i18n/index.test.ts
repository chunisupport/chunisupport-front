import assert from 'node:assert/strict'
import test from 'node:test'
import { setLocalePreferenceSignal } from '../stores/localePreferences'
import { formatMessage, localizedCopy } from './index'

test('localizedCopy は現在の表示言語の文言を返すこと', () => {
  // Given
  const copy = localizedCopy('appearance')

  // When
  setLocalePreferenceSignal('ja')
  const japanese = copy.themeLabel
  setLocalePreferenceSignal('en')
  const english = copy.themeLabel
  setLocalePreferenceSignal('ja')

  // Then
  assert.equal(japanese, '背景')
  assert.equal(english, 'Background')
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
