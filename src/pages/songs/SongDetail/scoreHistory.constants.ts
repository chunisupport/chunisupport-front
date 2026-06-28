import type { ScoreHistoryDifficulty } from '../../../api/songs'
import type { PlayerDataDifficulty } from '../../../types/api'

/** 通常譜面でスコア履歴を保持する難易度。 */
export const SCORE_HISTORY_DIFFICULTIES: readonly ScoreHistoryDifficulty[] = [
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

/** 楽曲詳細で自己スコアを表示する難易度。 */
export const OWN_SCORE_DIFFICULTIES: readonly PlayerDataDifficulty[] = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

/**
 * 指定した難易度がスコア履歴に対応するか判定する。
 *
 * @param difficulty - 判定対象の難易度。
 * @returns スコア履歴に対応する場合は true。
 */
export const supportsScoreHistory = (
  difficulty: PlayerDataDifficulty
): difficulty is ScoreHistoryDifficulty =>
  SCORE_HISTORY_DIFFICULTIES.some((historyDifficulty) => historyDifficulty === difficulty)

/** 楽曲詳細の自己スコアカード見出し。 */
export const OWN_SCORE_CARD_TITLE = '自分のスコア'
/** 未プレイ譜面に表示する文言。 */
export const UNPLAYED_SCORE_LABEL = '未プレイ'
/** 履歴画面へ遷移するリンクの表示文言。 */
export const SCORE_HISTORY_LINK_LABEL = '履歴を見る'
