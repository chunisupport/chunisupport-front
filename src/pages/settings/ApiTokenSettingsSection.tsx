import { Dialog } from '@kobalte/core/dialog'
import { RadioGroup } from '@kobalte/core/radio-group'
import { TextField } from '@kobalte/core/text-field'
import { ExternalLink } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal, For, onCleanup, Show } from 'solid-js'
import { deleteApiToken, fetchApiTokens, issueApiToken, renameApiToken } from '../../api/settings'
import { LoadError, Loading } from '../../components'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import { AppConfirmDialog } from '../../components/common/AppConfirmDialog'
import { SelectableCardItem } from '../../components/common/SelectableCardButton'
import { API_DOCUMENTATION_URL } from '../../config'
import { DEVELOPER_API_COPY } from '../../constants/developerApi'
import { EXTERNAL_LINK_NEW_TAB_DESCRIPTION } from '../../constants/externalLink'
import type { AccountType, ApiTokenPermission } from '../../types/api'
import {
  API_TOKEN_MAX_COUNT,
  API_TOKEN_PERMISSION_OPTIONS,
  API_TOKEN_SETTINGS_COPY,
  formatApiTokenDeleteTargetMessage,
  formatApiTokenPermission,
} from './ApiTokenSettings.constants'
import { createApiTokenSettings } from './createApiTokenSettings'
import { formatSettingsDateTime } from './settingsDateTime'
import { SETTINGS_SUBSECTION_CLASS, SETTINGS_SUBSECTION_TITLE_CLASS } from './settingsStyles'

type ApiTokenSettingsSectionProps = {
  /** APIトークン一覧の取得を開始する認証済みユーザー名 */
  username: string
  /** APIトークンを発行するユーザーのアカウント種別 */
  accountType: AccountType
}

type ApiTokenNameFieldProps = {
  /** 入力欄のラベル */
  label: string
  /** 入力中のAPIトークン名 */
  value: string
  /** 未入力時の表示文言 */
  placeholder?: string
  /** 入力を無効化するか */
  disabled: boolean
  /** 入力値に紐づくエラーメッセージ */
  error: string
  /** 入力値の変更通知先 */
  onChange: (value: string) => void
}

const API_TOKEN_NAME_INPUT_CLASS =
  'w-full rounded-md border border-border-strong bg-surface px-3 py-2 font-sans text-sm text-text outline-none transition focus:border-action-primary focus:ring-2 focus:ring-inset focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

/**
 * APIトークンの発行と名称変更で共通利用する名前入力欄を表示する。
 *
 * @param props - ラベル、入力値、状態、変更通知を含む入力設定。
 * @returns Kobalte TextFieldを使ったAPIトークン名入力欄。
 */
const ApiTokenNameField: Component<ApiTokenNameFieldProps> = (props) => (
  <TextField
    class="min-w-0 flex-1"
    value={props.value}
    onChange={props.onChange}
    required
    disabled={props.disabled}
    validationState={props.error ? 'invalid' : undefined}
  >
    <TextField.Label class="mb-1 block text-sm font-medium text-text-muted">
      {props.label}
    </TextField.Label>
    <TextField.Input
      class={API_TOKEN_NAME_INPUT_CLASS}
      placeholder={props.placeholder}
      autocomplete="off"
    />
    <TextField.ErrorMessage class="mt-1 text-sm text-danger" role="alert">
      {props.error}
    </TextField.ErrorMessage>
  </TextField>
)

/**
 * 発行直後の平文APIトークンと、クリップボードへのコピー操作を表示する。
 * 発行し直すと作り直されるため、コピー済みやコピー失敗の表示を前のトークンから持ち越さない。
 *
 * @param props - 発行直後の平文APIトークン。
 * @returns 平文APIトークンの表示欄。
 */
