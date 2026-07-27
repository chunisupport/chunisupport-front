import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import type {
  PlayerDataDifficulty,
  PlayerDataNumberDiff,
  PlayerDataStatistics,
  PlayerDataStatisticsGroup,
} from '../../types/api'

/** RECORD STATISTICSで表示する集計列。 */
export const REGISTER_SCORE_STAT_COLUMNS = [
  'AJ',
  'FC',
  'MAX',
  'SSS+',
  'SSS',
  'SS+',
  'SS',
  'S+',
  'S',
] as const

/** RECORD STATISTICSでFC列の後ろに区切り線を設ける列。 */
export const REGISTER_SCORE_STATISTIC_DIVIDER_START_COLUMN = 'MAX' as const

/** 更新差分レポートで扱う固定難易度。 */
export const REGISTER_SCORE_DIFFICULTIES: readonly PlayerDataDifficulty[] = PLAYER_DATA_DIFFICULTIES

/** 全難易度集計を表す設定キー。 */
export const REGISTER_SCORE_ALL_ROW_KEY = 'ALL' as const

/** 更新差分の集計行を識別するキー。 */
export type RegisterScoreAggregateRowKey = typeof REGISTER_SCORE_ALL_ROW_KEY | PlayerDataDifficulty

/** 更新差分の集計行ごとの表示状態。 */
export type RegisterScoreAggregateRowVisibility = Record<RegisterScoreAggregateRowKey, boolean>

/** TOTAL HIGH SCOREの1行分の表示データ。 */
export type RegisterScoreTotalHighScoreRow = {
  key: RegisterScoreAggregateRowKey
  label: string
  difficulty: PlayerDataDifficulty | null
  value: PlayerDataNumberDiff
}

/** RECORD STATISTICSの1行分の表示データ。 */
export type RegisterScoreStatisticRow = {
  key: RegisterScoreAggregateRowKey
  label: string
  difficulty: PlayerDataDifficulty | null
  values: Record<(typeof REGISTER_SCORE_STAT_COLUMNS)[number], PlayerDataNumberDiff>
}

/** 集計セクションで共通利用する行ごとの設定項目。 */
export const REGISTER_SCORE_AGGREGATE_ROW_OPTIONS: readonly {
  key: RegisterScoreAggregateRowKey
  label: string
}[] = [
  { key: REGISTER_SCORE_ALL_ROW_KEY, label: 'ALL' },
  { key: 'BASIC', label: 'BAS' },
  { key: 'ADVANCED', label: 'ADV' },
  { key: 'EXPERT', label: 'EXP' },
  { key: 'MASTER', label: 'MAS' },
  { key: 'ULTIMA', label: 'ULT' },
]

/**
 * 1統計グループを表示用の統計行へ変換する。
 *
 * @param key - 行を識別する設定キー。
 * @param label - 行見出し。
 * @param group - APIが返す統計グループ。
 * @param difficulty - 行に対応する難易度。全体行の場合はnull。
 * @returns 表示用の統計行。
 */
const toRegisterScoreStatisticRow = (
  key: RegisterScoreAggregateRowKey,
  label: string,
  group: PlayerDataStatisticsGroup,
  difficulty: PlayerDataDifficulty | null = null
): RegisterScoreStatisticRow => ({
  key,
  label,
  difficulty,
  values: {
    AJ: group.record_statistics.aj,
    FC: group.record_statistics.fc,
    MAX: group.record_statistics.max,
    'SSS+': group.record_statistics.sss_plus,
    SSS: group.record_statistics.sss,
    'SS+': group.record_statistics.ss_plus,
    SS: group.record_statistics.ss,
    'S+': group.record_statistics.s_plus,
    S: group.record_statistics.s,
  },
})

/**
 * 全体と固定5難易度の統計行を生成する。
 *
 * @param statistics - APIが返す全体および難易度別の統計差分。
 * @returns 全体、BASIC、ADVANCED、EXPERT、MASTER、ULTIMAの表示行。
 */
export const toRegisterScoreStatisticRows = (
  statistics: PlayerDataStatistics
): RegisterScoreStatisticRow[] => [
  toRegisterScoreStatisticRow(
    REGISTER_SCORE_ALL_ROW_KEY,
    REGISTER_SCORE_ALL_ROW_KEY,
    statistics.overall
  ),
  ...REGISTER_SCORE_DIFFICULTIES.map((difficulty) =>
    toRegisterScoreStatisticRow(
      difficulty,
      difficulty.slice(0, 3),
      statistics.by_difficulty[difficulty],
      difficulty
    )
  ),
]

/**
 * 全体と固定5難易度のTOTAL HIGH SCORE行を生成する。
 *
 * @param statistics - APIが返す全体および難易度別の統計差分。
 * @returns 全体、BASIC、ADVANCED、EXPERT、MASTER、ULTIMAの表示行。
 */
export const toRegisterScoreTotalHighScoreRows = (
  statistics: PlayerDataStatistics
): RegisterScoreTotalHighScoreRow[] => [
  {
    key: REGISTER_SCORE_ALL_ROW_KEY,
    label: REGISTER_SCORE_ALL_ROW_KEY,
    difficulty: null,
    value: statistics.overall.total_high_score,
  },
  ...REGISTER_SCORE_DIFFICULTIES.map((difficulty) => ({
    key: difficulty,
    label: difficulty.slice(0, 3),
    difficulty,
    value: statistics.by_difficulty[difficulty].total_high_score,
  })),
]

/**
 * 更新があるTOTAL HIGH SCORE行だけを有効にした初期表示状態を生成する。
 *
 * @param statistics - APIが返す全体および難易度別の統計差分。
 * @returns TOTAL HIGH SCOREの行ごとの初期表示状態。
 */
export const createDefaultRegisterScoreTotalHighScoreRowVisibility = (
  statistics: PlayerDataStatistics
): RegisterScoreAggregateRowVisibility =>
  Object.fromEntries(
    toRegisterScoreTotalHighScoreRows(statistics).map((row) => [row.key, row.value.delta !== 0])
  ) as RegisterScoreAggregateRowVisibility

/**
 * RECORD STATISTICSの行に表示対象の更新があるか判定する。
 *
 * @param row - 判定対象の統計行。
 * @returns 表示している集計列のいずれかに差分がある場合はtrue。
 */
export const hasRegisterScoreStatisticRowUpdate = (row: RegisterScoreStatisticRow): boolean =>
  REGISTER_SCORE_STAT_COLUMNS.some((column) => row.values[column].delta !== 0)

/**
 * 更新がある統計行だけを有効にした初期表示状態を生成する。
 *
 * @param statistics - APIが返す全体および難易度別の統計差分。
 * @returns RECORD STATISTICSの行ごとの初期表示状態。
 */
export const createDefaultRegisterScoreStatisticRowVisibility = (
  statistics: PlayerDataStatistics
): RegisterScoreAggregateRowVisibility => {
  const rows = toRegisterScoreStatisticRows(statistics)

  return Object.fromEntries(
    rows.map((row) => [row.key, hasRegisterScoreStatisticRowUpdate(row)])
  ) as RegisterScoreAggregateRowVisibility
}
