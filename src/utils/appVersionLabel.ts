/**
 * ビルド日時を YYYYMMDD 形式へ正規化する。
 *
 * @param buildDate - ビルド日時またはビルド日。
 * @returns YYYYMMDD 形式のビルド日。変換できない場合は入力値。
 */
export const normalizeBuildDate = (buildDate: string): string =>
  /^\d{4}-\d{2}-\d{2}/.test(buildDate) ? buildDate.slice(0, 10).replaceAll('-', '') : buildDate

/**
 * 公開フッター向けのビルド日表示を組み立てる。
 *
 * @param buildInfo - アプリケーション名とビルド日時。
 * @returns 表示用のビルド日文字列。
 */
export const formatBuildDateLabel = (buildInfo: { appName: string; buildDate: string }): string =>
  `${buildInfo.appName}: ${normalizeBuildDate(buildInfo.buildDate)}`

/**
 * 管理者向けのビルド日とコミットハッシュ表示を組み立てる。
 *
 * @param buildInfo - アプリケーション名、ビルド日時、コミットハッシュ。
 * @returns 表示用のビルド情報文字列。
 */
export const formatBuildRevisionLabel = (buildInfo: {
  appName: string
  buildDate: string
  commitHash: string
}): string =>
  `${buildInfo.appName}: ${normalizeBuildDate(buildInfo.buildDate)} (${buildInfo.commitHash})`
