import assert from 'node:assert/strict'
import test from 'node:test'
import { findLatestRecordDate, isDateInRange, toRecordDateString } from './dateFilter'

test('toRecordDateString', async (t) => {
  await t.test('ISO 8601 日時から日本時間基準の YYYY-MM-DD を抽出する', () => {
    assert.equal(toRecordDateString('2026-06-01T12:00:00Z'), '2026-06-01')
  })

  await t.test('UTCの日付をまたぐ時刻は日本時間の日付にする', () => {
    assert.equal(toRecordDateString('2026-05-31T14:59:59Z'), '2026-05-31')
    assert.equal(toRecordDateString('2026-05-31T15:00:00Z'), '2026-06-01')
    assert.equal(toRecordDateString('2026-05-31T23:59:59Z'), '2026-06-01')
  })

  await t.test('日付のみの文字列はそのまま返す', () => {
    assert.equal(toRecordDateString('2026-06-01'), '2026-06-01')
  })

  await t.test('カレンダー上に存在しない日付は null を返す', () => {
    assert.equal(toRecordDateString('2026-99-99T00:00:00Z'), null)
    assert.equal(toRecordDateString('2026-02-30T00:00:00Z'), null)
    assert.equal(toRecordDateString('2026-02-30'), null)
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

  await t.test('min のみ指定した場合は日本時間の下限以上を許可する', () => {
    assert.equal(isDateInRange('2026-06-01T12:00:00Z', { min: '2026-06-01', max: '' }), true)
    assert.equal(isDateInRange('2026-06-02T00:00:00Z', { min: '2026-06-01', max: '' }), true)
    assert.equal(isDateInRange('2026-05-31T14:59:59Z', { min: '2026-06-01', max: '' }), false)
    assert.equal(isDateInRange('2026-05-31T15:00:00Z', { min: '2026-06-01', max: '' }), true)
  })

  await t.test('max のみ指定した場合は当日の ISO 日時を含めて上限以下を許可する', () => {
    // Given: 上限日だけを指定する。
    const range = { min: '', max: '2026-06-01' }

    // When: 上限当日・前日・翌日の ISO 日時を判定する。
    const sameDay = isDateInRange('2026-06-01T12:00:00Z', range)
    const previousDay = isDateInRange('2026-05-31T00:00:00Z', range)
    const nextDay = isDateInRange('2026-06-02T00:00:00Z', range)

    // Then: 日時文字列を日付文字列と直接比較して当日を除外しない。
    assert.equal(sameDay, true)
    assert.equal(previousDay, true)
    assert.equal(nextDay, false)
  })

  await t.test('min〜max の範囲内の日時は一致する', () => {
    assert.equal(
      isDateInRange('2026-06-15T00:00:00Z', { min: '2026-06-01', max: '2026-06-30' }),
      true
    )
  })

  await t.test('範囲外の日時は不一致', () => {
    assert.equal(
      isDateInRange('2026-05-31T14:59:59Z', { min: '2026-06-01', max: '2026-06-30' }),
      false
    )
    assert.equal(
      isDateInRange('2026-07-01T00:00:00Z', { min: '2026-06-01', max: '2026-06-30' }),
      false
    )
  })
})

test('findLatestRecordDate', async (t) => {
  await t.test('最新日が先頭にあっても時刻を除いた最新の更新日を返す', () => {
    // Given
    const records = [
      { updated_at: '2026-06-02T12:34:56+09:00' },
      { updated_at: '2026-06-02T00:00:00+09:00' },
      { updated_at: '2026-06-01T23:59:59+09:00' },
    ]

    // When
    const result = findLatestRecordDate(records)

    // Then
    assert.equal(result, '2026-06-02')
  })

  await t.test('最新日が中間にありUTCの日付をまたぐ場合も日本時間の最新日を返す', () => {
    // Given
    const records = [
      { updated_at: '2026-05-31T14:59:59Z' },
      { updated_at: '2026-06-01T15:00:00Z' },
      { updated_at: '2026-06-01T14:59:59Z' },
    ]

    // When
    const result = findLatestRecordDate(records)

    // Then
    assert.equal(result, '2026-06-02')
  })

  await t.test('更新日がない場合は null を返す', () => {
    // Given
    const records = [{ updated_at: null }, { updated_at: 'invalid' }]

    // When
    const result = findLatestRecordDate(records)

    // Then
    assert.equal(result, null)
  })
})
