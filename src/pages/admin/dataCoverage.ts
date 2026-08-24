import { PLAYER_DATA_DIFFICULTIES, PLAYER_DATA_DIFFICULTY_ORDER } from '../../constants/difficulty'
import type { PlayerDataDifficulty, SongDTO } from '../../types/api'
import {
  type ChartLevelLabel,
  getChartLevelSortKey,
  isLowChartLevel,
  toChartLevelLabel,
} from '../../utils/chartLevel'

/** 判明件数、母数、充足率をまとめた集計値 */
export type DataCoverageCount = {
  /** 判明している譜面数 */
  known: number
  /** 集計対象の譜面総数 */
  total: number
  /** 0から100までの充足率 */
  percent: number
}

/** レベル1行分の難易度別譜面定数充足状況 */
export type ChartConstantCoverageRow = {
  /** 推定値を含む登録定数から算出した譜面レベル */
  level: ChartLevelLabel
  /** 難易度別の充足状況 */
  byDifficulty: Record<PlayerDataDifficulty, DataCoverageCount>
  /** 行全体の充足状況 */
  total: DataCoverageCount
}

/** 譜面定数が未判明の譜面情報 */
export type UnknownChartConstantEntry = {
  /** 楽曲名 */
  songTitle: string
  /** 譜面難易度 */
  difficulty: PlayerDataDifficulty
  /** 確定している譜面レベル */
  level: ChartLevelLabel
}

/** レベル10以上の譜面定数充足状況ダッシュボードに必要な集計結果 */
export type ChartConstantCoverage = {
  /** レベル10以上の全譜面の充足状況 */
  overall: DataCoverageCount
  /** 難易度別の充足状況 */
  byDifficulty: Record<PlayerDataDifficulty, DataCoverageCount>
  /** レベル別・難易度別の充足状況 */
  rows: ChartConstantCoverageRow[]
  /** 譜面定数が未判明の譜面一覧 */
  unknownCharts: UnknownChartConstantEntry[]
}

type MutableCoverageCount = {
  known: number
  total: number
}

type MutableCoverageRow = {
  byDifficulty: Record<PlayerDataDifficulty, MutableCoverageCount>
  total: MutableCoverageCount
}

/**
 * 空の可変集計値を生成する。
 *
 * @returns 判明数と総数が0の集計値。
 */
const createMutableCoverageCount = (): MutableCoverageCount => ({ known: 0, total: 0 })

/**
 * 難易度ごとの空の可変集計値を生成する。
 *
 * @returns 全難易度の判明数と総数が0の集計値。
 */
const createDifficultyCoverageCounts = (): Record<PlayerDataDifficulty, MutableCoverageCount> => ({
  BASIC: createMutableCoverageCount(),
  ADVANCED: createMutableCoverageCount(),
  EXPERT: createMutableCoverageCount(),
  MASTER: createMutableCoverageCount(),
  ULTIMA: createMutableCoverageCount(),
})

/**
 * 可変集計値を充足率付きの表示用集計値へ変換する。
 *
 * @param count - 判明数と総数を保持する可変集計値。
 * @returns 0から100までの充足率を含む集計値。
 */
const toCoverageCount = (count: MutableCoverageCount): DataCoverageCount => ({
  ...count,
  percent: count.total > 0 ? (count.known / count.total) * 100 : 0,
})

/**
 * 難易度別の可変集計値を表示用集計値へ変換する。
 *
 * @param counts - 難易度別の可変集計値。
 * @returns 全難易度の充足率を含む集計値。
 */
const toDifficultyCoverageCounts = (
  counts: Record<PlayerDataDifficulty, MutableCoverageCount>
): Record<PlayerDataDifficulty, DataCoverageCount> =>
  Object.fromEntries(
    PLAYER_DATA_DIFFICULTIES.map((difficulty) => [difficulty, toCoverageCount(counts[difficulty])])
  ) as Record<PlayerDataDifficulty, DataCoverageCount>

/**
 * 対象譜面を集計値へ加算する。
 *
 * @param count - 更新する可変集計値。
 * @param isKnown - 譜面定数が判明している場合はtrue。
 * @returns なし。
 */
const addChart = (count: MutableCoverageCount, isKnown: boolean): void => {
  count.total += 1
  if (isKnown) count.known += 1
}

/**
 * 通常楽曲からレベル10以上の譜面定数充足状況を集計する。
 *
 * 未判明譜面のレベル分類にはAPIへ登録済みの推定定数を利用する。
 *
 * @param songs - 有効な通常楽曲の一覧。
 * @returns レベル10以上の全体、難易度別、レベル別の充足状況と未判明譜面一覧。
 */
export const buildChartConstantCoverage = (songs: SongDTO[]): ChartConstantCoverage => {
  const overall = createMutableCoverageCount()
  const byDifficulty = createDifficultyCoverageCounts()
  const rowsByLevel = new Map<ChartLevelLabel, MutableCoverageRow>()
  const unknownCharts: UnknownChartConstantEntry[] = []

  for (const song of songs) {
    for (const difficulty of PLAYER_DATA_DIFFICULTIES) {
      const chart = song.charts[difficulty]
      if (!chart) continue

      const level = toChartLevelLabel(chart.const)
      if (isLowChartLevel(level)) continue

      const row = rowsByLevel.get(level) ?? {
        byDifficulty: createDifficultyCoverageCounts(),
        total: createMutableCoverageCount(),
      }
      const isKnown = !chart.is_const_unknown

      addChart(overall, isKnown)
      addChart(byDifficulty[difficulty], isKnown)
      addChart(row.byDifficulty[difficulty], isKnown)
      addChart(row.total, isKnown)
      rowsByLevel.set(level, row)

      if (!isKnown) {
        unknownCharts.push({
          songTitle: song.title,
          difficulty,
          level,
        })
      }
    }
  }

  const rows = [...rowsByLevel.entries()]
    .map(([level, row]) => ({
      level,
      byDifficulty: toDifficultyCoverageCounts(row.byDifficulty),
      total: toCoverageCount(row.total),
    }))
    .sort((left, right) => getChartLevelSortKey(left.level) - getChartLevelSortKey(right.level))

  unknownCharts.sort((left, right) => {
    const levelOrder = getChartLevelSortKey(left.level) - getChartLevelSortKey(right.level)
    if (levelOrder !== 0) return levelOrder

    const difficultyOrder =
      PLAYER_DATA_DIFFICULTY_ORDER[left.difficulty] - PLAYER_DATA_DIFFICULTY_ORDER[right.difficulty]
    if (difficultyOrder !== 0) return difficultyOrder

    return left.songTitle.localeCompare(right.songTitle, 'ja')
  })

  return {
    overall: toCoverageCount(overall),
    byDifficulty: toDifficultyCoverageCounts(byDifficulty),
    rows,
    unknownCharts,
  }
}
