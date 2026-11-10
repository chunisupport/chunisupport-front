import { API_TOKEN_NAME_MAX_LENGTH } from './ApiTokenSettings.constants.ts'

const API_TOKEN_NAME_ERROR_CODES = new Set(['invalid_api_token_name', 'api_token_name_conflict'])

/**
 * APIトークン名の前後空白を除去する。
 *
 * @param value - 入力されたAPIトークン名。
 * @returns 前後空白を除去したAPIトークン名。
 */
export const normalizeApiTokenName = (value: string): string => value.trim()

/**
 * APIトークン名がAPIの値オブジェクトと同じ制約を満たすか判定する。
 *
 * @param value - 判定対象のAPIトークン名。
 * @returns 前後空白除去後に1〜50文字かつ制御文字を含まない場合はtrue。
 */
export const isValidApiTokenName = (value: string): boolean => {
  const normalized = normalizeApiTokenName(value)
  const characterCount = Array.from(normalized).length
  return (
    characterCount >= 1 &&
    characterCount <= API_TOKEN_NAME_MAX_LENGTH &&
    !/\p{Cc}/u.test(normalized)
  )
}

/**
 * APIエラーがAPIトークン名の入力内容に紐づくものか判定する。
 *
 * @param error - API呼び出しで捕捉したエラー。
 * @returns 名前不正または名前重複エラーの場合はtrue。
 */
export const isApiTokenNameError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const code = (error as { code?: unknown }).code
  return typeof code === 'string' && API_TOKEN_NAME_ERROR_CODES.has(code)
}
