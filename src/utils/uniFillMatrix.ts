import type { PlayerStatsHeatmapAxis } from '../constants/playerStats'
import type { PlayerRecordDTO } from '../types/api'
import { formatChartConst, truncateChartConst } from './chartConstFormat'
import { getChartLevelSortKey, toChartLevelLabel } from './chartLevel'
import { hasPlayerStatsAchievement, type PlayerStatsAchievement } from './playerStatsDashboard'

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
 * @returns 並び替え用のキーと表示ラベル。
 */
const toUniFillMatrixColumn = (
  chartConst: number,
  axis: PlayerStatsHeatmapAxis
): UniFillMatrixColumn => {
  if (axis === 'level') {
    const level = toChartLevelLabel(chartConst)
    return { key: getChartLevelSortKey(level), label: level }
  }
  const truncated = truncateChartConst(chartConst)
  return { key: truncated, label: formatChartConst(truncated) }
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
