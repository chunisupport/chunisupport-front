import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { Pencil, Plus } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { createHonor, fetchAdminHonors, fetchHonorTypes, updateHonor } from '../../api/honors'
import { Loading } from '../../components'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { FormSelect } from '../../components/common/AppSelect'
import { showSuccessToast } from '../../components/common/AppToast'
import { getHonorTypeClassName } from '../../constants/honors'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { AdminHonorDTO, HonorRequestDTO, MasterItemDTO } from '../../types/api'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { ADMIN_HONORS_COPY, HONOR_INPUT_LIMITS } from './AdminHonorsPage.constants'

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

  const [honorsResponse] = createResource(() => refreshKey(), fetchAdminHonors)
  const [honorTypesResponse] = createResource(fetchHonorTypes)
  const honors = createMemo(() => honorsResponse()?.honors ?? [])
  const honorTypes = createMemo(() => honorTypesResponse()?.honor_types ?? [])
  const hasRows = createMemo(() => honors().length > 0)

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

      <Show when={!honorsResponse.loading} fallback={<Loading />}>
        <div class="overflow-x-auto rounded-lg border border-border bg-surface">
          <table class="min-w-full text-sm">
            <thead class="bg-surface-muted">
              <tr>
                <th class="w-0 whitespace-nowrap px-3 py-2 text-left">操作</th>
                <th class="px-3 py-2 text-left">称号</th>
                <th class="px-3 py-2 text-left">クラス</th>
                <th class="px-3 py-2 text-left">image_url</th>
              </tr>
            </thead>
            <tbody>
              <For each={honors()}>
                {(honor) => (
                  <tr class="border-t border-border">
                    <td class="w-0 whitespace-nowrap px-3 py-2">
                      <AppIconButton
                        aria-label={`${honor.name}を編集`}
                        title={ADMIN_HONORS_COPY.editAction}
                        onClick={() => openEditDialog(honor)}
                      >
                        <Pencil class="h-4 w-4" aria-hidden="true" />
                      </AppIconButton>
                    </td>
                    <td class="px-3 py-2">
                      <span
                        class={`user-honor-title m-0 ${getHonorTypeClassName(honor.type_name)}`}
                      >
                        {honor.name}
                      </span>
                    </td>
                    <td class="px-3 py-2">{honor.type_name}</td>
                    <td class="px-3 py-2 font-mono text-xs break-all">{honor.image_url || '-'}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={!hasRows()}>
          <p class="text-sm text-text-subtle">{ADMIN_HONORS_COPY.emptyState}</p>
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
