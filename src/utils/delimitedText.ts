/** 区切りテキストの1セルに書き出せる値。nullは空セルとして扱う */
export type DelimitedTextCell = string | number | boolean | null

/** 区切りテキストの区切り文字 */
export type DelimitedTextDelimiter = ',' | '\t'

/** RFC 4180 に合わせた行区切り */
const DELIMITED_TEXT_LINE_BREAK = '\r\n'

/**
 * 1セルの値を区切りテキスト用に文字列化し、必要な場合だけ二重引用符で囲む。
 *
 * @param value - 書き出すセルの値。
 * @param delimiter - 区切り文字。
 * @returns エスケープ済みのセル文字列。
 */
const formatDelimitedTextCell = (
  value: DelimitedTextCell,
  delimiter: DelimitedTextDelimiter
): string => {
  const text = value === null ? '' : String(value)
  const needsQuote =
    text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r')
  return needsQuote ? `"${text.replaceAll('"', '""')}"` : text
}

/**
 * 行の配列をCSVやTSVなどの区切りテキストへ変換する。
 *
 * 区切り文字・二重引用符・改行を含むセルは二重引用符で囲み、行はCRLFで区切る。
 *
 * @param rows - ヘッダー行を含む書き出し対象の行。
 * @param delimiter - 区切り文字。
 * @returns 末尾に改行を付けた区切りテキスト。
 */
export const formatDelimitedText = (
  rows: readonly (readonly DelimitedTextCell[])[],
  delimiter: DelimitedTextDelimiter
): string =>
  rows
    .map((row) => row.map((cell) => formatDelimitedTextCell(cell, delimiter)).join(delimiter))
    .map((line) => `${line}${DELIMITED_TEXT_LINE_BREAK}`)
    .join('')
