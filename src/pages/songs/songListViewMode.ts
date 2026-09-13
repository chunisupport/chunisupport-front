import { createSignal } from 'solid-js'
import { DEFAULT_SONG_LIST_VIEW_MODE, type SongListViewMode } from './constants'

const [currentSongListViewMode, setCurrentSongListViewMode] = createSignal<SongListViewMode>(
  DEFAULT_SONG_LIST_VIEW_MODE
)

/**
 * 現在の通常曲・WORLD'S END 共通の一覧表示形式を返す。
 *
 * @returns 現在の一覧表示形式。
 */
export const songListViewMode = currentSongListViewMode

/**
 * 通常曲・WORLD'S END 共通の一覧表示形式を反転する。
 *
 * @returns 切り替え後の表示形式。
 */
export const toggleSongListViewMode = (): SongListViewMode => {
  const nextMode = currentSongListViewMode() === 'card' ? 'table' : 'card'
  setCurrentSongListViewMode(nextMode)
  return nextMode
}
