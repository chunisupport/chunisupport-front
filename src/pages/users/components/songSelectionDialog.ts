import {
  getSearchTextFieldFrameStateClass,
  getSearchTextFieldIconClass,
} from '../../../components/common/searchTextFieldStyles'
import type { SongDTO } from '../../../types/api'
import { hasSameFilterValues } from '../utils/filterValue'

/** 楽曲選択ダイアログで共通利用するジャンル・バージョンフィルター */
export type SongSelectionFilter = {
  genres: string[]
  versions: string[]
}

/** 楽曲選択フィルターダイアログ内の Select を前面へ表示するクラス */
export const SONG_SELECTION_FILTER_SELECT_CONTENT_Z_INDEX_CLASS = 'z-80'

/** 楽曲選択ツールバーボタンの選択状態へ適用するクラス */
export const SONG_SELECTION_TOOLBAR_BUTTON_ACTIVE_CLASS =
  'border-action-primary bg-action-primary text-text-inverse hover:bg-action-primary-hover'

/** 楽曲選択ツールバーボタンの未選択状態へ適用するクラス */
export const SONG_SELECTION_TOOLBAR_BUTTON_INACTIVE_CLASS =
  'border-border-strong bg-surface text-text-muted hover:bg-surface-hover'

/**
 * 楽曲選択フィルターの初期値を生成する。
 *
 * @param genres - 全ジャンル。
 * @param versions - 全バージョン。
 * @returns 全項目を選択したフィルター。
 */
export const buildDefaultSongSelectionFilter = (
  genres: string[],
  versions: string[]
): SongSelectionFilter => ({ genres, versions })

/**
 * 楽曲選択フィルターが既定値から変わっているか判定する。
 *
 * @param current - 現在のフィルター。
 * @param defaultFilter - 既定のフィルター。
 * @returns 差分があればtrue。
 */
export const hasSongSelectionFilterChanges = (
  current: SongSelectionFilter,
  defaultFilter: SongSelectionFilter
): boolean =>
  !hasSameFilterValues(current.genres, defaultFilter.genres) ||
  !hasSameFilterValues(current.versions, defaultFilter.versions)

/**
 * 保存済みとdraftの選択キーが一致するか判定する。
 *
 * @param saved - 保存済みの選択キー。
 * @param draft - 編集中の選択キー。
 * @returns 両方のキーが一致する場合はtrue。
 */
export const hasSameSelectionKeys = (
  saved: ReadonlySet<string>,
  draft: ReadonlySet<string>
): boolean => saved.size === draft.size && [...saved].every((key) => draft.has(key))

/**
 * Setを直接変更せずに指定キーの選択状態を切り替える。
 *
 * @param current - 現在の選択キー。
 * @param key - 切り替える選択キー。
 * @param limit - 選択数の上限。省略時は無制限。
 * @returns 選択状態を反映した新しいSet。
 */
export const toggleSelectionKey = (
  current: ReadonlySet<string>,
  key: string,
  limit?: number
): Set<string> => {
  const next = new Set(current)
  if (next.has(key)) {
    next.delete(key)
  } else if (limit === undefined || next.size < limit) {
    next.add(key)
  }
  return next
}

/**
 * 楽曲検索欄の状態に応じた外枠クラスを返す。
 *
 * @param active - 検索文字列が入力されているか。
 * @returns 検索欄の外枠へ適用するクラス。
 */
export const getSongSelectionSearchFrameClass = (active: boolean): string =>
  getSearchTextFieldFrameStateClass(active)

/**
 * 楽曲検索欄の状態に応じたアイコンクラスを返す。
 *
 * @param active - 検索文字列が入力されているか。
 * @returns 検索アイコンへ適用するクラス。
 */
export const getSongSelectionSearchIconClass = (active: boolean): string =>
  getSearchTextFieldIconClass(active)

/**
 * 楽曲選択行の状態に応じたクラスを返す。
 *
 * @param selected - 楽曲が選択されているか。
 * @returns 楽曲選択行へ適用するクラス。
 */
export const getSongSelectionRowClass = (selected: boolean): string =>
  selected
    ? 'bg-action-primary text-text-inverse hover:bg-action-primary-hover'
    : 'bg-surface text-text hover:bg-surface-muted'

/**
 * 楽曲をリリース日、公式番号の新しい順で安定ソートする。
 *
 * @param songs - ソート対象楽曲。
 * @returns 新しい順へ並べた楽曲。
 */
export const sortSongSelectionCandidates = (songs: SongDTO[]): SongDTO[] =>
  songs
    .map((song, index) => ({ song, index }))
    .sort((left, right) => {
      const leftRelease = Date.parse(left.song.release ?? '')
      const rightRelease = Date.parse(right.song.release ?? '')
      const releaseOrder =
        (Number.isFinite(rightRelease) ? rightRelease : Number.NEGATIVE_INFINITY) -
        (Number.isFinite(leftRelease) ? leftRelease : Number.NEGATIVE_INFINITY)
      const leftOfficialIdx = Number(left.song.official_idx)
      const rightOfficialIdx = Number(right.song.official_idx)
      const officialIdxOrder =
        (Number.isFinite(rightOfficialIdx) ? rightOfficialIdx : Number.NEGATIVE_INFINITY) -
        (Number.isFinite(leftOfficialIdx) ? leftOfficialIdx : Number.NEGATIVE_INFINITY)
      return releaseOrder || officialIdxOrder || left.index - right.index
    })
    .map(({ song }) => song)
