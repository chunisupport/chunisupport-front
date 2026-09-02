import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalDTO, MasterDataDTO, VersionDTO } from '../../../types/api'
import { buildGoalPayload, formatGoalAttributesLabel, formatGoalTypeLabel } from './goalForm'

const MASTER_DATA: MasterDataDTO = {
  difficulties: [
    { id: 1, name: 'BASIC' },
    { id: 2, name: 'EXPERT' },
  ],
  genres: [{ id: 10, name: 'POPS & ANIME' }],
  versions: [],
  account_types: [],
  rating_bands: [],
  achievement_types: [],
}

const VERSIONS: VersionDTO[] = []

test('保存用ペイロードは実数値と割合の反転フラグを独立して引き継ぐ', () => {
  // Given: 反転フラグが異なる保存済み目標
  const goal = {
    id: 1,
    group_id: null,
    title: '残り値だけを表示',
    achievement_type: 'score_count',
    achievement_params: { score: 1_000_000, count: 10 },
    attributes: {},
    invert_value: true,
    invert_percentage: false,
    sort_order: 1,
    created_at: '2026-08-07T00:00:00+09:00',
  } satisfies GoalDTO

  // When: 保存用ペイロードへ変換する
  const result = buildGoalPayload(goal)

  // Then: 両方の反転フラグが変更されずに含まれる
  assert.equal(result.invert_value, true)
  assert.equal(result.invert_percentage, false)
  assert.equal('invert' in result, false)
})

test('FULL CHAIN目標種別を日本語ラベルへ変換する', () => {
  // Given / When / Then
  assert.equal(formatGoalTypeLabel('fullchain_count'), 'FULL CHAIN達成数')
})

test('空配列の条件は対象譜面なしとして表示する', () => {
  // Given / When
  const result = formatGoalAttributesLabel(
    { chart_target: 'OP_TARGET', diff: [] },
    MASTER_DATA,
    VERSIONS
  )

  // Then
  assert.equal(result, '対象譜面なし')
})
