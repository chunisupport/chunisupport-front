/** 楽曲詳細の外部リンク文言 */
export const SONG_DETAIL_LINK_COPY = {
  wiki: 'Wiki',
  wikiAriaLabel: 'Wikiで楽曲ページを開く',
  youtube: 'YouTubeで検索',
  youtubeAriaLabel: 'YouTubeで楽曲を検索する',
} as const

/** 楽曲一覧で選択できる表示形式 */
export type SongListViewMode = 'card' | 'table'

/** 楽曲一覧の初期表示形式 */
export const DEFAULT_SONG_LIST_VIEW_MODE: SongListViewMode = 'card'
