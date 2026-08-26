import {
  MASTER_ULTIMA_DIFFICULTIES,
  MASTER_ULTIMA_FILTER,
  THEORETICAL_OVER_POWER_TARGET_FILTER,
} from '../constants/chart'
import { PLAYER_DATA_DIFFICULTY_ORDER } from '../constants/difficulty'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../types/api'
import { truncateChartConst } from './chartConstFormat'
import { type ChartLevelLabel, getChartLevelSortKey, toChartLevelLabel } from './chartLevel'
import { MAX_SCORE, SCORE_RANK_MIN_SCORES } from './scoreRank'
import { isTheoreticalOverPowerTargetDifficulty } from './theoreticalOverPowerTarget'

/** 統計画面で選択できる難易度または派生条件 */
export type PlayerStatsDifficulty =
  | PlayerDataDifficulty
  | 'ALL'
  | typeof MASTER_ULTIMA_FILTER
  | typeof THEORETICAL_OVER_POWER_TARGET_FILTER

/** 達成階段とヒートマップで扱う到達条件 */
export type PlayerStatsAchievement =
  | 'played'
  | 's'
  | 'sPlus'
  | 'ss'
  | 'ssPlus'
  | 'sss'
  | 'sssPlus'
  | 'fc'
  | 'aj'
  | 'ajc'
  | 'max'
  | 'clear'
  | 'hard'
  | 'brave'
  | 'absolute'
  | 'catastrophe'

/** 統計画面上部に表示する集計値 */
export type PlayerStatsSummary = {
  total: number
  played: number
  playedPercent: number
  averageScore: number
  sss: number
  sssPercent: number
  sssPlus: number
  sssPlusPercent: number
  aj: number
  ajPercent: number
  max: number
  maxPercent: number
}

/** 達成条件1件分の件数と割合 */
export type PlayerStatsAchievementProgress = {
  achievement: PlayerStatsAchievement
  count: number
  percent: number
}

/** 譜面定数から換算した表示レベル単位の統計 */
export type PlayerStatsLevelAchievement =
  | 's'
  | 'sPlus'
  | 'ss'
  | 'ssPlus'
  | 'sss'
  | 'sssPlus'
  | 'fc'
  | 'aj'
  | 'ajc'
  | 'clear'
  | 'hard'
  | 'brave'
  | 'absolute'
  | 'catastrophe'

/** 達成率分布で表示する到達条件別の件数 */
export type PlayerStatsHeatmapRow = Record<PlayerStatsLevelAchievement, number> & {
  total: number
}

/** 表示レベル単位の達成率分布行 */
export type PlayerStatsLevelRow = PlayerStatsHeatmapRow & {
  level: ChartLevelLabel
}

/** 譜面定数単位の達成率分布行 */
export type PlayerStatsChartConstantRow = PlayerStatsHeatmapRow & {
  chartConstant: number
}

/** 次の区切りとなる達成曲数 */
export type PlayerStatsMilestone = {
  current: number
  target: number
  remaining: number
  isComplete: boolean
}

/** 目標候補リストの種別 */
export type PlayerStatsCandidateTarget = 'sss' | 'sssPlus' | 'aj' | 'max'

/** 曲IDと難易度から総ノーツ数を参照する統計候補用マップ */
export type PlayerStatsNotesBySongId = ReadonlyMap<
  string,
  Readonly<Partial<Record<PlayerDataDifficulty, number | null>>>
>

/** 統計フィルターで参照する楽曲属性 */
export type PlayerStatsRecordAttribute = {
  genre: string
  version: string
}

/** 統計画面のジャンル・バージョン絞り込み条件 */
export type PlayerStatsAttributeFilter = {
  attributesBySongId: ReadonlyMap<string, PlayerStatsRecordAttribute>
  genres: readonly string[]
  versions: readonly string[]
}

/** 統計画面で適用中の全フィルター条件 */
export type PlayerStatsFilterSelection = {
  difficulty: PlayerStatsDifficulty
  genres: readonly string[]
  versions: readonly string[]
}

/** 次の目標達成に近い譜面と数値上の残量 */
export type PlayerStatsCandidate = {
  record: PlayerRecordDTO
  scoreGap: number | null
  justiceGap: number | null
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
  sPlus: SCORE_RANK_MIN_SCORES['S+'],
  ss: SCORE_RANK_MIN_SCORES.SS,
  ssPlus: SCORE_RANK_MIN_SCORES['SS+'],
  sss: SCORE_RANK_MIN_SCORES.SSS,
  sssPlus: SCORE_RANK_MIN_SCORES['SSS+'],
  max: MAX_SCORE,
}

