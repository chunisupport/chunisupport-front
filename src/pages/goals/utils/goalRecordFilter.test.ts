import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalDTO, MasterDataDTO, VersionDTO } from '../../../types/api'
import type { PlayerRecordWithSongMeta } from '../../../utils/recordMerger'
import { isRecordMatched } from '../../users/UserRecord/utils/filtering'
import { buildGoalRecordFilter, isGoalRecordNavigationEnabled } from './goalRecordFilter'

const MASTER_DATA: MasterDataDTO = {
  difficulties: [
    { id: 1, name: 'BASIC' },
    { id: 2, name: 'EXPERT' },
    { id: 3, name: 'MASTER' },
    { id: 4, name: 'ULTIMA' },
  ],
  genres: [
    { id: 10, name: 'POPS & ANIME' },
    { id: 11, name: 'niconico' },
  ],
  versions: [],
  account_types: [],
  rating_bands: [],
  achievement_types: [],
}

const VERSIONS: VersionDTO[] = [
  { id: 100, name: 'CHUNITHM LUMINOUS', released_at: '2023-12-14' },
  { id: 101, name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
]

/**
 * フィルター変換テスト用の目標を作る。
 *
 * @param overrides - テストごとに差し替える目標項目。
 * @returns フィルター変換に使う目標。
 */
const createGoal = (overrides: Partial<GoalDTO> = {}): GoalDTO => ({
  id: 1,
  title: 'SSを目指す',
  achievement_type: 'score_count',
  achievement_params: { score: 1000000, count: 1 },
  attributes: {},
  invert: false,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

/**
 * 通常レコードフィルターとの一致テスト用レコードを作る。
 *
 * @param overrides - テストごとに差し替えるレコード項目。
 * @returns 楽曲メタ情報付きプレイヤーレコード。
 */
const createRecord = (
  overrides: Partial<PlayerRecordWithSongMeta> = {}
): PlayerRecordWithSongMeta => ({
  is_played: true,
  updated_at: null,
  difficulty: 'MASTER',
  id: 'song-1',
  title: 'Song',
  reading: 'ソング',
  artist: 'Artist',
  const: 14,
  is_const_unknown: false,
  score: 999999,
  rating: 15,
  overpower: 70,
  justice_count: null,
  overpower_percent: 80,
  img: '',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  genre: 'POPS & ANIME',
  release: '2024-12-12',
  release_version: 'VERSE',
  notes: 1000,
  ...overrides,
})

test('目標属性を難易度・定数・ジャンル・バージョンのフィルターへ変換する', () => {
  // Given
  const goal = createGoal({
    attributes: { diff: 2, const: { min: 12.5, max: 14.8 }, genre: 11, ver: 2 },
  })

  // When
  const filter = buildGoalRecordFilter(goal, MASTER_DATA, VERSIONS)

  // Then
  assert.deepEqual(filter.difficulties, ['EXPERT'])
  assert.deepEqual(filter.const, { min: 12.5, max: 14.8 })
  assert.deepEqual(filter.genres, ['niconico'])
  assert.deepEqual(filter.versions, ['VERSE'])
  assert.equal(filter.constFilterMode, 'number')
  assert.equal(filter.scoreFilterMode, 'number')
})

test('属性未指定時は全難易度・全定数・全ジャンル・全バージョンを対象にする', () => {
  // Given
  const goal = createGoal()

  // When
  const filter = buildGoalRecordFilter(goal, MASTER_DATA, VERSIONS)

  // Then
  assert.deepEqual(filter.difficulties, ['BASIC', 'EXPERT', 'MASTER', 'ULTIMA'])
  assert.deepEqual(filter.const, { min: 1, max: 16 })
  assert.deepEqual(filter.genres, [])
  assert.deepEqual(filter.versions, [])
})

test('スコア件数目標では目標スコア未満の譜面だけに一致する', () => {
  // Given
  const filter = buildGoalRecordFilter(createGoal(), MASTER_DATA, VERSIONS)

  // When & Then
  assert.equal(isRecordMatched(createRecord({ score: 999999 }), filter), true)
  assert.equal(isRecordMatched(createRecord({ score: 1000000 }), filter), false)
})

test('平均スコア目標では目標平均値未満の個別譜面だけに一致する', () => {
  // Given
  const goal = createGoal({
    achievement_type: 'avg_score',
    achievement_params: { score: 1005000 },
  })
  const filter = buildGoalRecordFilter(goal, MASTER_DATA, VERSIONS)

  // When & Then
  assert.equal(isRecordMatched(createRecord({ score: 1004999 }), filter), true)
  assert.equal(isRecordMatched(createRecord({ score: 1005000 }), filter), false)
})

test('ハードランプ目標では要求ランプ未満の譜面だけに一致する', () => {
  // Given
  const goal = createGoal({
    achievement_type: 'hardlamp_count',
    achievement_params: { lamp: 'ABS', count: 1 },
  })
  const filter = buildGoalRecordFilter(goal, MASTER_DATA, VERSIONS)

  // When & Then
  assert.equal(isRecordMatched(createRecord({ clear_lamp: 'BRAVE' }), filter), true)
  assert.equal(isRecordMatched(createRecord({ clear_lamp: 'ABSOLUTE' }), filter), false)
})

test('コンボランプ目標では要求ランプ未満の譜面だけに一致する', () => {
  // Given
  const goal = createGoal({
    achievement_type: 'combolamp_count',
    achievement_params: { lamp: 'AJ', count: 1 },
  })
  const filter = buildGoalRecordFilter(goal, MASTER_DATA, VERSIONS)

  // When & Then
  assert.equal(isRecordMatched(createRecord({ combo_lamp: 'FULL COMBO' }), filter), true)
  assert.equal(isRecordMatched(createRecord({ combo_lamp: 'ALL JUSTICE' }), filter), false)
})

test('未プレイ譜面を未達成としてフィルターに含める', () => {
  // Given
  const filter = buildGoalRecordFilter(createGoal(), MASTER_DATA, VERSIONS)

  // When
  const matched = isRecordMatched(
    createRecord({ is_played: false, score: 0, clear_lamp: null, combo_lamp: null }),
    filter
  )

  // Then
  assert.equal(filter.excludeNoPlay, false)
  assert.equal(matched, true)
})

test('集計系目標ではレコード遷移を無効にする', () => {
  // Given
  const goals = ['total_score', 'overpower_value', 'overpower_percent'].map((achievementType) =>
    createGoal({ achievement_type: achievementType as GoalDTO['achievement_type'] })
  )

  // When & Then
  goals.forEach((goal) => {
    assert.equal(isGoalRecordNavigationEnabled(goal), false)
  })
  assert.equal(isGoalRecordNavigationEnabled(createGoal()), true)
})

test('OP対象目標では通常レコードへのフィルター付き遷移を無効にする', () => {
  // Given
  const goal = createGoal({
    attributes: { chart_target: 'OP_TARGET' },
  })

  // When & Then
  assert.equal(isGoalRecordNavigationEnabled(goal), false)
})
