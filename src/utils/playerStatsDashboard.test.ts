import assert from 'node:assert/strict'
import test from 'node:test'
import { MASTER_ULTIMA_FILTER, THEORETICAL_OVER_POWER_TARGET_FILTER } from '../constants/chart'
import type { PlayerRecordDTO } from '../types/api'
import {
  buildPlayerStatsAchievementProgress,
  buildPlayerStatsLevelRows,
  buildPlayerStatsMilestone,
  buildPlayerStatsSummary,
  filterPlayerStatsRecords,
  findPlayerStatsCandidates,
  hasPlayerStatsAchievement,
} from './playerStatsDashboard'

/**
 * 統計テスト用の通常譜面レコードを生成する。
 *
 * @param overrides - テストケースごとに変更するレコード値。
 * @returns 既定値と上書き値を合わせた通常譜面レコード。
 */
const createRecord = (overrides: Partial<PlayerRecordDTO> = {}): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: false,
  updated_at: null,
  difficulty: 'MASTER',
  id: 'song-1',
  title: '楽曲1',
  artist: 'アーティスト',
  const: 14.5,
  is_const_unknown: false,
  score: 1_009_000,
  rating: 0,
  overpower: 0,
  justice_count: null,
  overpower_percent: 0,
  img: '',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

test('到達条件はスコア・コンボ・ハードランプをそれぞれ累計判定する', () => {
  // Given
  const record = createRecord({
    score: 1_010_000,
    combo_lamp: 'ALL JUSTICE',
    clear_lamp: 'ABSOLUTE',
  })

  // When & Then
  assert.equal(hasPlayerStatsAchievement(record, 'sssPlus'), true)
  assert.equal(hasPlayerStatsAchievement(record, 'sPlus'), true)
  assert.equal(hasPlayerStatsAchievement(record, 'ssPlus'), true)
  assert.equal(hasPlayerStatsAchievement(record, 'max'), true)
  assert.equal(hasPlayerStatsAchievement(record, 'fc'), true)
  assert.equal(hasPlayerStatsAchievement(record, 'aj'), true)
  assert.equal(hasPlayerStatsAchievement(record, 'ajc'), true)
  assert.equal(hasPlayerStatsAchievement(record, 'hard'), true)
  assert.equal(hasPlayerStatsAchievement(record, 'catastrophe'), false)
})

test('未プレイ譜面はスコア値にかかわらず到達条件を満たさない', () => {
  // Given
  const record = createRecord({ is_played: false, score: 1_010_000 })

  // When & Then
  assert.equal(hasPlayerStatsAchievement(record, 'played'), false)
  assert.equal(hasPlayerStatsAchievement(record, 'max'), false)
})

test('難易度フィルターは大文字ドメイン値で対象譜面だけを返す', () => {
  // Given
  const records = [
    createRecord({ id: 'master', difficulty: 'MASTER' }),
    createRecord({ id: 'ultima', difficulty: 'ULTIMA' }),
  ]

  // When
  const filtered = filterPlayerStatsRecords(records, 'ULTIMA')

  // Then
  assert.deepEqual(
    filtered.map((record) => record.id),
    ['ultima']
  )
  assert.equal(filterPlayerStatsRecords(records, 'ALL').length, 2)
})

test('MASTERとULTIMAの合算フィルターは両難易度だけを返す', () => {
  // Given
  const records = [
    createRecord({ id: 'expert', difficulty: 'EXPERT' }),
    createRecord({ id: 'master', difficulty: 'MASTER' }),
    createRecord({ id: 'ultima', difficulty: 'ULTIMA' }),
  ]

  // When
  const filtered = filterPlayerStatsRecords(records, MASTER_ULTIMA_FILTER)

  // Then
  assert.deepEqual(
    filtered.map((record) => record.id),
    ['master', 'ultima']
  )
})

