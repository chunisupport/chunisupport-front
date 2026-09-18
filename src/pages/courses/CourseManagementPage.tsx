import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import {
  createCourse,
  deleteCourseByDisplayId,
  fetchManagedCourses,
  restoreCourseByDisplayId,
  updateCourse,
} from '../../api/courses'
import { LoadError, Loading } from '../../components'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { FormSelect } from '../../components/common/AppSelect'
import { showErrorToast, showSuccessToast } from '../../components/common/AppToast'
import { RECORD_COMPACT_BADGE_CLASS } from '../../components/common/record/RecordBadges'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type {
  CreateCourseRequestDTO,
  ManagedCourseDTO,
  UpdateCourseRequestDTO,
} from '../../types/api'
import {
  COURSE_CLASS_OPTIONS,
  type CourseClassOption,
  courseClassBadgeClass,
  formatCourseClass,
} from '../../utils/courseClassDisplay'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  COURSE_INPUT_LIMITS,
  COURSE_MANAGEMENT_COPY,
  formatCourseDeleteLabel,
  formatCourseEditLabel,
  formatCourseRestoreLabel,
} from './CourseManagementPage.constants'
import {
  filterManagedCourses,
  isManagedCourseDeleted,
  sortManagedCourses,
} from './courseManagement'

type CourseManagementPageProps = {
  title: string
  canCreate: boolean
  canDelete: boolean
}

