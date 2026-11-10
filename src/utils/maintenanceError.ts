import { MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS } from '../constants/maintenance'

/**
 * HTTPレスポンスがAPIのメンテナンスモードエラーか判定する。
 *
 * @param status - HTTPステータスコード。
 * @param error - JSONとして読み取ったAPIエラーレスポンス。
 * @returns 503かつエラーコードがmaintenance_modeと完全一致する場合はtrue。
 */
export const isMaintenanceModeError = (status: number, error: unknown): boolean => {
  if (status !== 503 || typeof error !== 'object' || error === null || !('error' in error)) {
    return false
  }

  const detail = error.error
  return (
    typeof detail === 'object' &&
    detail !== null &&
    'code' in detail &&
    detail.code === 'maintenance_mode'
  )
}

/**
 * Retry-Afterヘッダーのdelta-secondsを正の秒数として読み取る。
 *
 * @param value - Retry-Afterヘッダー値。ヘッダーがない場合はnull。
 * @param fallbackSeconds - 値が不正な場合に使用する秒数。
 * @returns 正の安全な整数として解析できた秒数。不正な場合はフォールバック秒数。
 */
export const parseRetryAfterSeconds = (
  value: string | null,
  fallbackSeconds = MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS
): number => {
  const safeFallbackSeconds =
    Number.isSafeInteger(fallbackSeconds) && fallbackSeconds > 0
      ? fallbackSeconds
      : MAINTENANCE_DEFAULT_RETRY_AFTER_SECONDS
  const normalizedValue = value?.trim()
  if (!normalizedValue || !/^\d+$/.test(normalizedValue)) {
    return safeFallbackSeconds
  }

  const seconds = Number(normalizedValue)
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : safeFallbackSeconds
}
