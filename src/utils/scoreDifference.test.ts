import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateDisplayedScoreDifference,
  formatScoreDifference,
  getScoreDifferenceClass,
} from './scoreDifference'

test('表示上の平均スコアを切り捨てて自分との差を返すこと', () => {
  // Given: 小数部を含む平均スコアと、それを上回る自分のスコア。
  const ownScore = 1_005_000
  const averageScore = 1_000_000.9

  // When: 表示用のスコア差を算出する。
  const result = calculateDisplayedScoreDifference(ownScore, averageScore)

  // Then: 表示される整数スコアを基準にした差になる。
  assert.equal(result, 5_000)
})

test('小数点以下桁数を指定した場合は表示桁数で切り捨てた平均スコアとの差を返すこと', () => {
  // Given: 小数点以下3桁目を含む平均スコア。表示上は 1,005,000.75 になる。
  const averageScore = 1_005_000.759

  // When: 小数点以下2桁で上回る場合と下回る場合の差を算出する。
  const aboveResult = calculateDisplayedScoreDifference(1_005_001, averageScore, 2)
  const belowResult = calculateDisplayedScoreDifference(1_005_000, averageScore, 2)

  // Then: 表示される平均スコアどうしの差になり、浮動小数点の誤差を含まない。
  assert.equal(aboveResult, 0.25)
  assert.equal(belowResult, -0.75)
})

test('自分のスコアまたは平均スコアがない場合は表示用の差を返さないこと', () => {
  // Given: 未プレイ、または平均スコアの集計対象がない状態。
  const unplayedScore = undefined
  const missingAverageScore = null

  // When: それぞれのスコア差を算出する。
  const unplayedResult = calculateDisplayedScoreDifference(unplayedScore, 1_000_000)
  const missingAverageResult = calculateDisplayedScoreDifference(1_000_000, missingAverageScore)

  // Then: どちらも差分表示の対象外になる。
  assert.equal(unplayedResult, undefined)
  assert.equal(missingAverageResult, undefined)
})

test('スコア差を桁区切りと符号付きで表示すること', () => {
  // Given / When / Then
  assert.equal(formatScoreDifference(1234), '+1,234')
  assert.equal(formatScoreDifference(-1234), '-1,234')
  assert.equal(formatScoreDifference(0), '+0')
})

test('スコア差に応じて難易度別統計と同じ文字色を返すこと', () => {
  // Given / When / Then
  assert.equal(getScoreDifferenceClass(1), 'text-success')
  assert.equal(getScoreDifferenceClass(-1), 'text-score-difference-negative')
  assert.equal(getScoreDifferenceClass(0), 'text-text-muted')
})