const MILESTONE_STEP: Record<PlayerStatsCandidateTarget, number> = {
  sss: 10,
  sssPlus: 10,
  aj: 10,
  max: 5,
}

/**
 * 選択中の値が既定の全選択肢と一致するか判定する。
 *
 * @param selected - 現在選択されている値。
 * @param defaults - 既定で選択される全候補。
 * @returns 順序にかかわらず同じ値が選択されている場合はtrue。
 */
const hasSamePlayerStatsSelections = (
  selected: readonly string[],
  defaults: readonly string[]
): boolean => {
  if (selected.length !== defaults.length) return false

  const selectedValues = new Set(selected)
  return (
    selectedValues.size === defaults.length && defaults.every((value) => selectedValues.has(value))
  )
}

/**
 * 統計画面のフィルターが初期状態から変更されているか判定する。
 *
 * @param filters - 現在適用されているフィルター。
 * @param defaultDifficulty - 初期選択する難易度。
 * @param defaultGenres - 初期選択する全ジャンル。
 * @param defaultVersions - 初期選択する全バージョン。
 * @returns いずれかの条件が初期状態と異なる場合はtrue。
 */
export const isPlayerStatsFilterModified = (
  filters: PlayerStatsFilterSelection,
  defaultDifficulty: PlayerStatsDifficulty,
  defaultGenres: readonly string[],
  defaultVersions: readonly string[]
): boolean =>
  filters.difficulty !== defaultDifficulty ||
  !hasSamePlayerStatsSelections(filters.genres, defaultGenres) ||
  !hasSamePlayerStatsSelections(filters.versions, defaultVersions)

/**
 * 件数を全譜面数に対する割合へ変換する。
 *
 * @param count - 達成件数。
 * @param total - 集計対象の全譜面数。
 * @returns 0から100までの達成率。
 */
export const calculatePlayerStatsPercent = (count: number, total: number): number =>
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
  if (achievement === 'ajc') {
    return record.combo_lamp === 'ALL JUSTICE' && record.score === MAX_SCORE
  }

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
 * @param difficulty - 全難易度、通常難易度、MASTERとULTIMAの合算、または理論値OP対象。
 * @param targetDifficultyBySongId - 曲IDごとの理論値OVER POWER対象難易度。
 * @param attributeFilter - 楽曲ごとの属性と、選択中のジャンル・バージョン。
 * @returns 選択難易度に一致する新しい配列。
 */
export const filterPlayerStatsRecords = (
  records: PlayerRecordDTO[],
  difficulty: PlayerStatsDifficulty,
  targetDifficultyBySongId: ReadonlyMap<string, PlayerDataDifficulty> = new Map(),
  attributeFilter?: PlayerStatsAttributeFilter
): PlayerRecordDTO[] => {
  return records.filter((record) => {
    const recordDifficulty = record.difficulty.toUpperCase() as PlayerDataDifficulty
    const attribute = attributeFilter?.attributesBySongId.get(record.id)
    const matchesDifficulty =
      difficulty === 'ALL' ||
      (difficulty === MASTER_ULTIMA_FILTER
        ? MASTER_ULTIMA_DIFFICULTIES.some(
            (targetDifficulty) => targetDifficulty === recordDifficulty
          )
        : difficulty === THEORETICAL_OVER_POWER_TARGET_FILTER
          ? isTheoreticalOverPowerTargetDifficulty(
              targetDifficultyBySongId.get(record.id),
              recordDifficulty
            )
          : recordDifficulty === difficulty)

    return (
      matchesDifficulty &&
      (!attributeFilter ||
        (attribute !== undefined &&
          attributeFilter.genres.includes(attribute.genre) &&
          attributeFilter.versions.includes(attribute.version)))
    )
  })
}

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
  const sss = records.filter((record) => hasPlayerStatsAchievement(record, 'sss')).length
  const sssPlus = records.filter((record) => hasPlayerStatsAchievement(record, 'sssPlus')).length
  const aj = records.filter((record) => hasPlayerStatsAchievement(record, 'aj')).length
  const max = records.filter((record) => hasPlayerStatsAchievement(record, 'max')).length
  const averageScore = played
    ? Math.round(playedRecords.reduce((sum, record) => sum + record.score, 0) / played)
    : 0

  return {
    total,
    played,
    playedPercent: calculatePlayerStatsPercent(played, total),
    averageScore,
    sss,
    sssPercent: calculatePlayerStatsPercent(sss, total),
    sssPlus,
    sssPlusPercent: calculatePlayerStatsPercent(sssPlus, total),
    aj,
    ajPercent: calculatePlayerStatsPercent(aj, total),
    max,
    maxPercent: calculatePlayerStatsPercent(max, total),
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
      percent: calculatePlayerStatsPercent(count, records.length),
    }
  })

