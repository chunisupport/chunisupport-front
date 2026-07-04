import assert from 'node:assert/strict'
import test from 'node:test'
import { CHART_CONST_MAX, CHART_CONST_MIN } from '../../../../../constants/chart'
import type { GoalDTO } from '../../../../../types/api'
import {
  buildGoalFormAchievementParams,
  buildGoalFormAttributes,
  createGoalFormInitialState,
} from './goalFormModel'

const selectionFallbacks = {
  allDifficultySelections: ['1', '2', '3'],
  allGenreSelections: ['10', '20'],
  allVersionSelections: ['1', '2'],
}

test('作成フォームの初期状態は全選択と標準値で作成される', () => {
  // Given / When
  const result = createGoalFormInitialState(undefined, selectionFallbacks)

  // Then
  assert.equal(result.title, '')
  assert.equal(result.achievementType, 'rank_count')
  assert.equal(result.rank, 'S')
  assert.equal(result.countMode, 'all')
  assert.equal(result.chartTargetMode, 'normal')
  assert.equal(result.constMin, String(CHART_CONST_MIN))
  assert.equal(result.constMax, String(CHART_CONST_MAX))
  assert.deepEqual(result.diffs, selectionFallbacks.allDifficultySelections)
  assert.deepEqual(result.genres, selectionFallbacks.allGenreSelections)
  assert.deepEqual(result.versions, selectionFallbacks.allVersionSelections)
})

test('編集フォームの初期状態は保存済み目標から復元される', () => {
  // Given
  const goal = {
    id: 1,
    title: '虹レ目標',
    achievement_type: 'hardlamp_count',
    achievement_params: { lamp: 'ABS', remaining: 2 },
    attributes: {
      diff: 3,
      const: { min: 13.5, max: 15 },
      genre: [10],
      ver: [2],
    },
    invert: true,
    created_at: '2026-01-01T00:00:00Z',
  } satisfies GoalDTO

  // When
  const result = createGoalFormInitialState(goal, selectionFallbacks)

  // Then
  assert.equal(result.title, '虹レ目標')
  assert.equal(result.achievementType, 'hardlamp_count')
  assert.equal(result.hardLamp, 'ABS')
  assert.equal(result.count, '2')
  assert.equal(result.countMode, 'remaining')
  assert.equal(result.invert, true)
  assert.deepEqual(result.diffs, ['3'])
  assert.equal(result.constMin, '13.5')
  assert.equal(result.constMax, '15')
  assert.deepEqual(result.genres, ['10'])
  assert.deepEqual(result.versions, ['2'])
})

test('対象属性は通常条件とOP対象条件をAPI送信用に変換する', () => {
  // Given / When
  const normalAttributes = buildGoalFormAttributes({
    achievementType: 'score_count',
    chartTargetMode: 'normal',
    diffs: ['1', '2'],
    constMin: '13',
    constMax: '15',
    genres: ['10'],
    versions: ['1', '2'],
  })
  const opTargetAttributes = buildGoalFormAttributes({
    achievementType: 'overpower_value',
    chartTargetMode: 'op_target',
    diffs: ['1'],
    constMin: '',
    constMax: '',
    genres: [],
    versions: ['2'],
  })

  // Then
  assert.deepEqual(normalAttributes, {
    diff: [1, 2],
    const: { min: 13, max: 15 },
    genre: 10,
    ver: [1, 2],
  })
  assert.deepEqual(opTargetAttributes, {
    chart_target: 'OP_TARGET',
    genre: [],
    ver: 2,
  })
})

test('虹枠目標の対象属性から難易度・定数・OP対象を除外する', () => {
  // Given / When
  const attributes = buildGoalFormAttributes({
    achievementType: 'rainbow_count',
    chartTargetMode: 'op_target',
    diffs: ['4'],
    constMin: '13',
    constMax: '15',
    genres: ['10'],
    versions: ['2'],
  })

  // Then
  assert.deepEqual(attributes, {
    genre: 10,
    ver: 2,
  })
})

test('成果パラメータは目標種別と指定方法に応じて組み立てられる', () => {
  // Given / When
  const scoreCountParams = buildGoalFormAchievementParams({
    achievementType: 'score_count',
    score: '1009000',
    rank: 'S',
    count: '30',
    countMode: 'number',
    total: '10',
    totalMode: 'number',
    hardLamp: 'HRD',
    comboLamp: 'FC',
  })
  const totalScoreParams = buildGoalFormAchievementParams({
    achievementType: 'total_score',
    score: '0',
    rank: 'S',
    count: '1',
    countMode: 'all',
    total: '5',
    totalMode: 'remaining',
    hardLamp: 'HRD',
    comboLamp: 'FC',
  })

  // Then
  assert.deepEqual(scoreCountParams, { score: 1009000, count: 30 })
  assert.deepEqual(totalScoreParams, { remaining: 5 })
})