test('OP対象フィルターは楽曲マスタの理論値対象難易度だけを曲ごとに返す', () => {
  // Given
  const records = [
    createRecord({ id: 'song-1', difficulty: 'MASTER', is_op_target: true }),
    createRecord({ id: 'song-1', difficulty: 'ULTIMA', is_op_target: false }),
    createRecord({ id: 'song-2', difficulty: 'MASTER', is_op_target: false }),
    createRecord({ id: 'song-2', difficulty: 'ULTIMA', is_op_target: true }),
  ]
  const targetDifficultyBySongId = new Map([
    ['song-1', 'ULTIMA'],
    ['song-2', 'MASTER'],
  ] as const)

  // When
  const filtered = filterPlayerStatsRecords(
    records,
    THEORETICAL_OVER_POWER_TARGET_FILTER,
    targetDifficultyBySongId
  )

  // Then
  assert.deepEqual(
    filtered.map((record) => `${record.id}:${record.difficulty}`),
    ['song-1:ULTIMA', 'song-2:MASTER']
  )
})

test('サマリーは未プレイを母数に含め、平均スコアからは除外する', () => {
  // Given
  const records = [
    createRecord({ score: 1_010_000, combo_lamp: 'ALL JUSTICE' }),
    createRecord({ id: 'song-2', score: 1_008_000 }),
    createRecord({ id: 'song-3', is_played: false, score: 0 }),
  ]

  // When
  const summary = buildPlayerStatsSummary(records)

  // Then
  assert.equal(summary.total, 3)
  assert.equal(summary.played, 2)
  assert.equal(summary.averageScore, 1_009_000)
  assert.equal(summary.sssPlus, 1)
  assert.equal(summary.aj, 1)
  assert.equal(summary.max, 1)
})

test('達成階段は指定順を保ち全譜面を母数にする', () => {
  // Given
  const records = [
    createRecord({ score: 1_010_000 }),
    createRecord({ id: 'song-2', score: 1_000_000 }),
    createRecord({ id: 'song-3', is_played: false, score: 0 }),
  ]

  // When
  const progress = buildPlayerStatsAchievementProgress(records, ['played', 'ss', 'max'])

  // Then
  assert.deepEqual(
    progress.map(({ achievement, count }) => ({ achievement, count })),
    [
      { achievement: 'played', count: 2 },
      { achievement: 'ss', count: 2 },
      { achievement: 'max', count: 1 },
    ]
  )
  assert.equal(progress[0].percent, (2 / 3) * 100)
})

test('レベル別集計はRANK・COMBO・HARDの累計件数をレベルが高い順に返す', () => {
  // Given
  const records = [
    createRecord({ id: '14plus', const: 14.7, score: 1_009_000 }),
    createRecord({
      id: '14',
      const: 14.4,
      score: 1_010_000,
      combo_lamp: 'ALL JUSTICE',
      clear_lamp: 'CATASTROPHY',
    }),
    createRecord({ id: '14-second', const: 14.2, is_played: false, score: 0 }),
  ]

  // When
  const rows = buildPlayerStatsLevelRows(records)

  // Then
  assert.deepEqual(rows, [
    {
      level: '14+',
      total: 1,
      s: 1,
      sPlus: 1,
      ss: 1,
      ssPlus: 1,
      sss: 1,
      sssPlus: 1,
      fc: 0,
      aj: 0,
      ajc: 0,
      clear: 1,
      hard: 0,
      brave: 0,
      absolute: 0,
      catastrophe: 0,
    },
    {
      level: '14',
      total: 2,
      s: 1,
      sPlus: 1,
      ss: 1,
      ssPlus: 1,
      sss: 1,
      sssPlus: 1,
      fc: 1,
      aj: 1,
      ajc: 1,
      clear: 1,
      hard: 1,
      brave: 1,
      absolute: 1,
      catastrophe: 1,
    },
  ])
})

