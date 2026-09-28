import assert from 'node:assert/strict'
import test from 'node:test'
import { SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_DELAY_SECONDS } from '../constants/songBatch'
import { getSongBatchConfirmationDelaySeconds, isSongBatchModeAvailable } from './songBatchJob'

test('通常実行はメンテナンス状態に関わらず選択できること', () => {
  // Given
  const maintenanceStates = [true, false]

  // When
  const results = maintenanceStates.map((isMaintenance) =>
    isSongBatchModeAvailable('NORMAL', isMaintenance)
  )

  // Then
  assert.deepEqual(results, [true, true])
})

test('大型アップデートはメンテナンス中だけ選択できること', () => {
  // Given
  const maintenanceStates = [true, false]

  // When
  const results = maintenanceStates.map((isMaintenance) =>
    isSongBatchModeAvailable('MAJOR_UPDATE', isMaintenance)
  )

  // Then
  assert.deepEqual(results, [true, false])
})

test('大型アップデートだけ確認後の待機時間を設けること', () => {
  // Given
  const modes = ['NORMAL', 'MAJOR_UPDATE'] as const

  // When
  const results = modes.map((mode) => getSongBatchConfirmationDelaySeconds(mode))

  // Then
  assert.deepEqual(results, [0, SONG_BATCH_MAJOR_UPDATE_CONFIRMATION_DELAY_SECONDS])
})