/**
 * 達成率分布行へ譜面1件分の到達状況を加算する。
 *
 * @param row - 加算先の達成率分布行。
 * @param record - 加算する通常譜面レコード。
 * @returns 同じ行オブジェクト。
 */
const addRecordToHeatmapRow = <TRow extends PlayerStatsHeatmapRow>(
  row: TRow,
  record: PlayerRecordDTO
): TRow => {
  row.total += 1
  for (const achievement of PLAYER_STATS_LEVEL_ACHIEVEMENTS) {
    if (hasPlayerStatsAchievement(record, achievement)) {
      row[achievement] += 1
    }
  }
  return row
}

/** レベル別達成率へ集計する全到達条件 */
const PLAYER_STATS_LEVEL_ACHIEVEMENTS: readonly PlayerStatsLevelAchievement[] = [
  's',
  'sPlus',
  'ss',
  'ssPlus',
  'sss',
  'sssPlus',
  'fc',
  'aj',
  'ajc',
  'clear',
  'hard',
  'brave',
  'absolute',
  'catastrophe',
]

/**
 * 空の達成率分布行を生成する。
 *
 * @returns 全到達条件を0件で初期化した集計行。
 */
const createPlayerStatsHeatmapRow = (): PlayerStatsHeatmapRow => ({
  total: 0,
  s: 0,
  sPlus: 0,
  ss: 0,
  ssPlus: 0,
  sss: 0,
  sssPlus: 0,
  fc: 0,
  aj: 0,
  ajc: 0,
  clear: 0,
  hard: 0,
  brave: 0,
  absolute: 0,
  catastrophe: 0,
})

/**
 * 空のレベル別集計行を生成する。
 *
 * @param level - 集計対象の表示レベル。
 * @returns 全到達条件を0件で初期化した集計行。
 */
const createPlayerStatsLevelRow = (level: ChartLevelLabel): PlayerStatsLevelRow => ({
  ...createPlayerStatsHeatmapRow(),
  level,
})

/**
 * 空の譜面定数別集計行を生成する。
 *
 * @param chartConstant - 集計対象の譜面定数。
 * @returns 全到達条件を0件で初期化した集計行。
 */
const createPlayerStatsChartConstantRow = (chartConstant: number): PlayerStatsChartConstantRow => ({
  ...createPlayerStatsHeatmapRow(),
  chartConstant,
})

/**
 * 通常譜面レコードを譜面定数から換算した表示レベル単位に集計する。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @returns レベルが高い順に並んだRANK、COMBO、HARD到達件数。
 */
export const buildPlayerStatsLevelRows = (records: PlayerRecordDTO[]): PlayerStatsLevelRow[] => {
  const rows = new Map<ChartLevelLabel, PlayerStatsLevelRow>()

  for (const record of records) {
    const level = toChartLevelLabel(record.const)
    const row = rows.get(level) ?? createPlayerStatsLevelRow(level)
    rows.set(level, addRecordToHeatmapRow(row, record))
  }

  return [...rows.values()].sort(
    (left, right) => getChartLevelSortKey(right.level) - getChartLevelSortKey(left.level)
  )
}

/**
 * 通常譜面レコードを譜面定数単位に集計する。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @returns 譜面定数が高い順に並んだRANK、COMBO、HARD到達件数。
 */
