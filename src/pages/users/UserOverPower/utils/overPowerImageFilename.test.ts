import assert from 'node:assert/strict'
import test from 'node:test'
import { formatOverPowerImageFilename } from './overPowerImageFilename'

test('ユーザー名・表示軸・集計対象・日時を小文字のハイフン区切りでつなぐこと', () => {
  // Given
  const date = new Date(2026, 9, 11, 9, 5, 3)

  // When
  const filename = formatOverPowerImageFilename(
    { username: 'player01', subPage: 'genre', aggregationTarget: 'THEORETICAL_OP_TARGET' },
    date
  )

  // Then
  assert.equal(
    filename,
    'chunisupport-overpower-player01-genre-theoretical-op-target-20261011090503.png'
  )
})