const GeneratedApiTokenNotice: Component<{ token: string }> = (props) => {
  const [copied, setCopied] = createSignal(false)
  const [copyError, setCopyError] = createSignal('')
  let copiedResetTimer: number | undefined

  onCleanup(() => {
    if (typeof copiedResetTimer !== 'undefined') {
      window.clearTimeout(copiedResetTimer)
    }
  })

  /**
   * 発行直後の平文APIトークンをクリップボードへコピーする。
   *
   * @returns コピー処理完了後に解決されるPromise。
   */
  const handleCopyToken = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(props.token)
      setCopyError('')
      setCopied(true)
      if (typeof copiedResetTimer !== 'undefined') {
        window.clearTimeout(copiedResetTimer)
      }
      copiedResetTimer = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError(API_TOKEN_SETTINGS_COPY.copyFailure)
    }
  }

  return (
    <div class="mt-4 rounded-lg border border-success-border bg-success-bg p-4">
      <p class="text-sm font-semibold text-text">{API_TOKEN_SETTINGS_COPY.generatedTitle}</p>
      <p class="mt-1 text-xs text-text-muted">{API_TOKEN_SETTINGS_COPY.generatedNotice}</p>
      <p class="mt-3 break-all rounded border border-border bg-surface p-2 font-mono text-xs text-text">
        {props.token}
      </p>
      <div class="mt-3 flex items-center gap-2">
        <AppButton size="xs" onClick={handleCopyToken} class="rounded-md">
          {API_TOKEN_SETTINGS_COPY.copy}
        </AppButton>
        <span class="text-xs text-action-primary empty:hidden" role="status">
          {copied() ? API_TOKEN_SETTINGS_COPY.copied : ''}
        </span>
      </div>
      <p class="mt-2 text-sm text-danger empty:hidden" role="alert">
        {copyError()}
      </p>
    </div>
  )
}

/**
 * APIの最新契約に合わせた複数APIトークン管理欄を表示する。
 *
 * @param props - 認証済みユーザー情報。
 * @returns 発行、一覧、名称変更、削除を行う設定セクション。
 */
