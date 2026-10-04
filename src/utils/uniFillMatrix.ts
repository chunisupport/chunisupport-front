import {
  MASTER_ULTIMA_FILTER,
  SCORE_MIN,
  THEORETICAL_OVER_POWER_TARGET_FILTER,
} from '../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import type { PlayerStatsHeatmapAxis } from '../constants/playerStats'
import type { PlayerRecordDTO } from '../types/api'
import type { NumericRangeFilter } from '../types/record'
import type { FilterState } from '../types/recordFilter'
import { formatChartConst, truncateChartConst } from './chartConstFormat'
import {
  getChartLevelConstRange,
  getChartLevelFilterBoundary,
  getChartLevelSortKey,
  toChartLevelLabel,
} from './chartLevel'
import { COMBO_LAMP_UNACHIEVED_FILTERS, HARD_LAMP_UNACHIEVED_FILTERS } from './goalLamp'
import { formatFileTimestamp } from './localDateTime'
import {
  hasPlayerStatsAchievement,
  type PlayerStatsAchievement,
  type PlayerStatsDifficulty,
} from './playerStatsDashboard'
import { MAX_SCORE, SCORE_RANK_MIN_SCORES } from './scoreRank'

/** マトリクス1セル分の達成件数と総数 */
export type UniFillMatrixCell = {
  count: number
  total: number
}

/** マトリクスの列（レベルまたは譜面定数） */
export type UniFillMatrixColumn = {
  /** 列の並び替えと同一判定に使う数値 */
  key: number
  /** 列見出しに表示する文字列 */
  label: string
  /** 列に含まれる譜面定数の範囲 */
  constRange: NumericRangeFilter
  /** 通常レコードのフィルターで範囲を表す指定方法 */
  constFilterMode: FilterState['constFilterMode']
}

/** ジャンル1件分の行 */
export type UniFillMatrixRow = {
  /** 行見出しのジャンル名 */
  genre: string
  /** 列の並びに対応するセル */
  cells: UniFillMatrixCell[]
  /** ジャンル内の合計 */
  total: UniFillMatrixCell
}

/** ジャンル×レベル（または譜面定数）の達成状況マトリクス */
export type UniFillMatrix = {
  columns: UniFillMatrixColumn[]
  rows: UniFillMatrixRow[]
  columnTotals: UniFillMatrixCell[]
  grandTotal: UniFillMatrixCell
}

/**
 * 譜面定数を横軸の列へ変換する。
 *
 * @param chartConst - 譜面定数。
 * @param axis - レベル別または譜面定数別。
 * @returns 並び替え用のキー、表示ラベル、譜面定数の範囲とフィルターでの指定方法。
 */
const toUniFillMatrixColumn = (
  chartConst: number,
  axis: PlayerStatsHeatmapAxis
): UniFillMatrixColumn => {
  if (axis === 'level') {
    const level = toChartLevelLabel(chartConst)
    const constRange = getChartLevelConstRange(level)
    // 6以下はフィルターのレベル指定が「5 = 5.0〜5.9」にまとまるため、範囲が一致しない列は数値指定にする
    const isFilterLevelRange =
      getChartLevelFilterBoundary(level, 'min') === constRange.min &&
      getChartLevelFilterBoundary(level, 'max') === constRange.max
    return {
      key: getChartLevelSortKey(level),
      label: level,
      constRange,
      constFilterMode: isFilterLevelRange ? 'level' : 'number',
    }
  }
  const truncated = truncateChartConst(chartConst)
  return {
    key: truncated,
    label: formatChartConst(truncated),
    constRange: { min: truncated, max: truncated },
    constFilterMode: 'number',
  }
}

/**
 * 複数セルの達成件数と総数を合計する。
 *
 * @param cells - 合計対象のセル。
 * @returns 合計済みの新しいセル。
 */
const sumUniFillMatrixCells = (cells: readonly UniFillMatrixCell[]): UniFillMatrixCell =>
  cells.reduce((sum, cell) => ({ count: sum.count + cell.count, total: sum.total + cell.total }), {
    count: 0,
    total: 0,
  })

/**
 * 通常譜面レコードをジャンル×レベル（または譜面定数）で集計する。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @param attributesBySongId - 曲IDごとのジャンル。
 * @param genres - 行の表示順に並べたジャンル。ここに含まれないジャンルの譜面は集計せず、譜面が存在しないジャンルは行に含めない。
 * @param axis - 横軸をレベル別にするか譜面定数別にするか。
 * @param achievement - 埋め終わりとみなす到達条件。
 * @returns 横軸が高い順の列、ジャンル行、列合計、総合計。
 */
