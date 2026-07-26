import { createRoot } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS } from '../constants/maintenance'
import type { SystemStatusDTO } from '../types/api'

/** アプリが表示判断に利用するAPI可用性状態。 */
export type AvailabilityState =
  | {
      kind: 'checking'
    }
  | {
      kind: 'operational'
      updatedAt: string
      checkedAt: number
    }
  | {
      kind: 'maintenance'
      comment: string
      updatedAt: string | null
      retryAfterSeconds: number
      checkedAt: number
    }
  | {
      kind: 'unavailable'
      retryCount: number
      checkedAt: number
    }

type AvailabilityStore = {
  state: AvailabilityState
}

type MaintenanceDetectedListener = () => void
type SystemStatusAppliedListener = (state: AvailabilityState) => void

const maintenanceDetectedListeners = new Set<MaintenanceDetectedListener>()
const systemStatusAppliedListeners = new Set<SystemStatusAppliedListener>()

/** アプリ全体で共有する現在のAPI可用性状態と更新関数。 */
export const [availability, setAvailability] = createRoot(() =>
  createStore<AvailabilityStore>({ state: { kind: 'checking' } })
)

/**
 * 可用性状態をプロパティ残存なく置き換える。
 *
 * @param state - 次に保持する可用性状態。
 * @returns なし。
 */
const replaceAvailabilityState = (state: AvailabilityState): void => {
  setAvailability('state', reconcile(state))
}

/**
 * APIの状態レスポンスをアプリ共通の可用性状態へ反映する。
 *
 * @param status - APIが返したシステム状態。
 * @param checkedAt - 状態確認を完了した時刻。
 * @param retryAfterSeconds - メンテナンス中の次回確認までの秒数。
 * @returns 反映後の可用性状態。
 */
export const applySystemStatus = (
  status: SystemStatusDTO,
  checkedAt: number = Date.now(),
  retryAfterSeconds: number = MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS
): AvailabilityState => {
  const nextState: AvailabilityState =
    status.status === 'operational'
      ? {
          kind: 'operational',
          updatedAt: status.updated_at,
          checkedAt,
        }
      : {
          kind: 'maintenance',
          comment: status.comment,
          updatedAt: status.updated_at,
          retryAfterSeconds,
          checkedAt,
        }

  replaceAvailabilityState(nextState)
  for (const listener of systemStatusAppliedListeners) {
    listener(nextState)
  }
  return nextState
}

/**
 * API接続不能を記録する。既知のメンテナンス表示は一時的な確認失敗で解除しない。
 *
 * @param checkedAt - 接続失敗を確認した時刻。
 * @returns 反映後、または維持した可用性状態。
 */
export const markAvailabilityUnavailable = (checkedAt: number = Date.now()): AvailabilityState => {
  const current = availability.state
  if (current.kind === 'maintenance') {
    return current
  }

  const nextState: AvailabilityState = {
    kind: 'unavailable',
    retryCount: current.kind === 'unavailable' ? current.retryCount + 1 : 1,
    checkedAt,
  }
  replaceAvailabilityState(nextState)
  return nextState
}

/**
 * 通常APIでメンテナンス専用503を受けたことを即時反映する。
 *
 * @param retryAfterSeconds - Retry-Afterから取得した次回確認までの秒数。
 * @param checkedAt - 503を受信した時刻。
 * @returns 反映後のメンテナンス状態。
 */
export const markMaintenanceDetected = (
  retryAfterSeconds: number = MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS,
  checkedAt: number = Date.now()
): Extract<AvailabilityState, { kind: 'maintenance' }> => {
  const current = availability.state
  const nextState: Extract<AvailabilityState, { kind: 'maintenance' }> = {
    kind: 'maintenance',
    comment: current.kind === 'maintenance' ? current.comment : '',
    updatedAt: current.kind === 'maintenance' ? current.updatedAt : null,
    retryAfterSeconds,
    checkedAt,
  }

  replaceAvailabilityState(nextState)
  for (const listener of maintenanceDetectedListeners) {
    listener()
  }
  return nextState
}

/**
 * メンテナンス専用503の検知通知を購読する。
 *
 * @param listener - 検知時に呼び出す処理。
 * @returns 購読を解除する関数。
 */
export const subscribeMaintenanceDetected = (
  listener: MaintenanceDetectedListener
): (() => void) => {
  maintenanceDetectedListeners.add(listener)
  return () => {
    maintenanceDetectedListeners.delete(listener)
  }
}

/**
 * 公開状態APIの成功結果がStoreへ反映された通知を購読する。
 *
 * @param listener - APIで確認済みの最新状態を受け取る処理。
 * @returns 購読を解除する関数。
 */
export const subscribeSystemStatusApplied = (
  listener: SystemStatusAppliedListener
): (() => void) => {
  systemStatusAppliedListeners.add(listener)
  return () => {
    systemStatusAppliedListeners.delete(listener)
  }
}

/**
 * 初回確認前の状態へ戻す。主にテストとアプリ初期化で利用する。
 *
 * @returns なし。
 */
export const resetAvailability = (): void => {
  replaceAvailabilityState({ kind: 'checking' })
}
