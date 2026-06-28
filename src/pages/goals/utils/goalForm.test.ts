import assert from 'node:assert/strict'
import test from 'node:test'
import type { MasterDataDTO, VersionDTO } from '../../../types/api'
import { formatGoalAttributesLabel } from './goalForm'

const MASTER_DATA: MasterDataDTO = {
  difficulties: [
    { id: 1, name: 'BASIC' },
    { id: 2, name: 'EXPERT' },
  ],
  genres: [{ id: 10, name: 'POPS & ANIME' }],
  versions: [],
  account_types: [],
  rating_bands: [],
  achievement_types: [],
}

const VERSIONS: VersionDTO[] = []

test('空配列の条件は対象譜面なしとして表示する', () => {
  // Given / When
  const result = formatGoalAttributesLabel(
    { chart_target: 'OP_TARGET', diff: [] },
    MASTER_DATA,
    VERSIONS
  )

  // Then
  assert.equal(result, '対象譜面なし')
})
