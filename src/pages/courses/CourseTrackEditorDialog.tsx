import * as Tabs from '@kobalte/core/tabs'
import { useQuery } from '@tanstack/solid-query'
import AlertCircle from 'lucide-solid/icons/alert-circle'
import CheckCircle2 from 'lucide-solid/icons/check-circle-2'
import Circle from 'lucide-solid/icons/circle'
import { createMemo, createSignal, createUniqueId, For, Show } from 'solid-js'
import { replaceCourseTracks } from '../../api/courses'
import { LoadError, Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { AppConfirmDialog } from '../../components/common/AppConfirmDialog'
import { AppDialog } from '../../components/common/AppDialog'
import { toMultiSelectOptions } from '../../components/common/AppMultiSelect'
import { FormSelect } from '../../components/common/AppSelect'
import { type AppTabOption, SegmentedToggleGroup } from '../../components/common/AppTabs'
import { showSuccessToast } from '../../components/common/AppToast'
import { CourseClassMark } from '../../components/common/course/CourseRecordParts'
import { GenreMultiSelect } from '../../components/common/DomainMultiSelect'
import { WORLDSEND_SHORT_LABEL } from '../../constants/chart'
import { COURSE_TRACK_LEVELS, COURSE_TRACK_NUMBERS } from '../../constants/courseTracks'
import { createCourseTrackSongs } from '../../hooks/createCourseTrackSongs'
import { genresQueryOptions } from '../../queries/masterData'
import type {
  CourseTrackDTO,
  CourseTrackSelectionType,
  ManagedCourseDTO,
  SongDTO,
  WorldsendSongDTO,
} from '../../types/api'
import { courseChartKey, formatCourseTrackFilter } from '../../utils/courseTracks'
import { difficultyShort } from '../../utils/difficultyUtils'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { buildSearchableItems, filterSearchableItems } from '../../utils/searchHelpers'
import { CourseTrackChartPicker } from './CourseTrackChartPicker'
import {
  addCourseTrackChart,
  type CourseTrackDraft,
  createCourseTrackDrafts,
  toCourseTrackRequest,
  validateCourseTrackDraft,
} from './courseTrackEditor'
import {
  COURSE_TRACK_EDITOR_COPY as COPY,
  COURSE_TRACK_SELECTION_SHORT_LABELS,
} from './courseTrackEditor.constants'

type Props = {
  course: ManagedCourseDTO
  onClose: () => void
  onSaved: () => void
}

const SELECTION_TYPE_OPTIONS: readonly AppTabOption<CourseTrackSelectionType>[] = (
  ['FIXED', 'RANDOM_FILTER', 'RANDOM_POOL'] as const
).map((value) => ({
  value,
  label: COURSE_TRACK_SELECTION_SHORT_LABELS[value],
}))

const LEVEL_OPTIONS: string[] = [COPY.noLevel, ...COURSE_TRACK_LEVELS]

/**
 * トラックタブ内に表示する1行の要約文字列を生成する。
 *
 * @param track - 対象トラックの編集中データ。
 * @param songs - 曲名解決用の楽曲マップ。
 * @returns 現在の設定内容を表す短いテキスト。
 */
const formatDraftSummary = (
  track: CourseTrackDraft,
  songs: ReadonlyMap<string, SongDTO | WorldsendSongDTO>,
  songsLoading: boolean
): string => {
  if (track.selectionType === 'FIXED') {
    const chart = track.charts[0]
    if (!chart) return COPY.unconfiguredTabSummary
    const title =
      songs.get(chart.id)?.title ??
      (songsLoading ? COPY.loadingSongPlaceholder : COPY.chartUnavailable)
    const difficulty =
      chart.difficulty === 'WORLDSEND' ? WORLDSEND_SHORT_LABEL : difficultyShort(chart.difficulty)
    return `[${difficulty}] ${title}`
  }

  if (track.selectionType === 'RANDOM_FILTER') {
    const summary = formatCourseTrackFilter({
      min_level: track.minLevel ?? undefined,
      max_level: track.maxLevel ?? undefined,
      genres: track.genres.length > 0 ? track.genres : undefined,
    })
    return summary || COPY.unconfiguredTabSummary
  }

  if (track.charts.length === 0) return COPY.unconfiguredTabSummary
  return `${track.charts.length}${COPY.chartCountSuffix}`
}

/**
 * コースの3枠をタブ切替で編集し、1リクエストで保存する。
 *
 * @param props - 編集対象と、終了・再取得の通知先。
 * @returns トラック構成の編集ダイアログ。
 */
export const CourseTrackEditorDialog = (props: Props) => {
  const [drafts, setDrafts] = createSignal(createCourseTrackDrafts(props.course.tracks ?? []))
  const [activeTrack, setActiveTrack] = createSignal(String(COURSE_TRACK_NUMBERS[0]))
  const [errors, setErrors] = createSignal<Record<number, string>>({})
  const [saveError, setSaveError] = createSignal('')
  const [saving, setSaving] = createSignal(false)
  const [confirmClear, setConfirmClear] = createSignal(false)
  const [dialogContent, setDialogContent] = createSignal<HTMLElement>()
  const id = createUniqueId()

  const usesCharts = () => drafts().some((track) => track.selectionType !== 'RANDOM_FILTER')
  const { songsQuery, worldsendSongsQuery, songsById, loading } = createCourseTrackSongs(
    usesCharts,
    usesCharts
  )
  const genresQuery = useQuery(() => ({
    ...genresQueryOptions(),
    enabled: drafts().some((track) => track.selectionType === 'RANDOM_FILTER'),
  }))
  const searchable = createMemo(() => buildSearchableItems(songsQuery.data?.songs ?? []))
  const searchableWorldsend = createMemo(() =>
    buildSearchableItems(
      worldsendSongsQuery.data?.songs.filter((song) => song.charts.WORLDSEND) ?? []
    )
  )
  const genreOptions = createMemo(() =>
    toMultiSelectOptions(genresQuery.data?.map((genre) => genre.name) ?? [])
  )

  const configuredCount = createMemo(
    () => drafts().filter((track) => validateCourseTrackDraft(track) === undefined).length
  )

  /**
   * 1枠の入力を更新し、以前の入力エラーを解除する。
   *
   * @param number - 更新対象のトラック番号。
   * @param patch - 差し替える入力項目。
   * @returns なし。
   */
  const update = (number: number, patch: Partial<CourseTrackDraft>): void => {
    setDrafts((current) =>
      current.map((track) => (track.trackNumber === number ? { ...track, ...patch } : track))
    )
    setErrors((current) => {
      if (!(number in current)) return current
      const next = { ...current }
      delete next[number]
      return next
    })
  }

  /**
   * 編集内容を保存し、完了したら管理一覧へ反映する。
   *
   * @param tracks - 検証済みの構成。空配列なら設定をクリアする。
   * @returns 保存完了時に解決するPromise。
   */
  const save = async (tracks: CourseTrackDTO[]): Promise<void> => {
    if (saving()) return
    setSaveError('')
    setSaving(true)
    try {
      await replaceCourseTracks(props.course.id, tracks)
      showSuccessToast(tracks.length ? COPY.saved : COPY.clearSuccess)
      props.onSaved()
      props.onClose()
    } catch (error) {
      setConfirmClear(false)
      setSaveError(toUserFriendlyErrorMessage(error, COPY.saveError))
    } finally {
      setSaving(false)
    }
  }

  /**
   * 全枠を検証して保存する。不正な枠があれば最初の不正トラックへタブを切り替える。
   *
   * @param event - 構成フォームの送信イベント。
   * @returns なし。
   */
  const submit = (event: SubmitEvent): void => {
    event.preventDefault()
    const nextErrors: Record<number, string> = {}
    for (const track of drafts()) {
      const error = validateCourseTrackDraft(track)
      if (error) nextErrors[track.trackNumber] = error
    }
    setErrors(nextErrors)
    const firstInvalid = COURSE_TRACK_NUMBERS.find((number) => nextErrors[number])
    if (firstInvalid) {
      setActiveTrack(String(firstInvalid))
      queueMicrotask(() => document.getElementById(`${id}-track-panel-${firstInvalid}`)?.focus())
      return
    }
    void save(drafts().map(toCourseTrackRequest))
  }

  return (
    <>
      <AppDialog
        open
        onOpenChange={(open) => {
          if (!open) props.onClose()
        }}
        pending={saving()}
        title={COPY.action}
        description={
          <span class="flex items-center gap-2">
            <CourseClassMark courseClass={props.course.class} size="sm" />
            <span class="min-w-0 truncate font-sans font-medium text-text">
              {props.course.name}
            </span>
          </span>
        }
        closeLabel={COPY.cancel}
        placement="viewport"
        size="2xl"
        height="viewportFill"
        contentRef={setDialogContent}
      >
        <form class="mt-3 flex min-h-0 flex-1 flex-col gap-3" onSubmit={submit}>
          <Tabs.Root
            value={activeTrack()}
            onChange={setActiveTrack}
            class="flex min-h-0 flex-1 flex-col gap-3"
          >
            <Tabs.List aria-label={COPY.trackTabsLabel} class="grid shrink-0 grid-cols-3 gap-2">
              <For each={COURSE_TRACK_NUMBERS}>
                {(number, index) => {
                  const track = () => drafts()[index()]
                  const hasError = () => Boolean(errors()[number])
                  const isValid = () =>
                    !hasError() && validateCourseTrackDraft(track()) === undefined
                  const summary = () => formatDraftSummary(track(), songsById(), loading())

                  return (
                    <Tabs.Trigger
                      value={String(number)}
                      class={`flex min-w-0 cursor-pointer flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                        hasError()
                          ? 'border-danger-border bg-danger-bg/60 data-selected:border-danger data-selected:bg-surface data-selected:ring-1 data-selected:ring-danger'
                          : 'border-border bg-surface-muted hover:bg-surface-hover data-selected:border-action-primary data-selected:bg-surface data-selected:ring-1 data-selected:ring-action-primary'
                      }`}
                    >
                      <div class="flex w-full items-center justify-between gap-1">
                        <span class="font-oswald text-xs font-semibold tracking-wider text-text">
                          {COPY.trackPrefix} {number}
                        </span>
                        <Show
                          when={!hasError()}
                          fallback={
                            <AlertCircle class="size-4 shrink-0 text-danger" aria-hidden="true" />
                          }
                        >
                          <Show
                            when={isValid()}
                            fallback={
                              <Circle
                                class="size-3.5 shrink-0 text-text-subtle"
                                aria-hidden="true"
                              />
                            }
                          >
                            <CheckCircle2 class="size-4 shrink-0 text-success" aria-hidden="true" />
                          </Show>
                        </Show>
                      </div>
                      <span class="w-full truncate font-sans text-xs text-text-muted">
                        {summary()}
                      </span>
                    </Tabs.Trigger>
                  )
                }}
              </For>
            </Tabs.List>

            <div class="min-h-0 flex-1 basis-0 overflow-y-auto overscroll-contain">
              <For each={COURSE_TRACK_NUMBERS}>
                {(number, index) => {
                  const track = () => drafts()[index()]
                  const trackPanelId = `${id}-track-panel-${number}`
                  const filterSummary = createMemo(() =>
                    formatCourseTrackFilter({
                      min_level: track().minLevel ?? undefined,
                      max_level: track().maxLevel ?? undefined,
                      genres: track().genres.length > 0 ? track().genres : undefined,
                    })
                  )

                  return (
                    <Tabs.Content
                      value={String(number)}
                      id={trackPanelId}
                      tabindex="-1"
                      class="space-y-4 rounded-lg border border-border bg-surface p-3 outline-none sm:p-4"
                    >
                      <div class="space-y-1.5">
                        <span class="block text-xs font-medium text-text-muted">
                          {COPY.selectionType}
                        </span>
                        <SegmentedToggleGroup
                          ariaLabel={`${COPY.trackPrefix} ${number} ${COPY.selectionType}`}
                          options={SELECTION_TYPE_OPTIONS}
                          value={track().selectionType}
                          onChange={(value) => {
                            if (!saving()) update(number, { selectionType: value })
                          }}
                          class="grid w-full grid-cols-3"
                          itemClass="w-full px-1.5 py-1.5 text-xs sm:text-sm focus-visible:ring-inset"
                        />
                      </div>

                      <Show when={errors()[number]}>
                        {(message) => (
                          <div
                            role="alert"
                            class="flex items-center gap-2 rounded-md border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
                          >
                            <AlertCircle class="size-4 shrink-0" aria-hidden="true" />
                            <span>{message()}</span>
                          </div>
                        )}
                      </Show>

                      <Show
                        when={track().selectionType === 'RANDOM_FILTER'}
                        fallback={
                          <CourseTrackChartPicker
                            charts={track().charts}
                            songs={songsById()}
                            search={(query, catalog) =>
                              catalog === 'worldsend'
                                ? {
                                    songs: filterSearchableItems(searchableWorldsend(), query),
                                    loading: worldsendSongsQuery.isPending,
                                    error: worldsendSongsQuery.error,
                                  }
                                : {
                                    songs: filterSearchableItems(searchable(), query),
                                    loading: songsQuery.isPending,
                                    error: songsQuery.error,
                                  }
                            }
                            loading={loading()}
                            multiple={track().selectionType === 'RANDOM_POOL'}
                            disabled={saving()}
                            onSelect={(chart) =>
                              update(number, { charts: addCourseTrackChart(track(), chart) })
                            }
                            onRemove={(chart) =>
                              update(number, {
                                charts: track().charts.filter(
                                  (item) => courseChartKey(item) !== courseChartKey(chart)
                                ),
                              })
                            }
                          />
                        }
                      >
                        <div class="space-y-4">
                          <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                            <FormSelect
                              label={COPY.minLevel}
                              portalMount={dialogContent()}
                              name={`min-level-${number}`}
                              options={LEVEL_OPTIONS}
                              value={track().minLevel ?? COPY.noLevel}
                              disabled={saving()}
                              disallowEmptySelection
                              onChange={(value) =>
                                update(number, { minLevel: value === COPY.noLevel ? null : value })
                              }
                            />
                            <span
                              class="pb-2.5 text-sm font-medium text-text-muted"
                              aria-hidden="true"
                            >
                              {COPY.levelRangeSeparator}
                            </span>
                            <FormSelect
                              label={COPY.maxLevel}
                              portalMount={dialogContent()}
                              name={`max-level-${number}`}
                              options={LEVEL_OPTIONS}
                              value={track().maxLevel ?? COPY.noLevel}
                              disabled={saving()}
                              disallowEmptySelection
                              onChange={(value) =>
                                update(number, { maxLevel: value === COPY.noLevel ? null : value })
                              }
                            />
                          </div>

                          <Show when={!genresQuery.isPending} fallback={<Loading size="inline" />}>
                            <Show
                              when={!genresQuery.isError}
                              fallback={<LoadError error={genresQuery.error} />}
                            >
                              <GenreMultiSelect
                                options={genreOptions()}
                                portalMount={dialogContent()}
                                selected={track().genres}
                                disabled={saving()}
                                onChange={(genres) => update(number, { genres })}
                              />
                            </Show>
                          </Show>

                          <div class="rounded-md border border-border bg-surface-muted px-3 py-2">
                            <span class="block text-xs text-text-subtle">
                              {COPY.filterPreviewLabel}
                            </span>
                            <p class="mt-0.5 font-sans text-sm font-medium text-text">
                              {filterSummary() || COPY.filterPreviewEmpty}
                            </p>
                          </div>
                        </div>
                      </Show>
                    </Tabs.Content>
                  )
                }}
              </For>
            </div>
          </Tabs.Root>

          <Show when={saveError()}>
            <p
              role="alert"
              class="shrink-0 rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
            >
              {saveError()}
            </p>
          </Show>

          <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div class="flex items-center gap-2">
              <Show when={props.course.tracks?.length}>
                <AppButton
                  variant="dangerOutline"
                  size="sm"
                  type="button"
                  disabled={saving()}
                  onClick={() => setConfirmClear(true)}
                >
                  {COPY.clear}
                </AppButton>
              </Show>
              <span class="font-jost text-xs font-medium text-text-muted">
                {configuredCount()}/{COURSE_TRACK_NUMBERS.length} {COPY.configuredProgressSuffix}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <AppButton type="button" size="sm" disabled={saving()} onClick={props.onClose}>
                {COPY.cancel}
              </AppButton>
              <AppButton variant="primary" size="sm" type="submit" disabled={saving()}>
                {saving() ? COPY.saving : COPY.save}
              </AppButton>
            </div>
          </div>
        </form>
      </AppDialog>
      <Show when={confirmClear()}>
        <AppConfirmDialog
          open={confirmClear()}
          onOpenChange={setConfirmClear}
          title={COPY.clear}
          description={COPY.clearDescription}
          cancelLabel={COPY.cancel}
          confirmLabel={COPY.clear}
          confirmVariant="danger"
          pending={saving()}
          onConfirm={() => void save([])}
        />
      </Show>
    </>
  )
}
