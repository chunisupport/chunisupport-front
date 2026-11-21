import { TextField } from '@kobalte/core/text-field'
import { useQuery, useQueryClient } from '@tanstack/solid-query'
import ListMusic from 'lucide-solid/icons/list-music'
import Pencil from 'lucide-solid/icons/pencil'
import Plus from 'lucide-solid/icons/plus'
import RotateCcw from 'lucide-solid/icons/rotate-ccw'
import Trash2 from 'lucide-solid/icons/trash-2'
import type { Component, JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import {
  createCourse,
  deleteCourseByDisplayId,
  restoreCourseByDisplayId,
  updateCourse,
} from '../../api/courses'
import { LoadError, Loading } from '../../components'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { AppConfirmDialog } from '../../components/common/AppConfirmDialog'
import { AppDialog } from '../../components/common/AppDialog'
import { AppSelect, FormSelect } from '../../components/common/AppSelect'
import { type AppTabOption, SegmentedToggleGroup } from '../../components/common/AppTabs'
import { showErrorToast, showSuccessToast } from '../../components/common/AppToast'
import { CourseChartDifficultyBadge } from '../../components/common/course/CourseChartDifficultyBadge'
import { CourseClassMark } from '../../components/common/course/CourseRecordParts'
import { SearchTextField } from '../../components/common/SearchTextField'
import { COURSE_TRACK_NUMBERS } from '../../constants/courseTracks'
import { createCourseTrackSongs } from '../../hooks/createCourseTrackSongs'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { courseQueryKeys, managedCoursesQueryOptions } from '../../queries/courses'
import { authSession } from '../../stores/authSession'
import type {
  CourseTrackDTO,
  CreateCourseRequestDTO,
  ManagedCourseDTO,
  SongDTO,
  UpdateCourseRequestDTO,
  WorldsendSongDTO,
} from '../../types/api'
import {
  COURSE_CLASS_OPTIONS,
  type CourseClassOption,
  formatCourseClassLabel,
} from '../../utils/courseClassDisplay'
import { formatCourseTrackFilter } from '../../utils/courseTracks'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  COURSE_INPUT_LIMITS,
  COURSE_MANAGEMENT_COPY,
  formatCourseDeleteLabel,
  formatCourseDeleteTargetMessage,
  formatCourseEditLabel,
  formatCourseRestoreLabel,
} from './CourseManagementPage.constants'
import { CourseTrackEditorDialog } from './CourseTrackEditorDialog'
import {
  type CourseTrackFilterStatus,
  filterManagedCourses,
  hasCourseTracks,
  isManagedCourseDeleted,
  sortManagedCourses,
} from './courseManagement'
import {
  COURSE_TRACK_EDITOR_COPY,
  COURSE_TRACK_SELECTION_SHORT_LABELS,
} from './courseTrackEditor.constants'

type CourseManagementPageProps = {
  title: string
  canCreate: boolean
  canDelete: boolean
}

type CourseFormMode = 'create' | 'edit'

type ClassFilterOption = {
  value: string
  label: string
}

/** クラス絞り込みで全クラス表示を表す値（Kobalte Select で空文字キーが未選択扱いになるのを防ぐ） */
const ALL_CLASS_FILTER_VALUE = '__all__'

const ALL_CLASS_FILTER_OPTION: ClassFilterOption = {
  value: ALL_CLASS_FILTER_VALUE,
  label: COURSE_MANAGEMENT_COPY.allClassesOption,
}

const CLASS_FILTER_OPTIONS: ClassFilterOption[] = [ALL_CLASS_FILTER_OPTION, ...COURSE_CLASS_OPTIONS]

const COURSE_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-surface px-3 py-2 text-base text-text outline-none transition hover:border-input-border-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-text-muted disabled:opacity-100'

type CourseFormValue = {
  idx: string
  name: string
  class: string
}

/**
 * ダイアログの初期入力値を組み立てる。
 *
 * @param course - 編集対象。新規作成時は null。
 * @returns フォーム初期値。
 */
const buildCourseFormValue = (course: ManagedCourseDTO | null): CourseFormValue => ({
  idx: course?.idx ?? '',
  name: course?.name ?? '',
  class: course?.class ?? '',
})

/**
 * プルダウン内でコースクラスのアイコンとラベルを左揃えで表示する。
 *
 * @param props - 表示するコースクラス。
 * @returns セレクト向けのクラス表示。
 */
