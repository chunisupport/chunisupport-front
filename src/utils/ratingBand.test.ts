import assert from 'node:assert/strict'
import test from 'node:test'
import type { RatingBandDTO } from '../types/api'
import {
  findRatingBandForValue,
  getHighestRatingBand,
  resolveInitialBestSlotRatingBand,
} from './ratingBand.ts'

const RATING_BANDS: RatingBandDTO[] = [
  { id: 0, label: 'ALL', min_inclusive: null, max_exclusive: null, sort_order: 0 },
  { id: 1, label: '-14.9', min_inclusive: null, max_exclusive: 15, sort_order: 1 },
  { id: 2, label: '15.0', min_inclusive: 15, max_exclusive: 15.1, sort_order: 2 },
  { id: 3, label: '15.1+', min_inclusive: 15.1, max_exclusive: null, sort_order: 3 },
]

test('ベスト枠平均は下限を含み上限を含まないレート帯へ解決される', () => {
  // Given: ひとつ前の帯の上限と同じベスト枠平均。
  const bestAverage = 15.1

  // When: 該当するレート帯を取得する。
  const result = findRatingBandForValue(RATING_BANDS, bestAverage)

  // Then: 次のレート帯が選ばれる。
  assert.equal(result?.label, '15.1+')
})

test('最上位帯の取得ではALLを除外してsort_orderが最大の帯を返す', () => {
  // Given: ALLが最大のsort_orderを持ち、通常帯も非ソート順のマスター。
  const bands: RatingBandDTO[] = [
    { id: 2, label: '15.0', min_inclusive: 15, max_exclusive: 15.1, sort_order: 2 },
    { id: 0, label: 'ALL', min_inclusive: null, max_exclusive: null, sort_order: 99 },
    { id: 3, label: '15.1+', min_inclusive: 15.1, max_exclusive: null, sort_order: 3 },
    { id: 1, label: '-14.9', min_inclusive: null, max_exclusive: 15, sort_order: 1 },
  ]

  // When: 最上位の通常レート帯を取得する。
  const result = getHighestRatingBand(bands)

  // Then: 配列の位置やALLではなく、sort_orderが最大の通常帯が返る。
  assert.equal(result?.label, '15.1+')
})

test('ログインユーザーのベスト枠平均がある場合は該当帯を初期表示する', () => {
  // Given: 中間帯に含まれるベスト枠平均。
  const bestAverage = 15.05

  // When: 初期レート帯を解決する。
  const result = resolveInitialBestSlotRatingBand(RATING_BANDS, bestAverage)

  // Then: ユーザーの該当帯が返る。
  assert.equal(result?.label, '15.0')
})

test('未ログイン時は最上位帯を初期表示する', () => {
  // Given: ベスト枠平均がない状態。
  // When: 初期レート帯を解決する。
  const result = resolveInitialBestSlotRatingBand(RATING_BANDS, null)

  // Then: 最上位帯が返る。
  assert.equal(result?.label, '15.1+')
})

test('下限なしの帯は負の値でも該当帯として返す', () => {
  // Given: 下限なしの帯を含むマスターと負のベスト枠平均がある。
  const bestAverage = -1

  // When: 該当するレート帯を取得する。
  const result = findRatingBandForValue(RATING_BANDS, bestAverage)

  // Then: 下限なしの帯が選ばれる。
  assert.equal(result?.label, '-14.9')
})

test('同順位の帯が重複する場合は先頭の帯を最上位として返す', () => {
  // Given: 最大のsort_orderが並ぶ通常帯が2件ある。
  const bands: RatingBandDTO[] = [
    { id: 1, label: '15.0', min_inclusive: 15, max_exclusive: 15.1, sort_order: 2 },
    { id: 2, label: '15.0b', min_inclusive: 15, max_exclusive: 15.1, sort_order: 2 },
  ]

  // When: 最上位の通常レート帯を取得する。
  const result = getHighestRatingBand(bands)

  // Then: 先頭の帯が返る。
  assert.equal(result?.label, '15.0')
})
