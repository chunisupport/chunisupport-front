export type AppTheme = 'light' | 'dark'

/**
 * 現在テーマから次に切り替えるテーマを返します。
 * @param current 現在のテーマ。
 * @returns 次のテーマ。
 */
export const getNextTheme = (current: AppTheme): AppTheme => (current === 'dark' ? 'light' : 'dark')

/**
 * 現在のテーマ属性値を取得します。
 * @param datasetTheme document.documentElement.dataset.theme の値。
 * @returns アプリで扱うテーマ。未設定時は light。
 */
export const resolveTheme = (datasetTheme: string | undefined): AppTheme =>
  datasetTheme === 'dark' ? 'dark' : 'light'
