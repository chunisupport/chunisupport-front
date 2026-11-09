import assert from 'node:assert/strict'
import test from 'node:test'
import { toDateInputValue, toDateOnly } from './dateOnly'

test('YYYY-MM-DD はそのまま返し、前後の空白は除くこと', () => {
  // Given / When / Then
  assert.equal(toDateOnly('2025-06-19'), '2025-06-19')
  assert.equal(toDateOnly(' 2025-01-02 '), '2025-01-02')
})

test('YYYY-MM-DD で始まる日時は書かれた日付のまま返すこと', () => {
  // Given: JST では翌日になる UTC 時刻を含む
  const crossesJstMidnight = '2026-05-31T15:00:00Z'

  // When / Then: Date でタイムゾーン変換せず、先頭の日付を返す
  assert.equal(toDateOnly('2025-06-19T12:00:00Z'), '2025-06-19')
  assert.equal(toDateOnly('2025-01-02T23:59:59+09:00'), '2025-01-02')
  assert.equal(toDateOnly(crossesJstMidnight), '2026-05-31')
})

test('YYYY-MM-DD で始まらない形式はタイムゾーンに依存せず null になること', () => {
  // Given: `new Date('2026/07/01')` はローカル0時になり、JST では UTC 変換で前日になる
  const slashDate = '2026/07/01'

  // When / Then
  assert.equal(toDateOnly(slashDate), null)
  assert.equal(toDateOnly('2026/7/1'), null)
  assert.equal(toDateOnly('2026.07.01'), null)
  assert.equal(toDateOnly('07/01/2026'), null)
  assert.equal(toDateOnly('invalid'), null)
  assert.equal(toDateOnly('not-a-date'), null)
})

test('空文字・空白・未設定は null になり、入力欄用は空文字になること', () => {
  // Given / When / Then
  assert.equal(toDateOnly(null), null)
  assert.equal(toDateOnly(undefined), null)
  assert.equal(toDateOnly(''), null)
  assert.equal(toDateOnly('   '), null)
  assert.equal(toDateInputValue(null), '')
  assert.equal(toDateInputValue(undefined), '')
  assert.equal(toDateInputValue('2025-06-19'), '2025-06-19')
  assert.equal(toDateInputValue('2026/07/01'), '')
})
