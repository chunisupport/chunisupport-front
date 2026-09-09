import assert from 'node:assert/strict'
import test from 'node:test'
import type { GoalFilterOptions } from '../api/songs'
import type { GoalDTO, PlayerRecordDTO, SongDTO, VersionDTO } from '../types/api'
import {
  filterRandomSongCandidatesByGoal,
  isRandomSongGoalFilterAvailable,
} from './randomSongGoalFilter'
import { createRandomSongRecordMap, type RandomSongCandidate } from './randomSongSelector'

const versions: VersionDTO[] = [
  { id: 1, name: 'CHUNITHM', released_at: '2015-07-16' },
  { id: 2, name: 'CHUNITHM NEW', released_at: '2021-11-04' },
]

const masterData: GoalFilterOptions = {
  difficulties: [
    { id: 1, name: 'BASIC' },
    { id: 2, name: 'MASTER' },
  ],
  genres: [{ id: 10, name: 'POPS & ANIME' }],
}

/**
 * テストの前提となるデータを作る。
 * @param overrides - 差し替える項目。
 * @returns テスト用データ。
 */
const createSong = (overrides: Partial<SongDTO>): SongDTO => ({
  id: 'song-a',
  title: 'Song A',
  reading: null,
  artist: 'Artist',
  genre: 'POPS & ANIME',
  bpm: 180,
  release: '2021-11-04',
  official_idx: '1',
  jacket: null,
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: 'MASTER',
  is_new: false,
  charts: {
    BASIC: { const: 3, is_const_unknown: false, notes: 300 },
    MASTER: { const: 13.7, is_const_unknown: false, notes: 1200 },
  },
  ...overrides,
})

/**
 * テストの前提となるデータを作る。
 * @param overrides - 差し替える項目。
 * @returns テスト用データ。
 */
const createCandidate = (overrides: Partial<RandomSongCandidate>): RandomSongCandidate => ({
  song: createSong({ id: 'song-a', title: 'Song A' }),
  difficulty: 'MASTER',
  chartConst: 13.7,
  levelLabel: '13+',
  genre: 'POPS & ANIME',
  version: 'NEW',
  ...overrides,
})

/**
 * テストの前提となるデータを作る。
 * @param overrides - 差し替える項目。
 * @returns テスト用データ。
 */
const createRecord = (overrides: Partial<PlayerRecordDTO>): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: false,
  updated_at: null,
  difficulty: 'MASTER',
  id: 'song-a',
  title: 'Song A',
  artist: 'Artist',
  const: 13.7,
  is_const_unknown: false,
  score: 1007500,
  rating: 15,
  overpower: 20,
  justice_count: null,
  overpower_percent: 100,
  img: 'https://example.com/jacket-a.png',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

/**
 * テストの前提となるデータを作る。
 * @param overrides - 差し替える項目。
 * @returns テスト用データ。
 */
