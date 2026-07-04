import assert from 'node:assert/strict'
import test from 'node:test'
import type { ChartDTO, GoalDTO, MasterDataDTO, PlayerRecordDTO, SongDTO } from '../../../types/api'
import {
  calculateRainbowGoalProgress,
  filterRainbowTargetSongs,
  getRainbowRequiredDifficulties,
} from './goalRainbow'

const CHART = { const: 1 } as ChartDTO
const MASTER_DATA = {
  genres: [
    { id: 1, name: 'POPS' },
    { id: 2, name: 'GAME' },
  ],
} as MasterDataDTO
const VERSIONS = [
  { id: 1, name: 'A', released_at: '2024-01-01' },
  { id: 2, name: 'B', released_at: '2025-01-01' },
]

/**
 * 虹枠目標テスト用の楽曲を作る。
 *
 * @param overrides - テストごとに差し替える楽曲項目。
 * @returns 虹枠判定に使う楽曲。
 */
const createSong = (overrides: Partial<SongDTO> = {}): SongDTO => ({
  id: 'song-1',
  title: 'Song',
  reading: null,
  artist: 'Artist',
  genre: 'POPS',
  bpm: null,
  release: '2024-01-01',
  jacket: null,
  maxop: 0,
  is_maxop_unknown: false,
  op_target_difficulty: null,
  is_new: false,
  charts: {
    BASIC: CHART,
    ADVANCED: CHART,
    EXPERT: CHART,
    MASTER: CHART,
  },
  ...overrides,
})

/**
 * 虹枠目標テスト用のレコードを作る。
 *
 * @param songId - 楽曲ID。
 * @param difficulty - 難易度。
 * @param comboLamp - コンボランプ。
 * @returns 虹枠判定に使うプレイヤーレコード。
 */
const createRecord = (
  songId: string,
  difficulty: PlayerRecordDTO['difficulty'],
  comboLamp: PlayerRecordDTO['combo_lamp']
): PlayerRecordDTO =>
  ({
    id: songId,
    difficulty,
    combo_lamp: comboLamp,
  }) as PlayerRecordDTO

const createGoal = (params: GoalDTO['achievement_params']): GoalDTO => ({
  id: 1,
  title: '虹枠',
  achievement_type: 'rainbow_count',
  achievement_params: params,
  attributes: {},
  invert: false,
  created_at: '2026-01-01',
})

test('BASICからMASTERが揃いジャンルとバージョンに一致する楽曲だけを対象にする', () => {
  // Given
  const missingBasic = createSong({
    id: 'missing',
    charts: { ADVANCED: CHART, EXPERT: CHART, MASTER: CHART },
  })
  const wrongGenre = createSong({ id: 'genre', genre: 'GAME' })
  const wrongVersion = createSong({ id: 'version', release: '2025-01-01' })

  // When
  const result = filterRainbowTargetSongs(
    [createSong(), missingBasic, wrongGenre, wrongVersion],
    { genre: 1, ver: 1 },
    MASTER_DATA,
    VERSIONS
  )

  // Then
  assert.deepEqual(
    result.map((song) => song.id),
    ['song-1']
  )
})

test('ULTIMAが存在する楽曲ではULTIMAも必須難易度に含める', () => {
  // Given
  const song = createSong({ charts: { ...createSong().charts, ULTIMA: CHART } })

  // When
  const result = getRainbowRequiredDifficulties(song)

  // Then
  assert.deepEqual(result, ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'])
})

test('必須譜面がすべてAJの楽曲だけを虹枠達成数へ数える', () => {
  // Given
  const songs = [createSong({ id: 'achieved' }), createSong({ id: 'unachieved' })]
  const records = songs.flatMap((song) =>
    getRainbowRequiredDifficulties(song).map((difficulty) =>
      createRecord(
        song.id,
        difficulty,
        song.id === 'unachieved' && difficulty === 'MASTER' ? 'FULL COMBO' : 'ALL JUSTICE'
      )
    )
  )

  // When
  const result = calculateRainbowGoalProgress(createGoal({}), songs, records)

  // Then
  assert.equal(result.current, 1)
  assert.equal(result.target, 2)
  assert.equal(result.achieved, false)
})

test('固定件数は対象楽曲数が減っても維持する', () => {
  // Given
  const goal = createGoal({ count: 3 })

  // When
  const result = calculateRainbowGoalProgress(goal, [createSong()], [])

  // Then
  assert.equal(result.target, 3)
  assert.equal(result.achieved, false)
})

test('残数と割合は対象楽曲数から既存の件数目標と同様に算出する', () => {
  // Given
  const songs = [
    createSong({ id: 'song-1' }),
    createSong({ id: 'song-2' }),
    createSong({ id: 'song-3' }),
  ]

  // When
  const remainingResult = calculateRainbowGoalProgress(createGoal({ remaining: 1 }), songs, [])
  const percentResult = calculateRainbowGoalProgress(createGoal({ percent: 50 }), songs, [])

  // Then
  assert.equal(remainingResult.target, 2)
  assert.equal(percentResult.target, 2)
})
