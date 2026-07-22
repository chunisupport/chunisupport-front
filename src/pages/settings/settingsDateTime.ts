/**
 * API日時を設定画面向けの日本語表記へ変換する。
 *
 * @param value - ISO 8601形式の日時。未登録の場合はnull。
 * @param emptyLabel - 値がない場合に表示する文言。
 * @returns 日本語の日時表記、または値がない場合の文言。
 */
export const formatSettingsDateTime = (value: string | null, emptyLabel = '未登録'): string => {
  if (!value) {
    return emptyLabel
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return emptyLabel
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
