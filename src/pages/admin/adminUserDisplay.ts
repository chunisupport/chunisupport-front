import type { AccountType, AdminUserListResponse } from '../../types/api'

type AdminUserListEditableFields = Pick<AdminUserListResponse, 'account_type' | 'is_suspicious'>

const adminUserDateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Tokyo',
})

export const formatAdminUserDateTime = (value: string | null): string => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return adminUserDateTimeFormatter.format(date)
}

/**
 * APIが返すアカウント種別を一覧表示用の文字列へ変換する。
 *
 * @param value - APIが返すアカウント種別。
 * @returns 表示するアカウント種別。
 */
export const formatAccountType = (value: AccountType): string => value

export const formatNullableText = (value: string | null | undefined): string =>
  value ? value : '-'

/**
 * 管理者向けユーザー一覧の順序を保ったまま、対象行の変更済みフィールドだけを差し替える。
 *
 * @param users - 現在表示中のユーザー一覧。
 * @param username - 更新対象のユーザー名。
 * @param changes - APIで更新に成功したフィールド。
 * @returns 対象行だけを更新したユーザー一覧。
 */
export const updateAdminUserListRow = (
  users: readonly AdminUserListResponse[],
  username: string,
  changes: Partial<AdminUserListEditableFields>
): AdminUserListResponse[] =>
  users.map((user) => (user.username === username ? { ...user, ...changes } : user))
