import { DIFFICULTY_SHORT_NAME_MAP, PLAYER_DATA_DIFFICULTIES } from '../../../constants/difficulty'
import type { SortDirection } from '../../../utils/sortingQuery'
import type { SongChartDisplayMode } from '../SongsList/constants'
import type { SongSortKey } from '../SongsList/utils/sorting'

/** カード型楽曲一覧の表示文言 */
export const SONG_CARD_COPY = {
  pageTitle: '楽曲一覧',
  countSuffix: '件',
  empty: '表示できる楽曲がありません。',
  sortKeyLabel: 'ソート',
  sortDirectionLabel: '並び順',
  sortDefault: '標準',
  sortTitle: 'タイトル',
  sortArtist: 'アーティスト',
  sortGenre: 'ジャンル',
  sortRelease: '追加日',
  sortBpm: 'BPM',
  sortConstSuffix: '定数',
  sortNotesSuffix: 'ノーツ',
  sortAsc: '昇順',
  sortDesc: '降順',
  genreLabel: 'GENRE',
  bpmLabel: 'BPM',
  releaseLabel: 'RELEASE',
} as const

/** カード行間の隙間（px） */
export const SONG_CARD_ROW_GAP_PX = 16

/** カード列間の隙間（px） */
export const SONG_CARD_COLUMN_GAP_PX = 16

/** 一覧ページ左右パディング合計（px） */
export const SONG_CARD_PAGE_HORIZONTAL_PADDING_PX = 32

/** FHD全幅時のメイン領域幅（px） */
export const SONG_CARD_FHD_MAIN_WIDTH_PX = 1801

/** FHD全幅時のページ本文幅（px）。p-4 内側 */
export const SONG_CARD_FHD_CONTENT_WIDTH_PX =
  SONG_CARD_FHD_MAIN_WIDTH_PX - SONG_CARD_PAGE_HORIZONTAL_PADDING_PX

/** FHD全幅時に並べるカード枚数 */
export const SONG_CARD_FHD_COLUMN_COUNT = 4

/** カード1枚の固定幅（px）。FHD本文幅で4枚になる値 */
export const SONG_CARD_WIDTH_PX =
  (SONG_CARD_FHD_CONTENT_WIDTH_PX - SONG_CARD_COLUMN_GAP_PX * (SONG_CARD_FHD_COLUMN_COUNT - 1)) /
  SONG_CARD_FHD_COLUMN_COUNT

/** ジャケット領域の高さ（px） */
export const SONG_CARD_JACKET_HEIGHT_PX = 128
/** カード下部の難易度行の高さ（px） */
export const SONG_CARD_CHART_ROW_HEIGHT_PX = 40

/** カード1枚の高さ（px） */
export const SONG_CARD_HEIGHT_PX = SONG_CARD_JACKET_HEIGHT_PX + SONG_CARD_CHART_ROW_HEIGHT_PX

/** 仮想行の見積もり高さ（カード高 + 行間） */
export const SONG_CARD_ROW_HEIGHT_PX = SONG_CARD_HEIGHT_PX + SONG_CARD_ROW_GAP_PX

/** 仮想化の前後に追加描画する行数 */
export const SONG_CARD_GRID_OVERSCAN = 4

/** ノーツ数が未設定のときに表示するプレースホルダ */
export const SONG_CARD_NOTES_EMPTY = '-'

/** カード一覧のソート選択肢 */
export type SongCardSortOption = {
  id: string
  label: string
  sortKey: SongSortKey | null
  chartMetric: SongChartDisplayMode
}

/** カード一覧のソート方向選択肢 */
export type SongCardSortDirectionOption = {
  value: SortDirection
  label: string
}

const META_SORT_OPTIONS: SongCardSortOption[] = [
  {
    id: 'default',
    label: SONG_CARD_COPY.sortDefault,
    sortKey: null,
    chartMetric: 'const',
  },
  {
    id: 'title',
    label: SONG_CARD_COPY.sortTitle,
    sortKey: 'title',
    chartMetric: 'const',
  },
  {
    id: 'artist',
    label: SONG_CARD_COPY.sortArtist,
    sortKey: 'artist',
    chartMetric: 'const',
  },
  {
    id: 'genre',
    label: SONG_CARD_COPY.sortGenre,
    sortKey: 'genre',
    chartMetric: 'const',
  },
  {
    id: 'release',
    label: SONG_CARD_COPY.sortRelease,
    sortKey: 'release',
    chartMetric: 'const',
  },
  {
    id: 'bpm',
    label: SONG_CARD_COPY.sortBpm,
    sortKey: 'bpm',
    chartMetric: 'const',
  },
]

const CHART_SORT_OPTIONS: SongCardSortOption[] = PLAYER_DATA_DIFFICULTIES.flatMap((difficulty) => {
  const shortName = DIFFICULTY_SHORT_NAME_MAP[difficulty]
  const sortKey = difficulty.toLowerCase() as SongSortKey
  return [
    {
      id: `${sortKey}-const`,
      label: `${shortName}${SONG_CARD_COPY.sortConstSuffix}`,
      sortKey,
      chartMetric: 'const',
    },
    {
      id: `${sortKey}-notes`,
      label: `${shortName}${SONG_CARD_COPY.sortNotesSuffix}`,
      sortKey,
      chartMetric: 'notes',
    },
  ]
})

/** カード一覧で選択できるソートキー */
export const SONG_CARD_SORT_OPTIONS: SongCardSortOption[] = [
  ...META_SORT_OPTIONS,
  ...CHART_SORT_OPTIONS,
]

/** 初期選択するソートキー（追加日降順の既定順） */
export const SONG_CARD_DEFAULT_SORT_OPTION_ID = 'default'

/** カード一覧のソート方向選択肢 */
export const SONG_CARD_SORT_DIRECTION_OPTIONS: SongCardSortDirectionOption[] = [
  { value: 'asc', label: SONG_CARD_COPY.sortAsc },
  { value: 'desc', label: SONG_CARD_COPY.sortDesc },
]
