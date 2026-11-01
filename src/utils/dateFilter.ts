import { JST_TIME_ZONE } from '../constants/dateTime'
import type { DateRangeFilter } from '../types/record'

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const YMD_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/

/** 実行環境に依存せずJSTの年月日を組み立てるフォーマッター */
const jstDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: JST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * カレンダー上に存在する年月日か判定する。
 *
 * @param year - 西暦年。
 * @param month - 1始まりの月。
 * @param day - 日。
 * @returns 実在する日付の場合はtrue。
 */
const isValidYmd = (year: number, month: number, day: number): boolean => {
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

/**
 * タイムスタンプをJSTのYYYY-MM-DD形式へ変換する。
 *
 * @param timestamp - ミリ秒単位のタイムスタンプ。
 * @returns JST基準のYYYY-MM-DD形式の日付。
 */
const formatJstDate = (timestamp: number): string => {
  const parts = jstDateFormatter.formatToParts(timestamp)
  const partValue = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${partValue('year')}-${partValue('month')}-${partValue('day')}`
}

/**
 * ISO 8601 日時文字列から日本時間基準の YYYY-MM-DD 形式の日付を取得する。
 *
 * 日付のみの文字列はそのまま扱い、カレンダー上に存在しない日付は無効としてnullを返す。
 *
 * @param updatedAt - ISO 8601 日時文字列（例: "2026-06-01T12:00:00Z"）。null の場合は null を返す。
 * @returns YYYY-MM-DD 形式の日付文字列。抽出できない場合は null。
 */
export const toRecordDateString = (updatedAt: string | null): string | null => {
  if (!updatedAt) return null

  const dateOnly = DATE_ONLY_PATTERN.exec(updatedAt)
  if (dateOnly) {
    const year = Number(dateOnly[1])
    const month = Number(dateOnly[2])
    const day = Number(dateOnly[3])
    return isValidYmd(year, month, day) ? updatedAt : null
  }

  const prefix = YMD_PREFIX_PATTERN.exec(updatedAt)
  if (prefix && !isValidYmd(Number(prefix[1]), Number(prefix[2]), Number(prefix[3]))) {
    return null
  }

  const timestamp = Date.parse(updatedAt)
  return Number.isNaN(timestamp) ? null : formatJstDate(timestamp)
}

/**
 * レコード一覧から時刻を除いた最新更新日を返す。
 *
 * @param records - 更新日時を持つレコード一覧。
 * @returns JST基準の YYYY-MM-DD 形式の最新更新日。有効な更新日がなければ null。
 */
export const findLatestRecordDate = (
  records: readonly { updated_at: string | null }[]
): string | null => {
  let latestDate: string | null = null

  for (const record of records) {
    const recordDate = toRecordDateString(record.updated_at)
    if (recordDate !== null && (latestDate === null || recordDate > latestDate)) {
      latestDate = recordDate
    }
  }

  return latestDate
}

/**
 * レコードの最終更新日が日付範囲フィルターに一致するか判定する。
 *
 * 比較は日本時間基準の日付で行い、不正な日付は範囲指定がある場合に不一致とする。
 *
 * @param updatedAt - レコードの最終更新日 (ISO 8601 日時文字列)。null の場合は範囲指定があると不一致。
 * @param range - 日付範囲フィルター。空文字列の端は未指定として扱う。
 * @returns 日付範囲条件に一致する場合は true。
 */
export const isDateInRange = (updatedAt: string | null, range: DateRangeFilter): boolean => {
  if (!range.min && !range.max) return true
  if (updatedAt === null) return false
  const recordDate = toRecordDateString(updatedAt)
  if (recordDate === null) return false
  if (range.min && recordDate < range.min) return false
  if (range.max && recordDate > range.max) return false
  return true
}