export const buildUniFillMatrix = (
  records: readonly PlayerRecordDTO[],
  attributesBySongId: ReadonlyMap<string, { genre: string }>,
  genres: readonly string[],
  axis: PlayerStatsHeatmapAxis,
  achievement: PlayerStatsAchievement
): UniFillMatrix => {
  const targetGenres = new Set(genres)
  const columnsByKey = new Map<number, UniFillMatrixColumn>()
  const cellsByGenre = new Map<string, Map<number, UniFillMatrixCell>>()

  for (const record of records) {
    const genre = attributesBySongId.get(record.id)?.genre
    if (genre === undefined || !targetGenres.has(genre)) continue

    const column = toUniFillMatrixColumn(record.const, axis)
    columnsByKey.set(column.key, column)
    const cells = cellsByGenre.get(genre) ?? new Map<number, UniFillMatrixCell>()
    const cell = cells.get(column.key) ?? { count: 0, total: 0 }
    cell.total += 1
    if (hasPlayerStatsAchievement(record, achievement)) cell.count += 1
    cells.set(column.key, cell)
    cellsByGenre.set(genre, cells)
  }

  const columns = [...columnsByKey.values()].sort((left, right) => right.key - left.key)
  const rows = genres.flatMap((genre): UniFillMatrixRow[] => {
    const cells = cellsByGenre.get(genre)
    if (!cells) return []

    const rowCells = columns.map((column) => cells.get(column.key) ?? { count: 0, total: 0 })
    return [{ genre, cells: rowCells, total: sumUniFillMatrixCells(rowCells) }]
  })

  return {
    columns,
    rows,
    columnTotals: columns.map((_, index) =>
      sumUniFillMatrixCells(rows.map((row) => row.cells[index]))
    ),
    grandTotal: sumUniFillMatrixCells(rows.map((row) => row.total)),
  }
}

/** マトリクスで選択できる難易度 */
export type UniFillMatrixDifficulty = PlayerStatsDifficulty

/** 通常レコードへ引き継ぐマトリクスのマス */
export type UniFillMatrixRecordTarget = {
  /** マトリクスで選択中の難易度 */
  difficulty: UniFillMatrixDifficulty
  /** 埋め終わりとみなす到達条件 */
  achievement: PlayerStatsAchievement
  /** 行のジャンル。列合計・総合計のマスでは未指定 */
  genre?: string
  /** 横軸の列。ジャンル合計・総合計のマスでは未指定 */
  column?: UniFillMatrixColumn
}

/**
 * マトリクスの難易度を通常レコードの難易度・OP対象条件へ変換する。
 *
 * @param difficulty - マトリクスで選択中の難易度。
 * @returns 通常レコードで選択する難易度とOP対象条件。
 */
const resolveUniFillMatrixDifficultyFilter = (
  difficulty: UniFillMatrixDifficulty
): Pick<FilterState, 'difficulties' | 'opTargetOnly' | 'opTargetType'> => {
  if (difficulty === THEORETICAL_OVER_POWER_TARGET_FILTER) {
    return {
      difficulties: [...PLAYER_DATA_DIFFICULTIES],
      opTargetOnly: true,
      opTargetType: 'theoretical',
    }
  }
  if (difficulty === 'ALL') {
    return {
      difficulties: [...PLAYER_DATA_DIFFICULTIES],
      opTargetOnly: false,
      opTargetType: 'current',
    }
  }
  return {
    difficulties: difficulty === MASTER_ULTIMA_FILTER ? ['MASTER', 'ULTIMA'] : [difficulty],
    opTargetOnly: false,
    opTargetType: 'current',
  }
}

/**
 * スコア上限を指定した未達成条件を作る。
 *
 * @param maxScore - 表示するスコアの上限。
 * @returns スコア範囲を数値指定にした部分フィルター。
 */
const toScoreBelowFilter = (maxScore: number): Pick<FilterState, 'score' | 'scoreFilterMode'> => ({
  score: { min: SCORE_MIN, max: Math.max(SCORE_MIN, maxScore) },
  scoreFilterMode: 'number',
})

/**
 * 埋め条件を満たしていない譜面だけを表示する条件へ変換する。
 *
 * @param achievement - 埋め終わりとみなす到達条件。
 * @returns 未達成譜面を絞り込む部分フィルター。
 */
