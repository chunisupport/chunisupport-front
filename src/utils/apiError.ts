type ApiErrorLike = {
  code?: string
  status?: number
}

const NOT_FOUND_ERROR_CODES = [
  'user_not_found',
  'song_not_found',
  'resource_not_found',
  'not_found',
]

/**
 * unknown の値から API エラーとして参照できる形を取り出す。
 *
 * @param error - 判定対象のエラー値。
 * @returns API エラーの status/code を持つ可能性がある値。
 */
const toApiErrorLike = (error: unknown): ApiErrorLike | null =>
  typeof error === 'object' && error !== null ? (error as ApiErrorLike) : null

/**
 * API エラーが 404 相当かを判定する。
 *
 * @param error - 判定対象のエラー値。
 * @returns 404 相当の場合は true。
 */
export const isNotFoundApiError = (error: unknown): boolean => {
  const apiError = toApiErrorLike(error)
  return apiError?.status === 404 || NOT_FOUND_ERROR_CODES.includes(apiError?.code ?? '')
}

/**
 * パスパラメータの表示ID取得が存在しないリソース相当かを判定する。
 * 形式不正の表示IDは存在しない曲を指定したものとみなし、404 相当として扱う。
 *
 * @param error - 判定対象のエラー値。
 * @returns 存在しないリソース相当の場合は true。
 */
export const isNotFoundOrInvalidDisplayIdApiError = (error: unknown): boolean => {
  if (isNotFoundApiError(error)) return true
  return toApiErrorLike(error)?.code === 'validation_failed'
}

/**
 * API エラーが 403 相当かを判定する。
 *
 * @param error - 判定対象のエラー値。
 * @returns 403 相当の場合は true。
 */
export const isForbiddenApiError = (error: unknown): boolean => {
  const apiError = toApiErrorLike(error)
  return apiError?.status === 403 || apiError?.code === 'forbidden'
}
