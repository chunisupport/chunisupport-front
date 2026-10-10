import { Button } from '@kobalte/core/button'
import { TextField } from '@kobalte/core/text-field'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { Search } from 'lucide-solid'
import { For, Show } from 'solid-js'
import type { NameFolderDTO, VersionSummaryDTO } from '../../../types/api'
import {
  MANAGED_SONG_LIST_TITLE_SEPARATOR,
  MANAGED_SONG_LIST_VIRTUAL,
  SONG_MANAGEMENT_SECTION_COPY,
} from '../constants'
import type { SongManagementFilters } from '../songManagementFilters'
import SongManagementFilterPanel from './SongManagementFilterPanel'

/** 楽曲管理一覧の行ボタンに共通で付けるレイアウトクラス */
const managedSongRowButtonClass =
  'absolute top-0 left-0 flex h-14 w-full flex-col justify-center border-border px-3 text-left text-sm'

/** 楽曲管理一覧の1行に表示する最小項目 */
type ManagedSongListItem = {
  id: string
  title: string
  artist: string
  is_deleted: boolean
}

type ManagedSongListPanelProps<T extends ManagedSongListItem> = {
  /** フィルターダイアログの要素IDに付ける接頭辞 */
  idPrefix: string
  /** 検索・フィルター適用後の楽曲 */
  songs: T[]
  /** 選択中の楽曲ID */
  selectedSongId: string
  /** 楽曲選択時の処理 */
  onSelect: (songId: string) => void
  /** 検索文字列 */
  searchQuery: string
  /** 検索文字列の変更処理 */
  onSearchQueryChange: (query: string) => void
  /** 管理用の属性・欠落フィルターを表示するか */
  showAdvancedFilters: boolean
  /** 現在のフィルター */
  filters: SongManagementFilters
  /** フィルターの変更処理 */
  onFiltersChange: (filters: SongManagementFilters) => void
  /** フィルター候補のジャンル名 */
  genres: string[]
  /** フィルター候補のバージョン */
  versions: readonly VersionSummaryDTO[]
  /** フィルター候補の楽曲名順フォルダ */
  nameFolders: readonly NameFolderDTO[]
}

/**
 * 楽曲管理一覧の行背景クラスを返す。
 * 削除済み行は通常行のホバー色に置き換わらないようにする。
 *
 * @param isSelected - 選択中かどうか
 * @param isDeleted - 論理削除済みかどうか
 * @returns Button の classList へ渡すクラスマップ
 */
const getManagedSongRowClassList = (
  isSelected: boolean,
  isDeleted: boolean
): Record<string, boolean> => ({
  'bg-info-bg': isSelected,
  'bg-danger-bg': isDeleted && !isSelected,
  'hover:bg-surface-muted': !isDeleted && !isSelected,
})

/**
 * 楽曲管理画面の検索欄・フィルター・楽曲一覧を描画する。
 * 楽曲一覧はスクロール領域内で仮想化し、表示範囲付近の行だけを描画する。
 *
 * @param props 表示する楽曲、選択状態、検索・フィルター状態と変更処理
 * @returns 検索欄と選択可能な楽曲一覧
 */
const ManagedSongListPanel = <T extends ManagedSongListItem>(
  props: ManagedSongListPanelProps<T>
) => {
  let scrollElement: HTMLDivElement | undefined

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLButtonElement>({
    get count() {
      return props.songs.length
    },
    getScrollElement: () => scrollElement ?? null,
    estimateSize: () => MANAGED_SONG_LIST_VIRTUAL.rowHeight,
    overscan: MANAGED_SONG_LIST_VIRTUAL.overscan,
  })

  return (
    <>
      <div class="mb-2 flex items-end">
        <TextField
          class="flex min-w-0 flex-1 items-center gap-2 border border-border-strong px-2 focus-within:border-focus-ring"
          classList={{
            rounded: !props.showAdvancedFilters,
            'rounded-l border-r-0': props.showAdvancedFilters,
          }}
        >
          <Search class="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
          <TextField.Input
            type="search"
            value={props.searchQuery}
            onInput={(event) => props.onSearchQueryChange(event.currentTarget.value)}
            placeholder={SONG_MANAGEMENT_SECTION_COPY.searchPlaceholder}
            class="min-w-0 flex-1 py-2 font-sans text-sm outline-none"
          />
        </TextField>
        <Show when={props.showAdvancedFilters}>
          <SongManagementFilterPanel
            idPrefix={props.idPrefix}
            filters={props.filters}
            onChange={props.onFiltersChange}
            genres={props.genres}
            versions={props.versions}
            nameFolders={props.nameFolders}
          />
        </Show>
      </div>
      <div ref={scrollElement} class="max-h-130 overflow-y-auto rounded border border-border">
        <div class="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          <For each={rowVirtualizer.getVirtualItems()}>
            {(virtualRow) => {
              const song = () => props.songs[virtualRow.index]
              const isSelected = () => song()?.id === props.selectedSongId
              return (
                <Show when={song()}>
                  {(currentSong) => (
                    <Button
                      type="button"
                      class={managedSongRowButtonClass}
                      classList={{
                        ...getManagedSongRowClassList(isSelected(), currentSong().is_deleted),
                        'border-b': virtualRow.index < props.songs.length - 1,
                      }}
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                      title={`${currentSong().title}${MANAGED_SONG_LIST_TITLE_SEPARATOR}${currentSong().artist}`}
                      onClick={() => props.onSelect(currentSong().id)}
                    >
                      <span class="w-full truncate font-sans font-medium text-text">
                        {currentSong().title}
                      </span>
                      <span class="w-full truncate font-sans text-xs text-text-muted">
                        {currentSong().artist}
                      </span>
                    </Button>
                  )}
                </Show>
              )
            }}
          </For>
        </div>
      </div>
    </>
  )
}

export default ManagedSongListPanel
