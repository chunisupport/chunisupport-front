import assert from 'node:assert/strict'
import test from 'node:test'
import type { AvailabilityState } from '../../stores/availability.ts'
import { createAvailabilityPolling, getAvailabilityPollingDelayMs } from './availabilityPolling.ts'

test('メンテナンス中はRetry-Afterの秒数を次回確認間隔へ変換する', () => {
  // Given: APIから90秒後の再確認を指定されたメンテナンス状態
  const state = {
    kind: 'maintenance',
    comment: '更新作業中',
    updatedAt: null,
    retryAfterSeconds: 90,
    checkedAt: 1,
  } as const

  // When: 次回ポーリング間隔を解決する
  const delay = getAvailabilityPollingDelayMs(state)

  // Then: 90秒をミリ秒へ変換した値になる
  assert.equal(delay, 90_000)
})

test('API接続不能の再試行間隔は段階的に増え60秒で上限になる', () => {
  // Given: 接続失敗を1回から5回まで繰り返した状態
  const retryCounts = [1, 2, 3, 4, 5]

  // When: 各状態の次回ポーリング間隔を解決する
  const delays = retryCounts.map((retryCount) =>
    getAvailabilityPollingDelayMs({
      kind: 'unavailable',
      retryCount,
      checkedAt: retryCount,
    })
  )

  // Then: 5秒、15秒、30秒、60秒へ増え、その後は60秒を維持する
  assert.deepEqual(delays, [5_000, 15_000, 30_000, 60_000, 60_000])
})

test('初回確認中と通常稼働中は自動ポーリングしない', () => {
  // Given: 初回確認中と通常稼働中の状態
  const checking = { kind: 'checking' } as const
  const operational = {
    kind: 'operational',
    updatedAt: '2026-07-26T00:00:00Z',
    checkedAt: 1,
  } as const

  // When & Then: どちらも次回確認は不要になる
  assert.equal(getAvailabilityPollingDelayMs(checking), null)
  assert.equal(getAvailabilityPollingDelayMs(operational), null)
})

test('同時の即時再確認は1回の通信へ集約する', async () => {
  // Given: 完了を手動制御できる状態確認とメンテナンス状態
  let state: AvailabilityState = {
    kind: 'maintenance',
    comment: '更新中',
    updatedAt: null,
    retryAfterSeconds: 60,
    checkedAt: 1,
  }
  let refreshCount = 0
  let resolveRefresh: (() => void) | undefined
  const refreshPromise = new Promise<void>((resolve) => {
    resolveRefresh = resolve
  })
  const controller = createAvailabilityPolling({
    refresh: () => {
      refreshCount += 1
      return refreshPromise
    },
    abort: () => undefined,
    environment: {
      getState: () => state,
      isVisible: () => true,
      isOnline: () => true,
      setTimer: () => 1,
      clearTimer: () => undefined,
      addVisibilityListener: () => () => undefined,
      addOnlineListener: () => () => undefined,
      reload: () => undefined,
    },
  })

  try {
    // When: 状態確認を完了前に2回要求する
    const first = controller.refreshNow()
    const second = controller.refreshNow()

    // Then: 同じ通信完了を待ち、実処理は1回だけ呼ばれる
    assert.equal(first, second)
    assert.equal(refreshCount, 1)
    state = { kind: 'operational', updatedAt: '2026-07-26T00:00:00Z', checkedAt: 2 }
    resolveRefresh?.()
    await first
  } finally {
    controller.dispose()
  }
})

test('非表示中はタイマーを解除し、表示復帰時に即時確認する', async () => {
  // Given: 可視状態を切り替えられるポーリング環境
  let visible = true
  let refreshCount = 0
  let clearTimerCount = 0
  let visibilityListener: (() => void) | undefined
  const state: AvailabilityState = {
    kind: 'unavailable',
    retryCount: 1,
    checkedAt: 1,
  }
  const controller = createAvailabilityPolling({
    refresh: async () => {
      refreshCount += 1
    },
    abort: () => undefined,
    environment: {
      getState: () => state,
      isVisible: () => visible,
      isOnline: () => true,
      setTimer: () => 1,
      clearTimer: () => {
        clearTimerCount += 1
      },
      addVisibilityListener: (listener) => {
        visibilityListener = listener
        return () => {
          visibilityListener = undefined
        }
      },
      addOnlineListener: () => () => undefined,
      reload: () => undefined,
    },
  })

  try {
    controller.start()

    // When: タブを非表示にしてから表示へ戻す
    visible = false
    visibilityListener?.()
    visible = true
    visibilityListener?.()
    await Promise.resolve()
    await Promise.resolve()

    // Then: 予約済みタイマーを解除し、復帰時に1回だけ即時確認する
    assert.ok(clearTimerCount >= 1)
    assert.equal(refreshCount, 1)
  } finally {
    controller.dispose()
  }
})

test('オンライン復帰時に表示中なら即時確認する', async () => {
  // Given: オフラインから復帰できる表示中のポーリング環境
  let online = false
  let refreshCount = 0
  let onlineListener: (() => void) | undefined
  const state: AvailabilityState = {
    kind: 'unavailable',
    retryCount: 1,
    checkedAt: 1,
  }
  const controller = createAvailabilityPolling({
    refresh: async () => {
      refreshCount += 1
    },
    abort: () => undefined,
    environment: {
      getState: () => state,
      isVisible: () => true,
      isOnline: () => online,
      setTimer: () => 1,
      clearTimer: () => undefined,
      addVisibilityListener: () => () => undefined,
      addOnlineListener: (listener) => {
        onlineListener = listener
        return () => {
          onlineListener = undefined
        }
      },
      reload: () => undefined,
    },
  })

  try {
    controller.start()

    // When: ブラウザーがオンラインへ復帰する
    online = true
    onlineListener?.()
    await Promise.resolve()
    await Promise.resolve()

    // Then: 待機時間を待たずに1回だけ状態を確認する
    assert.equal(refreshCount, 1)
  } finally {
    controller.dispose()
  }
})

