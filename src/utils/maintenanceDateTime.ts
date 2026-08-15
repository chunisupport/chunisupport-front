import { MAINTENANCE_TIME_ZONE } from '../constants/maintenance'

const maintenanceDateTimeFormatter = new Intl.DateTimeFormat('ja-JP-u-ca-gregory-nu-latn', {
  timeZone: MAINTENANCE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/**
 * API日時をJST固定の年月日時分秒へ安全に整形する。
 *
 * @param value - APIが返した日時文字列。日時がない場合はnull。
 * @returns YYYY/MM/DD HH:mm:ss形式の日時。不正な値またはnullの場合はnull。
 */
export const formatMaintenanceDateTime = (value: string | null): string | null => {
  if (value === null || value.trim() === '') return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const parts = new Map(
    maintenanceDateTimeFormatter
      .formatToParts(date)
      .filter(({ type }) => ['year', 'month', 'day', 'hour', 'minute', 'second'].includes(type))
      .map(({ type, value: partValue }) => [type, partValue])
  )
  const year = parts.get('year')
  const month = parts.get('month')
  const day = parts.get('day')
  const hour = parts.get('hour')
  const minute = parts.get('minute')
  const second = parts.get('second')
  if (!year || !month || !day || !hour || !minute || !second) return null

  return `${year}/${month}/${day} ${hour}:${minute}:${second}`
}
