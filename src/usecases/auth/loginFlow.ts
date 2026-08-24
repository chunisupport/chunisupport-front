import { ADMIN_PATH, EDITOR_PATH, MAINTENANCE_LOGIN_PATH } from '../../constants/routes.ts'
import type { AccountType } from '../../types/api.ts'
import { isMaintenanceStaff } from '../../utils/maintenanceRole.ts'
import { normalizeRoutePathname } from '../../utils/routePathname.ts'
import { resolvePostLoginRedirectPath } from './redirectPath.ts'

const INTERNAL_ERROR_CODE = 'maintenance_staff_required'
const REDIRECT_BASE_URL = 'https://app.local'

type ErrorLike = {
  code?: unknown
  error?: {
    code?: unknown
  }
}

export type MaintenanceLoginDestination =
  | {
      /** ログインを許可し、遷移できる状態 */
      kind: 'allowed'
      /** スタッフログイン後の遷移先 */
      path: string
    }
  | {
      /** スタッフ以外のためログインを拒否する状態 */
      kind: 'forbidden'
    }

/**
 * 不明なエラー値からAPIまたはFirebaseのエラーコードを取得する。
 *
 * @param error - ログイン処理で発生した不明なエラー値。
 * @returns 文字列のエラーコード。取得できない場合はnull。
 */
const getLoginErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null) return null

  const errorLike = error as ErrorLike
  if (typeof errorLike.code === 'string') return errorLike.code
  return typeof errorLike.error?.code === 'string' ? errorLike.error.code : null
}

/**
 * URLのパス部分がスタッフログイン画面自身を指すか判定する。
 *
 * @param path - 安全性を検証済みのアプリ内パス。
 * @returns スタッフログイン画面自身の場合はtrue。
 */
const isMaintenanceLoginPath = (path: string): boolean => {
  const pathname = new URL(path, REDIRECT_BASE_URL).pathname
  return normalizeRoutePathname(pathname) === MAINTENANCE_LOGIN_PATH
}

/**
 * Solid Routerのredirectクエリを単一の文字列へ正規化する。
 *
 * @param redirect - Solid Routerから取得したredirectクエリ値。
 * @returns 利用可能なredirect値。複数指定時は先頭を採用する。
 */
export const normalizeRedirectParam = (
  redirect: string | string[] | undefined
): string | undefined => (Array.isArray(redirect) ? redirect[0] : redirect)

/**
 * Google認証直後のバックエンドログイン失敗が未登録ユーザー扱いか判定する。
 *
 * @param error - ログイン処理で発生した不明なエラー値。
 * @returns 通常の新規登録画面へ進めるエラーの場合はtrue。
 */
export const isUnregisteredLoginError = (error: unknown): boolean => {
  const code = getLoginErrorCode(error)
  return code === 'user_not_found' || code === 'invalid_token'
}

/**
 * ログイン失敗が、失効・不正トークンまたは未登録を区別できないAPIエラーか判定する。
 *
 * @param error - ログイン処理で発生した不明なエラー値。
 * @returns invalid_tokenエラーの場合はtrue。
 */
export const isInvalidTokenLoginError = (error: unknown): boolean =>
  getLoginErrorCode(error) === 'invalid_token'

/**
 * ログイン失敗がメンテナンス中の一般ユーザー拒否を表すか判定する。
 *
 * @param error - ログイン処理で発生した不明なエラー値。
 * @returns maintenance_modeエラーの場合はtrue。
 */
export const isMaintenanceModeLoginError = (error: unknown): boolean =>
  getLoginErrorCode(error) === 'maintenance_mode'

/**
 * スタッフ以外のログイン成功を共通フォームの失敗処理へ渡す内部エラーを作る。
 *
 * @returns スタッフ専用画面で拒否したことを識別できるエラー。
 */
export const createMaintenanceStaffRequiredError = (): Error & { code: string } =>
  Object.assign(new Error(INTERNAL_ERROR_CODE), { code: INTERNAL_ERROR_CODE })

/**
 * エラーがスタッフ以外のログイン成功を拒否した内部エラーか判定する。
 *
 * @param error - ログイン処理で発生した不明なエラー値。
 * @returns スタッフ要件による拒否の場合はtrue。
 */
export const isMaintenanceStaffRequiredError = (error: unknown): boolean =>
  getLoginErrorCode(error) === INTERNAL_ERROR_CODE

/**
 * スタッフのアカウント種別とredirectクエリからログイン後の遷移先を決定する。
 *
 * @param accountType - APIが返したログインユーザーのアカウント種別。
 * @param redirectPath - URLから取得した任意のredirectクエリ。
 * @returns 許可された遷移先、またはスタッフ以外を表す拒否結果。
 */
export const resolveMaintenanceLoginDestination = (
  accountType: AccountType,
  redirectPath?: string
): MaintenanceLoginDestination => {
  if (!isMaintenanceStaff(accountType)) {
    return { kind: 'forbidden' }
  }

  const safeRedirectPath = resolvePostLoginRedirectPath(redirectPath)
  if (safeRedirectPath && !isMaintenanceLoginPath(safeRedirectPath)) {
    return { kind: 'allowed', path: safeRedirectPath }
  }

  return {
    kind: 'allowed',
    path: accountType === 'ADMIN' ? ADMIN_PATH : EDITOR_PATH,
  }
}
