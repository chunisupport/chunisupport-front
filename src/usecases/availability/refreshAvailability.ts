import { MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS } from '../../constants/maintenance'
import {
  type AvailabilityState,
  applySystemStatus,
  availability,
  markAvailabilityUnavailable,
} from '../../stores/availability'
import type { SystemStatusDTO } from '../../types/api'

/** 状態確認処理の結果。 */
export type AvailabilityRefreshResult =
  | {
      type: 'success'
      state: AvailabilityState
    }
  | {
      type: 'failure'
      state: AvailabilityState
      error: unknown
    }
  | {
      type: 'aborted'
      state: AvailabilityState
    }

type FetchSystemStatus = (signal?: AbortSignal) => Promise<SystemStatusDTO>

type AvailabilityRefresherDependencies = {
  fetchStatus: FetchSystemStatus
  now?: () => number
}

/**
 * 状態確認APIを必要になるまで読み込まずに実行する。
 *
 * @param signal - 呼び出しを中止するAbortSignal。
 * @returns APIが返したシステム状態。
 */
const fetchDefaultSystemStatus: FetchSystemStatus = async (signal) => {
  const { fetchSystemStatus } = await import('../../api/maintenanceStatus')
  return fetchSystemStatus(signal)
}

/** 状態確認時に上書きできるメンテナンス再確認間隔。 */
export type RefreshAvailabilityOptions = {
  retryAfterSeconds?: number
}

/**
 * 同時呼び出しを一つにまとめ、キャンセル可能な可用性確認処理を作成する。
 *
 * @param dependencies - 状態取得関数と現在時刻の取得関数。
 * @returns 状態確認、進行中処理の中止を行う関数群。
 */
export const createAvailabilityRefresher = (
  dependencies: AvailabilityRefresherDependencies
): {
  refresh: (options?: RefreshAvailabilityOptions) => Promise<AvailabilityRefreshResult>
  abort: () => void
} => {
  const now = dependencies.now ?? Date.now
  let abortController: AbortController | null = null
  let inFlight: Promise<AvailabilityRefreshResult> | null = null

  /**
   * API状態を確認し、同時呼び出しでは進行中のPromiseを共有する。
   *
   * @param options - メンテナンス中の再確認間隔。
   * @returns 状態確認の成功、失敗、キャンセル結果。
   */
  const refresh = (
    options: RefreshAvailabilityOptions = {}
  ): Promise<AvailabilityRefreshResult> => {
    if (inFlight) {
      return inFlight
    }

    abortController = new AbortController()
    const activeController = abortController

    const request = dependencies
      .fetchStatus(activeController.signal)
      .then((status): AvailabilityRefreshResult => {
        if (activeController.signal.aborted) {
          return { type: 'aborted', state: availability.state }
        }

        const current = availability.state
        const retryAfterSeconds =
          options.retryAfterSeconds ??
          (current.kind === 'maintenance'
            ? current.retryAfterSeconds
            : MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS)
        const state = applySystemStatus(status, now(), retryAfterSeconds)
        return { type: 'success', state }
      })
      .catch((error: unknown): AvailabilityRefreshResult => {
        if (activeController.signal.aborted) {
          return { type: 'aborted', state: availability.state }
        }

        const state = markAvailabilityUnavailable(now())
        return { type: 'failure', state, error }
      })
      .finally(() => {
        if (abortController === activeController) {
          abortController = null
        }
        if (inFlight === request) {
          inFlight = null
        }
      })

    inFlight = request
    return request
  }

  /**
   * 進行中の状態確認があれば中止する。
   *
   * @returns なし。
   */
  const abort = (): void => {
    abortController?.abort()
  }

  return {
    refresh,
    abort,
  }
}

const defaultRefresher = createAvailabilityRefresher({ fetchStatus: fetchDefaultSystemStatus })

/**
 * APIの現在状態を取得して共通可用性ストアへ反映する。
 *
 * @param options - メンテナンス中の再確認間隔。
 * @returns 状態確認結果。
 */
export const refreshAvailability = (
  options?: RefreshAvailabilityOptions
): Promise<AvailabilityRefreshResult> => defaultRefresher.refresh(options)

/**
 * 進行中の共通可用性確認を中止する。
 *
 * @returns なし。
 */
export const abortAvailabilityRefresh = (): void => {
  defaultRefresher.abort()
}
