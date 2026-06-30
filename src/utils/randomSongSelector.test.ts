import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO, SongDTO, VersionDTO } from '../types/api'
import type { RandomSongCandidate, RandomSongLampFilter } from './randomSongSelector.ts'
import {
  buildRandomSongCandidates,
  createRandomSongCandidateKey,
  createRandomSongChartKey,
  createRandomSongRecordMap,
  drawRandomSongs,
  filterRandomSongCandidates,
  filterRandomSongCandidatesByRecord,
  hasInvalidRandomSongWeightValue,
  parseOptionalRandomSongDecimal,
  parseRandomSongDrawCount,
  parseRandomSongWeightValues,
  RANDOM_SONG_OP_TARGET_FILTER,
  RANDOM_SONG_SELECTOR_DIFFICULTIES,
  RANDOM_SONG_SELECTOR_DIFFICULTY_FILTERS,
  restoreRandomSongResults,
  toggleRandomSongDifficultyFilter,
  toggleRandomSongSelectionValue,
} from './randomSongSelector.ts'

const versions: VersionDTO[] = [
  { id: 1, name: 'CHUNITHM', released_at: '2015-07-16' },
  { id: 2, name: 'CHUNITHM NEW', released_at: '2021-11-04' },
]

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

const createCandidate = (overrides: Partial<RandomSongCandidate>): RandomSongCandidate => ({
  song: createSong({ id: 'song-a', title: 'Song A' }),
  difficulty: 'MASTER',
  chartConst: 13.7,
  levelLabel: '13+',
  genre: 'POPS & ANIME',
  version: 'NEW',
  ...overrides,
})

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

const allLampFilters: RandomSongLampFilter[] = [
  'AJC',
  'AJ',
  'FC',
  'CATASTROPHY',
  'ABSOLUTE',
  'BRAVE',
  'HARD',
  'CLEAR',
  'FAILED',
  'NONE',
]

test('楽曲一覧から譜面単位のランダム選曲候補を生成すること', () => {
  // Given: 複数難易度を持つ楽曲がある。
  const songs = [createSong({ id: 'song-a', title: 'Song A' })]

  // When: ランダム選曲候補を生成する。
  const candidates = buildRandomSongCandidates(songs, versions)

  // Then: 存在する譜面だけが候補になり、バージョンとレベル表記が付与される。
  assert.deepEqual(
    candidates.map((candidate) => ({
      title: candidate.song.title,
      difficulty: candidate.difficulty,
      levelLabel: candidate.levelLabel,
      version: candidate.version,
    })),
    [
      { title: 'Song A', difficulty: 'BASIC', levelLabel: '3', version: 'NEW' },
      { title: 'Song A', difficulty: 'MASTER', levelLabel: '13+', version: 'NEW' },
    ]
  )
})

