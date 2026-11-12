import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalDTO, MasterDataDTO, VersionDTO } from '../../../types/api'
import {
  buildGoalPayload,
  formatGoalAttributesLabel,
  resolveGoalAchievementTypeLabel,
} from './goalForm'

const MASTER_DATA: MasterDataDTO = {
  difficulties: [
    { id: 1, name: 'BASIC' },
    { id: 2, name: 'EXPERT' },
  ],
  genres: [{ id: 10, name: 'POPS & ANIME', short_name: 'P&A' }],
  versions: [],
  name_folders: [
    { code: 'A', name: 'あ行', sort_order: 7 },
    { code: 'KA', name: 'か行', sort_order: 8 },
  ],
  account_types: [],
  rating_bands: [],
  achievement_types: [],
  possessions: [],
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
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
    sort_order: 1,
    created_at: '2026-08-07T00:00:00+09:00',
  } satisfies GoalDTO

  // When: 保存用ペイロードへ変換する
  const result = buildGoalPayload(goal)

  // Then: 保存項目だけを返し、レスポンス専用項目は含めない。
  assert.deepEqual(result, {
    group_id: null,
    title: '残り値だけを表示',
    achievement_type: 'score_count',
    achievement_params: { score: 1_000_000, count: 10 },
    attributes: {},
    invert_value: true,
    invert_percentage: false,
    gauge_start: 0,
    apply_gauge_start_to_percentage: false,
  })
  assert.equal('invert' in result, false)
})

test('未知の目標種別は代替ラベルの指定がなければコードを表示する', () => {
  // Given: 表示名が登録されていない目標種別。
  const code = 'unknown_goal_type'

  // When: 代替ラベルを指定せずに表示名を解決する。
  const result = resolveGoalAchievementTypeLabel(code)

  // Then: 未知のコードをそのまま表示する。
  assert.equal(result, 'unknown_goal_type')
})

test('未知の目標種別は明示された代替ラベルを表示する', () => {
  // Given: 表示名が登録されていない目標種別と代替ラベル。
  const code = 'unknown_goal_type'
  const options = { fallbackLabel: '未対応の目標' }

  // When: 代替ラベルを指定して表示名を解決する。
  const result = resolveGoalAchievementTypeLabel(code, options)

  // Then: コードではなく代替ラベルを表示する。
  assert.equal(result, '未対応の目標')
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

test('楽曲名順の条件はマスタの表示名で表示する', () => {
  // Given / When
  const result = formatGoalAttributesLabel({ name_folder: ['A', 'KA'] }, MASTER_DATA, VERSIONS)

  // Then
  assert.equal(result, '楽曲名順: あ行, か行')
})

test('楽曲名順が空配列の条件は対象譜面なしとして表示する', () => {
  // Given / When
  const result = formatGoalAttributesLabel({ name_folder: [] }, MASTER_DATA, VERSIONS)

  // Then
  assert.equal(result, '対象譜面なし')
})

test('保存用ペイロードはゲージのスタート位置と達成率への適用指定を引き継ぐ', () => {
  // Given: スタート位置を持つ保存済み目標
  const goal = {
    id: 1,
    group_id: null,
    title: 'OP達成率99.8%',
    achievement_type: 'overpower_percent',
    achievement_params: { total: 99.8 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 99.6,
    apply_gauge_start_to_percentage: true,
    sort_order: 1,
    created_at: '2026-08-07T00:00:00+09:00',
  } satisfies GoalDTO

  // When: 保存用ペイロードへ変換する
  const result = buildGoalPayload(goal)

  // Then: ゲージ設定を含む保存項目だけを返す。
  assert.deepEqual(result, {
    group_id: null,
    title: 'OP達成率99.8%',
    achievement_type: 'overpower_percent',
    achievement_params: { total: 99.8 },
    attributes: {},
    invert_value: false,
    invert_percentage: false,
    gauge_start: 99.6,
    apply_gauge_start_to_percentage: true,
  })
})

test('レベル指定で保存した定数範囲はレベルで表示する', () => {
  // Given / When
  const result = formatGoalAttributesLabel(
    { const: { min: 13.5, max: 14.4 }, const_filter_mode: 'level' },
    MASTER_DATA,
    VERSIONS
  )

  // Then
  assert.equal(result, 'レベル: 13+ ～ 14')
})

test('数値指定または入力方法のない定数範囲は譜面定数で表示する', () => {
  // Given / When
  const numberResult = formatGoalAttributesLabel(
    { const: { min: 14, max: 14.9 }, const_filter_mode: 'number' },
    MASTER_DATA,
    VERSIONS
  )
  const legacyResult = formatGoalAttributesLabel(
    { const: { min: 13.7, max: 14.2 } },
    MASTER_DATA,
    VERSIONS
  )

  // Then
  assert.equal(numberResult, '定数: 14 ～ 14.9')
  assert.equal(legacyResult, '定数: 13.7 ～ 14.2')
})

test('レベル指定でもレベル境界と一致しない定数範囲は譜面定数で表示する', () => {
  // Given / When
  const result = formatGoalAttributesLabel(
    { const: { min: 13.7, max: 14.2 }, const_filter_mode: 'level' },
    MASTER_DATA,
    VERSIONS
  )

  // Then
  assert.equal(result, '定数: 13.7 ～ 14.2')
})
