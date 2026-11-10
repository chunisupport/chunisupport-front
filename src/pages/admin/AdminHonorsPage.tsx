import { Dialog } from '@kobalte/core/dialog'
import { Link } from '@kobalte/core/link'
import { TextField } from '@kobalte/core/text-field'
import { ExternalLink, Pencil, Plus } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { createHonor, fetchAdminHonors, fetchHonorTypes, updateHonor } from '../../api/honors'
import { Loading } from '../../components'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { AppSelect, FormSelect } from '../../components/common/AppSelect'
import { showSuccessToast } from '../../components/common/AppToast'
import { SearchTextField } from '../../components/common/SearchTextField'
import { SortableTableHeaderCell } from '../../components/common/SortableTableHeader'
import { getHonorTypeClassName } from '../../constants/honors'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { AdminHonorDTO, HonorRequestDTO, MasterItemDTO } from '../../types/api'
import {
  type AdminHonorSort,
  type AdminHonorSortKey,
  buildAdminHonorImageHref,
  filterAndSortAdminHonors,
  formatAdminHonorCreatedAt,
  nextAdminHonorSort,
} from '../../utils/adminHonorsList'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  ADMIN_HONORS_ALL_TYPE_VALUE,
  ADMIN_HONORS_COPY,
  HONOR_INPUT_LIMITS,
} from './AdminHonorsPage.constants'

type HonorFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  honor: AdminHonorDTO | null
  honorTypes: MasterItemDTO[]
  saving: boolean
  apiErrorMessage: string
  onOpenChange: (open: boolean) => void
  onSubmit: (request: HonorRequestDTO) => void
}

type HonorTypeFilterOption = { value: string; label: string }

/**
 * 称号フォーム内の入力系コントロールに適用する共通スタイル。
 */
const HONOR_EDIT_FIELD_FOCUS_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
const HONOR_EDIT_TEXT_INPUT_CLASS = `w-full rounded border border-border-strong bg-surface px-3 py-2 hover:border-input-border-hover ${HONOR_EDIT_FIELD_FOCUS_CLASS}`

/**
 * 称号編集フォームの初期値を作成する。
 *
 * @param honor - 編集対象の称号。
 * @returns 称号編集リクエスト。
 */
const buildHonorRequest = (honor: AdminHonorDTO | null): HonorRequestDTO => ({
  name: honor?.name ?? '',
  type_name: honor?.type_name ?? '',
  image_url: honor?.image_url ?? '',
})

/**
 * 管理者向け称号の追加・編集ダイアログを描画する。
 *
 * @param props - ダイアログ状態、編集対象、称号タイプ候補、保存ハンドラ。
 * @returns 称号フォームダイアログ。
 */
