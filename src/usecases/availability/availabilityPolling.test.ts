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
  const clearedTimers: number[] = []
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
      clearTimer: (timer) => {
        clearedTimers.push(timer)
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

    // When: タブを非表示にする
    visible = false
    visibilityListener?.()

    // Then: 表示復帰を待たず、予約済みタイマーを解除し通信しない
    assert.deepEqual(clearedTimers, [1])
    assert.equal(refreshCount, 0)

    // When: 表示へ戻す
    visible = true
    visibilityListener?.()
    await Promise.resolve()
    await Promise.resolve()

    // Then: 予約済みタイマーを解除し、復帰時に1回だけ即時確認する
    assert.deepEqual(clearedTimers, [1])
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

test('破棄時にタイマーとイベント購読を解除し、解除済みタイマーから通信しない', async () => {
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

for (const completedKind of ['operational', 'unavailable'] as const) {
  test(`進行中の通信を破棄時に中止し、遅れて${completedKind}になってもタイマーやリロードを再開しない`, async () => {
    // Given: 未解決の通信を開始できる接続不能状態
    let state: AvailabilityState = { kind: 'unavailable', retryCount: 1, checkedAt: 1 }
    let resolveRefresh: (() => void) | undefined
    const pending = new Promise<void>((resolve) => {
      resolveRefresh = resolve
    })
    const abortController = new AbortController()
    let requestAborted = false
    let refreshCount = 0
    let timerCount = 0
    let reloadCount = 0
    const controller = createAvailabilityPolling({
      refresh: () => {
        refreshCount += 1
        abortController.signal.addEventListener(
          'abort',
          () => {
            requestAborted = true
          },
          { once: true }
        )
        return pending
      },
      abort: () => abortController.abort(),
      environment: {
        getState: () => state,
        isVisible: () => true,
        isOnline: () => true,
        setTimer: () => ++timerCount,
        clearTimer: () => undefined,
        addVisibilityListener: () => () => undefined,
        addOnlineListener: () => () => undefined,
        reload: () => {
          reloadCount += 1
        },
      },
    })
    controller.start()
    const request = controller.refreshNow()
    assert.equal(refreshCount, 1)
    assert.equal(requestAborted, false)

    // When: 進行中に破棄する
    controller.dispose()

    // Then: 進行中処理の中止が通知される
    assert.equal(requestAborted, true)

    // When: 中止通知後も通信が遅れて完了する
    state =
      completedKind === 'operational'
        ? { kind: 'operational', updatedAt: '2026-07-26T00:00:00Z', checkedAt: 2 }
        : { kind: 'unavailable', retryCount: 2, checkedAt: 2 }
    resolveRefresh?.()
    await request

    // Then: 復旧時のリロードも、接続不能時の再試行予約も起きない
    assert.equal(reloadCount, 0)
    assert.equal(timerCount, 1)

    // When: 再試行が必要な状態でも、破棄後の同期・開始・即時確認を要求する
    state = { kind: 'unavailable', retryCount: 2, checkedAt: 3 }
    controller.sync()
    controller.start()
    await controller.refreshNow()

    // Then: 通信もタイマーも再開しない
    assert.equal(refreshCount, 1)
    assert.equal(timerCount, 1)
  })
}

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

test('接続不能から通常稼働へ戻ると現在URLを再読込する', () => {
  // Given: 接続不能状態で開始したポーリング
  let state: AvailabilityState = { kind: 'unavailable', retryCount: 1, checkedAt: 1 }
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

    // Then: 現在URLの再読込を1回だけ要求する
    assert.equal(reloadCount, 1)
  } finally {
    controller.dispose()
  }
})

test('復旧条件を満たさない同期では再読込しない', () => {
  // Given: 通常稼働中で開始したポーリング
  const state: AvailabilityState = {
    kind: 'operational',
    updatedAt: '2026-07-26T00:00:00Z',
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
    // When: 通常稼働のまま同期する
    controller.sync()

    // Then: 再読込しない
    assert.equal(reloadCount, 0)
  } finally {
    controller.dispose()
  }
})

test('二度目の復旧では再読込しない', () => {
  // Given: メンテナンスから復旧して再読込済みのポーリング
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
    // When: 一度復旧して再びメンテナンスから復旧する
    state = { kind: 'operational', updatedAt: '2026-07-26T00:00:00Z', checkedAt: 2 }
    controller.sync()
    state = {
      kind: 'maintenance',
      comment: '更新中',
      updatedAt: null,
      retryAfterSeconds: 60,
      checkedAt: 3,
    }
    controller.sync()
    state = { kind: 'operational', updatedAt: '2026-07-26T00:00:00Z', checkedAt: 4 }
    controller.sync()

    // Then: 初回復旧時の1回だけ再読込する
    assert.equal(reloadCount, 1)
  } finally {
    controller.dispose()
  }
})

test('非表示またはオフラインの即時確認は通信せずnullを返す', async () => {
  // Given: 非表示だがオンラインの環境と表示中だがオフラインの環境
  const createController = (visible: boolean, online: boolean, onRefresh: () => void) =>
    createAvailabilityPolling({
      refresh: async () => {
        onRefresh()
      },
      abort: () => undefined,
      environment: {
        getState: () => ({ kind: 'unavailable', retryCount: 1, checkedAt: 1 }) as AvailabilityState,
        isVisible: () => visible,
        isOnline: () => online,
        setTimer: () => 1,
        clearTimer: () => undefined,
        addVisibilityListener: () => () => undefined,
        addOnlineListener: () => () => undefined,
        reload: () => undefined,
      },
    })
  let hiddenRefreshCount = 0
  let offlineRefreshCount = 0
  const hiddenController = createController(false, true, () => {
    hiddenRefreshCount += 1
  })
  const offlineController = createController(true, false, () => {
    offlineRefreshCount += 1
  })

  try {
    // When: 即時確認を要求する
    const hiddenResult = await hiddenController.refreshNow()
    const offlineResult = await offlineController.refreshNow()

    // Then: 通信せずnullを返す
    assert.equal(hiddenResult, null)
    assert.equal(offlineResult, null)
    assert.equal(hiddenRefreshCount, 0)
    assert.equal(offlineRefreshCount, 0)
  } finally {
    hiddenController.dispose()
    offlineController.dispose()
  }
})

test('完了後の即時確認は新しい通信を開始する', async () => {
  // Given: 完了を手動制御できる状態確認
  const state: AvailabilityState = {
    kind: 'maintenance',
    comment: '更新中',
    updatedAt: null,
    retryAfterSeconds: 60,
    checkedAt: 1,
  }
  let refreshCount = 0
  let resolveRefresh: (() => void) | undefined
  let pending = new Promise<void>((resolve) => {
    resolveRefresh = resolve
  })
  const controller = createAvailabilityPolling({
    refresh: () => {
      refreshCount += 1
      return pending
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
    // When: 初回通信を完了させて再度即時確認する
    const first = controller.refreshNow()
    resolveRefresh?.()
    await first
    pending = new Promise<void>((resolve) => {
      resolveRefresh = resolve
    })
    const second = controller.refreshNow()
    resolveRefresh?.()
    await second

    // Then: 通信は2回実行される
    assert.equal(refreshCount, 2)
    assert.notEqual(first, second)
  } finally {
    controller.dispose()
  }
})

test('開始済みの二重開始は再予約しない', () => {
  // Given: 接続不能状態で開始済みのポーリング
  let timerCount = 0
  let clearCount = 0
  const state: AvailabilityState = { kind: 'unavailable', retryCount: 1, checkedAt: 1 }
  const controller = createAvailabilityPolling({
    refresh: async () => undefined,
    abort: () => undefined,
    environment: {
      getState: () => state,
      isVisible: () => true,
      isOnline: () => true,
      setTimer: () => ++timerCount,
      clearTimer: () => {
        clearCount += 1
      },
      addVisibilityListener: () => () => undefined,
      addOnlineListener: () => () => undefined,
      reload: () => undefined,
    },
  })

  try {
    // When: 開始を2回要求する
    controller.start()
    controller.start()

    // Then: 初回の予約だけ残る
    assert.equal(timerCount, 1)
    assert.equal(clearCount, 0)
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
