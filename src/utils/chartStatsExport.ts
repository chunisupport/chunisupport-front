import { CHART_STATS_FILE_KEYS, CHART_STATS_STANDARD_DIFFICULTIES } from '../constants/chartStats'
import type {
  ChartStats,
  ChartStatsClear,
  ChartStatsCombo,
  ChartStatsDifficulty,
  ChartStatsRank,
  ChartStatsResponse,
} from '../types/chartStats'
import { isWorldsendChartStats } from './chartStats'
import { type DelimitedTextCell, formatDelimitedText } from './delimitedText'
import { formatJstCompactDate } from './jstDateTime'

/** レコード統計のダウンロード形式 */
export type ChartStatsExportFormat = 'json' | 'csv' | 'tsv'

/** ダウンロード用に生成したファイル */
export type ChartStatsExportFile = {
  /** ファイル内容 */
  blob: Blob
  /** 拡張子付きファイル名 */
  filename: string
}

/** ダウンロードファイル名の接頭辞 */
const CHART_STATS_EXPORT_FILENAME_PREFIX = 'chart-stats'

/** 通常難易度をすべて選んだときにファイル名へ入れる識別子 */
const CHART_STATS_EXPORT_ALL_KEY = 'ALL'

/** Excelで日本語を文字化けさせずに開くためのUTF-8 BOM */
const UTF8_BOM = '\uFEFF'

/** 形式ごとのMIMEタイプ */
const CHART_STATS_EXPORT_MIME_TYPES: Record<ChartStatsExportFormat, string> = {
  json: 'application/json',
  csv: 'text/csv;charset=utf-8',
  tsv: 'text/tab-separated-values;charset=utf-8',
}

/** ランクの列順（上位から） */
const RANK_KEYS: readonly (keyof ChartStatsRank)[] = [
  'max',
  'sssp',
  'sss',
  'ssp',
  'ss',
  'sp',
  's',
  'aaal',
]

/** クリアランプの列順（上位から） */
const CLEAR_KEYS: readonly (keyof ChartStatsClear)[] = [
  'catastrophy',
  'absolute',
  'brave',
  'hard',
  'clear',
  'failed',
]

/** コンボランプの列順（上位から） */
const COMBO_KEYS: readonly (keyof ChartStatsCombo)[] = ['ajc', 'aj', 'fc', 'none']

/** 通常譜面のレベル情報列 */
const STANDARD_LEVEL_COLUMNS = ['const', 'is_const_unknown'] as const

/** WORLD'S END譜面のレベル情報列 */
const WORLDSEND_LEVEL_COLUMNS = ['level_star', 'attribute'] as const

/**
 * 譜面のレベル情報を取り出す。
 *
 * @param chart - 書き出す譜面統計。
 * @returns 通常譜面は定数と未判明フラグ、WORLD'S ENDは星数と属性。
 */
const getLevelCells = (chart: ChartStats): DelimitedTextCell[] =>
  isWorldsendChartStats(chart)
    ? [chart.level_star, chart.attribute]
    : [chart.const, chart.is_const_unknown]

/**
 * 複数難易度のレコード統計を1譜面1行の表形式へ平坦化して連結する。
 *
 * 通常譜面とWORLD'S ENDはレベル情報の列が異なるため、同じファイルに混在させない。
 * 値は画面の表示設定に関係なく、静的JSONと同じ排他的な人数を書き出す。
 *
 * @param statsList - 書き出す難易度別の統計。通常難易度だけ、またはWORLD'S ENDだけであること。
 *   `charts` は書き出す譜面だけに絞り込み済みであること。
 * @returns ヘッダー行を先頭に含む行の配列。
 */
export const buildChartStatsExportRows = (
  statsList: readonly ChartStatsResponse[]
): DelimitedTextCell[][] => [
  [
    'difficulty',
    'song_id',
    'title',
    ...(statsList.some((stats) => stats.difficulty === "WORLD'S END")
      ? WORLDSEND_LEVEL_COLUMNS
      : STANDARD_LEVEL_COLUMNS),
    'player_count',
    ...RANK_KEYS.map((key) => `rank_${key}`),
    ...CLEAR_KEYS.map((key) => `clear_${key}`),
    ...COMBO_KEYS.map((key) => `combo_${key}`),
  ],
  ...statsList.flatMap((stats) =>
    stats.charts.map((chart) => [
      stats.difficulty,
      chart.song_id,
      chart.title,
      ...getLevelCells(chart),
      chart.player_count,
      ...RANK_KEYS.map((key) => chart.rank[key]),
      ...CLEAR_KEYS.map((key) => chart.clear[key]),
      ...COMBO_KEYS.map((key) => chart.combo[key]),
    ])
  ),
]