export const buildPlayerStatsChartConstantRows = (
  records: PlayerRecordDTO[]
): PlayerStatsChartConstantRow[] => {
  const rows = new Map<number, PlayerStatsChartConstantRow>()

  for (const record of records) {
    const chartConstant = truncateChartConst(record.const)
    const row = rows.get(chartConstant) ?? createPlayerStatsChartConstantRow(chartConstant)
    rows.set(chartConstant, addRecordToHeatmapRow(row, record))
  }

  return [...rows.values()].sort((left, right) => right.chartConstant - left.chartConstant)
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
 * @param notesBySongId - MAX候補の失点を正規化するための譜面別ノーツ数。
 * @returns Array.sortで使用する比較値。
 */
const compareCandidateRecords = (
  left: PlayerRecordDTO,
  right: PlayerRecordDTO,
  target: PlayerStatsCandidateTarget,
  notesBySongId: PlayerStatsNotesBySongId
): number => {
  if (target === 'aj') {
    const leftHasFullCombo = left.combo_lamp === 'FULL COMBO' ? 1 : 0
    const rightHasFullCombo = right.combo_lamp === 'FULL COMBO' ? 1 : 0
    if (leftHasFullCombo !== rightHasFullCombo) return rightHasFullCombo - leftHasFullCombo
  }

  if (target === 'max') {
    const leftNotes = notesBySongId.get(left.id)?.[left.difficulty]
    const rightNotes = notesBySongId.get(right.id)?.[right.difficulty]
    const leftDroppedNotes = leftNotes ? ((MAX_SCORE - left.score) * leftNotes) / MAX_SCORE : null
    const rightDroppedNotes = rightNotes
      ? ((MAX_SCORE - right.score) * rightNotes) / MAX_SCORE
      : null

    if (leftDroppedNotes !== null && rightDroppedNotes !== null) {
      if (leftDroppedNotes !== rightDroppedNotes) return leftDroppedNotes - rightDroppedNotes
    } else if (leftDroppedNotes !== null) {
      return -1
    } else if (rightDroppedNotes !== null) {
      return 1
    }
  }

  if (left.score !== right.score) return right.score - left.score
  return right.const - left.const
}

/**
 * 候補譜面を難易度、表示レベル、譜面定数の低い順に比較する。
 *
 * @param left - 比較する左側のレコード。
 * @param right - 比較する右側のレコード。
 * @returns Array.sortで使用する比較値。
 */
const compareCandidateDisplayOrder = (left: PlayerRecordDTO, right: PlayerRecordDTO): number => {
  const difficultyDifference =
    PLAYER_DATA_DIFFICULTY_ORDER[left.difficulty] - PLAYER_DATA_DIFFICULTY_ORDER[right.difficulty]
  if (difficultyDifference !== 0) return difficultyDifference

  const levelDifference =
    getChartLevelSortKey(toChartLevelLabel(left.const)) -
    getChartLevelSortKey(toChartLevelLabel(right.const))
  if (levelDifference !== 0) return levelDifference
  if (left.const !== right.const) return left.const - right.const
  return left.title.localeCompare(right.title, 'ja')
}

/**
 * SSS、SSS+、AJ、MAXの次の達成候補を抽出し、難易度とレベルが低い順に並べる。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @param target - 候補を抽出する目標種別。
 * @param limit - 返す候補の最大件数。
 * @param notesBySongId - MAX候補の失点をノーツ数で正規化するための譜面情報。
 * @returns 候補譜面と、目標までのスコア差またはAJ済みMAX候補のJUSTICE数。
 */
export const findPlayerStatsCandidates = (
  records: PlayerRecordDTO[],
  target: PlayerStatsCandidateTarget,
  limit: number,
  notesBySongId: PlayerStatsNotesBySongId = new Map()
): PlayerStatsCandidate[] => {
  const candidates = records
    .filter((record) => {
      if (!record.is_played) return false
      if (target === 'sss') return !hasPlayerStatsAchievement(record, 'sss')
      if (target === 'sssPlus') return !hasPlayerStatsAchievement(record, 'sssPlus')
      if (target === 'aj') return !hasPlayerStatsAchievement(record, 'aj')
      return !hasPlayerStatsAchievement(record, 'max')
    })
    .sort((left, right) => compareCandidateRecords(left, right, target, notesBySongId))
    .slice(0, limit)
    .sort(compareCandidateDisplayOrder)

  const targetScore =
    target === 'sss'
      ? SCORE_RANK_MIN_SCORES.SSS
      : target === 'sssPlus'
        ? SCORE_RANK_MIN_SCORES['SSS+']
        : MAX_SCORE
  return candidates.map((record) => ({
    record,
    scoreGap: target === 'aj' ? null : Math.max(targetScore - record.score, 0),
    justiceGap:
      target === 'max' && record.combo_lamp === 'ALL JUSTICE' ? record.justice_count : null,
  }))
}
