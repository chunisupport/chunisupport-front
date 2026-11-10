import { PLAYER_DATA_DIFFICULTIES, PLAYER_DATA_DIFFICULTY_ORDER } from '../../constants/difficulty'
import type { PlayerDataDifficulty, SongDTO, WorldsendSongDTO } from '../../types/api'
import {
  type ChartLevelLabel,
  getChartLevelSortKey,
  isLowChartLevel,
  toChartLevelLabel,
} from '../../utils/chartLevel'
import { compareSongsByReading } from '../../utils/songTitleSorting'
import type { SortDirection } from '../../utils/sortingQuery'

/** 曲名ソートに必要な読み付きの譜面情報 */
type SongTitleSortEntry = {
  /** 楽曲名 */
  songTitle: string
  /** 楽曲の読み */
  songReading: string | null
}

/**
 * 曲名をレコードと同じく読みベースで比較する。
 *
 * @param left - 比較元の譜面。
 * @param right - 比較先の譜面。
 * @returns 読みの日本語辞書順による比較結果。
 */
const compareSongTitle = (left: SongTitleSortEntry, right: SongTitleSortEntry): number =>
  compareSongsByReading(
    { title: left.songTitle, reading: left.songReading },
    { title: right.songTitle, reading: right.songReading }
  )

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
  /** 楽曲表示ID。楽曲詳細画面へのリンクに利用する */
  songId: string
  /** 楽曲名 */
  songTitle: string
  /** 楽曲の読み。読みベースのソートに利用する */
  songReading: string | null
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

/** データ充足状況で集計する譜面区分 */
export type DataCoverageDifficulty = PlayerDataDifficulty | 'WORLDS_END'

/** データ充足状況で表示する譜面区分 */
export const DATA_COVERAGE_DIFFICULTIES: readonly DataCoverageDifficulty[] = [
  ...PLAYER_DATA_DIFFICULTIES,
  'WORLDS_END',
]

/** 譜面メタデータの集計対象項目 */
export type ChartMetadataCoverageField = 'notes' | 'notesDesigner'

/** 未登録の譜面メタデータ情報 */
export type MissingChartMetadataEntry = {
  /** 楽曲表示ID。楽曲詳細画面へのリンクに利用する */
  songId: string
  /** 楽曲名 */
  songTitle: string
  /** 楽曲の読み。読みベースのソートに利用する */
  songReading: string | null
  /** 譜面区分 */
  difficulty: DataCoverageDifficulty
}

/** ノーツ数またはNOTES DESIGNERの充足状況 */
export type ChartMetadataCoverage = {
  /** 集計対象譜面全体の充足状況 */
  overall: DataCoverageCount
  /** 譜面区分別の充足状況 */
  byDifficulty: Record<DataCoverageDifficulty, DataCoverageCount>
  /** 対象項目が未登録の譜面一覧 */
  missingCharts: MissingChartMetadataEntry[]
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
 * 通常難易度とWORLD'S ENDの空の可変集計値を生成する。
 *
 * @returns 全譜面区分の判明数と総数が0の集計値。
 */
const createMetadataCoverageCounts = (): Record<DataCoverageDifficulty, MutableCoverageCount> => ({
  ...createDifficultyCoverageCounts(),
  WORLDS_END: createMutableCoverageCount(),
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
 * 譜面区分別の可変集計値を表示用集計値へ変換する。
 *
 * @param counts - 通常難易度とWORLD'S ENDの可変集計値。
 * @returns 全譜面区分の充足率を含む集計値。
 */
const toMetadataCoverageCounts = (
  counts: Record<DataCoverageDifficulty, MutableCoverageCount>
): Record<DataCoverageDifficulty, DataCoverageCount> =>
  Object.fromEntries(
    DATA_COVERAGE_DIFFICULTIES.map((difficulty) => [
      difficulty,
      toCoverageCount(counts[difficulty]),
    ])
  ) as Record<DataCoverageDifficulty, DataCoverageCount>

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
 * 既定順の同順内は曲名をレコードと同じく読みベースで並べる。
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
          songId: song.id,
          songTitle: song.title,
          songReading: song.reading,
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

    return compareSongTitle(left, right)
  })

  return {
    overall: toCoverageCount(overall),
    byDifficulty: toDifficultyCoverageCounts(byDifficulty),
    rows,
    unknownCharts,
  }
}

/** NOTES DESIGNERを集計する通常譜面の難易度 */
const NOTES_DESIGNER_DIFFICULTIES = ['EXPERT', 'MASTER', 'ULTIMA'] as const

