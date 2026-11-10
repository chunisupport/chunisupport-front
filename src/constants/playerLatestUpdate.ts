/** 最新スコア更新結果画面のタイトルとメニュー表示名 */
export const LATEST_SCORE_UPDATE_TITLE = 'スコア更新履歴'

/** 保存済みの更新結果がない場合に表示する文言 */
export const LATEST_SCORE_UPDATE_EMPTY_MESSAGE = '保存された更新差分はありません。'

/** 新規保存される更新結果のスキーマバージョン */
export const LATEST_SCORE_UPDATE_SCHEMA_VERSION = 3

/** 画面で読み込み可能な保存済み更新結果のスキーマバージョン */
export const SUPPORTED_LATEST_SCORE_UPDATE_SCHEMA_VERSIONS = [
  1,
  2,
  LATEST_SCORE_UPDATE_SCHEMA_VERSION,
] as const

/** 前回更新で楽曲差分がない場合に表示する文言 */
export const LATEST_SCORE_UPDATE_CHANGED_SONGS_EMPTY_MESSAGE = '更新された楽曲はありません。'

/** 更新履歴選択欄のラベル */
export const LATEST_SCORE_UPDATE_HISTORY_LABEL = '更新履歴'

/** 最新結果の選択肢に付ける接頭辞 */
export const LATEST_SCORE_UPDATE_NEWEST_LABEL = '最新・'

/**
 * 履歴の世代番号を選択肢の表示へ変換する。
 *
 * @param generationsAgo - 最新から何世代前か。
 * @returns 過去世代の接頭辞。
 */
export const formatPreviousScoreUpdateLabel = (generationsAgo: number): string =>
  `${generationsAgo}件前・`
