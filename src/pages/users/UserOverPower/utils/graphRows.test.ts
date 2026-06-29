import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../../../types/api'
import { buildOverPowerLockedSongLookup } from '../../../../usecases/overpower/overpowerGraph'
import type { OverPowerSummaryRow } from '../../../../usecases/overpower/types'
import {
  buildGraphRows,
  buildSongBasedGraphRows,
  buildSongEntriesBySummaryTab,
  isRecordAvailable,
} from './graphRows.ts'

const versions: VersionSummaryDTO[] = [
  { name: 'CHUNITHM NEW', released_at: '2021-11-04' },
  { name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
]

/**
 * OVER POWERグラフ行テストで使う楽曲DTOを生成する。
 *
 * @param overrides - テストケースごとに上書きする楽曲DTOの一部。楽曲IDは必須。
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
 * OVER POWERグラフ行テストで使うプレイヤーレコードDTOを生成する。
 *
 * @param overrides - テストケースごとに上書きするプレイヤーレコードDTOの一部。
 * @returns 既定値を補完したプレイヤーレコードDTO。
 */
const createRecord = (overrides: Partial<PlayerRecordDTO> = {}): PlayerRecordDTO => ({
  is_played: true,
  is_op_target: true,
  updated_at: null,
  difficulty: 'MASTER',
  id: 'song-a',
  title: 'Song A',
  artist: 'Artist',
  const: 15,
  is_const_unknown: false,
  score: 1_010_000,
  rating: 17,
  overpower: 90,
  justice_count: null,
  overpower_percent: 100,
  img: '',
  clear_lamp: 'CLEAR',
  combo_lamp: null,
  full_chain: null,
  slot: null,
  ...overrides,
})

const summaryRow: OverPowerSummaryRow = {
  id: 'MASTER',
  label: 'MASTER',
  current: 180,
  max: 270,
  percent: 66.6666,
  count: 3,
}

test('isRecordAvailable は通常未解禁とULTIMA未解禁を分けて判定する', () => {
  // Given
  const lockedLookup = buildOverPowerLockedSongLookup([
    { display_id: 'song-locked', is_ultima: false },
    { display_id: 'song-ultima', is_ultima: true },
  ])

  // When & Then
  assert.equal(isRecordAvailable(createRecord({ id: 'song-locked' }), lockedLookup), false)
  assert.equal(
    isRecordAvailable(createRecord({ id: 'song-ultima', difficulty: 'ULTIMA' }), lockedLookup),
    false
  )
  assert.equal(
    isRecordAvailable(createRecord({ id: 'song-ultima', difficulty: 'MASTER' }), lockedLookup),
    true
  )
})

test('buildGraphRows はスコア帯とコンボ帯の件数をサマリー行へ付与する', () => {
  // Given
  const recordsByLabel = new Map<string, PlayerRecordDTO[]>([
    [
      'MASTER',
      [
        createRecord({ id: 'max-aj', score: 1_010_000, combo_lamp: 'ALL JUSTICE' }),
        createRecord({ id: 'sss-fc', score: 1_009_000, combo_lamp: 'FULL COMBO' }),
        createRecord({ id: 'unplayed', is_played: false, score: 0, combo_lamp: null }),
      ],
    ],
  ])

  // When
  const [result] = buildGraphRows([summaryRow], recordsByLabel)

  // Then
  assert.equal(result?.scoreBands.find((band) => band.label === 'MAX')?.count, 1)
  assert.equal(result?.scoreBands.find((band) => band.label === 'SSS+')?.count, 1)
  assert.equal(result?.scoreBands.find((band) => band.label === 'OTHER')?.count, 1)
  assert.equal(result?.comboBands.find((band) => band.label === 'ALL JUSTICE')?.count, 1)
  assert.equal(result?.comboBands.find((band) => band.label === 'FULL COMBO')?.count, 1)
  assert.equal(result?.comboBands.find((band) => band.label === 'OTHER')?.count, 1)
})

test('曲数ベースグラフは未解禁除外とバージョン分類とOTHER集計を反映する', () => {
  // Given
  const songs = [
    createSong({ id: 'played', genre: 'POPS', release: '2024-12-12' }),
    createSong({ id: 'unplayed', genre: 'POPS', release: '2024-12-12' }),
    createSong({ id: 'locked', genre: 'POPS', release: '2024-12-12' }),
    createSong({
      id: 'ultima-locked',
      genre: 'niconico',
      release: '2021-11-04',
      charts: {
        MASTER: { const: 14, is_const_unknown: false, notes: null },
        ULTIMA: { const: 15, is_const_unknown: false, notes: null },
      },
    }),
  ]
  const records = [
    createRecord({ id: 'played', combo_lamp: 'ALL JUSTICE', score: 1_010_000 }),
    createRecord({
      id: 'ultima-locked',
      difficulty: 'MASTER',
      combo_lamp: 'FULL COMBO',
      score: 1_009_000,
    }),
  ]
  const lockedLookup = buildOverPowerLockedSongLookup([
    { display_id: 'locked', is_ultima: false },
    { display_id: 'ultima-locked', is_ultima: true },
  ])
  const rows: OverPowerSummaryRow[] = [
    { id: 'all', label: 'ALL', current: 180, max: 270, percent: 66.6666, count: 3 },
    { id: 'POPS', label: 'POPS', current: 90, max: 180, percent: 50, count: 2 },
    { id: 'VERSE', label: 'VERSE', current: 90, max: 180, percent: 50, count: 2 },
  ]

  // When
  const entriesByTab = buildSongEntriesBySummaryTab(songs, records, versions, lockedLookup)
  const [allRow] = buildSongBasedGraphRows([rows[0]], entriesByTab.all)
  const [genreRow] = buildSongBasedGraphRows([rows[1]], entriesByTab.genres)
  const [versionRow] = buildSongBasedGraphRows([rows[2]], entriesByTab.versions)

  // Then
  assert.equal(entriesByTab.all.get('all')?.length, 3)
  assert.equal(entriesByTab.genres.get('POPS')?.length, 2)
  assert.equal(entriesByTab.versions.get('VERSE')?.length, 2)
  assert.equal(allRow?.scoreBands.find((band) => band.label === 'MAX')?.count, 1)
  assert.equal(allRow?.scoreBands.find((band) => band.label === 'SSS+')?.count, 1)
  assert.equal(allRow?.scoreBands.find((band) => band.label === 'OTHER')?.count, 1)
  assert.equal(genreRow?.scoreBands.find((band) => band.label === 'OTHER')?.count, 1)
  assert.equal(versionRow?.comboBands.find((band) => band.label === 'ALL JUSTICE')?.count, 1)
})