export const ApiTokenSettingsSection: Component<ApiTokenSettingsSectionProps> = (props) => {
  const settings = createApiTokenSettings({
    username: () => props.username,
    accountType: () => props.accountType,
    fetchTokens: fetchApiTokens,
    issueToken: issueApiToken,
    renameToken: renameApiToken,
    deleteToken: deleteApiToken,
  })

  return (
    <section aria-labelledby="api-integration-title">
      <h2 id="api-integration-title" class="text-xl font-semibold text-text">
        {DEVELOPER_API_COPY.sectionTitle}
      </h2>
      <p class="mt-2 text-sm text-text-muted">{DEVELOPER_API_COPY.description}</p>
      <a
        class={getAppButtonClass({ variant: 'surface', class: 'mt-4 w-fit' })}
        href={API_DOCUMENTATION_URL}
        target="_blank"
        rel="noreferrer"
      >
        {DEVELOPER_API_COPY.documentationLink}
        <ExternalLink class="h-4 w-4" aria-hidden="true" />
        <span class="sr-only">{EXTERNAL_LINK_NEW_TAB_DESCRIPTION}</span>
      </a>

      <div id="api-token" class={SETTINGS_SUBSECTION_CLASS}>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 class={SETTINGS_SUBSECTION_TITLE_CLASS}>{API_TOKEN_SETTINGS_COPY.title}</h3>
            <p class="mt-1 text-sm text-text-muted">{API_TOKEN_SETTINGS_COPY.description}</p>
          </div>
          <span class="inline-flex w-fit rounded-full bg-surface-hover px-3 py-1 text-sm font-semibold text-text-muted">
            {settings.tokens()?.tokens.length ?? 0} / {API_TOKEN_MAX_COUNT}
          </span>
        </div>

        <Dialog open={settings.issueFormOpen()} onOpenChange={settings.setIssueFormOpen}>
          <Dialog.Trigger
            as="button"
            type="button"
            class={getAppButtonClass({ variant: 'primary', class: 'mt-4 w-fit' })}
            disabled={settings.isIssueDisabled()}
          >
            {API_TOKEN_SETTINGS_COPY.startIssueButton}
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
            <Dialog.Content class="fixed inset-x-4 top-1/2 z-60 flex max-h-[calc(100dvh-2rem)] -translate-y-1/2 flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:w-[90vw] sm:max-w-lg sm:-translate-x-1/2 sm:p-6">
              <Dialog.Title class="shrink-0 text-lg font-bold text-text">
                {API_TOKEN_SETTINGS_COPY.issueDialogTitle}
              </Dialog.Title>
              <Dialog.Description class="mt-1 shrink-0 text-sm text-text-muted">
                {settings.canIssueReadWrite()
                  ? API_TOKEN_SETTINGS_COPY.issueDialogDescription
                  : API_TOKEN_SETTINGS_COPY.issueReadOnlyDialogDescription}
              </Dialog.Description>

              <form
                class="mt-5 flex min-h-0 flex-col"
                onSubmit={(event) => {
                  event.preventDefault()
                  void settings.issue()
                }}
              >
                <div class="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                  <ApiTokenNameField
                    label={API_TOKEN_SETTINGS_COPY.issueLabel}
                    value={settings.issueName()}
                    placeholder={API_TOKEN_SETTINGS_COPY.issuePlaceholder}
                    disabled={settings.issuing()}
                    error={settings.issueNameError()}
                    onChange={settings.setIssueName}
                  />
                  <Show when={settings.canIssueReadWrite()}>
                    <RadioGroup
                      name="api-token-permission"
                      value={settings.issuePermission()}
                      onChange={(value) => settings.setIssuePermission(value as ApiTokenPermission)}
                      disabled={settings.issuing()}
                      class="grid gap-2"
                    >
                      <RadioGroup.Label class="text-sm font-medium text-text-muted">
                        {API_TOKEN_SETTINGS_COPY.permissionLabel}
                      </RadioGroup.Label>
                      <div class="grid gap-2 sm:grid-cols-2">
                        <For each={API_TOKEN_PERMISSION_OPTIONS}>
                          {(option) => (
                            <SelectableCardItem
                              value={option.value}
                              title={option.label}
                              description={option.description}
                              ariaLabel={option.label}
                              selected={settings.issuePermission() === option.value}
                              disabled={settings.issuing()}
                              density="compact"
                              class="rounded-md"
                            />
                          )}
                        </For>
                      </div>
                    </RadioGroup>
                  </Show>
                  <p class="text-sm text-danger empty:hidden" role="alert">
                    {settings.issueActionError()}
                  </p>
                </div>
                <div class="mt-5 flex shrink-0 justify-end gap-2">
                  <Dialog.CloseButton
                    class={getAppButtonClass({ variant: 'secondary' })}
                    disabled={settings.issuing()}
                  >
                    {API_TOKEN_SETTINGS_COPY.cancelIssueButton}
                  </Dialog.CloseButton>
                  <AppButton
                    variant="primary"
                    type="submit"
                    disabled={settings.issuing()}
                    aria-busy={settings.issuing()}
                  >
                    {API_TOKEN_SETTINGS_COPY.issueButton}
                  </AppButton>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </div>

      <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
        {settings.issueSuccess()}
      </p>

      <Show when={settings.generatedToken()} keyed>
        {(issued) => <GeneratedApiTokenNotice token={issued.token} />}
      </Show>

      <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
        {settings.tokenActionSuccess()}
      </p>

      <div class="mt-4">
        <Show when={!settings.tokens.error} fallback={<LoadError error={settings.tokens.error} />}>
          <Show when={settings.tokens()} fallback={<Loading />}>
            {(loaded) => (
              <Show
                when={loaded().tokens.length > 0}
                fallback={
                  <div class="rounded-lg border border-dashed border-border-strong bg-surface-muted p-4 text-sm text-text-muted">
                    {API_TOKEN_SETTINGS_COPY.empty}
                  </div>
                }
              >
                <div class="overflow-x-auto rounded-lg border border-border bg-surface">
                  <table class="min-w-full text-sm">
                    <caption class="sr-only">{API_TOKEN_SETTINGS_COPY.tableCaption}</caption>
                    <thead class="bg-surface-muted">
                      <tr>
                        <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
                          {API_TOKEN_SETTINGS_COPY.nameLabel}
                        </th>
                        <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
                          {API_TOKEN_SETTINGS_COPY.permissionValueLabel}
                        </th>
                        <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
                          {API_TOKEN_SETTINGS_COPY.prefixLabel}
                        </th>
                        <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
                          {API_TOKEN_SETTINGS_COPY.createdAtLabel}
                        </th>
                        <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
                          {API_TOKEN_SETTINGS_COPY.lastUsedAtLabel}
                        </th>
                        <th scope="col" class="px-3 py-2 text-left whitespace-nowrap">
                          {API_TOKEN_SETTINGS_COPY.actionsLabel}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={loaded().tokens}>
                        {(token) => (
                          <Show
                            when={settings.editingTokenId() === token.id}
                            fallback={
                              <tr class="border-t border-border">
                                <th
                                  scope="row"
                                  class="px-3 py-3 text-left font-sans font-semibold text-text whitespace-nowrap"
                                >
                                  {token.name}
                                </th>
                                <td class="px-3 py-3 text-text-muted whitespace-nowrap">
                                  {formatApiTokenPermission(token.permission)}
                                </td>
                                <td class="px-3 py-3 font-mono text-xs text-text-muted whitespace-nowrap">
                                  {token.token_prefix
                                    ? `${token.token_prefix}…`
                                    : API_TOKEN_SETTINGS_COPY.migratedPrefix}
                                </td>
                                <td class="px-3 py-3 text-text-muted whitespace-nowrap">
                                  {formatSettingsDateTime(token.created_at)}
                                </td>
                                <td class="px-3 py-3 text-text-muted whitespace-nowrap">
                                  {formatSettingsDateTime(
                                    token.last_used_at,
                                    API_TOKEN_SETTINGS_COPY.unused
                                  )}
                                </td>
                                <td class="px-3 py-3">
                                  <div class="flex gap-2 whitespace-nowrap">
                                    <AppButton
                                      size="xs"
                                      onClick={() => settings.startRenaming(token)}
                                      disabled={settings.mutatingTokenId() !== null}
                                      aria-label={`「${token.name}」${API_TOKEN_SETTINGS_COPY.renameAriaLabelSuffix}`}
                                    >
                                      {API_TOKEN_SETTINGS_COPY.rename}
                                    </AppButton>
                                    <AppButton
                                      size="xs"
                                      variant="danger"
                                      onClick={() => settings.openDeleteDialog(token)}
                                      disabled={settings.mutatingTokenId() !== null}
                                      aria-busy={settings.mutatingTokenId() === token.id}
                                      aria-label={`「${token.name}」${API_TOKEN_SETTINGS_COPY.deleteAriaLabelSuffix}`}
                                    >
                                      {API_TOKEN_SETTINGS_COPY.delete}
                                    </AppButton>
                                  </div>
                                  <p class="mt-2 text-sm text-danger empty:hidden" role="alert">
                                    {settings.tokenActionErrorFor(token.id)}
                                  </p>
                                </td>
                              </tr>
                            }
                          >
                            <tr class="border-t border-border">
                              <td colSpan={6} class="p-3">
                                <form
                                  class="flex flex-col gap-3 sm:flex-row sm:items-end"
                                  onSubmit={(event) => {
                                    event.preventDefault()
                                    void settings.rename(token.id)
                                  }}
                                >
                                  <ApiTokenNameField
                                    label={API_TOKEN_SETTINGS_COPY.renameLabel}
                                    value={settings.editingName()}
                                    disabled={settings.mutatingTokenId() === token.id}
                                    error={settings.editingNameError()}
                                    onChange={settings.setEditingName}
                                  />
                                  <div class="flex shrink-0 gap-2">
                                    <AppButton
                                      size="xs"
                                      variant="primary"
                                      type="submit"
                                      disabled={settings.mutatingTokenId() === token.id}
                                      aria-busy={settings.mutatingTokenId() === token.id}
                                      aria-label={`「${token.name}」${API_TOKEN_SETTINGS_COPY.saveAriaLabelSuffix}`}
                                    >
                                      {API_TOKEN_SETTINGS_COPY.save}
                                    </AppButton>
                                    <AppButton
                                      size="xs"
                                      onClick={settings.cancelRenaming}
                                      disabled={settings.mutatingTokenId() === token.id}
                                      aria-label={`「${token.name}」${API_TOKEN_SETTINGS_COPY.cancelAriaLabelSuffix}`}
                                    >
                                      {API_TOKEN_SETTINGS_COPY.cancel}
                                    </AppButton>
                                  </div>
                                </form>
                                <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                                  {settings.tokenActionErrorFor(token.id)}
                                </p>
                              </td>
                            </tr>
                          </Show>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            )}
          </Show>
        </Show>
      </div>

      <AppConfirmDialog
        open={settings.deleteTarget() !== null}
        onOpenChange={settings.setDeleteDialogOpen}
        title={API_TOKEN_SETTINGS_COPY.deleteDialogTitle}
        description={formatApiTokenDeleteTargetMessage(settings.deleteTarget()?.name ?? '')}
        cancelLabel={API_TOKEN_SETTINGS_COPY.cancel}
        confirmLabel={
          settings.mutatingTokenId() !== null
            ? API_TOKEN_SETTINGS_COPY.deleting
            : API_TOKEN_SETTINGS_COPY.deleteDialogSubmit
        }
        confirmVariant="danger"
        pending={settings.mutatingTokenId() !== null}
        onConfirm={() => void settings.confirmDelete()}
      />
    </section>
  )
}
