import { formatJstDateTimeMinute } from '../../utils/jstDateTime'

/**
 * API日時を設定画面向けのJST固定の日本語表記へ変換する。
 *
 * @param value - ISO 8601形式の日時。未登録の場合はnull。
 * @param emptyLabel - 値がない場合に表示する文言。
 * @returns `YYYY/MM/DD HH:mm` 形式のJST日時、または値がない場合の文言。
 */
export const formatSettingsDateTime = (value: string | null, emptyLabel = '未登録'): string =>
  formatJstDateTimeMinute(value) ?? emptyLabel
