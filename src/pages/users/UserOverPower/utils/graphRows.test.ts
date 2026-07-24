import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordDTO, SongDTO } from '../../../../types/api'
import type { OverPowerSummaryRow } from '../../../../usecases/overpower/types'
import { buildChartRecordsBySummaryTab, buildGraphRows } from './graphRows.ts'

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

test('譜面単位グラフはレコードがない未プレイ譜面をOTHERへ集計する', () => {
  // Given
  const song = createSong({ id: 'unplayed', genre: 'POPS' })
  const groups = buildChartRecordsBySummaryTab([
    {
      song,
      difficulty: 'MASTER',
      chartConst: 15,
      maxOverPower: 90,
      level: '15',
      versionName: 'VERSE',
      record: null,
    },
  ])

  // When
  const [result] = buildGraphRows([summaryRow], groups.difficulties)

  // Then
  assert.equal(result?.scoreBands.find((band) => band.label === 'OTHER')?.count, 1)
  assert.equal(result?.comboBands.find((band) => band.label === 'OTHER')?.count, 1)
})
