import assert from 'node:assert/strict'
import test from 'node:test'
import { ADMIN_BATCH_PATH } from '../../constants/routes'
import { buildAdminBatchTabPath, resolveAdminBatchTab } from './adminBatchTab'

test('楽曲バッチタブはセグメントなし、譜面統計バッチタブはセグメント付きのパスになること', () => {
  // Given
  const tabs = ['song', 'chartStats'] as const

  // When
  const paths = tabs.map((tab) => buildAdminBatchTabPath(tab))

  // Then
  assert.deepEqual(paths, [ADMIN_BATCH_PATH, `${ADMIN_BATCH_PATH}/chart-stats`])
})

test('生成したパスのセグメントから元のタブを復元できること', () => {
  // Given
  const segments = [undefined, 'chart-stats']

  // When
  const tabs = segments.map((segment) => resolveAdminBatchTab(segment))

  // Then
  assert.deepEqual(tabs, ['song', 'chartStats'])
})
