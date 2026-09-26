import type { ScoreHistoryDifficulty } from '../../../api/songs'
import { PLAYER_DATA_DIFFICULTIES } from '../../../constants/difficulty'
import { localizedCopy } from '../../../i18n'
import type { PlayerDataDifficulty } from '../../../types/api'

/** 通常譜面でスコア履歴を保持する難易度 */
export const SCORE_HISTORY_DIFFICULTIES: readonly ScoreHistoryDifficulty[] = [
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

/** 楽曲詳細で自己スコアを表示する難易度 */
export const OWN_SCORE_DIFFICULTIES: readonly PlayerDataDifficulty[] = PLAYER_DATA_DIFFICULTIES

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

/** 自分のスコア欄の表示文言 */
export const OWN_SCORE_COPY = localizedCopy('songs.ownScore')
