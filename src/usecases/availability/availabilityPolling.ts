import { API_UNAVAILABLE_RETRY_DELAYS_MS } from '../../constants/maintenance'
import { type AvailabilityState, availability } from '../../stores/availability'

type TimerHandle = number
type EventListener = () => void

type AvailabilityPollingEnvironment = {
  getState: () => AvailabilityState
  isVisible: () => boolean
  isOnline: () => boolean
  setTimer: (callback: () => void, delay: number) => TimerHandle
  clearTimer: (timer: TimerHandle) => void
  addVisibilityListener: (listener: EventListener) => () => void
  addOnlineListener: (listener: EventListener) => () => void
  reload: () => void
}

type CreateAvailabilityPollingOptions<TResult> = {
  refresh: () => Promise<TResult>
  abort: () => void
  environment?: AvailabilityPollingEnvironment
  getPollingDelayMs?: (state: AvailabilityState) => number | null
}

/** 可用性ポーリングを操作するコントローラー */
export type AvailabilityPollingController<TResult = unknown> = {
  start: () => void
  sync: () => void
  refreshNow: () => Promise<TResult | null>
  dispose: () => void
}

/**
 * 現在の可用性状態に対応する次回確認までの時間を返す。
 *
 * @param state - 現在の可用性状態。
 * @returns 次回確認までのミリ秒。自動確認不要の場合はnull。
 */
export const getAvailabilityPollingDelayMs = (state: AvailabilityState): number | null => {
  if (state.kind === 'maintenance') {
    return Math.max(1, state.retryAfterSeconds) * 1_000
  }

  if (state.kind === 'unavailable') {
    const delayIndex = Math.min(
      Math.max(0, state.retryCount - 1),
      API_UNAVAILABLE_RETRY_DELAYS_MS.length - 1
    )
    return API_UNAVAILABLE_RETRY_DELAYS_MS[delayIndex]
  }

  return null
}

/**
 * ブラウザーで利用するポーリング環境を作成する。
 *
 * @returns 可視状態、オンライン状態、タイマー、イベント購読を提供する環境。
 */
const createBrowserPollingEnvironment = (): AvailabilityPollingEnvironment => ({
  getState: () => availability.state,
  isVisible: () => document.visibilityState !== 'hidden',
  isOnline: () => navigator.onLine,
  setTimer: (callback, delay) => window.setTimeout(callback, delay),
  clearTimer: (timer) => window.clearTimeout(timer),
  addVisibilityListener: (listener) => {
    document.addEventListener('visibilitychange', listener)
    return () => document.removeEventListener('visibilitychange', listener)
  },
  addOnlineListener: (listener) => {
    window.addEventListener('online', listener)
    return () => window.removeEventListener('online', listener)
  },
  reload: () => window.location.reload(),
})

/**
 * ページ可視性とオンライン状態を考慮した可用性ポーリングを作成する。
 *
 * @param options - 状態確認処理、中止処理、間隔・復旧動作・実行環境の差し替え。
 * @returns 開始、同期、即時確認、破棄を行うコントローラー。
 */
export const createAvailabilityPolling = <TResult>(
  options: CreateAvailabilityPollingOptions<TResult>
): AvailabilityPollingController<TResult> => {
  const environment = options.environment ?? createBrowserPollingEnvironment()
  const refresh = options.refresh
  const abort = options.abort
  const resolvePollingDelayMs = options.getPollingDelayMs ?? getAvailabilityPollingDelayMs

  let timer: TimerHandle | null = null
  let inFlight: Promise<TResult> | null = null
  let started = false
  let disposed = false
  let previousKind = environment.getState().kind
  let recoveryReloaded = false

  /**
   * 予約済みの次回状態確認タイマーを解除する。
   *
   * @returns なし。
   */
  const clearScheduledRefresh = (): void => {
    if (timer !== null) {
      environment.clearTimer(timer)
      timer = null
    }
  }

  /**
   * 現在状態に対応する次回確認を、実行可能な場合だけ予約する。
   *
   * @returns なし。
   */
  const schedule = (): void => {
    clearScheduledRefresh()
    if (
      !started ||
      disposed ||
      inFlight !== null ||
      !environment.isVisible() ||
      !environment.isOnline()
    ) {
      return
    }

    const delay = resolvePollingDelayMs(environment.getState())
    if (delay === null) {
      return
    }

    timer = environment.setTimer(() => {
      timer = null
      void refreshNow()
    }, delay)
  }

  /**
   * 外部で更新された可用性状態をタイマーと復帰処理へ同期する。
   *
   * @returns なし。
   */
  const sync = (): void => {
    if (disposed) {
      return
    }

    const currentKind = environment.getState().kind
    const recovered =
      currentKind === 'operational' &&
      (previousKind === 'maintenance' || previousKind === 'unavailable')
    previousKind = currentKind

    if (recovered && !recoveryReloaded) {
      recoveryReloaded = true
      clearScheduledRefresh()
      environment.reload()
      return
    }

    schedule()
  }

  /**
   * 可視かつオンラインの場合に、重複しない即時状態確認を行う。
   *
   * @returns 状態確認結果。実行できない場合はnull。
   */
  const refreshNow = (): Promise<TResult | null> => {
    if (disposed || !environment.isVisible() || !environment.isOnline()) {
      return Promise.resolve(null)
    }
    if (inFlight) {
      return inFlight
    }

    clearScheduledRefresh()
    const request = refresh()
      .then((result) => {
        sync()
        return result
      })
      .finally(() => {
        if (inFlight === request) {
          inFlight = null
        }
        schedule()
      })
    inFlight = request
    return request
  }

  /**
   * タブの可視状態変化に応じてタイマー停止または即時確認を行う。
   *
   * @returns なし。
   */
  const handleVisibilityChange = (): void => {
    if (!environment.isVisible()) {
      clearScheduledRefresh()
      return
    }
    if (resolvePollingDelayMs(environment.getState()) !== null) {
      void refreshNow()
    }
  }

  /**
   * オンライン復帰時に、表示中のタブだけ即時確認する。
   *
   * @returns なし。
   */
  const handleOnline = (): void => {
    if (environment.isVisible() && resolvePollingDelayMs(environment.getState()) !== null) {
      void refreshNow()
    }
  }

  const removeVisibilityListener = environment.addVisibilityListener(handleVisibilityChange)
  const removeOnlineListener = environment.addOnlineListener(handleOnline)

  return {
    start: () => {
      if (started || disposed) {
        return
      }
      started = true
      previousKind = environment.getState().kind
      schedule()
    },
    sync,
    refreshNow,
    dispose: () => {
      if (disposed) {
        return
      }
      disposed = true
      clearScheduledRefresh()
      abort()
      removeVisibilityListener()
      removeOnlineListener()
    },
  }
}
