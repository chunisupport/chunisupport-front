import { Button } from '@kobalte/core/button'
import Check from 'lucide-solid/icons/check'
import RefreshCw from 'lucide-solid/icons/refresh-cw'
import X from 'lucide-solid/icons/x'
import { createMemo, createSignal, createUniqueId, For, Show } from 'solid-js'
import placeholderImageUrl from '../../assets/placeholder.webp'
import { LoadError, Loading } from '../../components'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { SegmentedToggleGroup } from '../../components/common/AppTabs'
import { CourseChartDifficultyBadge } from '../../components/common/course/CourseChartDifficultyBadge'
import { JacketImage } from '../../components/common/JacketImage'
import { SearchTextField } from '../../components/common/SearchTextField'
import { WORLDSEND_SCORE_LABEL, WORLDSEND_SHORT_LABEL } from '../../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import type { CourseChartRefDTO, SongDTO, WorldsendSongDTO } from '../../types/api'
import { toChartLevelLabel } from '../../utils/chartLevel'
import {
  courseChartKey,
  formatCourseWorldsendChart,
  formatWorldsendAttributeStar,
} from '../../utils/courseTracks'
import { difficultyBadgeClass } from '../../utils/difficultyUtils'
import { buildChunithmJacketUrl } from '../../utils/jacket'
import {
  COURSE_TRACK_EDITOR_COPY as COPY,
  COURSE_TRACK_SEARCH_CATALOGS,
  COURSE_TRACK_SEARCH_LIMIT,
  formatRemoveChartLabel,
} from './courseTrackEditor.constants'

type Catalog = (typeof COURSE_TRACK_SEARCH_CATALOGS)[number]['value']
type SearchSong = SongDTO | WorldsendSongDTO

type Props = {
  charts: readonly CourseChartRefDTO[]
  songs: ReadonlyMap<string, SearchSong>
  search: (
    query: string,
    catalog: Catalog
  ) => {
    songs: SearchSong[]
    loading: boolean
    error: unknown
  }
  loading: boolean
  multiple: boolean
  disabled: boolean
  onSelect: (chart: CourseChartRefDTO) => void
  onRemove: (chart: CourseChartRefDTO) => void
}

/**
 * 選択可能なWORLD'S END楽曲を通常楽曲と区別する。
 *
 * @param song - 取得済みの楽曲。
 * @returns WORLD'S END譜面を含む場合は true。
 */
const isWorldsendSong = (song: SearchSong): song is WorldsendSongDTO => 'WORLDSEND' in song.charts

/** 譜面選択ボタンの共通スタイル */
const CHART_SELECT_BUTTON_BASE_CLASS =
  'inline-flex min-w-10 items-center justify-center gap-1 rounded px-2 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/**
 * 譜面情報を表示文字列にする。
 *
 * @param song - 譜面を含む楽曲データ。
 * @param difficulty - 対象の難易度。
 * @returns 譜面定数またはレベル表記。譜面が見つからない場合は空文字。
 */
const formatChartConstLabel = (
  song: SearchSong | undefined,
  difficulty: CourseChartRefDTO['difficulty']
): string => {
  if (!song) return ''
  if (isWorldsendSong(song)) {
    const chart = song.charts.WORLDSEND
    return chart ? formatCourseWorldsendChart(chart) : ''
  }
  if (difficulty === 'WORLDSEND') return ''
  const chart = song.charts[difficulty]
  if (!chart) return ''
  return chart.is_const_unknown ? `Lv.${toChartLevelLabel(chart.const)}` : chart.const.toFixed(1)
}

/**
 * 登録済み譜面をジャケット・難易度バッジ付きで表示し、曲名検索からコースに登録する譜面を選択・追加する。
 *
 * @param props - 現在値、楽曲検索、譜面選択と解除の操作。
 * @returns コーストラックの譜面選択欄。
 */
