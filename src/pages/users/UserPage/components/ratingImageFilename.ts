const RATING_IMAGE_FILENAME_PREFIX = 'chunisupport-best-new'

/**
 * 日付を画像ダウンロード名用のローカル時刻文字列へ変換する。
 *
 * @param date - 変換対象の日時。
 * @returns `YYYYMMDDhhmmss` 形式の日時文字列。
 */
const formatRatingImageTimestamp = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

/**
 * ベスト枠・新曲枠画像のダウンロードファイル名を生成する。
 *
 * @param username - プロフィールURLに使用するユーザー名。
 * @param date - ファイル名へ付与する日時。省略時は現在時刻。
 * @returns `chunisupport-best-new-{username}-{YYYYMMDDhhmmss}.jpg` 形式のファイル名。
 */
export const formatRatingImageFilename = (username: string, date: Date = new Date()): string =>
  `${RATING_IMAGE_FILENAME_PREFIX}-${username}-${formatRatingImageTimestamp(date)}.jpg`
