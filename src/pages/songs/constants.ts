/** 楽曲詳細の外部リンク文言 */
export const SONG_DETAIL_LINK_COPY = {
  wiki: 'Wiki',
  wikiAriaLabel: 'Wikiで楽曲ページを開く',
  youtube: 'YouTube',
  youtubeAriaLabel: 'YouTubeで楽曲を検索する',
} as const

/** 楽曲一覧で選択できる表示形式 */
export type SongListViewMode = 'card' | 'table'

/** 楽曲一覧の初期表示形式 */
export const DEFAULT_SONG_LIST_VIEW_MODE: SongListViewMode = 'card'

/** 楽曲詳細のお気に入り操作に用いる文言 */
export const SONG_DETAIL_FAVORITE_COPY = {
  label: 'お気に入り楽曲',
  add: 'お気に入りに登録',
  remove: 'お気に入りから解除',
  loginRequired: 'ログインしてお気に入りに登録',
  loadError: 'お気に入り楽曲を取得できませんでした。',
  saveError: 'お気に入り楽曲を更新できませんでした。',
} as const

/** 楽曲詳細の未解禁設定に用いる文言 */
export const SONG_DETAIL_LOCKED_COPY = {
  normalLabel: '楽曲全体の未解禁設定',
  ultimaLabel: 'ULTIMAの未解禁設定',
  lock: '未解禁に設定',
  unlock: '解禁済みに設定',
  ultimaLock: '未解禁に設定 (ULTIMA)',
  ultimaUnlock: '解禁済みに設定 (ULTIMA)',
  loginRequired: 'ログインして解禁状態を設定',
  loadError: '未解禁設定を取得できませんでした。',
  saveError: '未解禁設定を更新できませんでした。',
  ultimaBadge: 'ULT',
} as const