const CourseClassSelectOption: Component<{ courseClass: string }> = (props) => (
  <span class="inline-flex items-center gap-2">
    <CourseClassMark courseClass={props.courseClass} size="sm" />
    <span class="font-oswald text-sm font-medium tracking-wide">
      CLASS {formatCourseClassLabel(props.courseClass)}
    </span>
  </span>
)

type CourseFormDialogProps = {
  open: boolean
  mode: CourseFormMode
  course: ManagedCourseDTO | null
  saving: boolean
  errorMessage: string
  onOpenChange: (open: boolean) => void
  onCreate: (request: CreateCourseRequestDTO) => void
  onUpdate: (request: UpdateCourseRequestDTO) => void
}

/**
 * コース追加・基本情報編集フォームを表示する。
 *
 * @param props - フォーム種別、対象コース、送信状態とイベント。
 * @returns コース基本情報ダイアログ。
 */
const CourseFormDialog: Component<CourseFormDialogProps> = (props): JSX.Element => {
  const [formValue, setFormValue] = createSignal(buildCourseFormValue(props.course))
  const selectedClass = createMemo(
    () => COURSE_CLASS_OPTIONS.find((option) => option.value === formValue().class) ?? null
  )

  createEffect(() => {
    if (props.open) {
      setFormValue(buildCourseFormValue(props.course))
    }
  })

  /**
   * フォームの指定フィールドを更新する。
   *
   * @param field - 更新するフィールド名。
   * @param value - 入力された値。
   * @returns なし。
   */
  const updateField = (field: keyof CourseFormValue, value: string): void => {
    setFormValue((current) => ({ ...current, [field]: value }))
  }

  /**
   * 入力値を正規化して親コンポーネントへ渡す。
   *
   * @param event - フォーム送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    const current = formValue()
    const name = current.name.trim()
    const courseClass = current.class.trim()
    if (props.mode === 'create') {
      props.onCreate({ idx: current.idx.trim(), name, class: courseClass })
      return
    }
    props.onUpdate({ name, class: courseClass })
  }

  /**
   * 必須項目が空の送信を防ぐ。
   *
   * @returns 保存できない場合は true。
   */
  const isSubmitDisabled = (): boolean =>
    props.saving ||
    formValue().name.trim().length === 0 ||
    formValue().class.trim().length === 0 ||
    (props.mode === 'create' && formValue().idx.trim().length === 0)

  return (
    <AppDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      preventScroll={false}
      pending={props.saving}
      size="lg"
      height="max90"
      title={
        props.mode === 'create'
          ? COURSE_MANAGEMENT_COPY.createDialogTitle
          : COURSE_MANAGEMENT_COPY.editDialogTitle
      }
      description={
        props.mode === 'create'
          ? COURSE_MANAGEMENT_COPY.createDialogDescription
          : COURSE_MANAGEMENT_COPY.editDialogDescription
      }
    >
      <form class="mt-5 flex min-h-0 flex-col" onSubmit={handleSubmit} aria-busy={props.saving}>
        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <Show when={props.mode === 'edit'}>
            <TextField disabled>
              <TextField.Label class="mb-1 block text-sm font-medium text-text-muted">
                {COURSE_MANAGEMENT_COPY.displayIdLabel}
              </TextField.Label>
              <TextField.Input
                value={props.course?.id ?? ''}
                class={`${COURSE_INPUT_CLASS} font-mono text-sm`}
              />
            </TextField>
          </Show>

          <TextField required={props.mode === 'create'} disabled={props.mode === 'edit'}>
            <TextField.Label class="mb-1 block text-sm font-medium text-text-muted">
              {COURSE_MANAGEMENT_COPY.idxLabel}
            </TextField.Label>
            <TextField.Input
              name="course-idx"
              value={formValue().idx}
              maxLength={COURSE_INPUT_LIMITS.idx}
              required={props.mode === 'create'}
              disabled={props.saving || props.mode === 'edit'}
              onInput={(event) => updateField('idx', event.currentTarget.value)}
              class={`${COURSE_INPUT_CLASS} font-mono text-sm`}
            />
          </TextField>

          <TextField required>
            <TextField.Label class="mb-1 block text-sm font-medium text-text-muted">
              {COURSE_MANAGEMENT_COPY.nameLabel}
            </TextField.Label>
            <TextField.Input
              name="course-name"
              value={formValue().name}
              maxLength={COURSE_INPUT_LIMITS.name}
              required
              disabled={props.saving}
              onInput={(event) => updateField('name', event.currentTarget.value)}
              class={`${COURSE_INPUT_CLASS} font-sans`}
            />
          </TextField>

          <FormSelect<CourseClassOption>
            label={COURSE_MANAGEMENT_COPY.classLabel}
            options={COURSE_CLASS_OPTIONS}
            optionValue="value"
            optionTextValue="label"
            value={selectedClass()}
            onChange={(option: CourseClassOption | null) =>
              updateField('class', option?.value ?? '')
            }
            placeholder={COURSE_MANAGEMENT_COPY.classPlaceholder}
            contentZIndexClass="z-60"
            triggerClass="h-10 !py-0"
            valueClass="flex items-center"
            formatLabel={(option) => <CourseClassSelectOption courseClass={option.value} />}
            disabled={props.saving}
          />

          <Show when={props.errorMessage}>
            <p
              class="rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {props.errorMessage}
            </p>
          </Show>
        </div>

        <div class="mt-5 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AppButton disabled={props.saving} onClick={() => props.onOpenChange(false)}>
            {COURSE_MANAGEMENT_COPY.cancelButton}
          </AppButton>
          <AppButton type="submit" variant="primary" disabled={isSubmitDisabled()}>
            {props.saving
              ? COURSE_MANAGEMENT_COPY.saving
              : props.mode === 'create'
                ? COURSE_MANAGEMENT_COPY.createSubmit
                : COURSE_MANAGEMENT_COPY.saveSubmit}
          </AppButton>
        </div>
      </form>
    </AppDialog>
  )
}

