import type { PlayerDataDifficulty, PlayerRecordDTO } from '../types/api'
import { type ChartLevelLabel, getChartLevelSortKey, toChartLevelLabel } from './chartLevel'
import { MAX_SCORE, SCORE_RANK_MIN_SCORES } from './scoreRank'

/** 統計画面で選択できる難易度。 */
export type PlayerStatsDifficulty = PlayerDataDifficulty | 'ALL'

/** 達成階段とヒートマップで扱う到達条件。 */
export type PlayerStatsAchievement =
  | 'played'
  | 's'
  | 'ss'
  | 'sss'
  | 'sssPlus'
  | 'fc'
  | 'aj'
  | 'max'
  | 'clear'
  | 'hard'
  | 'brave'
  | 'absolute'
  | 'catastrophe'

/** 統計画面上部に表示する集計値。 */
export type PlayerStatsSummary = {
  total: number
  played: number
  playedPercent: number
  averageScore: number
  sssPlus: number
  sssPlusPercent: number
  aj: number
  ajPercent: number
  max: number
  maxPercent: number
}

/** 達成条件1件分の件数と割合。 */
export type PlayerStatsAchievementProgress = {
  achievement: PlayerStatsAchievement
  count: number
  percent: number
}

/** 譜面定数から換算した表示レベル単位の統計。 */
export type PlayerStatsLevelRow = {
  level: ChartLevelLabel
  total: number
  played: number
  sssPlus: number
  aj: number
  max: number
}

/** 次の区切りとなる達成曲数。 */
export type PlayerStatsMilestone = {
  current: number
  target: number
  remaining: number
  isComplete: boolean
}

/** 目標候補リストの種別。 */
export type PlayerStatsCandidateTarget = 'sssPlus' | 'aj' | 'max'

/** 次の目標達成に近い譜面と数値上の残量。 */
export type PlayerStatsCandidate = {
  record: PlayerRecordDTO
  scoreGap: number | null
}

const CLEAR_LAMP_LEVEL: Record<NonNullable<PlayerRecordDTO['clear_lamp']>, number> = {
  FAILED: 0,
  CLEAR: 1,
  HARD: 2,
  BRAVE: 3,
  ABSOLUTE: 4,
  CATASTROPHY: 5,
}

const CLEAR_ACHIEVEMENT_LEVEL: Partial<Record<PlayerStatsAchievement, number>> = {
  clear: CLEAR_LAMP_LEVEL.CLEAR,
  hard: CLEAR_LAMP_LEVEL.HARD,
  brave: CLEAR_LAMP_LEVEL.BRAVE,
  absolute: CLEAR_LAMP_LEVEL.ABSOLUTE,
  catastrophe: CLEAR_LAMP_LEVEL.CATASTROPHY,
}

const SCORE_ACHIEVEMENT_MINIMUM: Partial<Record<PlayerStatsAchievement, number>> = {
  s: SCORE_RANK_MIN_SCORES.S,
  ss: SCORE_RANK_MIN_SCORES.SS,
  sss: SCORE_RANK_MIN_SCORES.SSS,
  sssPlus: SCORE_RANK_MIN_SCORES['SSS+'],
  max: MAX_SCORE,
}

const MILESTONE_STEP: Record<PlayerStatsCandidateTarget, number> = {
  sssPlus: 10,
  aj: 10,
  max: 5,
}

/**
 * 件数を全譜面数に対する割合へ変換する。
 *
 * @param count - 達成件数。
 * @param total - 集計対象の全譜面数。
 * @returns 0から100までの達成率。
 */
const calculatePercent = (count: number, total: number): number =>
  total > 0 ? (count / total) * 100 : 0

/**
 * レコードが指定した到達条件を満たすか判定する。
 *
 * @param record - 判定対象の通常譜面レコード。
 * @param achievement - 判定する到達条件。
 * @returns 条件を満たす場合はtrue。
 */
export const hasPlayerStatsAchievement = (
  record: PlayerRecordDTO,
  achievement: PlayerStatsAchievement
): boolean => {
  if (!record.is_played) return false
  if (achievement === 'played') return true
  if (achievement === 'fc') return record.combo_lamp !== null
  if (achievement === 'aj') return record.combo_lamp === 'ALL JUSTICE'

  const minimumScore = SCORE_ACHIEVEMENT_MINIMUM[achievement]
  if (minimumScore !== undefined) return record.score >= minimumScore

  const minimumClearLevel = CLEAR_ACHIEVEMENT_LEVEL[achievement]
  if (minimumClearLevel === undefined) return false

  const clearLevel = record.clear_lamp ? CLEAR_LAMP_LEVEL[record.clear_lamp] : 0
  return clearLevel >= minimumClearLevel
}

/**
 * 統計画面で選択した難易度にレコードを絞り込む。
 *
 * @param records - 集計元の通常譜面レコード。
 * @param difficulty - ALLまたは大文字の難易度ドメイン値。
 * @returns 選択難易度に一致する新しい配列。
 */
export const filterPlayerStatsRecords = (
  records: PlayerRecordDTO[],
  difficulty: PlayerStatsDifficulty
): PlayerRecordDTO[] =>
  difficulty === 'ALL'
    ? [...records]
    : records.filter((record) => record.difficulty.toUpperCase() === difficulty)

/**
 * 通常譜面レコードから統計画面上部のサマリーを算出する。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @returns プレイ率、平均スコア、SSS+、AJ、MAXの集計値。
 */
