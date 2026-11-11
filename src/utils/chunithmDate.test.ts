import assert from 'node:assert/strict'
import test from 'node:test'
import { getTodayChunithmDate, toChunithmDate, toChunithmDayStartTimestamp } from './chunithmDate'

test('CHUNITHMの運用日はJST 07:00で切り替わり、実行環境のタイムゾーンに依存しないこと', () => {
  // Given: JST 2026-09-03 06:59:59 と 07:00:00。
  // 太平洋夏時間ではどちらも 2026-09-02 の午後で、ローカルの暦日は前日のまま。
  const beforeDayStart = new Date('2026-09-02T21:59:59Z')
  const atDayStart = new Date('2026-09-02T22:00:00Z')

  // When
  const before = toChunithmDate(beforeDayStart)
  const atStart = toChunithmDate(atDayStart)

  // Then: ローカル日付が前日でも、07:00からJSTの当日になる。
  assert.equal(before, '2026-09-02')
  assert.equal(atStart, '2026-09-03')
})

test('getTodayChunithmDateは渡した時刻の運用日を返すこと', () => {
  // Given: 新バージョン稼働日の直前と開始時刻。
  const beforeDayStart = new Date('2026-09-02T21:59:59Z')
  const atDayStart = new Date('2026-09-02T22:00:00Z')

  // When / Then
  assert.equal(getTodayChunithmDate(beforeDayStart), '2026-09-02')
  assert.equal(getTodayChunithmDate(atDayStart), '2026-09-03')
})

test('年をまたぐJST 07:00直前は前年の運用日になること', () => {
  // Given: JST 2026-01-01 06:59:59 と 07:00:00。
  const beforeDayStart = new Date('2025-12-31T21:59:59Z')
  const atDayStart = new Date('2025-12-31T22:00:00Z')

  // When / Then
  assert.equal(toChunithmDate(beforeDayStart), '2025-12-31')
  assert.equal(toChunithmDate(atDayStart), '2026-01-01')
})

test('稼働開始は稼働日のJST 07:00であり、06:59:59は含まないこと', () => {
  // Given: 新バージョンの稼働日。
  const releasedAt = '2026-06-18'

  // When
  const start = toChunithmDayStartTimestamp(releasedAt)

  // Then: UTC換算の07:00と一致し、直前の秒は境界より前。
  assert.equal(start, Date.parse('2026-06-17T22:00:00Z'))
  assert.ok(Date.parse('2026-06-18T06:59:59+09:00') < start)
  assert.equal(Date.parse('2026-06-18T07:00:00+09:00'), start)
})

test('稼働日時に時刻が付いていても暦日のJST 07:00を境界にすること', () => {
  // Given: 日付の後ろに時刻が続く稼働日。
  const releasedAt = '2026-06-18T15:00:00Z'

  // When
  const start = toChunithmDayStartTimestamp(releasedAt)

  // Then: 文字列先頭の暦日の07:00になる。
  assert.equal(start, Date.parse('2026-06-17T22:00:00Z'))
})
