import type { SortDirection } from '../../../../utils/sortingQuery'
import {
  WORLDSEND_SONG_CARD_SORT_DIRECTION_OPTIONS,
  WORLDSEND_SONG_CARD_SORT_OPTIONS,
  type WorldsendSongCardSortDirectionOption,
  type WorldsendSongCardSortOption,
} from '../constants'

/**
 * 選択中のソートキー選択肢を取得する。
 *
 * @param optionId - 選択肢 ID。
 * @returns 対応する選択肢。不明な ID の場合は標準。
 */
export const findWorldsendSongCardSortOption = (optionId: string): WorldsendSongCardSortOption =>
  WORLDSEND_SONG_CARD_SORT_OPTIONS.find((option) => option.id === optionId) ??
  WORLDSEND_SONG_CARD_SORT_OPTIONS[0]

/**
 * 選択中のソート方向選択肢を取得する。
 *
 * @param direction - 昇順または降順。
 * @returns 対応する選択肢。
 */
export const findWorldsendSongCardSortDirectionOption = (
  direction: SortDirection
): WorldsendSongCardSortDirectionOption =>
  WORLDSEND_SONG_CARD_SORT_DIRECTION_OPTIONS.find((option) => option.value === direction) ??
  WORLDSEND_SONG_CARD_SORT_DIRECTION_OPTIONS[0]