test('ランダム選曲の通常譜面難易度を共有定義で扱うこと', () => {
  // Given: ランダム選曲で扱う難易度定義がある。
  const difficulties = RANDOM_SONG_SELECTOR_DIFFICULTIES

  // When: 楽曲候補生成とUIが参照する難易度を確認する。
  const difficultyLabels = difficulties.map((difficulty) => difficulty)

  // Then: 通常譜面の5難易度が大文字のドメイン値で定義されている。
  assert.deepEqual(difficultyLabels, ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'])
})

test('ランダム選曲の難易度絞り込みはOP対象を選択肢に含めること', () => {
  // Given: ランダム選曲で表示する難易度絞り込み定義がある。
  const difficultyFilters = RANDOM_SONG_SELECTOR_DIFFICULTY_FILTERS

  // When: 画面の選択肢として扱う値を確認する。
  const filterValues = difficultyFilters.map((difficulty) => difficulty)

  // Then: 通常5難易度に加えてOP対象専用の絞り込み値が定義されている。
  assert.deepEqual(filterValues, [
    'BASIC',
    'ADVANCED',
    'EXPERT',
    'MASTER',
    'ULTIMA',
    RANDOM_SONG_OP_TARGET_FILTER,
  ])
})

test('難易度・ジャンル・バージョン・譜面定数で候補を絞り込むこと', () => {
  // Given: 条件が異なる候補がある。
  const candidates = [
    createCandidate({
      difficulty: 'MASTER',
      genre: 'POPS & ANIME',
      version: 'NEW',
      chartConst: 13.7,
    }),
    createCandidate({ difficulty: 'EXPERT', genre: 'niconico', version: 'NEW', chartConst: 11.2 }),
    createCandidate({
      difficulty: 'ULTIMA',
      genre: 'POPS & ANIME',
      version: 'VERSE',
      chartConst: 14.5,
    }),
  ]

  // When: 条件で絞り込む。
  const filtered = filterRandomSongCandidates(candidates, {
    difficulties: ['MASTER', 'ULTIMA'],
    genres: ['POPS & ANIME'],
    versions: ['NEW'],
    minConst: 13,
    maxConst: 14,
  })

  // Then: すべての条件に一致した候補だけが残る。
  assert.deepEqual(
    filtered.map((candidate) => candidate.difficulty),
    ['MASTER']
  )
})

test('OP対象の難易度絞り込みでは曲ごとのOP対象譜面だけを残すこと', () => {
  // Given: MASTERとULTIMAのどちらがOP対象か異なる候補がある。
  const candidates = [
    createCandidate({
      song: createSong({
        id: 'song-a',
        title: 'Song A',
        op_target_difficulty: 'ULTIMA',
      }),
      difficulty: 'MASTER',
      chartConst: 14,
    }),
    createCandidate({
      song: createSong({
        id: 'song-a',
        title: 'Song A',
        op_target_difficulty: 'ULTIMA',
      }),
      difficulty: 'ULTIMA',
      chartConst: 15,
    }),
    createCandidate({
      song: createSong({
        id: 'song-b',
        title: 'Song B',
        op_target_difficulty: 'MASTER',
      }),
      difficulty: 'MASTER',
      chartConst: 13.7,
    }),
  ]

  // When: OP対象だけに絞り込む。
  const filtered = filterRandomSongCandidates(candidates, {
    difficulties: [RANDOM_SONG_OP_TARGET_FILTER],
    genres: ['POPS & ANIME'],
    versions: ['NEW'],
    minConst: null,
    maxConst: null,
  })

  // Then: 楽曲ごとのOP対象難易度に一致する候補だけが残る。
  assert.deepEqual(
    filtered.map((candidate) => `${candidate.song.id}:${candidate.difficulty}`),
    ['song-a:ULTIMA', 'song-b:MASTER']
  )
})

test('OP対象の難易度絞り込みは通常難易度と排他選択にすること', () => {
  // Given: 通常難易度が複数選択されている。
  const selectedDifficulties = ['MASTER', 'ULTIMA'] as const

  // When: OP対象を選択し、その後通常難易度を選び直す。
  const opTargetSelected = toggleRandomSongDifficultyFilter(
    selectedDifficulties,
    RANDOM_SONG_OP_TARGET_FILTER
  )
  const masterSelected = toggleRandomSongDifficultyFilter(opTargetSelected, 'MASTER')

  // Then: OP対象は単独選択になり、通常難易度を選ぶとOP対象が外れる。
  assert.deepEqual(opTargetSelected, [RANDOM_SONG_OP_TARGET_FILTER])
  assert.deepEqual(masterSelected, ['MASTER'])
})

test('重み付き抽選は重み0の候補を除外し重複なしで選ぶこと', () => {
  // Given: 難易度重みが異なる候補がある。
  const candidates = [
    createCandidate({
      song: createSong({ id: 'song-a', title: 'Song A' }),
      difficulty: 'MASTER',
    }),
    createCandidate({
      song: createSong({ id: 'song-b', title: 'Song B' }),
      difficulty: 'EXPERT',
    }),
    createCandidate({
      song: createSong({ id: 'song-c', title: 'Song C' }),
      difficulty: 'ULTIMA',
    }),
  ]

  // When: EXPERT を重み0にして2曲抽選する。
  const selected = drawRandomSongs(candidates, 2, { difficultyWeights: { EXPERT: 0 } }, () => 0)

  // Then: 重み0の候補は選ばれず、同じ候補も重複しない。
  assert.deepEqual(
    selected.map((candidate) => candidate.song.id),
    ['song-a', 'song-c']
  )
})

test('定数別の倍率は難易度倍率と掛け合わせて抽選対象を制御すること', () => {
  // Given: 同じ難易度で譜面定数だけが異なる候補がある。
  const candidates = [
    createCandidate({
      song: createSong({ id: 'song-a', title: 'Song A' }),
      difficulty: 'MASTER',
      chartConst: 13.7,
    }),
    createCandidate({
      song: createSong({ id: 'song-b', title: 'Song B' }),
      difficulty: 'MASTER',
      chartConst: 14.5,
    }),
  ]

  // When: 13.7の倍率だけを0にして抽選する。
  const selected = drawRandomSongs(candidates, 1, { constWeights: { '13.7': 0 } }, () => 0)

  // Then: 倍率0の定数は抽選対象から外れる。
  assert.deepEqual(
    selected.map((candidate) => candidate.song.id),
    ['song-b']
  )
})

test('抽選数が候補数を超える場合は候補数までに制限すること', () => {
  // Given: 候補が1件だけある。
  const candidates = [createCandidate({ song: createSong({ id: 'song-a' }) })]

  // When: 候補数より多い件数を抽選する。
  const selected = drawRandomSongs(candidates, 10, {}, () => 0.5)

  // Then: 候補数までの結果になる。
  assert.equal(selected.length, 1)
})

test('ランダム選曲の入力値を抽選条件へ変換すること', () => {
  // Given: 曲数、任意の小数、倍率の入力値がある。
  const weights = { MASTER: '2', ULTIMA: '0,5' }

  // When: 入力文字列を抽選条件へ変換する。
  const count = parseRandomSongDrawCount('3')
  const emptyConst = parseOptionalRandomSongDecimal('')
  const decimalConst = parseOptionalRandomSongDecimal('12,5')
  const invalidConst = parseOptionalRandomSongDecimal('abc')
  const parsedWeights = parseRandomSongWeightValues(weights)

  // Then: 有効な入力値だけが数値として扱われる。
  assert.equal(count, 3)
  assert.equal(emptyConst, null)
  assert.equal(decimalConst, 12.5)
  assert.equal(invalidConst, null)
  assert.deepEqual(parsedWeights, { MASTER: 2, ULTIMA: 0.5 })
})

test('ランダム選曲の入力値が無効な場合は検出すること', () => {
  // Given: 曲数と倍率に無効な入力値がある。
  const weights = { MASTER: '1', ULTIMA: '-1' }

  // When: 入力値の妥当性を判定する。
  const count = parseRandomSongDrawCount('0')
  const hasInvalidWeight = hasInvalidRandomSongWeightValue(weights)

  // Then: 無効な曲数と倍率が検出される。
  assert.equal(count, null)
  assert.equal(hasInvalidWeight, true)
})

test('選択値の切り替えと保存済み選曲結果の復元を行うこと', () => {
  // Given: 選択中の難易度と保存済みの譜面キーがある。
  const candidates = [
    createCandidate({ song: createSong({ id: 'song-a', title: 'Song A' }) }),
    createCandidate({ song: createSong({ id: 'song-b', title: 'Song B' }) }),
  ]
  const storedKeys = [createRandomSongCandidateKey(candidates[1]), 'missing:MASTER']

  // When: 選択値を切り替え、保存済みキーから結果を復元する。
  const removed = toggleRandomSongSelectionValue(['MASTER', 'ULTIMA'], 'ULTIMA')
  const added = toggleRandomSongSelectionValue(removed, 'EXPERT')
  const restored = restoreRandomSongResults(candidates, storedKeys)

  // Then: 選択値は重複せず切り替わり、存在する候補だけが復元される。
  assert.deepEqual(removed, ['MASTER'])
  assert.deepEqual(added, ['MASTER', 'EXPERT'])
  assert.deepEqual(
    restored.map((candidate) => candidate.song.id),
    ['song-b']
  )
})

test('自分のレコード条件でプレイ状況とスコアを絞り込むこと', () => {
  // Given: プレイ済み、未プレイ、低スコアの候補がある。
  const candidates = [
    createCandidate({ song: createSong({ id: 'song-a', title: 'Song A' }) }),
    createCandidate({ song: createSong({ id: 'song-b', title: 'Song B' }) }),
    createCandidate({ song: createSong({ id: 'song-c', title: 'Song C' }) }),
  ]
  const records = createRandomSongRecordMap([
    createRecord({ id: 'song-a', score: 1008000 }),
    createRecord({ id: 'song-b', score: 995000 }),
  ])

  // When: プレイ済みかつスコア100万以上に絞り込む。
  const filtered = filterRandomSongCandidatesByRecord(candidates, records, new Set(), {
    playStatus: 'played',
    bestFrame: 'all',
    minScore: 1000000,
    maxScore: null,
    lamps: allLampFilters,
  })

  // Then: 条件を満たすプレイ済み候補だけが残る。
  assert.deepEqual(
    filtered.map((candidate) => candidate.song.id),
    ['song-a']
  )
})

test('自分のレコード条件でスコア範囲を指定した場合は未プレイを除外すること', () => {
  // Given: 未プレイ候補とスコア上限内のプレイ済み候補がある。
  const candidates = [
    createCandidate({ song: createSong({ id: 'song-a', title: 'Song A' }) }),
    createCandidate({ song: createSong({ id: 'song-b', title: 'Song B' }) }),
  ]
  const records = createRandomSongRecordMap([createRecord({ id: 'song-b', score: 995000 })])

  // When: プレイ状況はすべてのまま、スコア100万以下に絞り込む。
  const filtered = filterRandomSongCandidatesByRecord(candidates, records, new Set(), {
    playStatus: 'all',
    bestFrame: 'all',
    minScore: null,
    maxScore: 1000000,
    lamps: allLampFilters,
  })

  // Then: スコアを持つプレイ済み候補だけが残る。
  assert.deepEqual(
    filtered.map((candidate) => candidate.song.id),
    ['song-b']
  )
})

test('自分のレコード条件でベスト枠のみを絞り込むこと', () => {
  // Given: ベスト枠に含まれる候補と含まれない候補がある。
  const candidates = [
    createCandidate({ song: createSong({ id: 'song-a', title: 'Song A' }) }),
    createCandidate({ song: createSong({ id: 'song-b', title: 'Song B' }) }),
  ]
  const records = createRandomSongRecordMap([
    createRecord({ id: 'song-a' }),
    createRecord({ id: 'song-b' }),
  ])
  const bestChartKeys = new Set([createRandomSongChartKey('song-b', 'MASTER')])

  // When: ベスト枠のみで絞り込む。
  const filtered = filterRandomSongCandidatesByRecord(candidates, records, bestChartKeys, {
    playStatus: 'all',
    bestFrame: 'only',
    minScore: null,
    maxScore: null,
    lamps: allLampFilters,
  })

  // Then: ベスト枠の候補だけが残る。
  assert.deepEqual(
    filtered.map((candidate) => candidate.song.id),
    ['song-b']
  )
})

test('自分のレコード条件でランプを絞り込むこと', () => {
  // Given: ランプが異なる候補がある。
  const candidates = [
    createCandidate({ song: createSong({ id: 'song-a', title: 'Song A' }) }),
    createCandidate({ song: createSong({ id: 'song-b', title: 'Song B' }) }),
    createCandidate({ song: createSong({ id: 'song-c', title: 'Song C' }) }),
  ]
  const records = createRandomSongRecordMap([
    createRecord({ id: 'song-a', combo_lamp: 'ALL JUSTICE', justice_count: 0 }),
    createRecord({ id: 'song-b', combo_lamp: 'FULL COMBO' }),
    createRecord({ id: 'song-c', clear_lamp: 'HARD' }),
  ])

  // When: AJC と FC のみに絞り込む。
  const filtered = filterRandomSongCandidatesByRecord(candidates, records, new Set(), {
    playStatus: 'all',
    bestFrame: 'all',
    minScore: null,
    maxScore: null,
    lamps: ['AJC', 'FC'],
  })

  // Then: 対応するランプの候補だけが残る。
  assert.deepEqual(
    filtered.map((candidate) => candidate.song.id),
    ['song-a', 'song-b']
  )
})