/** 譜面区分ごとの並び順 */
const DATA_COVERAGE_DIFFICULTY_ORDER: Record<DataCoverageDifficulty, number> = {
  ...PLAYER_DATA_DIFFICULTY_ORDER,
  WORLDS_END: PLAYER_DATA_DIFFICULTIES.length,
}

/**
 * 対象の譜面メタデータが登録済みか判定する。
 *
 * @param field - 集計対象項目。
 * @param notes - ノーツ数。
 * @param notesDesigner - NOTES DESIGNER。
 * @returns 対象項目が登録済みの場合はtrue。
 */
const isChartMetadataKnown = (
  field: ChartMetadataCoverageField,
  notes: number | null | undefined,
  notesDesigner: string | null | undefined
): boolean => (field === 'notes' ? notes != null : Boolean(notesDesigner?.trim()))

/**
 * 通常譜面とWORLD'S END譜面からメタデータの充足状況を集計する。
 *
 * NOTES DESIGNERはBASICとADVANCEDを集計対象に含めない。
 * 通常譜面の必須難易度とWORLD'S END譜面は譜面自体がない場合も未登録として扱い、
 * 任意のULTIMA譜面は存在する場合だけ集計する。
 * 既定順の同順内は曲名をレコードと同じく読みベースで並べる。
 *
 * @param songs - 有効な通常楽曲の一覧。
 * @param worldsendSongs - 有効なWORLD'S END楽曲の一覧。
 * @param field - 集計する譜面メタデータ。
 * @returns 全体、譜面区分別の充足状況と未登録譜面一覧。
 */
export const buildChartMetadataCoverage = (
  songs: SongDTO[],
  worldsendSongs: WorldsendSongDTO[],
  field: ChartMetadataCoverageField
): ChartMetadataCoverage => {
  const overall = createMutableCoverageCount()
  const byDifficulty = createMetadataCoverageCounts()
  const missingCharts: MissingChartMetadataEntry[] = []
  const standardDifficulties =
    field === 'notes' ? PLAYER_DATA_DIFFICULTIES : NOTES_DESIGNER_DIFFICULTIES

  for (const song of songs) {
    for (const difficulty of standardDifficulties) {
      const chart = song.charts[difficulty]
      if (!chart && difficulty === 'ULTIMA') continue

      const isKnown = isChartMetadataKnown(field, chart?.notes, chart?.notes_designer)
      addChart(overall, isKnown)
      addChart(byDifficulty[difficulty], isKnown)

      if (!isKnown)
        missingCharts.push({
          songId: song.id,
          songTitle: song.title,
          songReading: song.reading,
          difficulty,
        })
    }
  }

  for (const song of worldsendSongs) {
    const chart = song.charts.WORLDSEND
    const difficulty = 'WORLDS_END'
    const isKnown = isChartMetadataKnown(field, chart?.notes, chart?.notes_designer)
    addChart(overall, isKnown)
    addChart(byDifficulty[difficulty], isKnown)

    if (!isKnown)
      missingCharts.push({
        songId: song.id,
        songTitle: song.title,
        songReading: song.reading,
        difficulty,
      })
  }

  missingCharts.sort((left, right) => {
    const difficultyOrder =
      DATA_COVERAGE_DIFFICULTY_ORDER[left.difficulty] -
      DATA_COVERAGE_DIFFICULTY_ORDER[right.difficulty]
    if (difficultyOrder !== 0) return difficultyOrder

    return compareSongTitle(left, right)
  })

  return {
    overall: toCoverageCount(overall),
    byDifficulty: toMetadataCoverageCounts(byDifficulty),
    missingCharts,
  }
}

/** 未判明譜面表でソート可能な列 */
export type UnknownChartsSortKey = 'songTitle' | 'difficulty' | 'level'

/** 未登録譜面表でソート可能な列 */
export type MissingChartsSortKey = 'songTitle' | 'difficulty'

/**
 * ソート方向を比較結果へ反映する。
 *
 * @param order - 昇順基準の比較結果。
 * @param direction - 現在のソート方向。
 * @returns 方向を反映した比較結果。
 */
const applySortDirection = (order: number, direction: SortDirection): number =>
  direction === 'desc' ? -order : order

/**
 * 未判明譜面2件をソートキー順で比較する。
 *
 * 曲名はレコードと同じく読みベースで比較する。
 * 同値の場合は難易度、レベル、曲名の順で順序を確定する。
 *
 * @param left - 比較元の未判明譜面。
 * @param right - 比較先の未判明譜面。
 * @param sortKey - ソート対象の列。
 * @returns ソートキー順による比較結果。
 */
