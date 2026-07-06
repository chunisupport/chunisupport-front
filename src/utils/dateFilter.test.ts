import assert from 'node:assert/strict'
import test from 'node:test'
import { isDateInRange, toRecordDateString } from './dateFilter'

test('toRecordDateString', async (t) => {
  await t.test('ISO 8601 日時から YYYY-MM-DD を抽出する', () => {
    assert.equal(toRecordDateString('2026-06-01T12:00:00Z'), '2026-06-01')
  })

  await t.test('日付のみの文字列はそのまま返す', () => {
    assert.equal(toRecordDateString('2026-06-01'), '2026-06-01')
  })

  await t.test('null の場合は null を返す', () => {
    assert.equal(toRecordDateString(null), null)
  })

  await t.test('空文字の場合は null を返す', () => {
    assert.equal(toRecordDateString(''), null)
  })

  await t.test('不正な形式の場合は null を返す', () => {
    assert.equal(toRecordDateString('invalid'), null)
  })
})

test('isDateInRange', async (t) => {
  await t.test('フィルター未指定（空文字）の場合は全件通過する', () => {
    assert.equal(isDateInRange('2026-06-01T12:00:00Z', { min: '', max: '' }), true)
    assert.equal(isDateInRange(null, { min: '', max: '' }), true)
  })

  await t.test('updated_at が null の場合は範囲指定があると不一致', () => {
    assert.equal(isDateInRange(null, { min: '2026-06-01', max: '' }), false)
    assert.equal(isDateInRange(null, { min: '', max: '2026-06-01' }), false)
  })

  await t.test('min のみ指定した場合は下限以上を許可する', () => {
    assert.equal(isDateInRange('2026-06-01T12:00:00Z', { min: '2026-06-01', max: '' }), true)
    assert.equal(isDateInRange('2026-06-02T00:00:00Z', { min: '2026-06-01', max: '' }), true)
    assert.equal(isDateInRange('2026-05-31T23:59:59Z', { min: '2026-06-01', max: '' }), false)
  })

  await t.test('max のみ指定した場合は上限以下を許可する', () => {
    assert.equal(isDateInRange('2026-06-01T12:00:00Z', { min: '', max: '2026-06-01' }), true)
    assert.equal(isDateInRange('2026-05-31T00:00:00Z', { min: '', max: '2026-06-01' }), true)
    assert.equal(isDateInRange('2026-06-02T00:00:00Z', { min: '', max: '2026-06-01' }), false)
  })

  await t.test('max 当日の ISO 日時は一致すること（バグ検出: 文字列比較の問題）', () => {
    assert.equal(isDateInRange('2026-06-01T12:00:00Z', { min: '', max: '2026-06-01' }), true)
  })

  await t.test('min〜max の範囲内の日時は一致する', () => {
    assert.equal(
      isDateInRange('2026-06-15T00:00:00Z', { min: '2026-06-01', max: '2026-06-30' }),
      true
    )
  })

  await t.test('範囲外の日時は不一致', () => {
    assert.equal(
      isDateInRange('2026-05-31T23:59:59Z', { min: '2026-06-01', max: '2026-06-30' }),
      false
    )
    assert.equal(
      isDateInRange('2026-07-01T00:00:00Z', { min: '2026-06-01', max: '2026-06-30' }),
      false
    )
  })
})