test('次のマイルストーンは現在値が区切り上でも次の区切りを返す', () => {
  // Given & When
  const milestone = buildPlayerStatsMilestone(20, 'sssPlus', 100)

  // Then
  assert.deepEqual(milestone, {
    current: 20,
    target: 30,
    remaining: 10,
    isComplete: false,
  })
})

test('次のマイルストーンは全譜面達成時に完了状態を返す', () => {
  // Given & When
  const milestone = buildPlayerStatsMilestone(8, 'max', 8)

  // Then
  assert.deepEqual(milestone, {
    current: 8,
    target: 8,
    remaining: 0,
    isComplete: true,
  })
})

test('次のマイルストーンは端数の全譜面数を達成可能な上限にする', () => {
  // Given & When
  const milestone = buildPlayerStatsMilestone(20, 'sssPlus', 24)

  // Then
  assert.deepEqual(milestone, {
    current: 20,
    target: 24,
    remaining: 4,
    isComplete: false,
  })
})

test('候補譜面は目標未達のプレイ済み譜面を現在記録に近い順で返す', () => {
  // Given
  const records = [
    createRecord({ id: 'near', score: 1_008_900 }),
    createRecord({ id: 'far', score: 1_005_000 }),
    createRecord({ id: 'done', score: 1_009_100 }),
    createRecord({ id: 'unplayed', is_played: false, score: 0 }),
  ]

  // When
  const candidates = findPlayerStatsCandidates(records, 'sssPlus', 5)

  // Then
  assert.deepEqual(
    candidates.map(({ record, scoreGap }) => ({ id: record.id, scoreGap })),
    [
      { id: 'near', scoreGap: 100 },
      { id: 'far', scoreGap: 4_000 },
    ]
  )
})

test('AJ候補はFULL COMBO済みを優先しスコア差を返さない', () => {
  // Given
  const records = [
    createRecord({ id: 'high-score', score: 1_009_900 }),
    createRecord({ id: 'full-combo', score: 1_008_000, combo_lamp: 'FULL COMBO' }),
    createRecord({ id: 'aj', score: 1_009_000, combo_lamp: 'ALL JUSTICE' }),
  ]

  // When
  const candidates = findPlayerStatsCandidates(records, 'aj', 5)

  // Then
  assert.deepEqual(
    candidates.map(({ record, scoreGap }) => ({ id: record.id, scoreGap })),
    [
      { id: 'full-combo', scoreGap: null },
      { id: 'high-score', scoreGap: null },
    ]
  )
})

test('MAX候補はノーツ数で正規化した失点が少ない譜面を選出する', () => {
  // Given
  const records = [
    createRecord({ id: 'few-dropped-notes', score: 1_009_000 }),
    createRecord({ id: 'many-dropped-notes', score: 1_009_500 }),
  ]
  const notesBySongId = new Map([
    ['few-dropped-notes', { MASTER: 500 }],
    ['many-dropped-notes', { MASTER: 2_000 }],
  ])

  // When
  const candidates = findPlayerStatsCandidates(records, 'max', 1, notesBySongId)

  // Then
  assert.deepEqual(
    candidates.map(({ record }) => record.id),
    ['few-dropped-notes']
  )
})

test('候補譜面は選出後に難易度とレベルが低い順で返す', () => {
  // Given
  const records = [
    createRecord({ id: 'master-14', difficulty: 'MASTER', const: 14.2, score: 1_008_900 }),
    createRecord({ id: 'expert-13-plus', difficulty: 'EXPERT', const: 13.7, score: 1_008_700 }),
    createRecord({ id: 'expert-13', difficulty: 'EXPERT', const: 13.2, score: 1_008_500 }),
  ]

  // When
  const candidates = findPlayerStatsCandidates(records, 'sssPlus', 3)

  // Then
  assert.deepEqual(
    candidates.map(({ record }) => record.id),
    ['expert-13', 'expert-13-plus', 'master-14']
  )
})