const resolveUnachievedFilter = (achievement: PlayerStatsAchievement): Partial<FilterState> => {
  switch (achievement) {
    case 'played':
      return toScoreBelowFilter(SCORE_MIN)
    case 's':
      return toScoreBelowFilter(SCORE_RANK_MIN_SCORES.S - 1)
    case 'sPlus':
      return toScoreBelowFilter(SCORE_RANK_MIN_SCORES['S+'] - 1)
    case 'ss':
      return toScoreBelowFilter(SCORE_RANK_MIN_SCORES.SS - 1)
    case 'ssPlus':
      return toScoreBelowFilter(SCORE_RANK_MIN_SCORES['SS+'] - 1)
    case 'sss':
      return toScoreBelowFilter(SCORE_RANK_MIN_SCORES.SSS - 1)
    case 'sssPlus':
      return toScoreBelowFilter(SCORE_RANK_MIN_SCORES['SSS+'] - 1)
    case 'max':
      return toScoreBelowFilter(MAX_SCORE - 1)
    case 'fc':
      return { combo_lamp: [...COMBO_LAMP_UNACHIEVED_FILTERS.FC] }
    case 'aj':
      return { combo_lamp: [...COMBO_LAMP_UNACHIEVED_FILTERS.AJ] }
    case 'ajc':
      return { combo_lamp: ['ALL JUSTICE', ...COMBO_LAMP_UNACHIEVED_FILTERS.AJ] }
    case 'clear':
      return { hard_lamp: ['FAILED', null] }
    case 'hard':
      return { hard_lamp: [...HARD_LAMP_UNACHIEVED_FILTERS.HRD] }
    case 'brave':
      return { hard_lamp: [...HARD_LAMP_UNACHIEVED_FILTERS.BRV] }
    case 'absolute':
      return { hard_lamp: [...HARD_LAMP_UNACHIEVED_FILTERS.ABS] }
    case 'catastrophe':
      return { hard_lamp: [...HARD_LAMP_UNACHIEVED_FILTERS.CTS] }
  }
}

/**
 * マトリクスのマスから、埋め条件を満たしていない譜面を表示する通常レコード用フィルターを作る。
 *
 * @param defaultFilter - マスタデータを反映した通常レコードの既定フィルター。
 * @param target - 難易度、埋め条件、行ジャンル、列。
 * @returns マスの条件と未達成条件を反映した通常レコードフィルター。
 */
export const buildUniFillMatrixRecordFilter = (
  defaultFilter: FilterState,
  target: UniFillMatrixRecordTarget
): FilterState => ({
  ...defaultFilter,
  ...resolveUniFillMatrixDifficultyFilter(target.difficulty),
  ...resolveUnachievedFilter(target.achievement),
  ...(target.genre === undefined ? {} : { genres: [target.genre] }),
  ...(target.column === undefined
    ? {}
    : {
        const: { ...target.column.constRange },
        constFilterMode: target.column.constFilterMode,
      }),
})

/**
 * ジャンルとレベル・譜面定数が交差するマスのチェック数を集計する。
 *
 * @param matrix - 集計済みのマトリクス。合計行・合計列と対象譜面がないマスは数えない。
 * @returns 全件達成マス数をcount、対象譜面があるマス数をtotalとした集計。
 */
export const countUniFillMatrixChecks = (matrix: UniFillMatrix): UniFillMatrixCell => {
  const checks = { count: 0, total: 0 }
  for (const row of matrix.rows) {
    for (const cell of row.cells) {
      if (cell.total === 0) continue
      checks.total += 1
      if (cell.count === cell.total) checks.count += 1
    }
  }
  return checks
}

/** マトリクス画像のファイル名の接頭辞 */
const UNI_FILL_MATRIX_IMAGE_FILENAME_PREFIX = 'chunisupport-uni-fill-matrix'

/**
 * 表示条件と日時を含むマトリクス画像のファイル名を生成する。
 *
 * @param condition - 画像化した難易度・埋め条件・縦軸。
 * @param date - ファイル名へ付与する日時。省略時は現在時刻。
 * @returns `chunisupport-uni-fill-matrix-{難易度}-{埋め条件}-{縦軸}-{YYYYMMDDhhmmss}.png` 形式の小文字のファイル名。
 */
export const formatUniFillMatrixImageFilename = (
  condition: {
    difficulty: UniFillMatrixDifficulty
    achievement: PlayerStatsAchievement
    axis: PlayerStatsHeatmapAxis
  },
  date: Date = new Date()
): string =>
  [
    UNI_FILL_MATRIX_IMAGE_FILENAME_PREFIX,
    condition.difficulty.replaceAll('_', '-'),
    condition.achievement,
    condition.axis,
    formatFileTimestamp(date),
  ]
    .join('-')
    .toLowerCase()
    .concat('.png')