/**
 * コースカード下部に表示する1トラック分のコンパクトなプレビュー。
 *
 * @param props - トラック番号、トラック定義、曲名解決用の楽曲マップ。
 * @returns トラック1枠のサマリー要素。
 */
const CourseTrackSummaryChip: Component<{
  trackNo: number
  track?: CourseTrackDTO
  songs: ReadonlyMap<string, SongDTO | WorldsendSongDTO>
  songsLoading: boolean
}> = (props) => {
  const fixedChart = () =>
    props.track?.selection_type === 'FIXED' ? props.track.charts[0] : undefined
  const detailText = () => {
    const track = props.track
    if (track?.selection_type === 'RANDOM_FILTER') {
      return formatCourseTrackFilter(track.filter)
    }
    if (track?.selection_type === 'RANDOM_POOL') {
      return `${track.charts.length}${COURSE_TRACK_EDITOR_COPY.chartCountSuffix}`
    }
    return ''
  }

  return (
    <div class="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface-muted/70 px-2.5 py-1.5 text-xs">
      <span class="shrink-0 font-oswald text-[11px] font-semibold tracking-wider text-text-subtle">
        T{props.trackNo}
      </span>
      <Show
        when={props.track}
        fallback={
          <span class="truncate text-text-subtle">
            {COURSE_TRACK_EDITOR_COPY.unconfiguredTabSummary}
          </span>
        }
      >
        {(track) => (
          <Show
            when={fixedChart()}
            fallback={
              <div class="flex min-w-0 flex-1 items-center gap-1.5">
                <span class="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[11px] font-medium text-text-muted">
                  {COURSE_TRACK_SELECTION_SHORT_LABELS[track().selection_type]}
                </span>
                <span class="min-w-0 truncate font-sans text-text">{detailText()}</span>
              </div>
            }
          >
            {(chart) => (
              <div class="flex min-w-0 flex-1 items-center gap-1.5">
                <CourseChartDifficultyBadge difficulty={chart().difficulty} />
                <span class="min-w-0 truncate font-sans text-text">
                  {props.songs.get(chart().id)?.title ??
                    (props.songsLoading
                      ? COURSE_TRACK_EDITOR_COPY.loadingSongPlaceholder
                      : COURSE_TRACK_EDITOR_COPY.chartUnavailable)}
                </span>
              </div>
            )}
          </Show>
        )}
      </Show>
    </div>
  )
}

/**
 * EDITOR / ADMIN 向けのコース一覧と編集操作を表示する。
 *
 * @param props - 画面タイトルと作成・削除権限。
 * @returns コース管理画面。
 */
