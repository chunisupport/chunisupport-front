import { getScoreRank, type ScoreRank } from './scoreRank'

/** コースモードを構成する楽曲数 */
export const COURSE_TRACK_COUNT = 3

/**
 * 3曲合計のコーススコアから通常スコアと同じ基準のランクを判定する。
 *
 * @param score - 3曲合計のコーススコア。
 * @returns 3倍したスコア境界に対応するランク。
 */
export const getCourseScoreRank = (score: number): ScoreRank =>
  getScoreRank(score / COURSE_TRACK_COUNT)