export const CourseTrackChartPicker = (props: Props) => {
  const [replacing, setReplacing] = createSignal(false)
  const [query, setQuery] = createSignal('')
  const [catalog, setCatalog] = createSignal<Catalog>('standard')
  const searchId = createUniqueId()
  const resultsId = createUniqueId()

  /** 検索エリアを表示するか。プール方式は常時、固定方式は未選択時または変更時に開く。 */
  const showSearch = createMemo(() => props.multiple || props.charts.length === 0 || replacing())
  const results = createMemo(() =>
    showSearch() ? props.search(query(), catalog()) : { songs: [], loading: false, error: null }
  )
  const selected = createMemo(() => new Set(props.charts.map(courseChartKey)))

  /**
   * 譜面を選択し、固定枠では変更用検索を閉じる。
   *
   * @param chart - 選択した譜面。
   * @returns なし。
   */
  const select = (chart: CourseChartRefDTO): void => {
    props.onSelect(chart)
    if (!props.multiple) {
      setReplacing(false)
      setQuery('')
      queueMicrotask(() => document.getElementById(`${resultsId}-toggle`)?.focus())
    }
  }

  return (
    <div class="space-y-3">
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-medium text-text-muted">
            {props.multiple ? COPY.selectedPoolHeading : COPY.selectedChartHeading}
            <Show when={props.multiple}>
              <span class="ml-1.5 font-oswald text-text-subtle">
                ({props.charts.length}
                {COPY.chartCountSuffix})
              </span>
            </Show>
          </span>
          <Show when={!props.multiple && props.charts.length > 0}>
            <AppButton
              id={`${resultsId}-toggle`}
              type="button"
              variant="surface"
              size="xs"
              disabled={props.disabled}
              aria-expanded={replacing()}
              aria-controls={resultsId}
              onClick={() => setReplacing((current) => !current)}
              leftIcon={<RefreshCw class="size-3.5" aria-hidden="true" />}
              class="focus-visible:ring-inset"
            >
              {replacing() ? COPY.closeSearch : COPY.changeChart}
            </AppButton>
          </Show>
        </div>

        <Show
          when={props.charts.length > 0}
          fallback={
            <div class="rounded-lg border border-dashed border-border-strong bg-surface-muted/60 px-3 py-4 text-center text-sm text-text-muted">
              {props.multiple ? COPY.emptyPoolCharts : COPY.emptyFixedChart}
            </div>
          }
        >
          <ul class="space-y-1.5">
            <For each={props.charts}>
              {(chart) => {
                const song = () => props.songs.get(chart.id)
                const constLabel = () => formatChartConstLabel(song(), chart.difficulty)
                return (
                  <li class="flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-surface p-2">
                    <JacketImage
                      source={buildChunithmJacketUrl(song()?.jacket ?? null) ?? undefined}
                      alt=""
                      ariaHidden
                      class="size-10 shrink-0 overflow-hidden rounded bg-surface-muted"
                      imageClass="size-full object-cover"
                      fallback={
                        <img src={placeholderImageUrl} alt="" class="size-full object-cover" />
                      }
                    />
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-sans text-sm font-medium text-text">
                        {song()?.title ??
                          (props.loading ? COPY.loadingSongPlaceholder : COPY.chartUnavailable)}
                      </p>
                      <div class="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <CourseChartDifficultyBadge difficulty={chart.difficulty} />
                        <Show when={constLabel()}>
                          <span
                            class={`text-xs font-medium text-text-muted ${
                              chart.difficulty === 'WORLDSEND' ? 'font-sans' : 'font-oswald'
                            }`}
                          >
                            {constLabel()}
                          </span>
                        </Show>
                        <Show when={song()?.artist}>
                          {(artist) => (
                            <span class="min-w-0 truncate font-sans text-xs text-text-subtle">
                              {artist()}
                            </span>
                          )}
                        </Show>
                      </div>
                    </div>
                    <AppIconButton
                      type="button"
                      size="sm"
                      tone="ghost"
                      disabled={props.disabled}
                      aria-label={formatRemoveChartLabel(
                        [song()?.title ?? chart.id, constLabel()].filter(Boolean).join(' '),
                        chart.difficulty
                      )}
                      onClick={() => props.onRemove(chart)}
                      class="shrink-0 focus-visible:ring-inset"
                    >
                      <X class="size-4" aria-hidden="true" />
                    </AppIconButton>
                  </li>
                )
              }}
            </For>
          </ul>
        </Show>
      </div>

      <div id={resultsId} hidden={!showSearch()}>
        <Show when={showSearch()}>
          <search class="space-y-2 rounded-lg border border-border bg-surface-muted/50 p-2.5">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SegmentedToggleGroup
                ariaLabel={COPY.searchCatalogLabel}
                options={COURSE_TRACK_SEARCH_CATALOGS}
                value={catalog()}
                onChange={setCatalog}
                class="grid w-full shrink-0 grid-cols-2 sm:inline-flex sm:w-auto"
                itemClass="w-full whitespace-nowrap px-2.5 py-1.5 text-xs focus-visible:ring-inset sm:w-auto"
              />
              <SearchTextField
                id={searchId}
                ariaLabel={COPY.searchLabel}
                value={query()}
                onChange={setQuery}
                placeholder={COPY.searchPlaceholder}
                active={query().trim().length > 0}
                class="min-w-0 flex-1"
              />
            </div>
            <Show when={!results().loading} fallback={<Loading size="inline" />}>
              <Show when={!results().error} fallback={<LoadError error={results().error} />}>
                <ul class="max-h-64 divide-y divide-border overflow-y-auto overscroll-contain rounded-md border border-border bg-surface">
                  <For
                    each={results().songs.slice(0, COURSE_TRACK_SEARCH_LIMIT)}
                    fallback={
                      <li class="px-3 py-4 text-center text-sm text-text-muted">
                        {COPY.noSearchResults}
                      </li>
                    }
                  >
                    {(song) => (
                      <li class="flex min-w-0 flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div class="flex min-w-0 flex-1 items-center gap-2.5">
                          <JacketImage
                            source={buildChunithmJacketUrl(song.jacket) ?? undefined}
                            alt=""
                            ariaHidden
                            class="size-9 shrink-0 overflow-hidden rounded bg-surface-muted"
                            imageClass="size-full object-cover"
                            fallback={
                              <img
                                src={placeholderImageUrl}
                                alt=""
                                class="size-full object-cover"
                              />
                            }
                          />
                          <div class="min-w-0 flex-1">
                            <p class="truncate font-sans text-sm font-medium text-text">
                              {song.title}
                            </p>
                            <p class="truncate font-sans text-xs text-text-subtle">
                              {song.artist}
                              <Show
                                when={isWorldsendSong(song) ? song.charts.WORLDSEND?.notes : null}
                              >
                                {(notes) => ` ・ ${notes().toLocaleString('ja-JP')} NOTES`}
                              </Show>
                            </p>
                          </div>
                        </div>
                        <div class="flex flex-wrap gap-1 sm:shrink-0 sm:justify-end">
                          <Show when={isWorldsendSong(song) ? song.charts.WORLDSEND : undefined}>
                            {(chart) => {
                              const ref = { id: song.id, difficulty: 'WORLDSEND' } as const
                              const isSelected = () => selected().has(courseChartKey(ref))
                              return (
                                <Button
                                  type="button"
                                  aria-label={`${song.title} ${WORLDSEND_SCORE_LABEL} ${formatCourseWorldsendChart(chart())}`}
                                  disabled={props.disabled || isSelected()}
                                  onClick={() => select(ref)}
                                  class={`${CHART_SELECT_BUTTON_BASE_CLASS} bg-[image:var(--cs-color-worldsend-label-bg)] text-worldsend-label-text text-shadow-badge ${
                                    isSelected()
                                      ? 'cursor-not-allowed opacity-45'
                                      : 'cursor-pointer hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
                                  }`}
                                >
                                  <Show when={isSelected()}>
                                    <Check class="size-3" aria-hidden="true" />
                                  </Show>
                                  <span class="font-sans tracking-wide">
                                    {formatWorldsendAttributeStar(
                                      chart().attribute,
                                      chart().level_star
                                    ) || WORLDSEND_SHORT_LABEL}
                                  </span>
                                </Button>
                              )
                            }}
                          </Show>
                          <For each={isWorldsendSong(song) ? [] : PLAYER_DATA_DIFFICULTIES}>
                            {(difficulty) => (
                              <Show when={!isWorldsendSong(song) && song.charts[difficulty]}>
                                {(chartData) => {
                                  const isSelected = () =>
                                    selected().has(courseChartKey({ id: song.id, difficulty }))
                                  return (
                                    <Button
                                      type="button"
                                      aria-label={`${song.title} ${difficulty} Lv.${toChartLevelLabel(chartData().const)}`}
                                      disabled={props.disabled || isSelected()}
                                      onClick={() => select({ id: song.id, difficulty })}
                                      class={`${CHART_SELECT_BUTTON_BASE_CLASS} ${difficultyBadgeClass(
                                        difficulty
                                      )} ${
                                        isSelected()
                                          ? 'cursor-not-allowed opacity-45'
                                          : 'cursor-pointer hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
                                      }`}
                                    >
                                      <Show when={isSelected()}>
                                        <Check class="size-3" aria-hidden="true" />
                                      </Show>
                                      <span class="font-oswald tracking-wide">
                                        {toChartLevelLabel(chartData().const)}
                                      </span>
                                    </Button>
                                  )
                                }}
                              </Show>
                            )}
                          </For>
                        </div>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </Show>
          </search>
        </Show>
      </div>
    </div>
  )
}
