import type { DateRangeFilter } from '../types/record'

const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/

/**
 * ISO 8601 日時文字列から YYYY-MM-DD 形式の日付部分を抽出する。
 *
 * @param updatedAt - ISO 8601 日時文字列（例: "2026-06-01T12:00:00Z"）。null の場合は null を返す。
 * @returns YYYY-MM-DD 形式の日付文字列。抽出できない場合は null。
 */
export const toRecordDateString = (updatedAt: string | null): string | null => {
  if (!updatedAt) return null
  const matched = updatedAt.match(YMD_PATTERN)
  return matched ? `${matched[1]}-${matched[2]}-${matched[3]}` : null
}

/**
 * レコードの最終更新日が日付範囲フィルターに一致するか判定する。
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
