/** `YYYY-MM-DD` で始まる文字列から日付部分を取り出す */
const DATE_ONLY_PREFIX_PATTERN = /^(\d{4}-\d{2}-\d{2})/

/**
 * リリース日などの日付文字列を `YYYY-MM-DD` へ正規化する。
 *
 * `YYYY-MM-DD` そのもの、またはその後ろに時刻が続く文字列は、先頭の日付部分をそのまま返す。
 * `Date` では解釈しないため、実行環境のタイムゾーンで日付がずれない。
 * スラッシュ区切りなど `YYYY-MM-DD` で始まらない値は不正な日付として null を返す。
 *
 * @param value - 正規化する日付文字列。
 * @returns 正規化できた日付。空、未設定、または `YYYY-MM-DD` で始まらない場合は null。
 */
export const toDateOnly = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim()
  if (!trimmed) return null

  return DATE_ONLY_PREFIX_PATTERN.exec(trimmed)?.[1] ?? null
}

/**
 * 日付入力欄 (`type="date"`) へ渡す `YYYY-MM-DD` 文字列を返す。
 *
 * @param value - 楽曲のリリース日など。
 * @returns 入力欄用の日付文字列。未設定または不正な場合は空文字。
 */
export const toDateInputValue = (value: string | null | undefined): string =>
  toDateOnly(value) ?? ''
