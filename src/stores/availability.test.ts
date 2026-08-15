import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applySystemStatus,
  availability,
  markAvailabilityUnavailable,
  markMaintenanceDetected,
  resetAvailability,
  subscribeMaintenanceDetected,
  subscribeSystemStatusApplied,
} from './availability.ts'

test('可用性Storeの初期化状態はcheckingになる', () => {
  // Given: 他テストの状態を初期化する
  resetAvailability()

  // When: 現在状態を取得する
  const state = availability.state

  // Then: API確認前の状態になる
  assert.deepEqual(state, { kind: 'checking' })
})

test('状態確認成功時はメンテナンスコメントと更新日時を反映する', () => {
  // Given: 初期状態とAPIのメンテナンスレスポンス
  resetAvailability()
  const response = {
    status: 'maintenance',
    comment: 'データ更新中です',
    updated_at: '2026-07-26T12:34:56+09:00',
  } as const

  // When: APIレスポンスをStoreへ反映する
  applySystemStatus(response, 100, 90)

  // Then: 表示とポーリングに必要な値を保持する
  assert.deepEqual(availability.state, {
    kind: 'maintenance',
    comment: response.comment,
    updatedAt: response.updated_at,
    retryAfterSeconds: 90,
    checkedAt: 100,
  })
})

test('既知のメンテナンス中に状態確認が失敗しても最後のコメントを保持する', () => {
  // Given: コメント取得済みのメンテナンス状態
  applySystemStatus(
    {
      status: 'maintenance',
      comment: '終了時刻を確認中です',
      updated_at: '2026-07-26T12:34:56+09:00',
    },
    100,
    60
  )

  // When: 次の状態確認で接続に失敗する
  markAvailabilityUnavailable(200)

  // Then: 接続不能へ切り替えず、既知のコメントを維持する
  assert.equal(availability.state.kind, 'maintenance')
  if (availability.state.kind === 'maintenance') {
    assert.equal(availability.state.comment, '終了時刻を確認中です')
    assert.equal(availability.state.checkedAt, 100)
  }
})

test('初回状態確認に失敗した場合は接続不能回数を増やす', () => {
  // Given: 初回確認前の状態
  resetAvailability()

  // When: 状態確認が2回続けて失敗する
  markAvailabilityUnavailable(100)
  markAvailabilityUnavailable(200)

  // Then: 接続不能状態と再試行回数を保持する
  assert.deepEqual(availability.state, {
    kind: 'unavailable',
    retryCount: 2,
    checkedAt: 200,
  })
})

test('maintenance_mode検知は空コメントへ即時遷移して購読者へ通知する', () => {
  // Given: 通常稼働中のStoreと検知通知の購読
  applySystemStatus(
    {
      status: 'operational',
      comment: '',
      updated_at: '2026-07-26T12:34:56+09:00',
    },
    100
  )
  let notificationCount = 0
  const unsubscribe = subscribeMaintenanceDetected(() => {
    notificationCount += 1
  })

  try {
    // When: 通常APIでメンテナンス専用503を検知する
    markMaintenanceDetected(120, 200)

    // Then: コメント再取得前でもメンテナンスへ切り替わり、1回通知する
    assert.deepEqual(availability.state, {
      kind: 'maintenance',
      comment: '',
      updatedAt: null,
      retryAfterSeconds: 120,
      checkedAt: 200,
    })
    assert.equal(notificationCount, 1)
  } finally {
    unsubscribe()
  }
})

test('状態APIの成功反映だけを購読者へ通知する', () => {
  // Given: 状態APIの成功通知を購読している
  resetAvailability()
  const receivedKinds: string[] = []
  const unsubscribe = subscribeSystemStatusApplied((state) => {
    receivedKinds.push(state.kind)
  })

  try {
    // When: API成功状態と通常APIのmaintenance_mode検知を順に反映する
    applySystemStatus(
      {
        status: 'operational',
        comment: '',
        updated_at: '2026-07-26T12:34:56+09:00',
      },
      100
    )
    markMaintenanceDetected(60, 200)

    // Then: 公開状態APIの成功だけが通知される
    assert.deepEqual(receivedKinds, ['operational'])
  } finally {
    unsubscribe()
  }
})
