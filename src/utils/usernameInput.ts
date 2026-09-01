/** ユーザー名の最小文字数。 */
export const USERNAME_MIN_LENGTH = 5

/** ユーザー名の最大文字数。 */
export const USERNAME_MAX_LENGTH = 50

/** ユーザー名の文字形式。 */
export const USERNAME_PATTERN = /^[a-z0-9]+$/

/** ユーザー名のバリデーション結果。 */
export type UsernameValidationError = 'required' | 'invalid' | null

/**
 * ユーザー名が API 仕様を満たすか検証する。
 *
 * @param value - 検証対象の username。
 * @returns 空の場合は `required`、形式不正の場合は `invalid`、有効な場合は `null`。
 */
export const validateUsername = (value: string): UsernameValidationError => {
  if (value.length === 0) {
    return 'required'
  }

  if (
    value.length < USERNAME_MIN_LENGTH ||
    value.length > USERNAME_MAX_LENGTH ||
    !USERNAME_PATTERN.test(value)
  ) {
    return 'invalid'
  }

  return null
}

/**
 * ユーザー名が API 仕様を満たさない場合に例外を送出する。
 *
 * @param value - 検証対象の username。
 * @returns なし。
 * @throws {TypeError} username が必須・長さ・文字種のいずれかを満たさない場合。
 */
export const assertValidUsername = (value: string): void => {
  if (validateUsername(value) !== null) {
    throw new TypeError()
  }
}