test('破棄時にタイマーとイベント購読を解除し進行中処理を中止する', async () => {
  // Given: タイマーとイベント購読が登録された接続不能状態
  let refreshCount = 0
  let abortCount = 0
  let clearTimerCount = 0
  let timerCallback: (() => void) | undefined
  let visibilityListener: (() => void) | undefined
  let onlineListener: (() => void) | undefined
  const state: AvailabilityState = {
    kind: 'unavailable',
    retryCount: 1,
    checkedAt: 1,
  }
  const controller = createAvailabilityPolling({
    refresh: async () => {
      refreshCount += 1
    },
    abort: () => {
      abortCount += 1
    },
    environment: {
      getState: () => state,
      isVisible: () => true,
      isOnline: () => true,
      setTimer: (callback) => {
        timerCallback = callback
        return 1
      },
      clearTimer: () => {
        clearTimerCount += 1
      },
      addVisibilityListener: (listener) => {
        visibilityListener = listener
        return () => {
          visibilityListener = undefined
        }
      },
      addOnlineListener: (listener) => {
        onlineListener = listener
        return () => {
          onlineListener = undefined
        }
      },
      reload: () => undefined,
    },
  })
  controller.start()
  const scheduledCallback = timerCallback

  // When: コントローラーを破棄し、破棄済みタイマーのcallbackを呼ぶ
  controller.dispose()
  scheduledCallback?.()
  await Promise.resolve()

  // Then: 全リソースが1回だけ解放され、状態確認は再開しない
  assert.equal(clearTimerCount, 1)
  assert.equal(abortCount, 1)
  assert.equal(visibilityListener, undefined)
  assert.equal(onlineListener, undefined)
  assert.equal(refreshCount, 0)

  controller.dispose()
  assert.equal(clearTimerCount, 1)
  assert.equal(abortCount, 1)
})

test('画面専用の確認間隔を使用できる', () => {
  // Given: 通常稼働中だけ60秒間隔を返す画面専用設定
  const state: AvailabilityState = {
    kind: 'operational',
    updatedAt: '2026-07-26T00:00:00Z',
    checkedAt: 1,
  }
  const scheduledDelays: number[] = []
  const controller = createAvailabilityPolling({
    refresh: async () => undefined,
    abort: () => undefined,
    getPollingDelayMs: (currentState) => (currentState.kind === 'operational' ? 60_000 : null),
    environment: {
      getState: () => state,
      isVisible: () => true,
      isOnline: () => true,
      setTimer: (_callback, delay) => {
        scheduledDelays.push(delay)
        return scheduledDelays.length
      },
      clearTimer: () => undefined,
      addVisibilityListener: () => () => undefined,
      addOnlineListener: () => () => undefined,
      reload: () => undefined,
    },
  })

  try {
    // When: controllerを開始する
    controller.start()

    // Then: 差し替えた60秒間隔で予約する
    assert.deepEqual(scheduledDelays, [60_000])
  } finally {
    controller.dispose()
  }
})

test('確認間隔がないcontrollerは表示・オンライン復帰時も通信しない', async () => {
  // Given: 現在画面では確認間隔を返さないポーリング環境
  let refreshCount = 0
  let visibilityListener: (() => void) | undefined
  let onlineListener: (() => void) | undefined
  const state: AvailabilityState = {
    kind: 'operational',
    updatedAt: '2026-07-26T00:00:00Z',
    checkedAt: 1,
  }
  const controller = createAvailabilityPolling({
    refresh: async () => {
      refreshCount += 1
    },
    abort: () => undefined,
    getPollingDelayMs: () => null,
    environment: {
      getState: () => state,
      isVisible: () => true,
      isOnline: () => true,
      setTimer: () => 1,
      clearTimer: () => undefined,
      addVisibilityListener: (listener) => {
        visibilityListener = listener
        return () => undefined
      },
      addOnlineListener: (listener) => {
        onlineListener = listener
        return () => undefined
      },
      reload: () => undefined,
    },
  })

  try {
    controller.start()

    // When: 表示復帰とオンライン復帰イベントを受け取る
    visibilityListener?.()
    onlineListener?.()
    await Promise.resolve()

    // Then: 現在画面の担当外なので状態確認しない
    assert.equal(refreshCount, 0)
  } finally {
    controller.dispose()
  }
})

test('メンテナンスまたは接続不能から通常稼働へ戻ると現在URLを再読込する', () => {
  // Given: メンテナンス状態で開始したポーリング
  let state: AvailabilityState = {
    kind: 'maintenance',
    comment: '更新中',
    updatedAt: null,
    retryAfterSeconds: 60,
    checkedAt: 1,
  }
  let reloadCount = 0
  const controller = createAvailabilityPolling({
    refresh: async () => undefined,
    abort: () => undefined,
    environment: {
      getState: () => state,
      isVisible: () => true,
      isOnline: () => true,
      setTimer: () => 1,
      clearTimer: () => undefined,
      addVisibilityListener: () => () => undefined,
      addOnlineListener: () => () => undefined,
      reload: () => {
        reloadCount += 1
      },
    },
  })
  controller.start()

  try {
    // When: APIが通常稼働へ復帰した状態を同期する
    state = { kind: 'operational', updatedAt: '2026-07-26T00:00:00Z', checkedAt: 2 }
    controller.sync()
    controller.sync()

    // Then: 現在URLの再読込は1回だけ要求される
    assert.equal(reloadCount, 1)
  } finally {
    controller.dispose()
  }
})