/**
 * レコード統計のダウンロードファイル名を生成する。
 *
 * @param statsList - 書き出す難易度別の統計。
 * @param format - ダウンロード形式。
 * @returns `chart-stats_BASIC-MASTER_20261109.csv` 形式のファイル名。通常難易度をすべて選んだ場合は
 *   `ALL`、生成日時がすべて不正な場合は日付を省く。
 */
export const buildChartStatsExportFilename = (
  statsList: readonly Pick<ChartStatsResponse, 'difficulty' | 'generated_at'>[],
  format: ChartStatsExportFormat
): string => {
  const isAll = CHART_STATS_STANDARD_DIFFICULTIES.every((difficulty) =>
    statsList.some((stats) => stats.difficulty === difficulty)
  )
  const difficultyKey = isAll
    ? CHART_STATS_EXPORT_ALL_KEY
    : statsList.map((stats) => CHART_STATS_FILE_KEYS[stats.difficulty]).join('-')
  const [latestDate] = statsList
    .map((stats) => formatJstCompactDate(stats.generated_at))
    .filter((date) => date !== null)
    .sort()
    .reverse()
  const parts = [CHART_STATS_EXPORT_FILENAME_PREFIX, difficultyKey, latestDate]
  return `${parts.filter((part) => part !== undefined).join('_')}.${format}`
}

/**
 * レコード統計を指定形式のファイル内容へ変換する。
 *
 * JSONは `{ stats: [静的統計JSON, ...] }` の形で、難易度ごとの生成日時を保つ。
 * CSVとTSVは `difficulty` 列を先頭に足して連結し、Excelで開けるようUTF-8 BOMを付ける。
 *
 * @param statsList - 書き出す難易度別の統計。`charts` は書き出す譜面だけに絞り込み済みであること。
 * @param format - ダウンロード形式。
 * @returns ファイル内容の文字列。
 */
export const formatChartStatsExportContent = (
  statsList: readonly ChartStatsResponse[],
  format: ChartStatsExportFormat
): string => {
  if (format === 'json') return JSON.stringify({ stats: statsList }, null, 2)
  const rows = buildChartStatsExportRows(statsList)
  return `${UTF8_BOM}${formatDelimitedText(rows, format === 'csv' ? ',' : '\t')}`
}

/**
 * レコード統計のダウンロードファイルを生成する。
 *
 * @param statsList - 書き出す難易度別の統計。`charts` は書き出す譜面だけに絞り込み済みであること。
 * @param format - ダウンロード形式。
 * @returns ファイル内容とファイル名。
 */
export const createChartStatsExportFile = (
  statsList: readonly ChartStatsResponse[],
  format: ChartStatsExportFormat
): ChartStatsExportFile => ({
  blob: new Blob([formatChartStatsExportContent(statsList, format)], {
    type: CHART_STATS_EXPORT_MIME_TYPES[format],
  }),
  filename: buildChartStatsExportFilename(statsList, format),
})

/**
 * ダウンロード対象の難易度選択を切り替える。
 *
 * 通常難易度とWORLD'S ENDは列構成が異なるため同時に選べない。WORLD'S ENDを選ぶと通常難易度の選択を外し、
 * 通常難易度を選ぶとWORLD'S ENDの選択を外す。並びは常に難易度の表示順に揃える。
 *
 * @param current - 現在選択中の難易度。
 * @param difficulty - 切り替える難易度。
 * @param checked - 選択するか。
 * @returns 切り替え後の難易度（表示順）。
 */
export const toggleChartStatsExportDifficulty = (
  current: readonly ChartStatsDifficulty[],
  difficulty: ChartStatsDifficulty,
  checked: boolean
): ChartStatsDifficulty[] => {
  if (!checked) return current.filter((value) => value !== difficulty)
  if (difficulty === "WORLD'S END") return [difficulty]
  const next = new Set<ChartStatsDifficulty>([...current, difficulty])
  return CHART_STATS_STANDARD_DIFFICULTIES.filter((value) => next.has(value))
}