export const buildPlayerStatsSummary = (records: PlayerRecordDTO[]): PlayerStatsSummary => {
  const total = records.length
  const playedRecords = records.filter((record) => record.is_played)
  const played = playedRecords.length
  const sssPlus = records.filter((record) => hasPlayerStatsAchievement(record, 'sssPlus')).length
  const aj = records.filter((record) => hasPlayerStatsAchievement(record, 'aj')).length
  const max = records.filter((record) => hasPlayerStatsAchievement(record, 'max')).length
  const averageScore = played
    ? Math.round(playedRecords.reduce((sum, record) => sum + record.score, 0) / played)
    : 0

  return {
    total,
    played,
    playedPercent: calculatePercent(played, total),
    averageScore,
    sssPlus,
    sssPlusPercent: calculatePercent(sssPlus, total),
    aj,
    ajPercent: calculatePercent(aj, total),
    max,
    maxPercent: calculatePercent(max, total),
  }
}

/**
 * 指定した到達条件を達成階段用の件数と割合へ集計する。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @param achievements - 表示順に並べた到達条件。
 * @returns 到達条件ごとの件数と全譜面に対する割合。
 */
export const buildPlayerStatsAchievementProgress = (
  records: PlayerRecordDTO[],
  achievements: readonly PlayerStatsAchievement[]
): PlayerStatsAchievementProgress[] =>
  achievements.map((achievement) => {
    const count = records.filter((record) => hasPlayerStatsAchievement(record, achievement)).length
    return {
      achievement,
      count,
      percent: calculatePercent(count, records.length),
    }
  })

/**
 * レベル行へ譜面1件分の到達状況を加算する。
 *
 * @param row - 加算先のレベル行。
 * @param record - 加算する通常譜面レコード。
 * @returns 同じ行オブジェクト。
 */
const addRecordToLevelRow = (
  row: PlayerStatsLevelRow,
  record: PlayerRecordDTO
): PlayerStatsLevelRow => {
  row.total += 1
  for (const achievement of ['played', 'sssPlus', 'aj', 'max'] as const) {
    if (hasPlayerStatsAchievement(record, achievement)) {
      row[achievement] += 1
    }
  }
  return row
}

/**
 * 通常譜面レコードを譜面定数から換算した表示レベル単位に集計する。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @returns レベルが高い順に並んだプレイ、SSS+、AJ、MAX件数。
 */
export const buildPlayerStatsLevelRows = (records: PlayerRecordDTO[]): PlayerStatsLevelRow[] => {
  const rows = new Map<ChartLevelLabel, PlayerStatsLevelRow>()

  for (const record of records) {
    const level = toChartLevelLabel(record.const)
    const row = rows.get(level) ?? { level, total: 0, played: 0, sssPlus: 0, aj: 0, max: 0 }
    rows.set(level, addRecordToLevelRow(row, record))
  }

  return [...rows.values()].sort(
    (left, right) => getChartLevelSortKey(right.level) - getChartLevelSortKey(left.level)
  )
}

/**
 * 現在件数から次の区切りとなる目標件数を算出する。
 *
 * @param current - 現在の達成件数。
 * @param target - SSS+、AJ、MAXのいずれか。
 * @param maximum - 選択条件内で達成可能な最大件数。
 * @returns 達成可能数を上限にした次の目標件数、残り件数、完了状態。
 */
export const buildPlayerStatsMilestone = (
  current: number,
  target: PlayerStatsCandidateTarget,
  maximum: number
): PlayerStatsMilestone => {
  if (current >= maximum) {
    return { current, target: maximum, remaining: 0, isComplete: true }
  }

  const step = MILESTONE_STEP[target]
  const nextTarget = Math.min((Math.floor(current / step) + 1) * step, maximum)
  return { current, target: nextTarget, remaining: nextTarget - current, isComplete: false }
}

/**
 * 目標種別に応じた候補譜面の並び順を比較する。
 *
 * @param left - 比較する左側のレコード。
 * @param right - 比較する右側のレコード。
 * @param target - 候補を抽出する目標種別。
 * @returns Array.sortで使用する比較値。
 */
const compareCandidateRecords = (
  left: PlayerRecordDTO,
  right: PlayerRecordDTO,
  target: PlayerStatsCandidateTarget
): number => {
  if (target === 'aj') {
    const leftHasFullCombo = left.combo_lamp === 'FULL COMBO' ? 1 : 0
    const rightHasFullCombo = right.combo_lamp === 'FULL COMBO' ? 1 : 0
    if (leftHasFullCombo !== rightHasFullCombo) return rightHasFullCombo - leftHasFullCombo
  }

  if (left.score !== right.score) return right.score - left.score
  return right.const - left.const
}

/**
 * SSS+、AJ、MAXの次の達成候補を現在記録に近い順で抽出する。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @param target - 候補を抽出する目標種別。
 * @param limit - 返す候補の最大件数。
 * @returns 候補譜面と、スコア目標の場合は必要スコア差。
 */
export const findPlayerStatsCandidates = (
  records: PlayerRecordDTO[],
  target: PlayerStatsCandidateTarget,
  limit: number
): PlayerStatsCandidate[] => {
  const candidates = records
    .filter((record) => {
      if (!record.is_played) return false
      if (target === 'sssPlus') return !hasPlayerStatsAchievement(record, 'sssPlus')
      if (target === 'aj') return !hasPlayerStatsAchievement(record, 'aj')
      return !hasPlayerStatsAchievement(record, 'max')
    })
    .sort((left, right) => compareCandidateRecords(left, right, target))
    .slice(0, limit)

  const targetScore = target === 'sssPlus' ? SCORE_RANK_MIN_SCORES['SSS+'] : MAX_SCORE
  return candidates.map((record) => ({
    record,
    scoreGap: target === 'aj' ? null : Math.max(targetScore - record.score, 0),
  }))
}