const HonorFormDialog: Component<HonorFormDialogProps> = (props) => {
  const [request, setRequest] = createSignal<HonorRequestDTO>(buildHonorRequest(props.honor))
  const selectedHonorType = createMemo(
    () => props.honorTypes.find((type) => type.name === request().type_name) ?? null
  )

  createEffect(() => {
    if (props.open) {
      setRequest(buildHonorRequest(props.honor))
    }
  })

  /**
   * 称号編集フォームの値を更新する。
   *
   * @param key - 更新対象フィールド。
   * @param value - 更新後の値。
   * @returns なし。
   */
  const updateRequestField = <K extends keyof HonorRequestDTO>(
    key: K,
    value: HonorRequestDTO[K]
  ): void => {
    setRequest((current) => ({ ...current, [key]: value }))
  }

  /**
   * 称号編集フォームを送信する。
   *
   * @param event - フォーム送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    const current = request()
    props.onSubmit({
      name: current.name.trim(),
      type_name: current.type_name.trim(),
      image_url: current.image_url.trim(),
    })
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface p-6 shadow-lg">
          <Dialog.Title class="shrink-0 text-lg font-bold text-text">
            {props.mode === 'create'
              ? ADMIN_HONORS_COPY.createDialogTitle
              : ADMIN_HONORS_COPY.editDialogTitle}
          </Dialog.Title>
          <Dialog.Description class="mt-1 shrink-0 text-sm text-text-muted">
            {ADMIN_HONORS_COPY.formDescription}
          </Dialog.Description>

          <form class="mt-5 flex min-h-0 flex-col" onSubmit={handleSubmit}>
            <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <TextField>
                <TextField.Label class="mb-1 block text-sm text-text-muted">
                  {ADMIN_HONORS_COPY.honorLabel}
                </TextField.Label>
                <TextField.Input
                  value={request().name}
                  maxLength={HONOR_INPUT_LIMITS.name}
                  required
                  onInput={(event) => updateRequestField('name', event.currentTarget.value)}
                  class={`${HONOR_EDIT_TEXT_INPUT_CLASS} font-sans`}
                />
              </TextField>

              <FormSelect<MasterItemDTO>
                label={ADMIN_HONORS_COPY.typeLabel}
                options={props.honorTypes}
                optionValue="name"
                optionTextValue="name"
                value={selectedHonorType()}
                onChange={(type: MasterItemDTO | null) =>
                  updateRequestField('type_name', type?.name ?? '')
                }
                placeholder={ADMIN_HONORS_COPY.selectPlaceholder}
                contentZIndexClass="z-60"
                formatLabel={(type) => type.name}
              />

              <TextField>
                <TextField.Label class="mb-1 block text-sm text-text-muted">
                  {ADMIN_HONORS_COPY.imageUrlLabel}
                </TextField.Label>
                <TextField.Input
                  value={request().image_url}
                  maxLength={HONOR_INPUT_LIMITS.imageUrl}
                  onInput={(event) => updateRequestField('image_url', event.currentTarget.value)}
                  class={`${HONOR_EDIT_TEXT_INPUT_CLASS} font-mono text-xs`}
                />
              </TextField>

              <Show when={props.apiErrorMessage}>
                <p class="rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
                  {props.apiErrorMessage}
                </p>
              </Show>
            </div>

            <div class="mt-5 flex shrink-0 justify-end gap-2">
              <AppButton onClick={() => props.onOpenChange(false)} disabled={props.saving}>
                {ADMIN_HONORS_COPY.cancelButton}
              </AppButton>
              <AppButton
                type="submit"
                variant="primary"
                disabled={props.saving || !request().name.trim() || !request().type_name.trim()}
              >
                {props.saving
                  ? ADMIN_HONORS_COPY.savingButton
                  : props.mode === 'create'
                    ? ADMIN_HONORS_COPY.createButtonLabel
                    : ADMIN_HONORS_COPY.saveButton}
              </AppButton>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

/**
 * 管理者向けの称号一覧画面を描画する。
 *
 * @returns 称号管理UI。
 */
const AdminHonorsPage = () => {
  useDocumentTitle(ADMIN_HONORS_COPY.pageTitle)

  const [refreshKey, setRefreshKey] = createSignal(0)
  const [dialogMode, setDialogMode] = createSignal<'create' | 'edit' | null>(null)
  const [editingHonor, setEditingHonor] = createSignal<AdminHonorDTO | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [formErrorMessage, setFormErrorMessage] = createSignal('')
  const [searchQuery, setSearchQuery] = createSignal('')
  const [selectedType, setSelectedType] = createSignal(ADMIN_HONORS_ALL_TYPE_VALUE)
  const [sort, setSort] = createSignal<AdminHonorSort>('created-at-desc')

  const [honorsResponse] = createResource(() => refreshKey(), fetchAdminHonors)
  const [honorTypesResponse] = createResource(fetchHonorTypes)
  const honors = createMemo(() => honorsResponse()?.honors ?? [])
  const honorTypes = createMemo(() => honorTypesResponse()?.honor_types ?? [])
  const typeFilterOptions = createMemo<HonorTypeFilterOption[]>(() => [
    { value: ADMIN_HONORS_ALL_TYPE_VALUE, label: ADMIN_HONORS_COPY.allTypes },
    ...honorTypes().map((type) => ({ value: type.name, label: type.name })),
  ])
  const selectedTypeOption = createMemo(
    () => typeFilterOptions().find((option) => option.value === selectedType()) ?? null
  )
  const filteredHonors = createMemo(() =>
    filterAndSortAdminHonors(
      honors(),
      searchQuery(),
      selectedType() === ADMIN_HONORS_ALL_TYPE_VALUE ? null : selectedType(),
      sort()
    )
  )

  /**
   * 称号名検索を更新する。
   *
   * @param value - 検索文字列。
   * @returns なし。
   */
  const handleSearchChange = (value: string): void => {
    setSearchQuery(value)
  }

  /**
   * クラス絞り込みを更新する。
   *
   * @param value - 選択したクラス。
   * @returns なし。
   */
  const handleTypeChange = (value: HonorTypeFilterOption | null): void => {
    setSelectedType(value?.value ?? ADMIN_HONORS_ALL_TYPE_VALUE)
  }

  /**
   * 選択した列の並べ替え方向を切り替える。
   *
   * @param key - 並べ替える列。
   * @returns なし。
   */
  const handleSortChange = (key: AdminHonorSortKey): void => {
    setSort((current) => nextAdminHonorSort(current, key))
  }

  /**
   * 指定した列が現在の並べ替え対象か判定する。
   *
   * @param key - 判定する列。
   * @returns 現在の並べ替え対象ならtrue。
   */
  const isSortActive = (key: AdminHonorSortKey): boolean =>
    sort() === `${key}-asc` || sort() === `${key}-desc`

  /**
   * 称号一覧を再取得する。
   *
   * @returns なし。
   */
  const refresh = (): void => {
    setRefreshKey((current) => current + 1)
  }

  /**
   * 指定した称号の編集ダイアログを開く。
   *
   * @param honor - 編集対象の称号。
   * @returns なし。
   */
  const openEditDialog = (honor: AdminHonorDTO): void => {
    setEditingHonor(honor)
    setFormErrorMessage('')
    setDialogMode('edit')
  }

  /**
   * 称号追加ダイアログを開く。
   *
   * @returns なし。
   */
  const openCreateDialog = (): void => {
    setEditingHonor(null)
    setFormErrorMessage('')
    setDialogMode('create')
  }

  /**
   * 編集ダイアログの開閉状態を更新する。
   *
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleDialogOpenChange = (open: boolean): void => {
    if (!open) {
      setDialogMode(null)
      setEditingHonor(null)
      setFormErrorMessage('')
    }
  }

  /**
   * 称号を新規作成する。
   *
   * @param request - 作成する称号の内容。
   * @returns なし。
   */
  const handleSubmitCreate = async (request: HonorRequestDTO): Promise<void> => {
    setFormErrorMessage('')
    setSaving(true)

    try {
      await createHonor(request)
      showSuccessToast(ADMIN_HONORS_COPY.createSuccess)
      handleDialogOpenChange(false)
      refresh()
    } catch (error) {
      setFormErrorMessage(toUserFriendlyErrorMessage(error, ADMIN_HONORS_COPY.createError))
    } finally {
      setSaving(false)
    }
  }

  /**
   * 称号編集内容を保存する。
   *
   * @param request - 称号更新リクエスト。
   * @returns なし。
   */
  const handleSubmitEdit = async (request: HonorRequestDTO): Promise<void> => {
    const honor = editingHonor()
    if (!honor) return

    setFormErrorMessage('')
    setSaving(true)

    try {
      await updateHonor(honor.id, request)
      showSuccessToast(ADMIN_HONORS_COPY.editSuccess)
      handleDialogOpenChange(false)
      refresh()
    } catch (error) {
      setFormErrorMessage(toUserFriendlyErrorMessage(error, ADMIN_HONORS_COPY.editError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">{ADMIN_HONORS_COPY.pageTitle}</h1>
          <p class="mt-1 text-sm text-text-muted">{ADMIN_HONORS_COPY.pageDescription}</p>
        </div>
        <AppButton
          variant="primary"
          leftIcon={<Plus class="h-4 w-4" aria-hidden="true" />}
          onClick={openCreateDialog}
        >
          {ADMIN_HONORS_COPY.createButton}
        </AppButton>
      </div>

      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,12rem)] sm:items-end">
        <SearchTextField
          ariaLabel={ADMIN_HONORS_COPY.searchLabel}
          label={ADMIN_HONORS_COPY.searchLabel}
          value={searchQuery()}
          placeholder={ADMIN_HONORS_COPY.searchPlaceholder}
          active={searchQuery().trim().length > 0}
          onChange={handleSearchChange}
        />
        <AppSelect<HonorTypeFilterOption>
          label={ADMIN_HONORS_COPY.typeLabel}
          options={typeFilterOptions()}
          optionValue="value"
          optionTextValue="label"
          value={selectedTypeOption()}
          onChange={handleTypeChange}
          formatLabel={(type) => type.label}
        />
      </div>

      <Show when={!honorsResponse.loading} fallback={<Loading />}>
        <p class="text-sm text-text-muted" aria-live="polite">
          {ADMIN_HONORS_COPY.resultCount(filteredHonors().length, honors().length)}
        </p>
        <div class="overflow-x-auto rounded-lg border border-border bg-surface">
          <table class="min-w-full text-center text-sm">
            <thead class="bg-surface-muted">
              <tr>
                <SortableTableHeaderCell
                  label={ADMIN_HONORS_COPY.idColumn}
                  active={isSortActive('id')}
                  direction={sort().endsWith('-asc') ? 'asc' : 'desc'}
                  onClick={() => handleSortChange('id')}
                  thClass="w-0 whitespace-nowrap text-nowrap"
                  buttonClass="justify-center px-3 py-2"
                />
                <SortableTableHeaderCell
                  label={ADMIN_HONORS_COPY.honorLabel}
                  active={isSortActive('name')}
                  direction={sort().endsWith('-asc') ? 'asc' : 'desc'}
                  onClick={() => handleSortChange('name')}
                  buttonClass="justify-center px-3 py-2"
                />
                <SortableTableHeaderCell
                  label={ADMIN_HONORS_COPY.typeLabel}
                  active={isSortActive('type')}
                  direction={sort().endsWith('-asc') ? 'asc' : 'desc'}
                  onClick={() => handleSortChange('type')}
                  thClass="whitespace-nowrap text-nowrap"
                  buttonClass="justify-center px-3 py-2"
                />
                <SortableTableHeaderCell
                  label={ADMIN_HONORS_COPY.createdAtColumn}
                  active={isSortActive('created-at')}
                  direction={sort().endsWith('-asc') ? 'asc' : 'desc'}
                  onClick={() => handleSortChange('created-at')}
                  thClass="whitespace-nowrap text-nowrap"
                  buttonClass="justify-center px-3 py-2"
                />
                <SortableTableHeaderCell
                  label={ADMIN_HONORS_COPY.imageUrlLabel}
                  active={isSortActive('image-url')}
                  direction={sort().endsWith('-asc') ? 'asc' : 'desc'}
                  onClick={() => handleSortChange('image-url')}
                  thClass="whitespace-nowrap text-nowrap"
                  buttonClass="justify-center px-3 py-2"
                />
                <th scope="col" class="w-0 whitespace-nowrap px-3 py-2 text-center">
                  {ADMIN_HONORS_COPY.actionColumn}
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={filteredHonors()}>
                {(honor) => (
                  <tr class="border-t border-border">
                    <td class="whitespace-nowrap px-3 py-2 font-jost tabular-nums text-nowrap">
                      {honor.id}
                    </td>
                    <td class="px-3 py-2">
                      <span
                        class={`user-honor-title mx-auto my-0 ${getHonorTypeClassName(honor.type_name)}`}
                      >
                        {honor.name}
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-2 text-nowrap">{honor.type_name}</td>
                    <td class="whitespace-nowrap px-3 py-2 font-jost tabular-nums text-nowrap">
                      <time datetime={honor.created_at ?? undefined}>
                        {formatAdminHonorCreatedAt(honor.created_at)}
                      </time>
                    </td>
                    <td class="whitespace-nowrap px-3 py-2 font-mono text-xs text-nowrap">
                      <Show when={honor.image_url} fallback="-">
                        {(imageUrl) => (
                          <Link
                            href={buildAdminHonorImageHref(imageUrl())}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={ADMIN_HONORS_COPY.imageLinkAriaLabel(imageUrl())}
                            class="text-action-primary underline underline-offset-2 hover:text-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                          >
                            {imageUrl()}
                            <ExternalLink class="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        )}
                      </Show>
                    </td>
                    <td class="w-0 whitespace-nowrap px-3 py-2">
                      <AppIconButton
                        aria-label={`${honor.name}を編集`}
                        title={ADMIN_HONORS_COPY.editAction}
                        onClick={() => openEditDialog(honor)}
                      >
                        <Pencil class="h-4 w-4" aria-hidden="true" />
                      </AppIconButton>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={filteredHonors().length === 0}>
          <p class="text-sm text-text-subtle">
            {honors().length === 0 ? ADMIN_HONORS_COPY.emptyState : ADMIN_HONORS_COPY.noResults}
          </p>
        </Show>
      </Show>

      <HonorFormDialog
        open={dialogMode() !== null}
        mode={dialogMode() ?? 'create'}
        honor={editingHonor()}
        honorTypes={honorTypes()}
        saving={saving()}
        apiErrorMessage={formErrorMessage()}
        onOpenChange={handleDialogOpenChange}
        onSubmit={(request) =>
          dialogMode() === 'create' ? handleSubmitCreate(request) : handleSubmitEdit(request)
        }
      />
    </div>
  )
}

export default AdminHonorsPage
