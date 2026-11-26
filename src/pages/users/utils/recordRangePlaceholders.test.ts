import assert from 'node:assert/strict'
import test from 'node:test'
import { getRecordRangePlaceholders } from './recordRangePlaceholders'

test('通常レコードのプレイ済み実測値から項目ごとの範囲を集計する', () => {
  const record = {
    is_played: true,
    top_percent: 12.34,
    combo_lamp: 'ALL JUSTICE',
    justice_count: 7,
    is_const_unknown: false,
    rating: 16.25,
    overpower: 78.125,
  } as const
  const records = [
    record,
    { ...record, top_percent: 0.01, justice_count: 0, rating: 17.3, overpower: 83.205 },
    { ...record, top_percent: null, combo_lamp: 'FULL COMBO', justice_count: 500 },
    { ...record, is_const_unknown: true, rating: 0, overpower: 4.5 },
    { ...record, is_played: false, top_percent: 100, justice_count: 0, rating: 0, overpower: 0 },
  ] as const

  const result = getRecordRangePlaceholders(records)

  assert.deepEqual(result, {
    topPercent: { min: 0.01, max: 12.34 },
    rating: { min: 16.25, max: 17.3 },
    justiceCount: { min: 0, max: 7 },
    overPower: { min: 4.5, max: 83.205 },
  })
})

test("WORLD'S END の実測値がない項目は範囲を返さない", () => {
  const records = [
    { is_played: true, combo_lamp: 'ALL JUSTICE', justice_count: 0 },
    { is_played: true, combo_lamp: 'ALL JUSTICE', justice_count: null, top_percent: NaN },
    { is_played: false, combo_lamp: null, justice_count: null, top_percent: 30 },
  ] as const

  const result = getRecordRangePlaceholders(records)

  assert.deepEqual(result, { justiceCount: { min: 0, max: 0 } })
  assert.deepEqual(getRecordRangePlaceholders([]), {})
})
