import type { SortDirection } from '../../../utils/sortingQuery'
import type { WorldsendSongSortKey } from '../WorldsendSongsList/utils/sorting'

/** WORLD'S END カード型楽曲一覧の表示文言 */
export const WORLDSEND_SONG_CARD_COPY = {
  pageTitle: "WORLD'S END 楽曲一覧",
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
  sortAttribute: '属性',
  sortLevel: 'レベル',
  sortNotes: 'ノーツ',
  sortAsc: '昇順',
  sortDesc: '降順',
  genreLabel: 'GENRE',
  bpmLabel: 'BPM',
  releaseLabel: 'RELEASE',
} as const

/** 未設定時の表示 */
export const WORLDSEND_SONG_CARD_EMPTY = '-'

/** WORLD'S END カードの星表示に使う文字 */
export const WORLDSEND_SONG_CARD_STAR = '★'

/** WORLD'S END カード一覧のソート選択肢 */
export type WorldsendSongCardSortOption = {
  id: string
  label: string
  sortKey: WorldsendSongSortKey | null
}

/** WORLD'S END カード一覧のソート方向選択肢 */
export type WorldsendSongCardSortDirectionOption = {
  value: SortDirection
  label: string
}

/** カード一覧で選択できるソートキー */
export const WORLDSEND_SONG_CARD_SORT_OPTIONS: WorldsendSongCardSortOption[] = [
  {
    id: 'default',
    label: WORLDSEND_SONG_CARD_COPY.sortDefault,
    sortKey: null,
  },
  {
    id: 'title',
    label: WORLDSEND_SONG_CARD_COPY.sortTitle,
    sortKey: 'title',
  },
  {
    id: 'artist',
    label: WORLDSEND_SONG_CARD_COPY.sortArtist,
    sortKey: 'artist',
  },
  {
    id: 'genre',
    label: WORLDSEND_SONG_CARD_COPY.sortGenre,
    sortKey: 'genre',
  },
  {
    id: 'release',
    label: WORLDSEND_SONG_CARD_COPY.sortRelease,
    sortKey: 'release',
  },
  {
    id: 'bpm',
    label: WORLDSEND_SONG_CARD_COPY.sortBpm,
    sortKey: 'bpm',
  },
  {
    id: 'attribute',
    label: WORLDSEND_SONG_CARD_COPY.sortAttribute,
    sortKey: 'attribute',
  },
  {
    id: 'level',
    label: WORLDSEND_SONG_CARD_COPY.sortLevel,
    sortKey: 'level',
  },
  {
    id: 'notes',
    label: WORLDSEND_SONG_CARD_COPY.sortNotes,
    sortKey: 'notes',
  },
]

/** 初期選択するソートキー（追加日降順の既定順） */
export const WORLDSEND_SONG_CARD_DEFAULT_SORT_OPTION_ID = 'default'

/** カード一覧のソート方向選択肢 */
export const WORLDSEND_SONG_CARD_SORT_DIRECTION_OPTIONS: WorldsendSongCardSortDirectionOption[] = [
  { value: 'asc', label: WORLDSEND_SONG_CARD_COPY.sortAsc },
  { value: 'desc', label: WORLDSEND_SONG_CARD_COPY.sortDesc },
]
