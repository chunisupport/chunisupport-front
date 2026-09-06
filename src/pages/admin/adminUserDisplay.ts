import type { AccountType } from '../../types/api'

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

export const formatBooleanFlag = (value: boolean): string => (value ? 'true' : 'false')

/**
 * APIが返すアカウント種別を一覧表示用の文字列へ変換する。
 *
 * @param value - APIが返すアカウント種別。
 * @returns 表示するアカウント種別。
 */
export const formatAccountType = (value: AccountType): string => value

export const formatNullableText = (value: string | null | undefined): string =>
  value ? value : '-'
