import assert from 'node:assert/strict'
import test from 'node:test'
import {
  toSongMetaBpmDraftValue,
  toSongMetaBpmInputValue,
  toSongMetaOptionalTextDraftValue,
  toSongMetaOptionalTextInputValue,
  toSongMetaReleasedAtInputValue,
} from './songMetaInput'

test('共通メタの任意テキストは空白のみを null にし、入力途中の空白は残すこと', () => {
  // Given
  const padded = ' チューニズム '
  const blank = '   '

  // When
  const paddedResult = toSongMetaOptionalTextDraftValue(padded)
  const blankResult = toSongMetaOptionalTextDraftValue(blank)
  const emptyResult = toSongMetaOptionalTextDraftValue('')

  // Then
  assert.equal(paddedResult, padded)
  assert.equal(blankResult, null)
  assert.equal(emptyResult, null)
  assert.equal(toSongMetaOptionalTextInputValue(null), '')
  assert.equal(toSongMetaOptionalTextInputValue(padded), padded)
})

test('BPMは空文字を null、0 と数値文字列を Number へ変換すること', () => {
  // Given / When / Then
  assert.equal(toSongMetaBpmDraftValue(''), null)
  assert.equal(toSongMetaBpmDraftValue('0'), 0)
  assert.equal(toSongMetaBpmDraftValue('128'), 128)
  assert.equal(toSongMetaBpmInputValue(null), '')
  assert.equal(toSongMetaBpmInputValue(0), 0)
  assert.equal(toSongMetaBpmInputValue(128), 128)
})

test('配信日の表示は YYYY-MM-DD に揃え、入力値そのものは日付変換しないこと', () => {
  // Given
  const dateTime = '2025-06-19T15:00:00Z'
  const invalid = '2026/07/01'

  // When / Then
  assert.equal(toSongMetaReleasedAtInputValue(dateTime), '2025-06-19')
  assert.equal(toSongMetaReleasedAtInputValue(null), '')
  assert.equal(toSongMetaReleasedAtInputValue(invalid), '')
  assert.equal(toSongMetaOptionalTextDraftValue(dateTime), dateTime)
  assert.equal(toSongMetaOptionalTextDraftValue('2025-06-19'), '2025-06-19')
  assert.equal(toSongMetaOptionalTextDraftValue(''), null)
})
