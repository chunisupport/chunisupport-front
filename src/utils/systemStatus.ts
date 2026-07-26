import type { SystemStatusDTO } from '../types/api'

const INVALID_SYSTEM_STATUS_RESPONSE_MESSAGE = 'システム状態のレスポンス形式が不正です'
const RFC3339_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

/**
 * API日時がRFC3339形式かつJavaScriptで解析可能かを判定する。
 *
 * @param value - 検証する日時文字列。
 * @returns RFC3339日時として扱える場合はtrue。
 */
const isValidSystemStatusUpdatedAt = (value: string): boolean =>
  RFC3339_DATE_TIME_PATTERN.test(value) && Number.isFinite(Date.parse(value))

/**
 * APIレスポンスをシステム状態DTOとして検証する。
 *
 * @param value - APIから取得した未検証の値。
 * @returns 検証済みのシステム状態DTO。
 * @throws レスポンス形式がAPI仕様と異なる場合。
 */
export const parseSystemStatusDTO = (value: unknown): SystemStatusDTO => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('status' in value) ||
    (value.status !== 'operational' && value.status !== 'maintenance') ||
    !('comment' in value) ||
    typeof value.comment !== 'string' ||
    !('updated_at' in value) ||
    typeof value.updated_at !== 'string' ||
    !isValidSystemStatusUpdatedAt(value.updated_at)
  ) {
    throw new Error(INVALID_SYSTEM_STATUS_RESPONSE_MESSAGE)
  }

  return {
    status: value.status,
    comment: value.comment,
    updated_at: value.updated_at,
  }
}
