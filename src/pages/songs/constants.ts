import { localizedCopy } from '../../i18n'
/** 楽曲詳細の外部リンク文言 */
export const SONG_DETAIL_LINK_COPY = localizedCopy('songs.detailLinks')

/** 楽曲一覧で選択できる表示形式 */
export type SongListViewMode = 'card' | 'table'

/** 楽曲一覧の初期表示形式 */
export const DEFAULT_SONG_LIST_VIEW_MODE: SongListViewMode = 'card'
