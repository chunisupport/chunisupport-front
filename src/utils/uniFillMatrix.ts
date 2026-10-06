import {
  MASTER_ULTIMA_FILTER,
  SCORE_MIN,
  THEORETICAL_OVER_POWER_TARGET_FILTER,
} from '../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import {
  PLAYER_STATS_HEATMAP_AXIS_OPTIONS,
  type PlayerStatsHeatmapAxis,
} from '../constants/playerStats'
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

/** マトリクスのレベルまたは譜面定数1件分の範囲 */
export type UniFillMatrixLevelConst = {
  /** 並び替えと同一判定に使う数値 */
  key: number
  /** 見出しに表示する文字列 */
  label: string
  /** 含まれる譜面定数の範囲 */
  constRange: NumericRangeFilter
  /** 通常レコードのフィルターで範囲を表す指定方法 */
  constFilterMode: FilterState['constFilterMode']
}

/** 縦軸・横軸に選べる属性の一覧 */
const UNI_FILL_MATRIX_DIMENSIONS = ['levelConst', 'genre', 'version', 'nameFolder'] as const

/** 縦軸・横軸に選べる属性。levelConst はレベルまたは譜面定数 */
export type UniFillMatrixDimension = (typeof UNI_FILL_MATRIX_DIMENSIONS)[number]

/** ウニ埋めマトリックスの保存対象となる表示設定 */
export type UniFillMatrixViewSettings = {
  /** 縦軸の属性 */
  vertical: UniFillMatrixDimension
  /** 横軸の属性 */
  horizontal: UniFillMatrixDimension
  /** レベル・定数の軸をレベル別にするか定数別にするか */
  levelConstAxis: PlayerStatsHeatmapAxis
  /** 達成件数の代わりに達成率を表示するか */
  showPercent: boolean
}

/**
 * 保存済みの値をウニ埋めマトリックスの表示設定として正規化する。
 * 項目ごとに不正値を既定値へ戻し、縦軸と横軸が同じ属性になる場合は両軸とも既定値へ戻す。
 *
 * @param value - localStorage などから読み込んだ未検証の値。
 * @param fallback - 未設定・不正値のときに使う既定の表示設定。
 * @returns 正規化した表示設定。
 */
export const normalizeUniFillMatrixViewSettings = (
  value: unknown,
  fallback: UniFillMatrixViewSettings
): UniFillMatrixViewSettings => {
  const source: Partial<Record<keyof UniFillMatrixViewSettings, unknown>> =
    typeof value === 'object' && value !== null ? value : {}
  const vertical = UNI_FILL_MATRIX_DIMENSIONS.find((dimension) => dimension === source.vertical)
  const horizontal = UNI_FILL_MATRIX_DIMENSIONS.find((dimension) => dimension === source.horizontal)
  const hasValidAxes = vertical !== undefined && horizontal !== undefined && vertical !== horizontal

  return {
    vertical: hasValidAxes ? vertical : fallback.vertical,
    horizontal: hasValidAxes ? horizontal : fallback.horizontal,
    levelConstAxis:
      PLAYER_STATS_HEATMAP_AXIS_OPTIONS.find(({ value }) => value === source.levelConstAxis)
        ?.value ?? fallback.levelConstAxis,
    showPercent:
      typeof source.showPercent === 'boolean' ? source.showPercent : fallback.showPercent,
  }
}

/** 楽曲の属性から決まる軸 */
type UniFillMatrixSongDimension = Exclude<UniFillMatrixDimension, 'levelConst'>

/** 曲IDごとの楽曲属性 */
export type UniFillMatrixSongAttributes = {
  genre: string
  version?: string
  nameFolder?: NameFolderKey
}

/** 表示用の見出し。axis はレベル・譜面定数、group はジャンル・バージョン・名前順フォルダ */
export type UniFillMatrixHeader = {
  label: string
  kind: 'axis' | 'group'
}

