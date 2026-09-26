import assert from 'node:assert/strict'
import test from 'node:test'
import { detectLocaleFromLanguages, isAppLocale } from './localePreference'

test('ブラウザ言語の優先順で最初に対応できる表示言語を返すこと', () => {
  // Given
  const languages = ['fr-FR', 'ko-KR', 'en-US']

  // When
  const locale = detectLocaleFromLanguages(languages)

  // Then
  assert.equal(locale, 'ko')
})

test('中国語はすべて繁体字として扱うこと', () => {
  // Given
  const languages = ['zh-CN']

  // When
  const locale = detectLocaleFromLanguages(languages)

  // Then
  assert.equal(locale, 'zh-TW')
})

test('対応言語がない場合は日本語を返すこと', () => {
  // Given
  const languages = ['fr-FR', 'de']

  // When
  const locale = detectLocaleFromLanguages(languages)

  // Then
  assert.equal(locale, 'ja')
})

test('表示言語として有効な値だけを受け入れること', () => {
  // Given / When / Then
  assert.equal(isAppLocale('zh-TW'), true)
  assert.equal(isAppLocale('zh'), false)
  assert.equal(isAppLocale(null), false)
})
