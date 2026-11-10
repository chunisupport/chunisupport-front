import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateCandidateScoreDifference,
  calculateCandidateTargetRating,
} from './candidateScoreDifference'

test('枠内最低レーティングより0.01高い目標値を返すこと', () => {
  // Given: 枠内最低レーティングが17.45の枠。
  const slotRatings = [17.82, 17.63, 17.45]

  // When: 候補譜面の目標レーティングを算出する。
  const result = calculateCandidateTargetRating(slotRatings)

  // Then: 枠内最低値を上回る17.46を返す。
  assert.equal(result, 17.46)
})

test('枠内レコードがない場合は目標レーティングを返さないこと', () => {
  // Given: 枠内レコードがない状態。
  const slotRatings: number[] = []

  // When: 候補譜面の目標レーティングを算出する。
  const result = calculateCandidateTargetRating(slotRatings)

  // Then: 目標値は未定義になる。
  assert.equal(result, undefined)
})

test('候補譜面の現在スコアから枠入り最低スコアまでの差を返すこと', () => {
  // Given: 定数15.4で17.46に必要な1,008,100点に1,770点不足している候補譜面。
  const currentScore = 1_006_330
  const chartConstant = 15.4
  const targetRating = 17.46

  // When: 枠入り最低スコアとの差を算出する。
  const result = calculateCandidateScoreDifference(currentScore, chartConstant, targetRating)

  // Then: 不足分を負数で返す。
  assert.equal(result, -1_770)
})

test('レーティング計算式の境界となるスコアを最低スコアとして返すこと', () => {
  // Given: 定数15.0の各スコア帯で到達する目標値と最低スコア。
  const chartConstant = 15
  const boundaries = [
    { targetRating: 5, minimumScore: 800_000 },
    { targetRating: 10, minimumScore: 900_000 },
    { targetRating: 11.66, minimumScore: 924_900 },
    { targetRating: 13.33, minimumScore: 950_000 },
    { targetRating: 15, minimumScore: 975_000 },
    { targetRating: 15.6, minimumScore: 990_000 },
    { targetRating: 16, minimumScore: 1_000_000 },
    { targetRating: 16.5, minimumScore: 1_005_000 },
    { targetRating: 17, minimumScore: 1_007_500 },
    { targetRating: 17.15, minimumScore: 1_009_000 },
  ]

  // When: 各目標値に対して、最低スコアの1点手前からの差を算出する。
  const results = boundaries.map(({ targetRating, minimumScore }) =>
    calculateCandidateScoreDifference(minimumScore - 1, chartConstant, targetRating)
  )

  // Then: どのスコア帯でも目標到達には正確にあと1点必要になる。
  assert.deepEqual(
    results,
    boundaries.map(() => -1)
  )
})

test('理論値でも目標レーティングへ届かない場合は差を返さないこと', () => {
  // Given: 定数15.3で到達できる上限17.45を超えた目標値。
  const chartConstant = 15.3
  const targetRating = 17.46

  // When: 枠入り最低スコアとの差を算出する。
  const result = calculateCandidateScoreDifference(1_010_000, chartConstant, targetRating)

  // Then: 差は未定義になる。
  assert.equal(result, undefined)
})