/** マトリクスを組み立てる条件 */
export type UniFillMatrixLayout = {
  /** 縦軸（左端の見出し）に使う属性 */
  vertical: UniFillMatrixDimension
  /** 横軸（上端の見出し）に使う属性 */
  horizontal: UniFillMatrixDimension
  /** レベル・定数の軸をレベル別にするか譜面定数別にするか */
  levelConstAxis: PlayerStatsHeatmapAxis
  /** 表示順に並べたジャンル。ここに含まれないジャンルの譜面は集計しない */
  genres: readonly string[]
  /** 稼働順に並べた公開済みバージョン。ここに含まれないバージョンの譜面は集計しない */
  versions: readonly string[]
  /** 集計用の名称に対応する見出しの短縮名・表示名。未指定時は集計用の名称 */
  labels?: Partial<Record<UniFillMatrixSongDimension, ReadonlyMap<string, string>>>
}

/**
 * 譜面定数をレベルまたは譜面定数1件分の範囲へ変換する。
 *
 * @param chartConst - 譜面定数。
 * @param axis - レベル別または譜面定数別。
 * @returns 並び替え用のキー、表示ラベル、譜面定数の範囲とフィルターでの指定方法。
 */
const toUniFillMatrixLevelConst = (
  chartConst: number,
  axis: PlayerStatsHeatmapAxis
): UniFillMatrixLevelConst => {
  if (axis === 'level') {
    const level = toChartLevelLabel(chartConst)
    const constRange = getChartLevelConstRange(level)
    // 6以下はフィルターのレベル指定が「5 = 5.0〜5.9」にまとまるため、範囲が一致しない項目は数値指定にする
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

/** 軸の1項目。order の昇順に並べる */
type UniFillMatrixAxisItem = {
  /** 集計時の同一判定に使うキー */
  key: string
  /** 並び順。小さいほど先頭 */
  order: number
  header: UniFillMatrixHeader
  /** レコード画面で絞り込む位置。通常レコードで絞り込めない項目では未指定 */
  position?: UniFillMatrixCellPosition
}

/**
 * 楽曲属性の軸の名称を、通常レコードで絞り込む位置へ変換する。
 *
 * @param dimension - 楽曲の属性から決まる軸。
 * @param group - 集計用の名称。
 * @returns 絞り込み位置。名前順フォルダは通常レコードで絞り込めないため undefined。
 */
const toSongDimensionPosition = (
  dimension: UniFillMatrixSongDimension,
  group: string
): UniFillMatrixCellPosition | undefined => {
  switch (dimension) {
    case 'genre':
      return { genre: group }
    case 'version':
      return { version: group }
    case 'nameFolder':
      return undefined
  }
}

/**
 * 譜面が属する軸の項目を求める関数を作る。
 *
 * @param dimension - 縦軸または横軸に使う属性。
 * @param layout - マトリクスの条件。
 * @param attributesBySongId - 曲IDごとの楽曲属性。
 * @returns 譜面から軸の項目を求める関数。集計対象外の譜面では undefined を返す。
 */
const createAxisItemResolver = (
  dimension: UniFillMatrixDimension,
  layout: UniFillMatrixLayout,
  attributesBySongId: ReadonlyMap<string, UniFillMatrixSongAttributes>
): ((record: PlayerRecordDTO) => UniFillMatrixAxisItem | undefined) => {
  if (dimension === 'levelConst') {
    return (record) => {
      const levelConst = toUniFillMatrixLevelConst(record.const, layout.levelConstAxis)
      return {
        key: String(levelConst.key),
        // レベル・譜面定数は高い順に並べる
        order: -levelConst.key,
        header: { label: levelConst.label, kind: 'axis' },
        position: { levelConst },
      }
    }
  }
  const groups: readonly string[] =
    dimension === 'genre'
      ? layout.genres
      : dimension === 'version'
        ? layout.versions
        : NAME_FOLDER_KEYS
  const orders = new Map(groups.map((group, index) => [group, index]))
  const labels = layout.labels?.[dimension]
  return (record) => {
    const group = attributesBySongId.get(record.id)?.[dimension]
    const order = group === undefined ? undefined : orders.get(group)
    if (group === undefined || order === undefined) return undefined
    return {
      key: group,
      order,
      header: { label: labels?.get(group) ?? group, kind: 'group' },
      position: toSongDimensionPosition(dimension, group),
    }
  }
}

/**
 * 縦軸と横軸の絞り込み位置を合わせる。
 *
 * @param line - 縦軸の項目の絞り込み位置。
 * @param column - 横軸の項目の絞り込み位置。
 * @returns 両方の条件を持つ位置。どちらかが絞り込めない場合は undefined。
 */
const mergeCellPositions = (
  line: UniFillMatrixCellPosition | undefined,
  column: UniFillMatrixCellPosition | undefined
): UniFillMatrixCellPosition | undefined => line && column && { ...line, ...column }

/**
 * 軸の項目を並び順に並べる。
 *
 * @param items - キーごとの軸の項目。
 * @returns order の昇順に並べた項目。
 */
const sortAxisItems = (items: ReadonlyMap<string, UniFillMatrixAxisItem>) =>
  [...items.values()].sort((left, right) => left.order - right.order)

/**
 * 通常譜面レコードを、選択した縦軸・横軸の属性で集計した表示用の表にする。
 *
 * @param records - 集計対象の通常譜面レコード。
 * @param attributesBySongId - 曲IDごとのジャンル、追加バージョン、名前順フォルダ。
 * @param achievement - 埋め終わりとみなす到達条件。
 * @param layout - 縦軸・横軸の属性、レベル別か譜面定数別か、ジャンル・バージョンの一覧と見出しの表示名。
 * @returns 列見出し、行、最下段の合計行、総合計を持つ表。譜面がない行・列と、どちらかの軸で集計対象外の譜面は含めない。
 */
export const buildUniFillMatrix = (
  records: readonly PlayerRecordDTO[],
  attributesBySongId: ReadonlyMap<string, UniFillMatrixSongAttributes>,
  achievement: PlayerStatsAchievement,
  layout: UniFillMatrixLayout
): UniFillMatrix => {
  const resolveLineItem = createAxisItemResolver(layout.vertical, layout, attributesBySongId)
  const resolveColumnItem = createAxisItemResolver(layout.horizontal, layout, attributesBySongId)
  const lineItems = new Map<string, UniFillMatrixAxisItem>()
  const columnItems = new Map<string, UniFillMatrixAxisItem>()
  const cellsByLine = new Map<string, Map<string, UniFillMatrixCell>>()

  for (const record of records) {
    const lineItem = resolveLineItem(record)
    const columnItem = resolveColumnItem(record)
    if (!lineItem || !columnItem) continue

    lineItems.set(lineItem.key, lineItem)
    columnItems.set(columnItem.key, columnItem)
    const cells = cellsByLine.get(lineItem.key) ?? new Map<string, UniFillMatrixCell>()
    const cell = cells.get(columnItem.key) ?? { count: 0, total: 0 }
    cell.total += 1
    if (hasPlayerStatsAchievement(record, achievement)) cell.count += 1
    cells.set(columnItem.key, cell)
    cellsByLine.set(lineItem.key, cells)
  }

  const sortedColumnItems = sortAxisItems(columnItems)
  const lines = sortAxisItems(lineItems).map((lineItem): UniFillMatrixLine => {
    const cells = cellsByLine.get(lineItem.key)
    const lineCells = sortedColumnItems.map((columnItem) => ({
      cell: cells?.get(columnItem.key) ?? { count: 0, total: 0 },
      position: mergeCellPositions(lineItem.position, columnItem.position),
    }))
    return {
      header: lineItem.header,
      cells: lineCells,
      total: {
        cell: sumUniFillMatrixCells(lineCells.map((gridCell) => gridCell.cell)),
        position: lineItem.position,
      },
    }
  })

  return {
    lineHeaderKind: layout.vertical === 'levelConst' ? 'axis' : 'group',
    columnHeaders: sortedColumnItems.map((columnItem) => columnItem.header),
    lines,
    totals: sortedColumnItems.map((columnItem, index) => ({
      cell: sumUniFillMatrixCells(lines.map((line) => line.cells[index].cell)),
      position: columnItem.position,
    })),
    grandTotal: {
      cell: sumUniFillMatrixCells(lines.map((line) => line.total.cell)),
      position: {},
    },
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
  /** ジャンル。ジャンルの軸を含まないマスや合計のマスでは未指定 */
  genre?: string
  /** 追加バージョン。バージョンの軸を含まないマスや合計のマスでは未指定 */
  version?: string
  /** レベル・譜面定数。レベル・定数の軸を含まないマスや合計のマスでは未指定 */
  levelConst?: UniFillMatrixLevelConst
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
 * @param target - 難易度、埋め条件と、マスが表すジャンル・追加バージョン・レベル・譜面定数。
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
  ...(target.levelConst === undefined
    ? {}
    : {
        const: { ...target.levelConst.constRange },
        constFilterMode: target.levelConst.constFilterMode,
      }),
})

/** レコード画面で絞り込むマスの位置。未指定の軸は絞り込まない */
export type UniFillMatrixCellPosition = Pick<
  UniFillMatrixRecordTarget,
  'genre' | 'version' | 'levelConst'
>

/** 表示用の1マス */
export type UniFillMatrixGridCell = {
  cell: UniFillMatrixCell
  /** レコード画面で絞り込む位置。通常レコードで絞り込めないマスでは未指定 */
  position?: UniFillMatrixCellPosition
}

/** 表示用の1行 */
export type UniFillMatrixLine = {
  header: UniFillMatrixHeader
  cells: UniFillMatrixGridCell[]
  total: UniFillMatrixGridCell
}

/** 縦軸・横軸の属性で集計した表示用の表 */
export type UniFillMatrix = {
  /** 左端の見出しの種類 */
  lineHeaderKind: UniFillMatrixHeader['kind']
  columnHeaders: UniFillMatrixHeader[]
  lines: UniFillMatrixLine[]
  /** 最下段の合計行のマス */
  totals: UniFillMatrixGridCell[]
  grandTotal: UniFillMatrixGridCell
}

/**
 * 縦軸と横軸の属性が交差するマスのチェック数を集計する。
 *
 * @param matrix - 集計済みのマトリクス。合計行・合計列と対象譜面がないマスは数えない。
 * @returns 全件達成マス数をcount、対象譜面があるマス数をtotalとした集計。
 */
export const countUniFillMatrixChecks = (matrix: UniFillMatrix): UniFillMatrixCell => {
  const checks = { count: 0, total: 0 }
  for (const line of matrix.lines) {
    for (const { cell } of line.cells) {
      if (cell.total === 0) continue
      checks.total += 1
      if (cell.count === cell.total) checks.count += 1
    }
  }
  return checks
}

/** マトリクス画像のファイル名の接頭辞 */
const UNI_FILL_MATRIX_IMAGE_FILENAME_PREFIX = 'chunisupport-uni-fill-matrix'

/** 楽曲属性の軸ごとのファイル名の要素 */
const UNI_FILL_MATRIX_IMAGE_FILENAME_SONG_DIMENSION: Record<UniFillMatrixSongDimension, string> = {
  genre: 'genre',
  version: 'version',
  nameFolder: 'name',
}

/**
 * 軸の属性をファイル名の要素へ変換する。
 *
 * @param dimension - 縦軸または横軸の属性。
 * @param levelConstAxis - レベル別または譜面定数別。
 * @returns レベル・定数ではlevelまたはchartConstant、それ以外は属性の名前。
 */
const toImageFilenameDimension = (
  dimension: UniFillMatrixDimension,
  levelConstAxis: PlayerStatsHeatmapAxis
): string =>
  dimension === 'levelConst'
    ? levelConstAxis
    : UNI_FILL_MATRIX_IMAGE_FILENAME_SONG_DIMENSION[dimension]

/**
 * 表示条件と日時を含むマトリクス画像のファイル名を生成する。
 *
 * @param condition - 画像化した難易度・埋め条件・レベル別か譜面定数別か・縦軸・横軸。
 * @param date - ファイル名へ付与する日時。省略時は現在時刻。
 * @returns 難易度・埋め条件・縦軸・横軸・日時を含む小文字のファイル名。
 */
export const formatUniFillMatrixImageFilename = (
  condition: {
    difficulty: UniFillMatrixDifficulty
    achievement: PlayerStatsAchievement
    levelConstAxis: PlayerStatsHeatmapAxis
    vertical: UniFillMatrixDimension
    horizontal: UniFillMatrixDimension
  },
  date: Date = new Date()
): string =>
  [
    UNI_FILL_MATRIX_IMAGE_FILENAME_PREFIX,
    condition.difficulty.replaceAll('_', '-'),
    condition.achievement,
    toImageFilenameDimension(condition.vertical, condition.levelConstAxis),
    toImageFilenameDimension(condition.horizontal, condition.levelConstAxis),
    formatFileTimestamp(date),
  ]
    .join('-')
    .toLowerCase()
    .concat('.png')
