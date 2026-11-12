import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveGoalCardDisplayProgress } from './goalCardProgressModel'

test('平均スコア目標は残り点数を固定表示し、反転設定を適用しない', () => {
  // Given
  const progress = {
    current: 1008000,
    target: 1010000,
    percent: 99.8,
    achieved: false,
    targetCount: 2,
    remainingScore: 1234,
    hasUnknownMaxOp: false,
  }

  // When
  const display = resolveGoalCardDisplayProgress(progress, 'avg_score', true, true)

  // Then
  assert.deepEqual(display, {
    currentText: '1,008,000',
    targetText: '1,010,000',
    percentPrefixText: 'あと',
    percentText: '1,234',
    percentSuffixText: '点',
    ariaValueText: '達成率 99.80%、あと1,234点',
    progressValue: (1008000 / 1010000) * 100,
  })
})

test('OVER POWER目標の表示モデルは現在値と目標値を小数点以下3桁で表示する', () => {
  // Given: 現在値には切り捨てが必要で、目標値には小数部のゼロ埋めが必要な進捗。
  const progress = {
    current: 1234.5679,
    target: 2000.5,
    percent: 61.71,
    achieved: false,
    targetCount: 10,
    hasUnknownMaxOp: false,
  }

  // When: OVER POWER目標のカード表示モデルへ変換する。
  const result = resolveGoalCardDisplayProgress(progress, 'overpower_value', false, false)

  // Then: 現在値と目標値の両方にOVER POWER用の表示形式を適用する。
  assert.equal(result.currentText, '1,234.567')
  assert.equal(result.targetText, '2,000.500')
})

test('スタート位置を達成率へ適用する場合はゲージと割合表示がそろうこと', () => {
  // Given: OVER POWER達成率 99.6% から 99.8% を目指している
  const progress = {
    current: 99.7,
    target: 99.8,
    percent: 99.9,
    achieved: false,
    targetCount: 10,
    hasUnknownMaxOp: false,
  }
  const gaugeStart = { value: 99.6, applyToPercentage: true }

  // When
  const normal = resolveGoalCardDisplayProgress(
    progress,
    'overpower_percent',
    false,
    false,
    gaugeStart
  )
  const inverted = resolveGoalCardDisplayProgress(
    progress,
    'overpower_percent',
    false,
    true,
    gaugeStart
  )

  // Then
  assert.equal(normal.progressValue, 50)
  assert.equal(normal.percentText, '50.00%')
  assert.equal(normal.ariaValueText, '達成率 50.00%')
  assert.equal(normal.currentText, '99.700%')
  assert.equal(normal.targetText, '99.800%')
  assert.equal(normal.gaugeStartText, '99.600%')
  assert.deepEqual([inverted.percentPrefixText, inverted.percentText], ['あと', '50.00%'])
})

test('スタート位置を達成率へ適用しない場合はゲージだけがスタート位置から描かれること', () => {
  // Given
  const progress = {
    current: 99.7,
    target: 99.8,
    percent: 99.9,
    achieved: false,
    targetCount: 10,
    hasUnknownMaxOp: false,
  }
  const gaugeStart = { value: 99.6, applyToPercentage: false }

  // When
  const normal = resolveGoalCardDisplayProgress(
    progress,
    'overpower_percent',
    false,
    false,
    gaugeStart
  )
  const inverted = resolveGoalCardDisplayProgress(
    progress,
    'overpower_percent',
    false,
    true,
    gaugeStart
  )

  // Then
  assert.equal(normal.progressValue, 50)
  assert.equal(normal.percentText, '99.89%')
  assert.equal(normal.ariaValueText, '達成率 99.89%')
  assert.deepEqual([inverted.percentPrefixText, inverted.percentText], ['あと', '0.10%'])
})

test('OVER POWER達成率の反転表示は残量の後ろに%を付ける', () => {
  // Given
  const progress = {
    current: 10,
    target: 20,
    percent: 50,
    achieved: false,
    targetCount: 10,
    hasUnknownMaxOp: false,
  }

  // When
  const result = resolveGoalCardDisplayProgress(progress, 'overpower_percent', true, false)

  // Then
  assert.equal(result.currentText, '10.000%')
  assert.equal(result.targetText, '20.000%')
})