const compareUnknownCharts = (
  left: UnknownChartConstantEntry,
  right: UnknownChartConstantEntry,
  sortKey: UnknownChartsSortKey
): number => {
  if (sortKey === 'difficulty') {
    const difficultyOrder =
      PLAYER_DATA_DIFFICULTY_ORDER[left.difficulty] - PLAYER_DATA_DIFFICULTY_ORDER[right.difficulty]
    if (difficultyOrder !== 0) return difficultyOrder
    const levelOrder = getChartLevelSortKey(left.level) - getChartLevelSortKey(right.level)
    if (levelOrder !== 0) return levelOrder
    return compareSongTitle(left, right)
  }

  if (sortKey === 'level') {
    const levelOrder = getChartLevelSortKey(left.level) - getChartLevelSortKey(right.level)
    if (levelOrder !== 0) return levelOrder
    const difficultyOrder =
      PLAYER_DATA_DIFFICULTY_ORDER[left.difficulty] - PLAYER_DATA_DIFFICULTY_ORDER[right.difficulty]
    if (difficultyOrder !== 0) return difficultyOrder
    return compareSongTitle(left, right)
  }

  const titleOrder = compareSongTitle(left, right)
  if (titleOrder !== 0) return titleOrder
  const difficultyOrder =
    PLAYER_DATA_DIFFICULTY_ORDER[left.difficulty] - PLAYER_DATA_DIFFICULTY_ORDER[right.difficulty]
  if (difficultyOrder !== 0) return difficultyOrder
  return getChartLevelSortKey(left.level) - getChartLevelSortKey(right.level)
}

/**
 * 未登録譜面2件をソートキー順で比較する。
 *
 * 曲名はレコードと同じく読みベースで比較する。
 * 同値の場合は残りの列で順序を確定する。
 *
 * @param left - 比較元の未登録譜面。
 * @param right - 比較先の未登録譜面。
 * @param sortKey - ソート対象の列。
 * @returns ソートキー順による比較結果。
 */
const compareMissingCharts = (
  left: MissingChartMetadataEntry,
  right: MissingChartMetadataEntry,
  sortKey: MissingChartsSortKey
): number => {
  if (sortKey === 'difficulty') {
    const difficultyOrder =
      DATA_COVERAGE_DIFFICULTY_ORDER[left.difficulty] -
      DATA_COVERAGE_DIFFICULTY_ORDER[right.difficulty]
    if (difficultyOrder !== 0) return difficultyOrder
    return compareSongTitle(left, right)
  }

  const titleOrder = compareSongTitle(left, right)
  if (titleOrder !== 0) return titleOrder
  return (
    DATA_COVERAGE_DIFFICULTY_ORDER[left.difficulty] -
    DATA_COVERAGE_DIFFICULTY_ORDER[right.difficulty]
  )
}

/**
 * 未判明譜面一覧を指定列で並べ替える。
 *
 * ソート未指定時は集計時の既定順を維持した複製を返す。
 *
 * @param charts - 未判明譜面一覧。
 * @param sortKey - ソート対象の列。未指定時は既定順を維持する。
 * @param sortDirection - ソート方向。未指定時は既定順を維持する。
 * @returns 並べ替えた未判明譜面一覧。
 */
export const sortUnknownCharts = (
  charts: readonly UnknownChartConstantEntry[],
  sortKey: UnknownChartsSortKey | null,
  sortDirection: SortDirection | null
): UnknownChartConstantEntry[] => {
  if (sortKey === null || sortDirection === null) return [...charts]

  return [...charts].sort((left, right) =>
    applySortDirection(compareUnknownCharts(left, right, sortKey), sortDirection)
  )
}

/**
 * 未登録譜面一覧を指定列で並べ替える。
 *
 * ソート未指定時は集計時の既定順を維持した複製を返す。
 *
 * @param charts - 未登録譜面一覧。
 * @param sortKey - ソート対象の列。未指定時は既定順を維持する。
 * @param sortDirection - ソート方向。未指定時は既定順を維持する。
 * @returns 並べ替えた未登録譜面一覧。
 */
export const sortMissingCharts = (
  charts: readonly MissingChartMetadataEntry[],
  sortKey: MissingChartsSortKey | null,
  sortDirection: SortDirection | null
): MissingChartMetadataEntry[] => {
  if (sortKey === null || sortDirection === null) return [...charts]

  return [...charts].sort((left, right) =>
    applySortDirection(compareMissingCharts(left, right, sortKey), sortDirection)
  )
}
