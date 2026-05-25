import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { Select } from '@kobalte/core/select'
import { TextField } from '@kobalte/core/text-field'
import { Check, ChevronsUpDown, Pencil } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { fetchAdminHonors, fetchHonorTypes, updateHonor } from '../../api/honors'
import { Loading } from '../../components'
import { getHonorTypeClassName } from '../../constants/honors'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { AdminHonorDTO, HonorRequestDTO, MasterItemDTO } from '../../types/api'

type HonorEditDialogProps = {
  open: boolean
  honor: AdminHonorDTO | null
  honorTypes: MasterItemDTO[]
  saving: boolean
  apiErrorMessage: string
  onOpenChange: (open: boolean) => void
  onSubmit: (request: HonorRequestDTO) => void
}

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
 * 管理者向け称号編集ダイアログを描画する。
 *
 * @param props - ダイアログ状態、編集対象、称号タイプ候補、保存ハンドラ。
 * @returns 称号編集ダイアログ。
 */
const HonorEditDialog: Component<HonorEditDialogProps> = (props) => {
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
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-surface p-6 shadow-lg">
          <Dialog.Title class="text-lg font-bold text-text">称号を編集</Dialog.Title>
          <Dialog.Description class="mt-1 text-sm text-text-muted">
            称号名、クラス、画像URLを更新します。
          </Dialog.Description>

          <form class="mt-5 space-y-4" onSubmit={handleSubmit}>
            <TextField>
              <TextField.Label class="mb-1 block text-sm text-text-muted">称号</TextField.Label>
              <TextField.Input
                value={request().name}
                maxLength={500}
                required
                onInput={(event) => updateRequestField('name', event.currentTarget.value)}
                class="w-full rounded border border-border-strong px-3 py-2 font-sans"
              />
            </TextField>

            <Select<MasterItemDTO>
              options={props.honorTypes}
              optionValue="name"
              optionTextValue="name"
              value={selectedHonorType()}
              onChange={(type) => updateRequestField('type_name', type?.name ?? '')}
              placeholder="選択してください"
              itemComponent={(selectProps) => (
                <Select.Item
                  item={selectProps.item}
                  class="cursor-pointer px-3 py-2 text-text hover:bg-surface-hover data-[selected]:bg-surface-hover"
                >
                  <div class="flex items-center gap-2">
                    <span class="inline-flex w-4 justify-center text-success">
                      <Select.ItemIndicator>
                        <Check size={14} />
                      </Select.ItemIndicator>
                    </span>
                    <Select.ItemLabel>{selectProps.item.rawValue.name}</Select.ItemLabel>
                  </div>
                </Select.Item>
              )}
            >
              <Select.Label class="mb-1 block text-sm text-text-muted">クラス</Select.Label>
              <Select.Trigger class="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm">
                <Select.Value<MasterItemDTO> class="truncate data-placeholder-shown:text-text-placeholder">
                  {(state) => state.selectedOption().name}
                </Select.Value>
                <Select.Icon class="text-text-subtle">
                  <ChevronsUpDown size={16} />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content class="z-50 mt-1 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-border bg-surface shadow-md">
                  <Select.Listbox />
                </Select.Content>
              </Select.Portal>
            </Select>

            <TextField>
              <TextField.Label class="mb-1 block text-sm text-text-muted">
                image_url
              </TextField.Label>
              <TextField.Input
                value={request().image_url}
                maxLength={255}
                onInput={(event) => updateRequestField('image_url', event.currentTarget.value)}
                class="w-full rounded border border-border-strong px-3 py-2 font-mono text-xs"
              />
            </TextField>

            <Show when={props.apiErrorMessage}>
              <p class="rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
                {props.apiErrorMessage}
              </p>
            </Show>

            <div class="flex justify-end gap-2">
              <Button
                type="button"
                class="rounded bg-action-secondary px-4 py-2 text-sm text-text-muted hover:bg-action-secondary-hover"
                onClick={() => props.onOpenChange(false)}
                disabled={props.saving}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                class="rounded bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:bg-action-secondary-hover"
                disabled={props.saving || !request().name.trim() || !request().type_name.trim()}
              >
                {props.saving ? '保存中...' : '保存'}
              </Button>
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
  useDocumentTitle('称号管理')

  const [refreshKey, setRefreshKey] = createSignal(0)
  const [editingHonor, setEditingHonor] = createSignal<AdminHonorDTO | null>(null)
  const [editDialogOpen, setEditDialogOpen] = createSignal(false)
  const [saving, setSaving] = createSignal(false)
  const [message, setMessage] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal('')
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
    setEditDialogOpen(true)
  }

  /**
   * 編集ダイアログの開閉状態を更新する。
   *
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleEditDialogOpenChange = (open: boolean): void => {
    setEditDialogOpen(open)
    if (!open) {
      setEditingHonor(null)
      setFormErrorMessage('')
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

    setMessage('')
    setErrorMessage('')
    setFormErrorMessage('')
    setSaving(true)

    try {
      await updateHonor(honor.id, request)
      setMessage('称号を更新しました。')
      handleEditDialogOpenChange(false)
      refresh()
    } catch (error) {
      setFormErrorMessage(error instanceof Error ? error.message : '称号の更新に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
      <div>
        <h1 class="text-2xl font-semibold">称号管理</h1>
        <p class="mt-1 text-sm text-text-muted">称号、クラス、image_url を一覧で確認します。</p>
      </div>

      <Show when={message()}>
        <p class="rounded border border-success-border bg-success-bg px-3 py-2 text-sm text-success">
          {message()}
        </p>
      </Show>
      <Show when={errorMessage()}>
        <p class="rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
          {errorMessage()}
        </p>
      </Show>

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
                      <Button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded border border-border-strong text-text-muted hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        aria-label={`${honor.name}を編集`}
                        title="編集"
                        onClick={() => openEditDialog(honor)}
                      >
                        <Pencil class="h-4 w-4" aria-hidden="true" />
                      </Button>
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
          <p class="text-sm text-text-subtle">登録されている称号がありません。</p>
        </Show>
      </Show>

      <HonorEditDialog
        open={editDialogOpen()}
        honor={editingHonor()}
        honorTypes={honorTypes()}
        saving={saving()}
        apiErrorMessage={formErrorMessage()}
        onOpenChange={handleEditDialogOpenChange}
        onSubmit={handleSubmitEdit}
      />
    </div>
  )
}

export default AdminHonorsPage
