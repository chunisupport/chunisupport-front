import { MAINTENANCE_LOGIN_PATH } from '../../constants/routes'
import type { AuthStatus } from '../../stores/authSession'
import type { AvailabilityState } from '../../stores/availability'
import type { AccountType } from '../../types/api'
import { isMaintenanceStaff } from '../../utils/maintenanceRole'
import { normalizeRoutePathname } from '../../utils/routePathname'

/** アプリ可用性ゲートが表示する画面種別 */
export type AvailabilityView = 'application' | 'loading' | 'maintenance' | 'unavailable'

type ResolveAvailabilityViewOptions = {
  pathname: string
  state: AvailabilityState
  isBootstrapping: boolean
  accountType?: AccountType
}

type ResolveMaintenanceSessionOptions = {
  authStatus: AuthStatus
  hasAuthenticatedUser: boolean
  hasRestored: boolean
}

/**
 * メンテナンス中に利用する認証判定が完了しているか判定する。
 *
 * @param options - 現在の認証状態、既知ユーザーの有無、当該期間の復元完了状態。
 * @returns 既知の認証済みユーザーを利用できるか、復元処理が完了済みならtrue。
 */
export const isMaintenanceSessionResolved = (options: ResolveMaintenanceSessionOptions): boolean =>
  options.hasRestored || (options.authStatus === 'authenticated' && options.hasAuthenticatedUser)

/**
 * API可用性、認証復元状態、現在パスから表示対象を決定する。
 *
 * @param options - 現在パス、可用性状態、認証復元中か、アカウント種別。
 * @returns アプリ本体、確認中、メンテナンス、接続不能のいずれか。
 */
export const resolveAvailabilityView = (
  options: ResolveAvailabilityViewOptions
): AvailabilityView => {
  if (normalizeRoutePathname(options.pathname) === MAINTENANCE_LOGIN_PATH) {
    return 'application'
  }
  if (options.isBootstrapping || options.state.kind === 'checking') {
    return 'loading'
  }
  if (options.state.kind === 'operational') {
    return 'application'
  }
  if (options.state.kind === 'unavailable') {
    return 'unavailable'
  }
  return isMaintenanceStaff(options.accountType) ? 'application' : 'maintenance'
}
