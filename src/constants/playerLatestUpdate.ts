import { formatMessage, localizedCopy } from '../i18n'
/** スコア更新履歴画面の表示文言 */
export const LATEST_SCORE_UPDATE_COPY = localizedCopy('latestScoreUpdate')
/** 新規保存される更新結果のスキーマバージョン */
export const LATEST_SCORE_UPDATE_SCHEMA_VERSION = 3

/** 画面で読み込み可能な保存済み更新結果のスキーマバージョン */
export const SUPPORTED_LATEST_SCORE_UPDATE_SCHEMA_VERSIONS = [
  1,
  2,
  LATEST_SCORE_UPDATE_SCHEMA_VERSION,
] as const

/**
 * 履歴の世代番号を選択肢の表示へ変換する。
 *
 * @param generationsAgo - 最新から何世代前か。
 * @returns 過去世代の接頭辞。
 */
export const formatPreviousScoreUpdateLabel = (generationsAgo: number): string =>
  formatMessage(LATEST_SCORE_UPDATE_COPY.previousLabel, { count: generationsAgo })
