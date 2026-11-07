import { JST_TIME_ZONE } from '../constants/dateTime'

/** 実行環境のタイムゾーンやロケール設定に依存せず、JSTの年月日時分秒を構成要素で得るフォーマッター */
const jstDateTimeFormatter = new Intl.DateTimeFormat('ja-JP-u-ca-gregory-nu-latn', {
  timeZone: JST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/** JSTの日時を、年以外2桁ゼロ埋めした構成要素 */
type JstDateTimeParts = {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
}

/**
 * 日時をJSTの年月日時分秒の構成要素へ分解する。
 *
 * @param value - 日時文字列、またはUNIXエポックからの経過ミリ秒。日時がない場合はnull。
 * @returns JSTの構成要素。不正な値、空文字またはnullの場合はnull。
 */
const toJstDateTimeParts = (value: string | number | null): JstDateTimeParts | null => {
  if (value === null || (typeof value === 'string' && value.trim() === '')) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const parts = new Map(
    jstDateTimeFormatter.formatToParts(date).map(({ type, value: partValue }) => [type, partValue])
  )
  const year = parts.get('year')
  const month = parts.get('month')
  const day = parts.get('day')
  const hour = parts.get('hour')
  const minute = parts.get('minute')
  const second = parts.get('second')
  if (!year || !month || !day || !hour || !minute || !second) return null

  return { year, month, day, hour, minute, second }
}

/**
 * 日時をJST固定の年月日時分秒へ安全に整形する。
 *
 * @param value - APIが返した日時文字列、またはUNIXエポックからの経過ミリ秒。日時がない場合はnull。
 * @returns YYYY/MM/DD HH:mm:ss形式の日時。不正な値またはnullの場合はnull。
 */
export const formatJstDateTime = (value: string | number | null): string | null => {
  const parts = toJstDateTimeParts(value)
  if (!parts) return null

  const { year, month, day, hour, minute, second } = parts
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`
}

/**
 * 日時をJST固定の年月日時分へ安全に整形する。
 *
 * @param value - APIが返した日時文字列、またはUNIXエポックからの経過ミリ秒。日時がない場合はnull。
 * @returns YYYY/MM/DD HH:mm形式の日時。不正な値またはnullの場合はnull。
 */
export const formatJstDateTimeMinute = (value: string | number | null): string | null => {
  const parts = toJstDateTimeParts(value)
  if (!parts) return null

  const { year, month, day, hour, minute } = parts
  return `${year}/${month}/${day} ${hour}:${minute}`
}