test('実数値の反転表示はスタート位置に関係なく目標値までの残りを表示すること', () => {
  // Given
  const progress = {
    current: 950,
    target: 1000,
    percent: 95,
    achieved: false,
    targetCount: 1000,
    hasUnknownMaxOp: false,
  }

  // When
  const result = resolveGoalCardDisplayProgress(progress, 'combolamp_count', true, false, {
    value: 900,
    applyToPercentage: true,
  })

  // Then
  assert.equal(result.currentText, '50')
  assert.equal(result.percentText, '50.00%')
})

test('現在値がスタート位置を下回った場合はゲージと割合表示が0%になること', () => {
  // Given: 新曲追加でOVER POWER達成率がスタート位置より下がった
  const progress = {
    current: 99.5,
    target: 99.8,
    percent: 99.69,
    achieved: false,
    targetCount: 10,
    hasUnknownMaxOp: false,
  }

  // When
  const result = resolveGoalCardDisplayProgress(progress, 'overpower_percent', false, true, {
    value: 99.6,
    applyToPercentage: true,
  })

  // Then
  assert.equal(result.progressValue, 0)
  assert.deepEqual([result.percentPrefixText, result.percentText], ['あと', '100.00%'])
})

test('スタート位置が目標値以上になった場合は0から描きスタート位置を表示しないこと', () => {
  // Given: 譜面削除で動的な目標値がスタート位置を下回った
  const progress = {
    current: 40,
    target: 80,
    percent: 50,
    achieved: false,
    targetCount: 80,
    hasUnknownMaxOp: false,
  }

  // When
  const result = resolveGoalCardDisplayProgress(progress, 'score_count', false, false, {
    value: 90,
    applyToPercentage: true,
  })

  // Then
  assert.equal(result.progressValue, 50)
  assert.equal(result.percentText, '50.00%')
  assert.equal(result.gaugeStartText, undefined)
})

test('平均スコア目標のゲージはスタート位置から描かれ、残り点数表示は変わらないこと', () => {
  // Given
  const progress = {
    current: 1007600,
    target: 1008000,
    percent: 99.96,
    achieved: false,
    targetCount: 2,
    remainingScore: 800,
    hasUnknownMaxOp: false,
  }

  // When
  const result = resolveGoalCardDisplayProgress(progress, 'avg_score', false, false, {
    value: 1007000,
    applyToPercentage: false,
  })

  // Then
  assert.equal(result.progressValue, 60)
  assert.deepEqual([result.percentPrefixText, result.percentText], ['あと', '800'])
  assert.equal(result.ariaValueText, '達成率 60.00%、あと800点')
  assert.equal(result.gaugeStartText, '1,007,000')
})

test('実数値と割合の反転表示を独立して適用し、ゲージ値は通常進捗を使う', () => {
  // Given
  const progress = {
    current: 30,
    target: 100,
    percent: 30,
    achieved: false,
    targetCount: 100,
    hasUnknownMaxOp: false,
  }

  // When
  const valueOnly = resolveGoalCardDisplayProgress(progress, 'score_count', true, false)
  const percentageOnly = resolveGoalCardDisplayProgress(progress, 'score_count', false, true)

  // Then
  assert.deepEqual(valueOnly, {
    currentText: '70',
    targetText: '100',
    percentPrefixText: '',
    percentText: '30.00%',
    ariaValueText: '達成率 30.00%',
    progressValue: 30,
  })
  assert.deepEqual(percentageOnly, {
    currentText: '30',
    targetText: '100',
    percentPrefixText: 'あと',
    percentText: '70.00%',
    ariaValueText: '達成率 30.00%、あと70.00%',
    progressValue: 30,
  })
})

test('スタート位置を達成率へ適用する場合は超過達成もスタート位置からの幅で表示すること', () => {
  // Given: スタート位置99.6、目標99.8に対して99.9まで伸びた
  const progress = {
    current: 99.9,
    target: 99.8,
    percent: 100,
    achieved: true,
    targetCount: 10,
    hasUnknownMaxOp: false,
  }

  // When
  const result = resolveGoalCardDisplayProgress(progress, 'overpower_percent', false, false, {
    value: 99.6,
    applyToPercentage: true,
  })

  // Then: ゲージは満タン、割合表示は超過分を含める
  assert.equal(result.progressValue, 100)
  assert.equal(result.percentText, '150.00%')
  assert.equal(result.ariaValueText, '達成率 100.00%')
})
