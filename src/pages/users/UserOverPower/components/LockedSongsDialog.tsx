import { Button } from '@kobalte/core/button'
import { Check } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import { CheckboxField } from '../../../../components/common/CheckboxField'
import type {
  MasterItemDTO,
  PlayerLockedSongRequest,
  PlayerLockedSongResponseItem,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../../../../types/api'
import { createLockedSongKey } from '../../../../usecases/overpower/lockedSongsBatch'
import { sortMasterItemsBySortOrder } from '../../../../utils/masterData'
import {
  normalizeForReadingSearch,
  normalizeForSearch,
  normalizeQuery,
} from '../../../../utils/searchUtils'
import {
  filterReleasedVersions,
  getShortVersionName,
  resolveVersionNameByReleaseDate,
} from '../../../../utils/versionConverter'
import { createSongSelectionDialogModel } from '../../components/createSongSelectionDialogModel'
import { SongSelectionDialogBase } from '../../components/SongSelectionDialogBase'
import {
  buildDefaultSongSelectionFilter,
  getSongSelectionRowClass,
  sortSongSelectionCandidates,
} from '../../components/songSelectionDialog'
import { hasSameFilterValues } from '../../utils/filterValue'

type Props = {
  open: boolean
  songs: SongDTO[]
  records: PlayerRecordDTO[]
  genres: MasterItemDTO[]
  versions: VersionDTO[]
  lockedSongs: PlayerLockedSongResponseItem[]
  onOpenChange: (open: boolean) => void
  onSaveLockedSongs: (items: PlayerLockedSongRequest[]) => Promise<void>
}

type LockedSongListItem = {
  song: SongDTO
  isUltima: boolean
}

type LockedSongsFilter = {
  genres: string[]
  versions: string[]
  unplayedOnly: boolean
}

const LOCKED_SONG_DESCRIPTION = 'チェックした曲・譜面はOVER POWER計算対象から除外されます。'

/**
 * 楽曲にULTIMA譜面があるか判定する。
 *
 * @param song - 判定対象の楽曲。
 * @returns ULTIMA譜面がある場合はtrue。
 */
const hasUltimaChart = (song: SongDTO): boolean => Boolean(song.charts.ULTIMA)

/**
 * 未解禁楽曲フィルターの初期値を選択肢の全選択状態から生成する。
 *
 * @param genres - 初期選択するジャンル選択肢。
 * @param versions - 初期選択するバージョン選択肢。
 * @returns ジャンル・バージョンを全選択したフィルター状態。
 */
const buildDefaultLockedSongsFilter = (
  genres: string[],
  versions: string[]
): LockedSongsFilter => ({
  ...buildDefaultSongSelectionFilter(genres, versions),
  unplayedOnly: false,
})

/**
 * 未解禁楽曲フィルターが既定値から変更されているか判定する。
 *
 * @param current - 現在のフィルター状態。
 * @param defaultFilter - 比較対象の既定フィルター状態。
 * @returns 既定値との差分がある場合はtrue。
 */
const isLockedSongsFilterChanged = (
  current: LockedSongsFilter,
  defaultFilter: LockedSongsFilter
): boolean =>
  current.unplayedOnly !== defaultFilter.unplayedOnly ||
  !hasSameFilterValues(current.genres, defaultFilter.genres) ||
  !hasSameFilterValues(current.versions, defaultFilter.versions)

/**
 * 選択キーを未解禁楽曲保存payloadへ変換する。
 *
 * @param keys - `displayId:mode` 形式の選択キー。
 * @returns 未解禁楽曲の保存payload。
 */
const toLockedSongRequests = (keys: string[]): PlayerLockedSongRequest[] =>
  keys.map((key) => {
    const [displayId, mode] = key.split(':')
    return {
      display_id: displayId,
      is_ultima: mode === 'ultima',
    }
  })

/**
 * OVER POWER計算から除外する未解禁楽曲を検索・絞り込みしながら編集するダイアログ。
 *
 * @param props - ダイアログの表示状態、楽曲・マスターデータ、未解禁楽曲、保存処理。
 * @returns 未解禁楽曲設定ダイアログのUI。
 */
const LockedSongsDialog: Component<Props> = (props) => {
  const genreOptions = createMemo(() =>
    sortMasterItemsBySortOrder(props.genres).map((genre) => genre.name)
  )
  const versionOptions = createMemo(() =>
    filterReleasedVersions(props.versions).map((version) => getShortVersionName(version.name))
  )
  const defaultFilter = createMemo(() =>
    buildDefaultLockedSongsFilter(genreOptions(), versionOptions())
  )
  const lockedSongKeys = createMemo(
    () =>
      new Set(
        props.lockedSongs.map((lockedSong) =>
          createLockedSongKey(lockedSong.display_id, lockedSong.is_ultima)
        )
      )
  )
  const model = createSongSelectionDialogModel({
    open: () => props.open,
    selectedKeys: lockedSongKeys,
    defaultFilter,
    isFilterReady: (filter) => filter.genres.length > 0 && filter.versions.length > 0,
    save: (keys) => props.onSaveLockedSongs(toLockedSongRequests(keys)),
    onSaved: () => props.onOpenChange(false),
    saveErrorMessage: '未解禁楽曲設定の保存に失敗しました。',
  })
  const filterChanged = createMemo(() =>
    isLockedSongsFilterChanged(model.filters(), defaultFilter())
  )
  const songVersionNameById = createMemo(
    () =>
      new Map(
        props.songs.map((song) => [
          song.id,
          getShortVersionName(resolveVersionNameByReleaseDate(song.release, props.versions)),
        ])
      )
  )
  const recordBySongAndDifficulty = createMemo(
    () => new Map(props.records.map((record) => [`${record.id}:${record.difficulty}`, record]))
  )
  const recordsBySongId = createMemo(() => {
    const grouped = new Map<string, PlayerRecordDTO[]>()
    for (const record of props.records) {
      const records = grouped.get(record.id) ?? []
      records.push(record)
      grouped.set(record.id, records)
    }
    return grouped
  })
  const songListItems = createMemo<LockedSongListItem[]>(() =>
    sortSongSelectionCandidates(props.songs).flatMap((song) => [
      { song, isUltima: false },
      ...(hasUltimaChart(song) ? [{ song, isUltima: true }] : []),
    ])
  )
  const searchableSongListItems = createMemo(() =>
    songListItems().map((item) => {
      const chartLabel = item.isUltima ? 'ultima' : '通常 譜面'
      return {
        item,
        searchableText: normalizeForSearch(
          `${item.song.id} ${item.song.title} ${item.song.artist} ${chartLabel}`
        ),
        searchableReading: normalizeForReadingSearch(
          item.song.reading?.trim() ? item.song.reading : item.song.title
        ),
      }
    })
  )

  /**
   * 候補が未プレイのみ表示フィルターに合致するか判定する。
   *
   * @param item - 未解禁候補の曲・譜面種別。
   * @returns 未プレイ候補として表示できる場合はtrue。
   */
  const isUnplayedListItem = (item: LockedSongListItem): boolean => {
    if (item.isUltima) {
      return recordBySongAndDifficulty().get(`${item.song.id}:ULTIMA`)?.is_played !== true
    }
    const songRecords = recordsBySongId().get(item.song.id) ?? []
    return songRecords.length === 0 || songRecords.every((record) => !record.is_played)
  }

  const filteredSongListItems = createMemo(() => {
    const { normalizedQuery, normalizedReadingQuery } = normalizeQuery(model.query())
    const currentFilters = model.filters()

    return searchableSongListItems()
      .filter(({ item, searchableText, searchableReading }) => {
        const key = createLockedSongKey(item.song.id, item.isUltima)
        if (model.showSelectedOnly() && !model.draftKeys().has(key)) return false
        if (currentFilters.unplayedOnly && !isUnplayedListItem(item)) return false
        if (!currentFilters.genres.includes(item.song.genre)) return false
        const version = songVersionNameById().get(item.song.id) ?? '不明'
        if (!currentFilters.versions.includes(version)) return false
        if (!normalizedQuery) return true
        return (
          searchableText.includes(normalizedQuery) ||
          searchableReading.includes(normalizedReadingQuery)
        )
      })
      .map(({ item }) => item)
  })
  const selectionSummary = createMemo(
    () => `${model.selectedCount()}件選択中 / ${filteredSongListItems().length}件表示`
  )

  /**
   * 未解禁候補の選択行を描画する。
   *
   * @param item - 描画対象の楽曲と譜面種別。
   * @returns 未解禁状態の選択ボタン。
   */
  const renderSong = (item: LockedSongListItem): JSX.Element => {
    const key = createLockedSongKey(item.song.id, item.isUltima)
    const selected = (): boolean => model.draftKeys().has(key)

    return (
      <Button
        type="button"
        class={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60 ${getSongSelectionRowClass(
          selected()
        )}`}
        aria-pressed={selected()}
        aria-label={`${item.song.title} ${item.isUltima ? 'ULTIMA' : '通常'}の未解禁設定を切り替え`}
        disabled={model.isSaving()}
        onClick={() => model.toggleDraftKey(key)}
      >
        <div class="min-w-0">
          <div class="flex min-w-0 items-center gap-2">
            <p class="truncate font-sans text-sm font-medium">{item.song.title}</p>
            <Show when={item.isUltima}>
              <span
                class={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                  selected() ? 'bg-surface/20 text-text-inverse' : 'bg-danger-bg text-danger'
                }`}
              >
                ULTIMA
              </span>
            </Show>
          </div>
          <p
            class={`truncate font-sans text-xs ${
              selected() ? 'text-text-inverse/80' : 'text-text-subtle'
            }`}
          >
            {item.song.artist}
          </p>
        </div>
        <span
          class={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            selected() ? 'bg-surface/20 opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <Check class="h-4 w-4" />
        </span>
      </Button>
    )
  }

  /**
   * 未プレイのみ表示する追加フィルターを描画する。
   *
   * @returns 未プレイ絞り込みのチェック欄。
   */
  const renderFilterExtras = (): JSX.Element => (
    <section>
      <CheckboxField
        id="locked-song-filter-unplayed-only"
        checked={model.filters().unplayedOnly}
        onChange={(unplayedOnly) => model.setFilters((current) => ({ ...current, unplayedOnly }))}
        label="未プレイのみ表示"
      />
    </section>
  )

  return (
    <SongSelectionDialogBase
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="未解禁楽曲設定"
      description={LOCKED_SONG_DESCRIPTION}
      searchAriaLabel="未解禁楽曲検索"
      query={model.query}
      setQuery={model.setQuery}
      filterDialogOpen={model.filterDialogOpen}
      setFilterDialogOpen={model.setFilterDialogOpen}
      filterChanged={filterChanged}
      showSelectedOnly={model.showSelectedOnly}
      setShowSelectedOnly={model.setShowSelectedOnly}
      selectionSummary={selectionSummary}
      items={filteredSongListItems}
      isListReady={model.isListReady}
      isSaving={model.isSaving}
      saveError={model.saveError}
      hasChanges={model.hasChanges}
      genres={genreOptions}
      versions={versionOptions}
      filters={model.filters}
      selectedGenres={(filter) => filter.genres}
      selectedVersions={(filter) => filter.versions}
      setGenres={(genres) => model.setFilters((current) => ({ ...current, genres }))}
      setVersions={(versions) => model.setFilters((current) => ({ ...current, versions }))}
      resetFilters={model.resetFilters}
      showFilterCloseButton={true}
      actionButtonSize="sm"
      renderFilterExtras={renderFilterExtras}
      renderItem={renderSong}
      onSave={model.save}
    />
  )
}

export default LockedSongsDialog
