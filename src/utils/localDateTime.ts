/**
 * 日付をダウンロードファイル名用のローカル時刻文字列へ変換する。
 *
 * 画面表示の日時はJSTへ固定しているが、ファイル名は利用者の端末上で他のファイルと並べて扱うため、
 * 意図的に実行環境（端末）のタイムゾーンのローカル時刻を使う。
 *
 * @param date - 変換対象の日時。
 * @param separator - 日付と時刻の間に入れる文字列。省略時は区切らない。
 * @returns `YYYYMMDD{separator}hhmmss` 形式のローカル日時文字列。
 */
export const formatFileTimestamp = (date: Date, separator = ''): string => {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}${separator}${hours}${minutes}${seconds}`
}
