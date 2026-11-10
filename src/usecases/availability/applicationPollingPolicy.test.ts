import assert from 'node:assert/strict'
import test from 'node:test'
import type { AvailabilityState } from '../../stores/availability.ts'
import { getApplicationAvailabilityPollingDelayMs } from './applicationPollingPolicy.ts'

const operationalState: AvailabilityState = {
  kind: 'operational',
  updatedAt: '2026-07-26T00:00:00Z',
  checkedAt: 1,
}

test('メンテナンス管理画面は通常稼働中も60秒間隔で状態を確認すること', () => {
  // Given: ルーターが同じ管理画面として扱うパス表記
  const pathnames = [
    '/admin/maintenance',
    '/admin/maintenance/',
    '/admin//maintenance',
    '/ADMIN/MAINTENANCE',
  ]

  // When: 各パスの確認間隔を解決する
  const delays = pathnames.map((pathname) =>
    getApplicationAvailabilityPollingDelayMs(operationalState, pathname)
  )

  // Then: 表記にかかわらず60秒になる
  assert.deepEqual(delays, [60_000, 60_000, 60_000, 60_000])
})

test('通常稼働中の他画面では定期確認を行わないこと', () => {
  // Given: 通常稼働中の一般画面
  const pathname = '/songs'

  // When & Then: 自動確認間隔は設定されない
  assert.equal(getApplicationAvailabilityPollingDelayMs(operationalState, pathname), null)
})

test('メンテナンス中と接続不能中は画面にかかわらず共通間隔を使用すること', () => {
  // Given: 全体ポーリングが必要なメンテナンス状態と接続不能状態
  const states: AvailabilityState[] = [
    {
      kind: 'maintenance',
      comment: '更新中',
      updatedAt: null,
      retryAfterSeconds: 90,
      checkedAt: 1,
    },
    { kind: 'unavailable', retryCount: 2, checkedAt: 2 },
  ]

  // When: 管理画面上で各状態の間隔を解決する
  const delays = states.map((state) =>
    getApplicationAvailabilityPollingDelayMs(state, '/admin/maintenance')
  )

  // Then: 共通ルールの90秒と15秒になる
  assert.deepEqual(delays, [90_000, 15_000])
})
