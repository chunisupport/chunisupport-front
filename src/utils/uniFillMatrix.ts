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
import { NAME_FOLDER_KEYS, type NameFolderKey } from './nameFolder'
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

/** 画面の横軸に使う楽曲属性 */
export type UniFillMatrixHorizontalAxis = 'genre' | 'version' | 'nameFolder'

/** 横軸1件分の属性。横軸に対応するプロパティだけを持つ */
type UniFillMatrixRowAttribute =
  | { genre: string; version?: never; nameFolder?: never }
  | { version: string; genre?: never; nameFolder?: never }
  | { nameFolder: NameFolderKey; genre?: never; version?: never }

/** 画面の横軸1件分の集計 */
export type UniFillMatrixRow = UniFillMatrixRowAttribute & {
  /** 見出しに表示する短縮名・表示名。未指定時は集計用の名称 */
  label: string
  /** 列の並びに対応するセル */
  cells: UniFillMatrixCell[]
  /** 横軸属性内の合計 */
  total: UniFillMatrixCell
}

/** ジャンル・追加バージョン・名前順フォルダ×レベル・譜面定数の達成状況 */
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
 * 横軸1件分の属性を行のプロパティへ変換する。
 *
 * @param axis - 画面の横軸。
 * @param group - 集計用の名称。名前順フォルダでは内部キー。
 * @returns 横軸に対応するプロパティだけを持つオブジェクト。
 */
const toUniFillMatrixRowAttribute = (
  axis: UniFillMatrixHorizontalAxis,
  group: string
): UniFillMatrixRowAttribute => {
  switch (axis) {
    case 'genre':
      return { genre: group }
    case 'version':
      return { version: group }
    case 'nameFolder':
      return { nameFolder: group as NameFolderKey }
  }
}

/**
 * 通常譜面レコードをジャンル・追加バージョン・名前順フォルダとレベル・譜面定数で集計する。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @param attributesBySongId - 曲IDごとのジャンル、追加バージョン、名前順フォルダ。
 * @param genres - 行の表示順に並べたジャンル。ここに含まれないジャンルの譜面は集計せず、譜面が存在しないジャンルは行に含めない。
 * @param axis - 画面の縦軸をレベル別にするか譜面定数別にするか。
 * @param achievement - 埋め終わりとみなす到達条件。
 * @param horizontal - 画面の横軸、稼働順に並べた公開済みバージョン一覧、集計用の名称に対応する短縮名・表示名。
 * @returns レベル・譜面定数が高い順の列、横軸属性の集計、合計。
 */
export const buildUniFillMatrix = (
  records: readonly PlayerRecordDTO[],
  attributesBySongId: ReadonlyMap<
    string,
    { genre: string; version?: string; nameFolder?: NameFolderKey }
  >,
  genres: readonly string[],
  axis: PlayerStatsHeatmapAxis,
  achievement: PlayerStatsAchievement,
  horizontal: {
    axis: UniFillMatrixHorizontalAxis
    versions: readonly string[]
    shortNames?: ReadonlyMap<string, string>
  } = {
    axis: 'genre',
    versions: [],
  }
): UniFillMatrix => {
  const groups: readonly string[] =
    horizontal.axis === 'version'
      ? horizontal.versions
      : horizontal.axis === 'nameFolder'
        ? NAME_FOLDER_KEYS
        : genres
  const targetGroups = new Set(groups)
  const columnsByKey = new Map<number, UniFillMatrixColumn>()
  const cellsByGroup = new Map<string, Map<number, UniFillMatrixCell>>()

  for (const record of records) {
    const group = attributesBySongId.get(record.id)?.[horizontal.axis]
    if (group === undefined || !targetGroups.has(group)) continue

    const column = toUniFillMatrixColumn(record.const, axis)
    columnsByKey.set(column.key, column)
    const cells = cellsByGroup.get(group) ?? new Map<number, UniFillMatrixCell>()
    const cell = cells.get(column.key) ?? { count: 0, total: 0 }
    cell.total += 1
    if (hasPlayerStatsAchievement(record, achievement)) cell.count += 1
    cells.set(column.key, cell)
    cellsByGroup.set(group, cells)
  }

  const columns = [...columnsByKey.values()].sort((left, right) => right.key - left.key)
  const rows = groups.flatMap((group): UniFillMatrixRow[] => {
    const cells = cellsByGroup.get(group)
    if (!cells) return []

    const rowCells = columns.map((column) => cells.get(column.key) ?? { count: 0, total: 0 })
    return [
      {
        ...toUniFillMatrixRowAttribute(horizontal.axis, group),
        label: horizontal.shortNames?.get(group) ?? group,
        cells: rowCells,
        total: sumUniFillMatrixCells(rowCells),
      },
    ]
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
  /** 横軸の追加バージョン。合計列では未指定 */
  version?: string
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
 * @param target - 難易度、埋め条件、ジャンルまたは追加バージョン、レベル・譜面定数。
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
  ...(target.version === undefined ? {} : { versions: [target.version] }),
  ...(target.column === undefined
    ? {}
    : {
        const: { ...target.column.constRange },
        constFilterMode: target.column.constFilterMode,
      }),
})

/**
 * 横軸の属性とレベル・譜面定数が交差するマスのチェック数を集計する。
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

/** 横軸ごとに縦軸の後へ付けるファイル名の要素。ジャンルは既定のため付けない */
const UNI_FILL_MATRIX_IMAGE_FILENAME_HORIZONTAL_SUFFIX: Record<
  UniFillMatrixHorizontalAxis,
  readonly string[]
> = {
  genre: [],
  version: ['version'],
  nameFolder: ['name'],
}

/**
 * 表示条件と日時を含むマトリクス画像のファイル名を生成する。
 *
 * @param condition - 画像化した難易度・埋め条件・縦軸・横軸。
 * @param date - ファイル名へ付与する日時。省略時は現在時刻。
 * @returns 表示条件と日時を含む小文字のファイル名。バージョン横軸ではversion、楽曲名横軸ではnameを日時の前に付ける。
 */
export const formatUniFillMatrixImageFilename = (
  condition: {
    difficulty: UniFillMatrixDifficulty
    achievement: PlayerStatsAchievement
    axis: PlayerStatsHeatmapAxis
    horizontalAxis?: UniFillMatrixHorizontalAxis
  },
  date: Date = new Date()
): string =>
  [
    UNI_FILL_MATRIX_IMAGE_FILENAME_PREFIX,
    condition.difficulty.replaceAll('_', '-'),
    condition.achievement,
    condition.axis,
    ...UNI_FILL_MATRIX_IMAGE_FILENAME_HORIZONTAL_SUFFIX[condition.horizontalAxis ?? 'genre'],
    formatFileTimestamp(date),
  ]
    .join('-')
    .toLowerCase()
    .concat('.png')
