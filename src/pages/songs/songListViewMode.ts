import { createSignal } from 'solid-js'
import type { SongListViewMode } from './constants'
import { readSongListViewMode, saveSongListViewMode } from './songListViewModeStorage'

const [currentSongListViewMode, setCurrentSongListViewMode] = createSignal<SongListViewMode>(
  readSongListViewMode()
)

/**
 * 現在の通常曲・WORLD'S END 共通の一覧表示形式を返す。
 *
 * @returns 現在の一覧表示形式。
 */
export const songListViewMode = currentSongListViewMode

/**
 * 通常曲・WORLD'S END 共通の一覧表示形式を反転し、次回表示用に保存する。
 *
 * @returns 切り替え後の表示形式。
 */
export const toggleSongListViewMode = (): SongListViewMode => {
  const nextMode = currentSongListViewMode() === 'card' ? 'table' : 'card'
  setCurrentSongListViewMode(nextMode)
  saveSongListViewMode(nextMode)
  return nextMode
}