const CourseManagementPage = (props: CourseManagementPageProps): JSX.Element => {
  useDocumentTitle(props.title)

  const queryClient = useQueryClient()
  const [trackTarget, setTrackTarget] = createSignal<ManagedCourseDTO | null>(null)
  let trackTrigger: HTMLElement | undefined
  const [searchQuery, setSearchQuery] = createSignal('')
  const [classFilter, setClassFilter] = createSignal<ClassFilterOption>(ALL_CLASS_FILTER_OPTION)
  const [statusFilter, setStatusFilter] = createSignal<CourseTrackFilterStatus>('all')
  const [formMode, setFormMode] = createSignal<CourseFormMode | null>(null)
  const [editingCourse, setEditingCourse] = createSignal<ManagedCourseDTO | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [formError, setFormError] = createSignal('')
  const [deleteTargetCourse, setDeleteTargetCourse] = createSignal<ManagedCourseDTO | null>(null)
  const [deleting, setDeleting] = createSignal(false)

  const username = (): string | null => authSession.user?.username ?? null
  const coursesQuery = useQuery(() => managedCoursesQueryOptions(username()))
  const courses = createMemo(() => sortManagedCourses(coursesQuery.data?.courses ?? []))
  const fixedCharts = createMemo(() =>
    courses().flatMap(
      (course) =>
        course.tracks?.flatMap((track) => (track.selection_type === 'FIXED' ? track.charts : [])) ??
        []
    )
  )
  const trackSongs = createCourseTrackSongs(
    () => fixedCharts().some((chart) => chart.difficulty !== 'WORLDSEND'),
    () => fixedCharts().some((chart) => chart.difficulty === 'WORLDSEND')
  )

  const hasDeletedCourses = createMemo(() => courses().some(isManagedCourseDeleted))
  const unconfiguredCount = createMemo(
    () =>
      courses().filter((course) => !isManagedCourseDeleted(course) && !hasCourseTracks(course))
        .length
  )

  const statusOptions = createMemo<readonly AppTabOption<CourseTrackFilterStatus>[]>(() => {
    const base: AppTabOption<CourseTrackFilterStatus>[] = [
      { value: 'all', label: COURSE_MANAGEMENT_COPY.statusFilterAll },
      { value: 'unconfigured', label: COURSE_MANAGEMENT_COPY.statusFilterUnconfigured },
      { value: 'configured', label: COURSE_MANAGEMENT_COPY.statusFilterConfigured },
    ]
    if (hasDeletedCourses()) {
      base.push({ value: 'deleted', label: COURSE_MANAGEMENT_COPY.statusFilterDeleted })
    }
    return base
  })

  createEffect(() => {
    if (statusFilter() === 'deleted' && !hasDeletedCourses()) {
      setStatusFilter('all')
    }
  })

  const filteredCourses = createMemo(() =>
    filterManagedCourses(courses(), searchQuery(), {
      courseClass: classFilter().value === ALL_CLASS_FILTER_VALUE ? '' : classFilter().value,
      status: statusFilter(),
    })
  )

  const isFiltering = createMemo(
    () =>
      searchQuery().trim().length > 0 ||
      classFilter().value !== ALL_CLASS_FILTER_VALUE ||
      statusFilter() !== 'all'
  )

  /** 検索・絞り込み条件を初期状態へ戻す。 */
  const resetFilters = (): void => {
    setSearchQuery('')
    setClassFilter(ALL_CLASS_FILTER_OPTION)
    setStatusFilter('all')
  }

  /** コース一覧を再取得する。 */
  const refresh = (): void => {
    void coursesQuery.refetch()
  }

  /** 構成エディターを閉じて、起動ボタンにフォーカスを戻す。 */
  const closeTrackEditor = (): void => {
    setTrackTarget(null)
    if (trackTrigger?.isConnected) trackTrigger.focus({ preventScroll: true })
    trackTrigger = undefined
  }

  /**
   * 構成保存後に、変更したコースの管理一覧と公開コース詳細のキャッシュだけを無効化する。
   *
   * @param displayId - 構成を保存したコースの公開ID。
   */
  const refreshCourseTracks = (displayId: string): void => {
    void queryClient.invalidateQueries({ queryKey: courseQueryKeys.managed(username()) })
    void queryClient.invalidateQueries({ queryKey: courseQueryKeys.detail(displayId) })
  }

  /** コース追加ダイアログを開く。 */
  const openCreateDialog = (): void => {
    setEditingCourse(null)
    setFormError('')
    setFormMode('create')
  }

  /**
   * コース編集ダイアログを開く。
   *
   * @param course - 編集するコース。
   * @returns なし。
   */
  const openEditDialog = (course: ManagedCourseDTO): void => {
    setEditingCourse(course)
    setFormError('')
    setFormMode('edit')
  }

  /** コースフォームを閉じて入力状態を破棄する。 */
  const closeForm = (): void => {
    setFormMode(null)
    setEditingCourse(null)
    setFormError('')
  }

  /**
   * コースフォームの開閉状態を反映する。
   *
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleFormOpenChange = (open: boolean): void => {
    if (open || saving()) return
    closeForm()
  }

  /**
   * コースを新規作成する。
   *
   * @param request - 正規化済みの追加内容。
   * @returns 保存完了時に解決するPromise。
   */
  const handleCreate = async (request: CreateCourseRequestDTO): Promise<void> => {
    setFormError('')
    setSaving(true)
    try {
      await createCourse(request)
      showSuccessToast(COURSE_MANAGEMENT_COPY.createSuccess)
      closeForm()
      refresh()
    } catch (error) {
      setFormError(toUserFriendlyErrorMessage(error, COURSE_MANAGEMENT_COPY.createError))
    } finally {
      setSaving(false)
    }
  }

  /**
   * コース名称とクラスを更新する。
   *
   * @param request - 正規化済みの更新内容。
   * @returns 保存完了時に解決するPromise。
   */
  const handleUpdate = async (request: UpdateCourseRequestDTO): Promise<void> => {
    const course = editingCourse()
    if (!course) return

    setFormError('')
    setSaving(true)
    try {
      await updateCourse(course.id, request)
      showSuccessToast(COURSE_MANAGEMENT_COPY.editSuccess)
      closeForm()
      refresh()
    } catch (error) {
      setFormError(toUserFriendlyErrorMessage(error, COURSE_MANAGEMENT_COPY.editError))
    } finally {
      setSaving(false)
    }
  }

  /**
   * 削除確認ダイアログの開閉要求を反映する。開く操作は削除ボタンから行うため、閉じる要求のみ扱う。
   *
   * @param open - ダイアログを開く場合はtrue。
   * @returns なし。
   */
  const handleDeleteDialogOpenChange = (open: boolean): void => {
    if (open) return
    setDeleteTargetCourse(null)
  }

  /**
   * 確認ダイアログで確定されたコースを削除し、完了後にダイアログを閉じる。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const handleDelete = async (): Promise<void> => {
    const course = deleteTargetCourse()
    if (!course) return

    setDeleting(true)
    try {
      await deleteCourseByDisplayId(course.id)
      showSuccessToast(COURSE_MANAGEMENT_COPY.deleteSuccess)
      refresh()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, COURSE_MANAGEMENT_COPY.deleteError))
    } finally {
      setDeleting(false)
      setDeleteTargetCourse(null)
    }
  }

  /**
   * 指定したコースを復元する。
   *
   * @param course - 復元対象のコース。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleRestore = async (course: ManagedCourseDTO): Promise<void> => {
    try {
      await restoreCourseByDisplayId(course.id)
      showSuccessToast(COURSE_MANAGEMENT_COPY.restoreSuccess)
      refresh()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, COURSE_MANAGEMENT_COPY.restoreError))
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2.5">
          <h1 class="text-2xl font-semibold">{props.title}</h1>
          <Show when={!coursesQuery.isPending && !coursesQuery.error}>
            <span class="rounded-full bg-surface-muted px-2.5 py-0.5 font-jost text-xs font-medium text-text-muted">
              {courses().length}
              {COURSE_MANAGEMENT_COPY.totalCountSuffix}
            </span>
            <Show when={unconfiguredCount() > 0}>
              <span class="rounded-full border border-warning-border bg-warning-bg px-2.5 py-0.5 font-jost text-xs font-semibold text-warning">
                {COURSE_MANAGEMENT_COPY.unconfiguredSummary} {unconfiguredCount()}
                {COURSE_MANAGEMENT_COPY.totalCountSuffix}
              </span>
            </Show>
          </Show>
        </div>
        <Show when={props.canCreate}>
          <AppButton
            variant="primary"
            leftIcon={<Plus class="h-4 w-4" aria-hidden="true" />}
            onClick={openCreateDialog}
          >
            {COURSE_MANAGEMENT_COPY.createButton}
          </AppButton>
        </Show>
      </div>

      <Show when={!coursesQuery.isPending} fallback={<Loading />}>
        <Show when={!coursesQuery.error} fallback={<LoadError error={coursesQuery.error} />}>
          <div class="space-y-3 rounded-lg border border-border bg-surface p-3">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_12rem]">
              <SearchTextField
                ariaLabel={COURSE_MANAGEMENT_COPY.searchLabel}
                value={searchQuery()}
                onChange={setSearchQuery}
                placeholder={COURSE_MANAGEMENT_COPY.searchPlaceholder}
                active={searchQuery().trim().length > 0}
                frameClass="h-10 rounded-md"
              />
              <AppSelect<ClassFilterOption>
                label={COURSE_MANAGEMENT_COPY.classFilterLabel}
                labelVariant="srOnly"
                options={CLASS_FILTER_OPTIONS}
                optionValue="value"
                optionTextValue="label"
                value={classFilter()}
                onChange={(option) => setClassFilter(option ?? ALL_CLASS_FILTER_OPTION)}
                disallowEmptySelection
                triggerClass="h-10 rounded-md !py-0"
                valueClass="flex items-center"
                formatLabel={(option) =>
                  option.value !== ALL_CLASS_FILTER_VALUE ? (
                    <CourseClassSelectOption courseClass={option.value} />
                  ) : (
                    <span class="text-sm">{option.label}</span>
                  )
                }
              />
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2">
              <SegmentedToggleGroup
                ariaLabel={COURSE_MANAGEMENT_COPY.statusFilterLabel}
                options={statusOptions()}
                value={statusFilter()}
                onChange={setStatusFilter}
                class="flex-wrap"
                itemClass="px-2.5 py-1 text-xs sm:text-sm"
              />
              <Show when={isFiltering()}>
                <span class="font-jost text-xs text-text-muted">
                  {COURSE_MANAGEMENT_COPY.showingCountPrefix} {filteredCourses().length} /{' '}
                  {courses().length}
                  {COURSE_MANAGEMENT_COPY.totalCountSuffix}
                </span>
              </Show>
            </div>
          </div>

          <Show
            when={filteredCourses().length > 0}
            fallback={
              <div class="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-4 py-10 text-center">
                <p class="text-sm text-text-muted">
                  {courses().length === 0
                    ? COURSE_MANAGEMENT_COPY.emptyState
                    : COURSE_MANAGEMENT_COPY.emptySearchState}
                </p>
                <Show when={isFiltering()}>
                  <AppButton variant="surface" size="sm" onClick={resetFilters}>
                    {COURSE_MANAGEMENT_COPY.resetFiltersButton}
                  </AppButton>
                </Show>
              </div>
            }
          >
            <ul class="space-y-2.5">
              <For each={filteredCourses()}>
                {(course) => {
                  const deleted = () => isManagedCourseDeleted(course)
                  const configured = () => hasCourseTracks(course)

                  return (
                    <li
                      class={`rounded-lg border p-3 transition-colors sm:p-4 ${
                        deleted()
                          ? 'border-danger-border bg-danger-bg/60'
                          : 'border-border bg-surface'
                      }`}
                    >
                      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div class="flex min-w-0 items-center gap-3">
                          <CourseClassMark courseClass={course.class} />
                          <div class="min-w-0 flex-1 space-y-1">
                            <div class="flex flex-wrap items-center gap-2">
                              <h2 class="break-words font-sans text-base font-semibold text-text">
                                {course.name}
                              </h2>
                              <Show
                                when={!deleted()}
                                fallback={
                                  <span class="rounded-full border border-danger-border bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">
                                    {COURSE_MANAGEMENT_COPY.deletedStatus}
                                  </span>
                                }
                              >
                                <Show when={!configured()}>
                                  <span class="rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                                    {COURSE_MANAGEMENT_COPY.unconfiguredStatus}
                                  </span>
                                </Show>
                              </Show>
                            </div>
                            <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-xs text-text-subtle">
                              <span>idx: {course.idx}</span>
                              <span class="break-all">id: {course.id}</span>
                            </div>
                          </div>
                        </div>

                        <div class="flex shrink-0 items-center gap-2 sm:justify-end">
                          <Show
                            when={!deleted()}
                            fallback={
                              <>
                                <AppIconButton
                                  size="sm"
                                  aria-label={formatCourseEditLabel(course.name)}
                                  title={COURSE_MANAGEMENT_COPY.editBasicInfoAction}
                                  onClick={() => openEditDialog(course)}
                                >
                                  <Pencil class="size-4" aria-hidden="true" />
                                </AppIconButton>
                                <AppIconButton
                                  tone="primary"
                                  size="sm"
                                  aria-label={formatCourseRestoreLabel(course.name)}
                                  title={COURSE_MANAGEMENT_COPY.restoreAction}
                                  onClick={() => void handleRestore(course)}
                                >
                                  <RotateCcw class="size-4" aria-hidden="true" />
                                </AppIconButton>
                              </>
                            }
                          >
                            <AppIconButton
                              tone={configured() ? 'surface' : 'primary'}
                              size="sm"
                              aria-label={`${course.name}の${COURSE_TRACK_EDITOR_COPY.action}`}
                              title={COURSE_MANAGEMENT_COPY.editTracksAction}
                              onClick={(
                                event: MouseEvent & { currentTarget: HTMLButtonElement }
                              ) => {
                                trackTrigger = event.currentTarget
                                setTrackTarget(course)
                              }}
                            >
                              <ListMusic class="size-4" aria-hidden="true" />
                            </AppIconButton>
                            <AppIconButton
                              size="sm"
                              aria-label={formatCourseEditLabel(course.name)}
                              title={COURSE_MANAGEMENT_COPY.editBasicInfoAction}
                              onClick={() => openEditDialog(course)}
                            >
                              <Pencil class="size-4" aria-hidden="true" />
                            </AppIconButton>
                            <Show when={props.canDelete}>
                              <AppIconButton
                                tone="danger"
                                size="sm"
                                aria-label={formatCourseDeleteLabel(course.name)}
                                title={COURSE_MANAGEMENT_COPY.deleteAction}
                                onClick={() => setDeleteTargetCourse(course)}
                              >
                                <Trash2 class="size-4" aria-hidden="true" />
                              </AppIconButton>
                            </Show>
                          </Show>
                        </div>
                      </div>

                      <Show when={!deleted() && configured()}>
                        <div class="mt-3 grid grid-cols-1 gap-1.5 border-t border-border pt-2.5 sm:grid-cols-3">
                          <For each={COURSE_TRACK_NUMBERS}>
                            {(trackNo) => (
                              <CourseTrackSummaryChip
                                trackNo={trackNo}
                                track={course.tracks?.find((item) => item.track_no === trackNo)}
                                songs={trackSongs.songsById()}
                                songsLoading={trackSongs.loading()}
                              />
                            )}
                          </For>
                        </div>
                      </Show>
                    </li>
                  )
                }}
              </For>
            </ul>
          </Show>
        </Show>
      </Show>

      <Show when={trackTarget()} keyed>
        {(course) => (
          <CourseTrackEditorDialog
            course={course}
            onClose={closeTrackEditor}
            onSaved={() => refreshCourseTracks(course.id)}
          />
        )}
      </Show>

      <CourseFormDialog
        open={formMode() !== null}
        mode={formMode() ?? 'create'}
        course={editingCourse()}
        saving={saving()}
        errorMessage={formError()}
        onOpenChange={handleFormOpenChange}
        onCreate={(request) => void handleCreate(request)}
        onUpdate={(request) => void handleUpdate(request)}
      />

      <AppConfirmDialog
        open={deleteTargetCourse() !== null}
        onOpenChange={handleDeleteDialogOpenChange}
        title={COURSE_MANAGEMENT_COPY.deleteDialogTitle}
        description={formatCourseDeleteTargetMessage(deleteTargetCourse()?.name ?? '')}
        cancelLabel={COURSE_MANAGEMENT_COPY.cancelButton}
        confirmLabel={
          deleting() ? COURSE_MANAGEMENT_COPY.deleting : COURSE_MANAGEMENT_COPY.deleteSubmit
        }
        confirmVariant="danger"
        pending={deleting()}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

export default CourseManagementPage
