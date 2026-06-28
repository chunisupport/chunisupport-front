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

test('OP対象条件では空の難易度を選択なしとして表示しない', () => {
  // Given / When
  const result = formatGoalAttributesLabel(
    { chart_target: 'OP_TARGET', diff: [] },
    MASTER_DATA,
    VERSIONS
  )

  // Then
  assert.equal(result, '対象: OP対象')
})
