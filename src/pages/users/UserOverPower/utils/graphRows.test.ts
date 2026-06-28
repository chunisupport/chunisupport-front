import assert from 'node:assert/strict'
import test from 'node:test'

import type { PlayerRecordDTO } from '../../../../types/api'
import { buildOverPowerLockedSongLookup } from '../../../../usecases/overpower/overpowerGraph'
import type { OverPowerSummaryRow } from '../../../../usecases/overpower/types'
import { buildGraphRows, isRecordAvailable } from './graphRows.ts'

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
