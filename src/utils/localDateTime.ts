/** ローカル時刻の日時を、年以外2桁ゼロ埋めした構成要素 */
type LocalDateTimeParts = {
  year: string
  month: string
  day: string
  hours: string
  minutes: string
  seconds: string
}

/**
 * 日時をローカル時刻の構成要素へ分解する。
 *
 * @param date - 変換対象の日時。
 * @returns 年と、2桁ゼロ埋めした月・日・時・分・秒。
 */
const toLocalDateTimeParts = (date: Date): LocalDateTimeParts => ({
  year: String(date.getFullYear()),
  month: String(date.getMonth() + 1).padStart(2, '0'),
  day: String(date.getDate()).padStart(2, '0'),
  hours: String(date.getHours()).padStart(2, '0'),
  minutes: String(date.getMinutes()).padStart(2, '0'),
  seconds: String(date.getSeconds()).padStart(2, '0'),
})

/**
 * 日付をダウンロードファイル名用のローカル時刻文字列へ変換する。
 *
 * @param date - 変換対象の日時。
 * @param separator - 日付と時刻の間に入れる文字列。省略時は区切らない。
 * @returns `YYYYMMDD{separator}hhmmss` 形式の日時文字列。
 */
export const formatFileTimestamp = (date: Date, separator = ''): string => {
  const { year, month, day, hours, minutes, seconds } = toLocalDateTimeParts(date)

  return `${year}${month}${day}${separator}${hours}${minutes}${seconds}`
}

/**
 * 日付を画面表示用のローカル時刻文字列へ変換する。
 *
 * @param date - 変換対象の日時。
 * @returns `YYYY/MM/DD HH:mm:ss` 形式の日時文字列。
 */
export const formatLocalDateTime = (date: Date): string => {
  const { year, month, day, hours, minutes, seconds } = toLocalDateTimeParts(date)

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}
