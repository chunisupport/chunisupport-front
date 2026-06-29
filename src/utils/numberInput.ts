/**
 * 数値入力値を指定範囲内に丸めた文字列へ変換する。
 *
 * @param value - 入力欄から受け取った文字列。
 * @param min - 許容する最小値。
 * @param max - 許容する最大値。
 * @param format - 範囲外補正時の文字列フォーマット。
 * @returns 空文字・入力途中の値はそのまま、範囲外の数値は丸めた文字列。
 */
export const clampNumericInput = (
  value: string,
  min: number,
  max: number,
  format: (value: number) => string = String
): string => {
  if (value === '') return value

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  if (parsed < min) return format(min)
  if (parsed > max) return format(max)
  return value
}
