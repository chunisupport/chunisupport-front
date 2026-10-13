import {
  DEFAULT_SONG_LIST_VIEW_MODE,
  SONG_LIST_VIEW_MODE_STORAGE_KEY,
  type SongListViewMode,
} from './constants'

/**
 * 楽曲一覧の表示形式を localStorage から読み取る。
 *
 * @returns 保存済みの表示形式。未設定・不正値・読み取り失敗時は既定値。
 */
export const readSongListViewMode = (): SongListViewMode => {
  try {
    const value = window.localStorage.getItem(SONG_LIST_VIEW_MODE_STORAGE_KEY)
    if (value === 'card' || value === 'table') return value
  } catch {
    return DEFAULT_SONG_LIST_VIEW_MODE
  }
  return DEFAULT_SONG_LIST_VIEW_MODE
}

/**
 * 楽曲一覧の表示形式を localStorage へ保存する。
 *
 * @param mode - 保存する表示形式。
 * @returns なし。
 */
export const saveSongListViewMode = (mode: SongListViewMode): void => {
  try {
    window.localStorage.setItem(SONG_LIST_VIEW_MODE_STORAGE_KEY, mode)
  } catch {
    // 保存できない環境でも、現在の表示形式は画面上で維持する。
  }
}
