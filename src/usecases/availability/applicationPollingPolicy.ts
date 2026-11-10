import { MAINTENANCE_POLL_INTERVAL_MS } from '../../constants/maintenance'
import { ADMIN_MAINTENANCE_PATH } from '../../constants/routes'
import type { AvailabilityState } from '../../stores/availability'
import { normalizeRoutePathname } from '../../utils/routePathname'
import { getAvailabilityPollingDelayMs } from './availabilityPolling'

/**
 * アプリ全体の可用性状態と現在画面に対応する次回確認間隔を返す。
 *
 * @param state - 現在のAPI可用性状態。
 * @param pathname - ブラウザーの現在パス。
 * @returns 次回確認までのミリ秒。自動確認不要の場合はnull。
 */
export const getApplicationAvailabilityPollingDelayMs = (
  state: AvailabilityState,
  pathname: string
): number | null => {
  if (state.kind === 'operational' && normalizeRoutePathname(pathname) === ADMIN_MAINTENANCE_PATH) {
    return MAINTENANCE_POLL_INTERVAL_MS
  }

  return getAvailabilityPollingDelayMs(state)
}
