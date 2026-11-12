import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findGenreIdByName,
  findGenreNameById,
  formatUpdatedAt,
  hasNotesDesigner,
  readSongNewFlag,
  toNullableTrimmedString,
  toOptionalNumberInput,
  toOptionalTextInput,
} from './songDraftCommon'

const genres = [
  { id: 1, name: 'POPS & ANIME' },
  { id: 2, name: 'ORIGINAL' },
]

test('更新日時は日本時間で整形し、不正値は - になること', () => {
  // Given
  const value = '2025-01-01T15:00:00Z'

  // When
  const result = formatUpdatedAt(value)

  // Then
  assert.equal(result, '2025/1/2 00:00:00')
  assert.equal(formatUpdatedAt(null), '-')
  assert.equal(formatUpdatedAt('invalid'), '-')
})

test('BASIC・ADVANCED は NOTES DESIGNER の入力対象外であること', () => {
  // Given / When / Then
  assert.equal(hasNotesDesigner('BASIC'), false)
  assert.equal(hasNotesDesigner('ADVANCED'), false)
  assert.equal(hasNotesDesigner('EXPERT'), true)
  assert.equal(hasNotesDesigner('ULTIMA'), true)
})

test('任意文字列の正規化は前後空白を除き、空白のみならnullにする', () => {
  // Given: 前後に空白を含む文字列と空白のみの文字列
  const text = '  abc  '
  const blank = '   '

  // When: 保存用の文字列へ正規化する
  const trimmed = toNullableTrimmedString(text)
  const empty = toNullableTrimmedString(blank)

  // Then: 前後の空白を除き、空白のみは未設定にする
  assert.equal(trimmed, 'abc')
  assert.equal(empty, null)
})

test('任意テキスト入力は入力途中の前後空白を残し、空白のみならnullにする', () => {
  // Given: 入力途中の文字列と空白のみの文字列
  const text = ' abc '
  const blank = '  '

  // When: 任意テキスト入力へ変換する
  const preserved = toOptionalTextInput(text)
  const empty = toOptionalTextInput(blank)

  // Then: 文字を含む入力は空白も保持し、空白のみは未設定にする
  assert.equal(preserved, ' abc ')
  assert.equal(empty, null)
})

test('任意数値入力は空文字をnull、数値文字列を数値に変換する', () => {
  // Given: 空の入力欄と数値の入力欄
  const blank = ''
  const text = '180'

  // When: 任意数値入力へ変換する
  const empty = toOptionalNumberInput(blank)
  const number = toOptionalNumberInput(text)

  // Then: 空文字は未設定、数値文字列は数値になる
  assert.equal(empty, null)
  assert.equal(number, 180)
})

test('ジャンル名とジャンルIDを相互に解決し、未登録なら null になること', () => {
  // Given / When / Then
  assert.equal(findGenreIdByName(genres, 'ORIGINAL'), 2)
  assert.equal(findGenreIdByName(genres, '未登録'), null)
  assert.equal(findGenreNameById(genres, 1), 'POPS & ANIME')
  assert.equal(findGenreNameById(genres, null), null)
})

test('新曲フラグはtrueのときだけ真になること', () => {
  // Given: 新曲と通常曲のフラグ値。
  // When: 編集用の真偽値へ正規化する。
  // Then: trueのときだけ真になり、それ以外は偽になる。
  assert.equal(readSongNewFlag({ is_new: true }), true)
  assert.equal(readSongNewFlag({ is_new: false }), false)
})
