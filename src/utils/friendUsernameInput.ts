/** フレンド操作で使用できる username の最小文字数。 */
export const FRIEND_USERNAME_MIN_LENGTH = 5

/** フレンド操作で使用できる username の最大文字数。 */
export const FRIEND_USERNAME_MAX_LENGTH = 50

/** フレンド操作で使用できる username の文字形式。 */
export const FRIEND_USERNAME_PATTERN = /^[a-z0-9]+$/

/** フレンド操作用 username のバリデーション結果。 */
export type FriendUsernameValidationError = 'required' | 'invalid' | null

/**
 * フレンド操作用 username が API 仕様を満たすか検証する。
 *
 * @param value - 検証対象の username。
 * @returns 空の場合は `required`、形式不正の場合は `invalid`、有効な場合は `null`。
 */
export const validateFriendUsername = (value: string): FriendUsernameValidationError => {
  if (value.length === 0) {
    return 'required'
  }

  if (
    value.length < FRIEND_USERNAME_MIN_LENGTH ||
    value.length > FRIEND_USERNAME_MAX_LENGTH ||
    !FRIEND_USERNAME_PATTERN.test(value)
  ) {
    return 'invalid'
  }

  return null
}

/**
 * フレンド操作用 username が API 仕様を満たさない場合に例外を送出する。
 *
 * @param value - 検証対象の username。
 * @returns なし。
 * @throws {TypeError} username が必須・長さ・文字種のいずれかを満たさない場合。
 */
export const assertValidFriendUsername = (value: string): void => {
  if (validateFriendUsername(value) !== null) {
    throw new TypeError()
  }
}
