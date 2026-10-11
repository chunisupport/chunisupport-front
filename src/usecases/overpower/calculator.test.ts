import assert from 'node:assert/strict'
import test from 'node:test'
import type { PlayerRecordDTO, SongDTO } from '../../types/api'
import { buildOverPowerCalculatorData } from './calculator'
import { buildOverPowerSummary } from './overpowerSummary'

/**
 * OVER POWERサマリー用テストで使う楽曲DTOを生成する。
 *
 * @param overrides - テストケースごとに上書きする楽曲DTOの一部。楽曲IDは必須。
 * @returns 既定値を補完した楽曲DTO。
 */
const createSong = (overrides: Partial<SongDTO> & Pick<SongDTO, 'id'>): SongDTO => ({
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  reading: overrides.reading ?? null,
  name_folder_code: 'NUMBER',
  artist: overrides.artist ?? 'artist',
  genre: overrides.genre ?? 'POPS',
  bpm: overrides.bpm ?? null,
  release: overrides.release === undefined ? '2021-11-04' : overrides.release,
  jacket: overrides.jacket ?? null,
  maxop: overrides.maxop ?? 90,
  is_maxop_unknown: overrides.is_maxop_unknown ?? false,
  op_target_difficulty: overrides.op_target_difficulty ?? 'MASTER',
  is_new: overrides.is_new ?? false,
  unlock_required: overrides.unlock_required ?? false,
  charts: overrides.charts ?? {
    MASTER: {
      const: 15,
      is_const_unknown: false,
      notes: null,
    },
  },
})

/**
 * OVER POWERサマリー用テストで使うプレイヤーレコードDTOを生成する。
 *
 * @param overrides - テストケースごとに上書きするプレイヤーレコードDTOの一部。楽曲IDは必須。
 * @returns 既定値を補完したプレイヤーレコードDTO。
 */
const createRecord = (
  overrides: Partial<PlayerRecordDTO> & Pick<PlayerRecordDTO, 'id'>
): PlayerRecordDTO => ({
  is_played: overrides.is_played ?? true,
  is_op_target: overrides.is_op_target ?? true,
  updated_at: overrides.updated_at ?? null,
  difficulty: overrides.difficulty ?? 'MASTER',
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  artist: overrides.artist ?? 'artist',
  const: overrides.const ?? 15,
  is_const_unknown: overrides.is_const_unknown ?? false,
  score: overrides.score ?? 1_010_000,
  rating: overrides.rating ?? 17,
  overpower: overrides.overpower ?? 90,
  justice_count: overrides.justice_count ?? null,
  overpower_percent: overrides.overpower_percent ?? 100,
  img: overrides.img ?? '',
  clear_lamp: overrides.clear_lamp ?? 'CLEAR',
  combo_lamp: overrides.combo_lamp ?? null,
  full_chain: overrides.full_chain ?? null,
  slot: overrides.slot ?? null,
})

test('未解禁の通常曲とULTIMAを除外し、現行集計と同じ自動入力値を生成する', () => {
  // Given
  const songs = [
    createSong({ id: 'locked' }),
    createSong({
      id: 'ultima',
      maxop: 95,
      op_target_difficulty: 'ULTIMA',
      charts: {
        MASTER: { const: 15, is_const_unknown: false, notes: null },
        ULTIMA: { const: 16, is_const_unknown: false, notes: null },
      },
    }),
  ]
  const records = [
    createRecord({ id: 'locked' }),
    createRecord({ id: 'ultima', difficulty: 'MASTER', overpower: 85, is_op_target: false }),
    createRecord({ id: 'ultima', difficulty: 'ULTIMA', overpower: 94, const: 16 }),
  ]
  const lockedSongs = [
    { id: 'locked', is_ultima: false },
    { id: 'ultima', is_ultima: true },
  ]
  // When
  const data = buildOverPowerCalculatorData(songs, records, [], lockedSongs)
  const summary = buildOverPowerSummary(songs, records, [], lockedSongs)
  // Then
  assert.equal(data.current, summary.all.current)
  assert.equal(data.max, summary.all.max)
  assert.deepEqual(data.unplayedEntries, [
    { current: 85, max: 90, targetConst: 15, isUnplayed: false },
  ])
  assert.equal(data.playedAverageScore, 1010000)
})

test('下位譜面をプレイ済みでも理論値対象が未プレイなら補完対象に含める', () => {
  // Given
  const songs = [
    createSong({
      id: 'song',
      op_target_difficulty: 'ULTIMA',
      maxop: 95,
      charts: {
        MASTER: { const: 15, is_const_unknown: false, notes: null },
        ULTIMA: { const: 16, is_const_unknown: false, notes: null },
      },
    }),
  ]
  const records = [
    createRecord({ id: 'song', overpower: 90 }),
    createRecord({
      id: 'song',
      difficulty: 'ULTIMA',
      const: 16,
      is_op_target: false,
      is_played: false,
      score: 0,
      overpower: 0,
    }),
  ]
  // When
  const data = buildOverPowerCalculatorData(songs, records, [], [])
  // Then
  assert.deepEqual(data.unplayedEntries, [
    { current: 90, max: 95, targetConst: 16, isUnplayed: true },
  ])
  assert.equal(data.playedAverageScoreByConst.get(15), 1010000)
})

test('レコードがない楽曲も理論値と未プレイ補完対象に含める', () => {
  // Given
  const songs = [createSong({ id: 'song' })]
  // When
  const data = buildOverPowerCalculatorData(songs, [], [], [])
  // Then
  assert.equal(data.current, 0)
  assert.equal(data.max, 90)
  assert.equal(data.unplayedEntries[0].isUnplayed, true)
  assert.equal(data.playedAverageScore, null)
  assert.equal(data.playedAverageScoreRegression, null)
})

test('未解禁曲を解禁扱いにすると全曲の理論値へ戻る', () => {
  // Given
  const songs = [createSong({ id: 'song' })]
  // When
  const excluded = buildOverPowerCalculatorData(songs, [], [], [{ id: 'song', is_ultima: false }])
  const unlocked = buildOverPowerCalculatorData(songs, [], [], [])
  // Then
  assert.equal(excluded.max, 0)
  assert.equal(unlocked.max, 90)
})
