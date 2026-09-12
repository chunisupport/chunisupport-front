import assert from 'node:assert/strict'
import test from 'node:test'
import type { HonorDTO } from '../../../../types/api'
import {
  buildHonorSlots,
  formatRatingImageOverPowerLine,
  formatRatingImageOverPowerPercent,
  formatRatingImageOverPowerValue,
  getPrimaryHonor,
  getRatingImageV2ComboLampLabel,
} from './ratingImageShared.ts'

test('getPrimaryHonor は1枠目の称号を優先すること', () => {
  // Given: 2枠目が先頭で、1枠目が後続にある称号一覧。
  const honors = [
    { slot: 2, name: '第二称号' },
    { slot: 1, name: '第一称号' },
  ] as HonorDTO[]

  // When: 代表称号を取得する。
  const honor = getPrimaryHonor(honors)

  // Then: 1枠目の称号が選ばれる。
  assert.equal(honor?.name, '第一称号')
})

test('getPrimaryHonor は1枠目が無い場合は先頭の称号を返すこと', () => {
  // Given: 1枠目を含まない称号一覧。
  const honors = [{ slot: 3, name: '第三称号' }] as HonorDTO[]

  // When: 代表称号を取得する。
  const honor = getPrimaryHonor(honors)

  // Then: 先頭の称号が選ばれる。
  assert.equal(honor?.name, '第三称号')
})

test('buildHonorSlots は1〜3枠を称号または空枠で埋めること', () => {
  // Given: 1枠目と3枠目だけ称号がある。
  const honors = [
    { slot: 3, name: '第三称号' },
    { slot: 1, name: '第一称号' },
  ] as HonorDTO[]

  // When: 3枠のスロットを組み立てる。
  const slots = buildHonorSlots(honors)

  // Then: 2枠目だけ空になる。
  assert.equal(slots[0]?.name, '第一称号')
  assert.equal(slots[1], null)
  assert.equal(slots[2]?.name, '第三称号')
})

test('formatRatingImageOverPowerValue は数値を小数点以下3桁へ整形すること', () => {
  // Given: OVER POWER値がある。
  const value = 123.4567

  // When: 画像用の表示文字列へ整形する。
  const label = formatRatingImageOverPowerValue(value)

  // Then: 切り捨てた3桁表示になる。
  assert.equal(label, '123.456')
})

test('formatRatingImageOverPowerValue は未設定値をハイフンへすること', () => {
  // Given: OVER POWER値が未設定。

  // When: 画像用の表示文字列へ整形する。
  const label = formatRatingImageOverPowerValue(null)

  // Then: ハイフンになる。
  assert.equal(label, '-')
})

test('formatRatingImageOverPowerLine は値と達成率を括弧付き1行へすること', () => {
  // Given: OVER POWER値と達成率がある。
  const value = 123.4567
  const percent = 12.345678

  // When: 1行表記へ整形する。
  const label = formatRatingImageOverPowerLine(value, percent)

  // Then: OP値と括弧付き達成率になる。
  assert.equal(label, 'OP 123.456 (12.34567%)')
})

test('formatRatingImageOverPowerPercent は未設定値をハイフンへすること', () => {
  // Given: OVER POWER達成率が未設定。

  // When: 画像用の表示文字列へ整形する。
  const label = formatRatingImageOverPowerPercent(null)

  // Then: ハイフンになる。
  assert.equal(label, '-')
})

test('レーティング枠画像 Ver. 2 のコンボランプは省略せずFULL COMBOとALL JUSTICEを返すこと', () => {
  // Given: FULL COMBOとALL JUSTICEと未設定のコンボランプ。

  // When: 画像用の表示文言を取得する。
  const fullCombo = getRatingImageV2ComboLampLabel('FULL COMBO')
  const allJustice = getRatingImageV2ComboLampLabel('ALL JUSTICE')
  const unset = getRatingImageV2ComboLampLabel(null)

  // Then: 省略せずフル表記し、未設定は空文字になる。
  assert.equal(fullCombo, 'FULL COMBO')
  assert.equal(allJustice, 'ALL JUSTICE')
  assert.equal(unset, '')
})
