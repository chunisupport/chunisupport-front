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

export const formatAccountType = (value: 'ADMIN' | 'PLAYER'): string => value

export const formatNullableText = (value: string | null): string => (value ? value : '-')