type CourseFormMode = 'create' | 'edit'

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
 * コース追加・編集フォームを表示する。
 *
 * @param props - フォーム種別、対象コース、送信状態とイベント。
 * @returns コース編集ダイアログ。
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
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface p-6 shadow-lg">
          <Dialog.Title class="shrink-0 text-lg font-bold text-text">
            {props.mode === 'create'
              ? COURSE_MANAGEMENT_COPY.createDialogTitle
              : COURSE_MANAGEMENT_COPY.editDialogTitle}
          </Dialog.Title>
          <Dialog.Description class="mt-1 shrink-0 text-sm text-text-muted">
            {props.mode === 'create'
              ? COURSE_MANAGEMENT_COPY.createDialogDescription
              : COURSE_MANAGEMENT_COPY.editDialogDescription}
          </Dialog.Description>

          <form class="mt-5 flex min-h-0 flex-col" onSubmit={handleSubmit} aria-busy={props.saving}>
            <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <Show when={props.mode === 'edit'}>
                <TextField disabled>
                  <TextField.Label class="mb-1 block text-sm font-medium text-text-muted">
                    {COURSE_MANAGEMENT_COPY.displayIdLabel}
                  </TextField.Label>
                  <TextField.Input
                    value={props.course?.display_id ?? ''}
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
                formatLabel={(option) => option.label}
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
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

  const [refreshKey, setRefreshKey] = createSignal(0)
  const [searchQuery, setSearchQuery] = createSignal('')
  const [formMode, setFormMode] = createSignal<CourseFormMode | null>(null)
  const [editingCourse, setEditingCourse] = createSignal<ManagedCourseDTO | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [formError, setFormError] = createSignal('')

  const [coursesResponse] = createResource(refreshKey, fetchManagedCourses)
  const courses = createMemo(() => sortManagedCourses(coursesResponse()?.courses ?? []))
  const filteredCourses = createMemo(() => filterManagedCourses(courses(), searchQuery()))

  /** コース一覧を再取得する。 */
  const refresh = (): void => {
    setRefreshKey((current) => current + 1)
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
      await updateCourse(course.display_id, request)
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
   * 指定したコースを確認後に削除する。
   *
   * @param course - 削除対象のコース。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleDelete = async (course: ManagedCourseDTO): Promise<void> => {
    if (!window.confirm(COURSE_MANAGEMENT_COPY.deleteConfirm)) return

    try {
      await deleteCourseByDisplayId(course.display_id)
      showSuccessToast(COURSE_MANAGEMENT_COPY.deleteSuccess)
      refresh()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, COURSE_MANAGEMENT_COPY.deleteError))
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
      await restoreCourseByDisplayId(course.display_id)
      showSuccessToast(COURSE_MANAGEMENT_COPY.restoreSuccess)
      refresh()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, COURSE_MANAGEMENT_COPY.restoreError))
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">{props.title}</h1>
          <p class="mt-1 text-sm text-text-muted">{COURSE_MANAGEMENT_COPY.pageDescription}</p>
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

      <Show when={!coursesResponse.loading} fallback={<Loading />}>
        <Show when={!coursesResponse.error} fallback={<LoadError error={coursesResponse.error} />}>
          <TextField class="flex items-center gap-2 rounded border border-border-strong px-2 focus-within:border-focus-ring">
            <Search class="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
            <TextField.Label class="sr-only">{COURSE_MANAGEMENT_COPY.searchLabel}</TextField.Label>
            <TextField.Input
              type="search"
              value={searchQuery()}
              onInput={(event) => setSearchQuery(event.currentTarget.value)}
              placeholder={COURSE_MANAGEMENT_COPY.searchPlaceholder}
              class="min-w-0 flex-1 py-2 font-sans text-sm outline-none"
            />
          </TextField>

          <div class="overflow-x-auto rounded-lg border border-border bg-surface">
            <table class="min-w-full text-sm">
              <thead class="bg-surface-muted">
                <tr>
                  <th class="w-0 whitespace-nowrap px-3 py-2 text-left">
                    {COURSE_MANAGEMENT_COPY.actionsHeading}
                  </th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">
                    {COURSE_MANAGEMENT_COPY.displayIdLabel}
                  </th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">
                    {COURSE_MANAGEMENT_COPY.idxLabel}
                  </th>
                  <th class="px-3 py-2 text-left">{COURSE_MANAGEMENT_COPY.nameLabel}</th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">
                    {COURSE_MANAGEMENT_COPY.classLabel}
                  </th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">
                    {COURSE_MANAGEMENT_COPY.statusLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={filteredCourses()}>
                  {(course) => (
                    <tr
                      class="border-t border-border"
                      classList={{ 'bg-danger-bg': isManagedCourseDeleted(course) }}
                    >
                      <td class="w-0 whitespace-nowrap px-3 py-2">
                        <div class="flex gap-2">
                          <AppIconButton
                            aria-label={formatCourseEditLabel(course.name)}
                            title={COURSE_MANAGEMENT_COPY.editAction}
                            onClick={() => openEditDialog(course)}
                          >
                            <Pencil class="h-4 w-4" aria-hidden="true" />
                          </AppIconButton>
                          <Show
                            when={!isManagedCourseDeleted(course)}
                            fallback={
                              <AppIconButton
                                tone="primary"
                                aria-label={formatCourseRestoreLabel(course.name)}
                                title={COURSE_MANAGEMENT_COPY.restoreAction}
                                onClick={() => void handleRestore(course)}
                              >
                                <RotateCcw class="h-4 w-4" aria-hidden="true" />
                              </AppIconButton>
                            }
                          >
                            <Show when={props.canDelete}>
                              <AppIconButton
                                tone="danger"
                                aria-label={formatCourseDeleteLabel(course.name)}
                                title={COURSE_MANAGEMENT_COPY.deleteAction}
                                onClick={() => void handleDelete(course)}
                              >
                                <Trash2 class="h-4 w-4" aria-hidden="true" />
                              </AppIconButton>
                            </Show>
                          </Show>
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 font-mono text-xs">
                        {course.display_id}
                      </td>
                      <td class="whitespace-nowrap px-3 py-2 font-mono">{course.idx}</td>
                      <td class="px-3 py-2 font-sans">{course.name}</td>
                      <td class="whitespace-nowrap px-3 py-2">
                        <span
                          class={`${RECORD_COMPACT_BADGE_CLASS} ${courseClassBadgeClass(course.class)}`}
                        >
                          {formatCourseClass(course.class)}
                        </span>
                      </td>
                      <td class="whitespace-nowrap px-3 py-2">
                        {isManagedCourseDeleted(course)
                          ? COURSE_MANAGEMENT_COPY.deletedStatus
                          : COURSE_MANAGEMENT_COPY.activeStatus}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>

          <Show when={filteredCourses().length === 0}>
            <p class="text-sm text-text-subtle">
              {courses().length === 0
                ? COURSE_MANAGEMENT_COPY.emptyState
                : COURSE_MANAGEMENT_COPY.emptySearchState}
            </p>
          </Show>
        </Show>
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
    </div>
  )
}

export default CourseManagementPage