const createGoal = (overrides: Partial<GoalDTO> = {}): GoalDTO => ({
  id: 1,
  group_id: null,
  title: 'SSを目指す',
  achievement_type: 'score_count',
  achievement_params: { score: 1000000, count: 1 },
  attributes: {},
  invert_value: false,
  invert_percentage: false,
  sort_order: 1,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

test('保存済み目標の属性と未達成スコアで候補を絞り込むこと', () => {
  // Given: 目標対象内の未達成・達成済み譜面と、対象外難易度の譜面がある。
  const candidates = [
    createCandidate({ song: createSong({ id: 'song-a' }) }),
    createCandidate({ song: createSong({ id: 'song-b' }) }),
    createCandidate({ song: createSong({ id: 'song-c' }), difficulty: 'BASIC', chartConst: 3 }),
  ]
  const records = createRandomSongRecordMap([
    createRecord({ id: 'song-a', score: 999999 }),
    createRecord({ id: 'song-b', score: 1000000 }),
    createRecord({ id: 'song-c', difficulty: 'BASIC', const: 3, score: 0 }),
  ])
  const goal = createGoal({
    attributes: { diff: 2, const: { min: 13, max: 14 }, genre: 10, ver: 2 },
  })

  // When: 保存済み目標を候補へ適用する。
  const filtered = filterRandomSongCandidatesByGoal(candidates, records, goal, masterData, versions)

  // Then: 目標属性に一致する未達成譜面だけが残る。
  assert.deepEqual(
    filtered.map((candidate) => candidate.song.id),
    ['song-a']
  )
})

test('ハードランプ目標はコンボランプ表示に隠れたハードランプでも判定すること', () => {
  // Given: FC済みだがハードランプ目標は未達成の譜面がある。
  const candidate = createCandidate({})
  const records = createRandomSongRecordMap([
    createRecord({ combo_lamp: 'FULL COMBO', clear_lamp: 'HARD' }),
  ])
  const goal = createGoal({
    achievement_type: 'hardlamp_count',
    achievement_params: { lamp: 'ABS', count: 1 },
  })

  // When: ハードランプ目標を候補へ適用する。
  const filtered = filterRandomSongCandidatesByGoal(
    [candidate],
    records,
    goal,
    masterData,
    versions
  )

  // Then: 代表表示がFCでも実際のハードランプが未達成なら候補に残る。
  assert.equal(filtered.length, 1)
})

test('OP対象目標は楽曲マスタで指定された対象難易度だけに絞り込むこと', () => {
  // Given: 同じ楽曲のBASICとOP対象MASTERが候補にある。
  const song = createSong({ id: 'song-a', op_target_difficulty: 'MASTER' })
  const candidates = [
    createCandidate({ song, difficulty: 'BASIC', chartConst: 3 }),
    createCandidate({ song, difficulty: 'MASTER', chartConst: 13.7 }),
  ]
  const goal = createGoal({ attributes: { chart_target: 'OP_TARGET' } })

  // When: OP対象目標を未プレイ候補へ適用する。
  const filtered = filterRandomSongCandidatesByGoal(
    candidates,
    new Map(),
    goal,
    masterData,
    versions
  )

  // Then: 楽曲マスタのOP対象難易度だけが残る。
  assert.deepEqual(
    filtered.map((candidate) => candidate.difficulty),
    ['MASTER']
  )
})

test('目標属性のいずれかが空選択なら候補を返さないこと', () => {
  // Given: 難易度が明示的な空配列で保存された目標がある。
  const goal = createGoal({ attributes: { diff: [] } })

  // When: 目標を候補へ適用する。
  const filtered = filterRandomSongCandidatesByGoal(
    [createCandidate({})],
    new Map(),
    goal,
    masterData,
    versions
  )

  // Then: 対象譜面なしとして空配列を返す。
  assert.deepEqual(filtered, [])
})

test('集計系目標は譜面単位の絞り込み対象にしないこと', () => {
  // Given: 譜面単位の未達成条件を持たない総スコア目標がある。
  const goal = createGoal({
    achievement_type: 'total_score',
    achievement_params: { total: 1000000 },
  })

  // When & Then: ランダム選曲で利用できない目標と判定される。
  assert.equal(isRandomSongGoalFilterAvailable(goal), false)
})

for (const achievementType of ['rank_count', 'score_count', 'avg_score'] as const) {
  test(`${achievementType}は達成境界を除外して未プレイを含める`, () => {
    // Given: 境界前後、未プレイとレコード欠落の譜面。
    const candidates = ['below', 'equal', 'above', 'unplayed', 'missing'].map((id) =>
      createCandidate({ song: createSong({ id }) })
    )
    const records = createRandomSongRecordMap([
      createRecord({ id: 'below', score: 999999 }),
      createRecord({ id: 'equal', score: 1000000 }),
      createRecord({ id: 'above', score: 1000001 }),
      createRecord({ id: 'unplayed', is_played: false, score: 1000000 }),
    ])
    // When: 反転表示設定を持つ目標を適用。
    const result = filterRandomSongCandidatesByGoal(
      candidates,
      records,
      createGoal({
        achievement_type: achievementType,
        invert_value: true,
        invert_percentage: true,
      }),
      masterData,
      versions
    )
    // Then: 反転表示にかかわらず未達成譜面を選ぶ。
    assert.deepEqual(
      result.map((candidate) => candidate.song.id),
      ['below', 'unplayed', 'missing']
    )
  })
}

for (const attributes of [
  { diff: [] },
  { genre: [] },
  { ver: [] },
  { diff: [999] },
  { genre: [999] },
  { ver: [999] },
]) {
  test(`空または不明な属性では候補を返さない: ${JSON.stringify(attributes)}`, () => {
    // Given
    const goal = createGoal({ attributes })
    // When
    const result = filterRandomSongCandidatesByGoal(
      [createCandidate({})],
      new Map(),
      goal,
      masterData,
      versions
    )
    // Then
    assert.deepEqual(result, [])
  })
}

for (const lamp of ['GOLD', 'PLATINUM'] as const) {
  test(`FULL CHAIN ${lamp}は同じ色の達成済み譜面だけを除外する`, () => {
    // Given: 異なる色のFULL CHAINと未プレイ。
    const candidates = ['gold', 'platinum', 'missing'].map((id) =>
      createCandidate({ song: createSong({ id }) })
    )
    const records = createRandomSongRecordMap([
      createRecord({ id: 'gold', full_chain: 'FULL CHAIN GOLD' }),
      createRecord({ id: 'platinum', full_chain: 'FULL CHAIN PLATINUM' }),
    ])
    const goal = createGoal({
      achievement_type: 'fullchain_count',
      achievement_params: { lamp, count: 1 },
    })
    // When
    const result = filterRandomSongCandidatesByGoal(candidates, records, goal, masterData, versions)
    // Then
    assert.deepEqual(
      result.map((candidate) => candidate.song.id),
      [lamp === 'GOLD' ? 'platinum' : 'gold', 'missing']
    )
  })
}

test('単曲レート目標は達成済み・到達不能・定数不明を除外する', () => {
  // Given: 16.0へ到達する最小定数は13.9。
  const candidates = ['below', 'equal', 'missing', 'unreachable', 'unknown'].map((id) =>
    createCandidate({
      song: createSong({
        id,
        charts: { MASTER: { const: 13.9, is_const_unknown: id === 'unknown', notes: 1200 } },
      }),
      chartConst: id === 'unreachable' ? 13.8 : 13.9,
    })
  )
  const records = createRandomSongRecordMap([
    createRecord({ id: 'below', rating: 15.99 }),
    createRecord({ id: 'equal', rating: 16 }),
  ])
  const goal = createGoal({
    achievement_type: 'rating_count',
    achievement_params: { rating: 16, count: 1 },
  })
  // When
  const result = filterRandomSongCandidatesByGoal(candidates, records, goal, masterData, versions)
  // Then
  assert.deepEqual(
    result.map((candidate) => candidate.song.id),
    ['below', 'missing']
  )
})

for (const lamp of ['FC', 'AJ'] as const) {
  test(`コンボランプ${lamp}の達成済み譜面を除外する`, () => {
    // Given
    const candidates = ['fc', 'aj', 'missing'].map((id) =>
      createCandidate({ song: createSong({ id }) })
    )
    const records = createRandomSongRecordMap([
      createRecord({ id: 'fc', combo_lamp: 'FULL COMBO' }),
      createRecord({ id: 'aj', combo_lamp: 'ALL JUSTICE' }),
    ])
    // When
    const result = filterRandomSongCandidatesByGoal(
      candidates,
      records,
      createGoal({ achievement_type: 'combolamp_count', achievement_params: { lamp, count: 1 } }),
      masterData,
      versions
    )
    // Then
    assert.deepEqual(
      result.map((candidate) => candidate.song.id),
      lamp === 'FC' ? ['missing'] : ['fc', 'missing']
    )
  })
}

test('壊れた成果条件を持つ目標は選択できない', () => {
  // Given
  const goals = [
    createGoal({ achievement_params: {} }),
    createGoal({ achievement_params: { score: Number.NaN } }),
    createGoal({ achievement_type: 'hardlamp_count', achievement_params: { lamp: 'FC' } }),
    createGoal({ achievement_type: 'rating_count', achievement_params: {} }),
  ]
  // When & Then
  for (const goal of goals) {
    assert.equal(isRandomSongGoalFilterAvailable(goal), false)
    assert.deepEqual(
      filterRandomSongCandidatesByGoal(
        [createCandidate({})],
        new Map(),
        goal,
        masterData,
        versions
      ),
      []
    )
  }
})

test('虹枠目標は通常譜面が揃った楽曲の未AJ譜面を抽出し、難易度・定数指定を使わない', () => {
  // Given: BASIC〜MASTERとULTIMAがある楽曲、および通常譜面が欠けた楽曲。
  const song = createSong({
    charts: {
      BASIC: { const: 3, is_const_unknown: false, notes: 300 },
      ADVANCED: { const: 6, is_const_unknown: false, notes: 500 },
      EXPERT: { const: 10, is_const_unknown: false, notes: 800 },
      MASTER: { const: 13.7, is_const_unknown: false, notes: 1200 },
      ULTIMA: { const: 14, is_const_unknown: false, notes: 1400 },
    },
  })
  const candidates = [
    createCandidate({ song, difficulty: 'BASIC', chartConst: 3 }),
    createCandidate({ song }),
    createCandidate({ song, difficulty: 'ULTIMA', chartConst: 14 }),
    createCandidate({ song: createSong({ id: 'incomplete' }) }),
  ]
  const goal = createGoal({
    achievement_type: 'rainbow_count',
    achievement_params: { count: 1 },
    attributes: { diff: [], const: { min: 15 }, chart_target: 'OP_TARGET' },
  })
  const records = createRandomSongRecordMap([createRecord({ combo_lamp: 'ALL JUSTICE' })])
  // When
  const result = filterRandomSongCandidatesByGoal(candidates, records, goal, masterData, versions)
  // Then: 虹枠達成に必要な未AJのBASICとULTIMAが残る。
  assert.deepEqual(
    result.map((candidate) => candidate.difficulty),
    ['BASIC', 'ULTIMA']
  )
})
