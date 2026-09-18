import { Button } from '@kobalte/core/button'
import { Check } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, Show } from 'solid-js'
import { AppSelect } from '../../../../components/common/AppSelect'
import { CheckboxField } from '../../../../components/common/CheckboxField'
import type {
  MasterItemDTO,
  PlayerLockedSongRequest,
  PlayerLockedSongResponseItem,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../../../../types/api'
import {
  createLockedSongKey,
  toLockedSongRequests,
} from '../../../../usecases/overpower/lockedSongsBatch'
import { buildLockedSongsOpComparison } from '../../../../usecases/overpower/lockedSongsOpComparison'
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
  SONG_SELECTION_FILTER_SELECT_CONTENT_Z_INDEX_CLASS,
  sortSongSelectionCandidates,
} from '../../components/songSelectionDialog'
import { hasSameFilterValues } from '../../utils/filterValue'
import {
  LOCKED_SONG_PLAY_STATUS_FILTER_COPY,
  LOCKED_SONG_PLAY_STATUS_OPTIONS,
  type LockedSongsPlayStatus,
} from '../constants'
import { LockedSongsOpComparison } from './LockedSongsOpComparison'
import { matchesLockedSongsPlayStatus } from './lockedSongsFilter'

type Props = {
  open: boolean
  songs: SongDTO[]
  records: PlayerRecordDTO[]
  genres: MasterItemDTO[]
  versions: VersionDTO[]
  lockedSongs: PlayerLockedSongResponseItem[]
  /** CHUNITHM-NETから取得した公式OVER POWER */
  officialOverPower: number
  /** CHUNITHM-NETから取得した公式OP%。記録開始前はnull */
  officialOverPowerPercent: number | null
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
  playStatusEnabled: boolean
  playStatus: LockedSongsPlayStatus
}

type LockedSongsPlayStatusOption = (typeof LOCKED_SONG_PLAY_STATUS_OPTIONS)[number]

const LOCKED_SONG_DESCRIPTION = 'チェックした曲・譜面はOVER POWER計算対象から除外されます。'
/** プレイ状況フィルターのチェックボックスを識別するID */
const LOCKED_SONG_PLAY_STATUS_FILTER_ID = 'locked-song-filter-play-status'

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
  playStatusEnabled: false,
  playStatus: LOCKED_SONG_PLAY_STATUS_OPTIONS[0].value,
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
  current.playStatusEnabled !== defaultFilter.playStatusEnabled ||
  current.playStatus !== defaultFilter.playStatus ||
  !hasSameFilterValues(current.genres, defaultFilter.genres) ||
  !hasSameFilterValues(current.versions, defaultFilter.versions)

/**
 * OVER POWER計算から除外する未解禁楽曲を検索・絞り込みしながら編集するダイアログ。
 *
 * @param props - ダイアログの表示状態、楽曲・マスターデータ、未解禁楽曲、公式OP、保存処理。
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
   * 候補がプレイ状況フィルターに合致するか判定するための未プレイ状態を返す。
   *
   * @param item - 未解禁候補の曲・譜面種別。
   * @returns 候補が未プレイとして扱われる場合はtrue。
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
        if (
          currentFilters.playStatusEnabled &&
          !matchesLockedSongsPlayStatus(currentFilters.playStatus, isUnplayedListItem(item))
        ) {
          return false
        }
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
  const draftLockedSongs = createMemo(() => toLockedSongRequests([...model.draftKeys()]))
  const opComparison = createMemo(() =>
    buildLockedSongsOpComparison({
      songs: props.songs,
      records: props.records,
      versions: props.versions,
      lockedSongs: draftLockedSongs(),
      officialOverPower: props.officialOverPower,
      officialOverPowerPercent: props.officialOverPowerPercent,
    })
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
   * プレイ状況フィルターを描画する。
   *
   * @returns プレイ状況絞り込みのチェックボックスとSelect欄。
   */
  const renderFilterExtras = (): JSX.Element => {
    const selectedOption = (): LockedSongsPlayStatusOption =>
      LOCKED_SONG_PLAY_STATUS_OPTIONS.find(
        (option) => option.value === model.filters().playStatus
      ) ?? LOCKED_SONG_PLAY_STATUS_OPTIONS[0]

    return (
      <section>
        <div class="flex min-w-0 items-center gap-2">
          <CheckboxField
            id={LOCKED_SONG_PLAY_STATUS_FILTER_ID}
            checked={model.filters().playStatusEnabled}
            onChange={(playStatusEnabled) =>
              model.setFilters((current) => ({
                ...current,
                playStatusEnabled,
              }))
            }
            ariaLabel={LOCKED_SONG_PLAY_STATUS_FILTER_COPY.ariaLabel}
            class="shrink-0"
          />
          <AppSelect<LockedSongsPlayStatusOption>
            rootClass="min-w-0 flex-1"
            label={LOCKED_SONG_PLAY_STATUS_FILTER_COPY.label}
            labelVariant="srOnly"
            options={[...LOCKED_SONG_PLAY_STATUS_OPTIONS]}
            optionValue="value"
            optionTextValue="label"
            value={selectedOption()}
            onChange={(option) =>
              model.setFilters((current) => ({
                ...current,
                playStatus: option?.value ?? LOCKED_SONG_PLAY_STATUS_OPTIONS[0].value,
              }))
            }
            formatLabel={(option) => option.label}
            contentZIndexClass={SONG_SELECTION_FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
            itemClass="hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg"
          />
          <label
            for={LOCKED_SONG_PLAY_STATUS_FILTER_ID}
            class="shrink-0 cursor-pointer text-sm text-text-muted"
          >
            {LOCKED_SONG_PLAY_STATUS_FILTER_COPY.suffix}
          </label>
        </div>
      </section>
    )
  }

  return (
    <SongSelectionDialogBase
      open={props.open}
      onOpenChange={props.onOpenChange}
      title="未解禁楽曲設定"
      description={LOCKED_SONG_DESCRIPTION}
      headerExtra={<LockedSongsOpComparison comparison={opComparison} />}
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
