import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api'
import {
  buildLockedSongsOpComparison,
  formatLockedSongsOverPowerDelta,
  formatLockedSongsOverPowerPercentDelta,
  formatOfficialOverPowerDisplay,
  getLockedSongsOpComparisonDeltaDirection,
  matchesOfficialOverPowerDisplay,
} from './lockedSongsOpComparison'

const versions: VersionSummaryDTO[] = [{ name: 'CHUNITHM VERSE', released_at: '2024-12-12' }]

/**
 * 照合テストで使う楽曲DTOを生成する。
 *
 * @param overrides - 上書きする楽曲DTOの一部。楽曲IDは必須。
 * @returns 既定値を補完した楽曲DTO。
 */
const createSong = (overrides: Partial<SongDTO> & Pick<SongDTO, 'id'>): SongDTO => ({
  id: overrides.id,
  title: overrides.title ?? overrides.id,
  reading: overrides.reading ?? null,
  artist: overrides.artist ?? 'artist',
  genre: overrides.genre ?? 'POPS',
  bpm: overrides.bpm ?? null,
  release: overrides.release === undefined ? '2024-12-12' : overrides.release,
  jacket: overrides.jacket ?? null,
  maxop: overrides.maxop ?? 90,
  is_maxop_unknown: overrides.is_maxop_unknown ?? false,
  op_target_difficulty: overrides.op_target_difficulty ?? 'MASTER',
  is_new: overrides.is_new ?? false,
  charts: overrides.charts ?? {
    MASTER: {
      const: 15,
      is_const_unknown: false,
      notes: null,
    },
  },
})

/**
 * 照合テストで使うプレイヤーレコードDTOを生成する。
 *
 * @param overrides - 上書きするプレイヤーレコードDTOの一部。楽曲IDは必須。
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

test('公式表示は小数第2位へ切り捨てて整形すること', () => {
  // Given
  const value = 96120.129

  // When
  const result = formatOfficialOverPowerDisplay(value)

  // Then
  assert.equal(result, '96120.12')
})

test('小数第2位へ切り捨てた表示が同じなら公式値と一致すること', () => {
  // Given
  const calculated = 90.129
  const official = 90.12

  // When
  const result = matchesOfficialOverPowerDisplay(calculated, official)

  // Then
  assert.equal(result, true)
})

test('表示上のOP差分方向を判定できること', () => {
  assert.equal(getLockedSongsOpComparisonDeltaDirection(90.13, 90.12), 'higher')
  assert.equal(getLockedSongsOpComparisonDeltaDirection(90.11, 90.12), 'lower')
  assert.equal(getLockedSongsOpComparisonDeltaDirection(90.129, 90.12), null)
})

test('計算OPが公式OPより大きいときの差を符号付きで整形すること', () => {
  // Given
  const calculated = 100.5
  const official = 90

  // When
  const result = formatLockedSongsOverPowerDelta(calculated, official)

  // Then
  assert.equal(result, '+10.500')
})

test('計算OPが公式OPより小さいときの差を符号付きで整形すること', () => {
  // Given
  const calculated = 88.5
  const official = 90.12

  // When
  const result = formatLockedSongsOverPowerDelta(calculated, official)

  // Then
  assert.equal(result, '-1.620')
})

test('計算OP%が公式OP%より大きいときの差を符号付きで整形すること', () => {
  // Given
  const calculated = 76.26412
  const official = 76.26

  // When
  const result = formatLockedSongsOverPowerPercentDelta(calculated, official)

  // Then
  assert.equal(result, '+0.00412%')
})

test('小数第2位へ切り捨てた表示が違うなら公式値と一致しないこと', () => {
  // Given
  const calculated = 90.13
  const official = 90.12

  // When
  const result = matchesOfficialOverPowerDisplay(calculated, official)

  // Then
  assert.equal(result, false)
})

test('未解禁なしの計算値が公式値と一致する場合はmatchedになること', () => {
  // Given
  const songs = [createSong({ id: 'song-a', maxop: 90 })]
  const records = [createRecord({ id: 'song-a', overpower: 85 })]

  // When
  const result = buildLockedSongsOpComparison({
    songs,
    records,
    versions,
    lockedSongs: [],
    officialOverPower: 85,
    officialOverPowerPercent: (85 / 90) * 100,
  })

  // Then
  assert.equal(result.calculatedOverPower, 85)
  assert.equal(result.overPowerMatched, true)
  assert.equal(result.percentMatched, true)
  assert.equal(result.matched, true)
})

test('未解禁にすると計算値が減り公式値と不一致になること', () => {
  // Given
  const songs = [
    createSong({ id: 'locked', maxop: 90 }),
    createSong({ id: 'available', maxop: 80 }),
  ]
  const records = [
    createRecord({ id: 'locked', overpower: 85 }),
    createRecord({ id: 'available', overpower: 70 }),
  ]

  // When
  const result = buildLockedSongsOpComparison({
    songs,
    records,
    versions,
    lockedSongs: [{ display_id: 'locked', is_ultima: false }],
    officialOverPower: 155,
    officialOverPowerPercent: 91.17,
  })

  // Then
  assert.equal(result.calculatedOverPower, 70)
  assert.equal(result.calculatedOverPowerPercent, (70 / 80) * 100)
  assert.equal(result.overPowerMatched, false)
  assert.equal(result.percentMatched, false)
  assert.equal(result.matched, false)
})

test('公式OP%がnullのときはOP一致だけでmatchedを判定すること', () => {
  // Given
  const songs = [createSong({ id: 'song-a', maxop: 90 })]
  const records = [createRecord({ id: 'song-a', overpower: 85 })]

  // When
  const result = buildLockedSongsOpComparison({
    songs,
    records,
    versions,
    lockedSongs: [],
    officialOverPower: 85,
    officialOverPowerPercent: null,
  })

  // Then
  assert.equal(result.percentMatched, null)
  assert.equal(result.overPowerMatched, true)
  assert.equal(result.matched, true)
})
