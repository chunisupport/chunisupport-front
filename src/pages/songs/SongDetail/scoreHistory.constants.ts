import type { ScoreHistoryDifficulty } from '../../../api/songs'

/** 通常譜面でスコア履歴を保持する難易度。 */
export const SCORE_HISTORY_DIFFICULTIES: readonly ScoreHistoryDifficulty[] = [
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

/** 楽曲詳細の自己スコアカード見出し。 */
export const OWN_SCORE_CARD_TITLE = '自分のスコア'
/** 未プレイ譜面に表示する文言。 */
export const UNPLAYED_SCORE_LABEL = '未プレイ'
/** 履歴画面へ遷移するリンクの表示文言。 */
export const SCORE_HISTORY_LINK_LABEL = '履歴を見る'
