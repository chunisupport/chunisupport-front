import { TextField } from '@kobalte/core/text-field'
import type { Component } from 'solid-js'
import { createResource, createSignal, For, onCleanup, Show } from 'solid-js'
import { deleteApiToken, fetchApiTokens, issueApiToken, renameApiToken } from '../../api/settings'
import { LoadError, Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import type { ApiToken } from '../../types/api'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { API_TOKEN_MAX_COUNT, API_TOKEN_SETTINGS_COPY } from './ApiTokenSettings.constants'
import { isApiTokenNameError, isValidApiTokenName, normalizeApiTokenName } from './apiTokenName'
import { formatSettingsDateTime } from './settingsDateTime'

type ApiTokenSettingsSectionProps = {
  /** APIトークン一覧の取得を開始する認証済みユーザー名。 */
  username: string
}

type ApiTokenNameFieldProps = {
  /** 入力欄のラベル。 */
  label: string
  /** 入力中のAPIトークン名。 */
  value: string
  /** 未入力時の表示文言。 */
  placeholder?: string
  /** 入力を無効化するか。 */
  disabled: boolean
  /** 入力値に紐づくエラーメッセージ。 */
  error: string
  /** 入力値の変更通知先。 */
  onChange: (value: string) => void
}

type TokenActionError = {
  tokenId: number
  message: string
}

const API_TOKEN_NAME_INPUT_CLASS =
  'w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text outline-none transition focus:border-action-primary focus:ring-2 focus:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

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
 * APIの最新契約に合わせた複数APIトークン管理欄を表示する。
 *
 * @param props - 認証済みユーザー情報。
 * @returns 発行、一覧、名称変更、削除を行う設定セクション。
 */
export const ApiTokenSettingsSection: Component<ApiTokenSettingsSectionProps> = (props) => {
  const [issueName, setIssueName] = createSignal('')
  const [issueNameError, setIssueNameError] = createSignal('')
  const [issueActionError, setIssueActionError] = createSignal('')
  const [issueSuccess, setIssueSuccess] = createSignal('')
  const [isIssuing, setIsIssuing] = createSignal(false)
  const [generatedToken, setGeneratedToken] = createSignal<
    Awaited<ReturnType<typeof issueApiToken>> | undefined
  >()
  const [copied, setCopied] = createSignal(false)
  const [copyError, setCopyError] = createSignal('')
  const [editingTokenId, setEditingTokenId] = createSignal<number | null>(null)
  const [editingName, setEditingName] = createSignal('')
  const [editingNameError, setEditingNameError] = createSignal('')
  const [mutatingTokenId, setMutatingTokenId] = createSignal<number | null>(null)
  const [tokenActionError, setTokenActionError] = createSignal<TokenActionError | null>(null)
  const [tokenActionSuccess, setTokenActionSuccess] = createSignal('')
  let copiedResetTimer: number | undefined

  const [apiTokens, { mutate: mutateApiTokens }] = createResource(
    () => props.username,
    async () => fetchApiTokens()
  )

  onCleanup(() => {
    if (typeof copiedResetTimer !== 'undefined') {
      window.clearTimeout(copiedResetTimer)
    }
  })

  /**
   * 一覧取得前・発行中・上限到達時に発行操作を無効化する。
   *
   * @returns APIトークンを発行できない場合はtrue。
   */
  const isIssueDisabled = (): boolean =>
    isIssuing() || !apiTokens() || (apiTokens()?.tokens.length ?? 0) >= API_TOKEN_MAX_COUNT

  /**
   * APIトークン名を発行用入力欄へ反映し、既存エラーを解消する。
   *
   * @param value - 新しい入力値。
   * @returns なし。
   */
  const handleIssueNameChange = (value: string): void => {
    setIssueName(value)
    setIssueNameError('')
  }

  /**
   * 入力された名前でAPIトークンを追加発行する。
   *
   * @returns 発行処理完了後に解決されるPromise。
   */
  const handleIssueApiToken = async (): Promise<void> => {
    setIssueNameError('')
    setIssueActionError('')
    setIssueSuccess('')
    setTokenActionSuccess('')
    if (!isValidApiTokenName(issueName())) {
      setIssueNameError(API_TOKEN_SETTINGS_COPY.nameValidationError)
      return
    }

    setIsIssuing(true)
    try {
      const result = await issueApiToken(normalizeApiTokenName(issueName()))
      setGeneratedToken(result)
      setCopied(false)
      setCopyError('')
      setIssueName('')
      setIssueSuccess(API_TOKEN_SETTINGS_COPY.issueSuccess)
      const issuedMetadata: ApiToken = {
        id: result.id,
        name: result.name,
        token_prefix: result.token_prefix,
        last_used_at: result.last_used_at,
        created_at: result.created_at,
      }
      mutateApiTokens((current) => ({ tokens: [issuedMetadata, ...(current?.tokens ?? [])] }))
    } catch (error) {
      const message = toUserFriendlyErrorMessage(error, API_TOKEN_SETTINGS_COPY.issueFailure)
      if (isApiTokenNameError(error)) {
        setIssueNameError(message)
      } else {
        setIssueActionError(message)
      }
    } finally {
      setIsIssuing(false)
    }
  }

  /**
   * 発行直後の平文APIトークンをクリップボードへコピーする。
   *
   * @returns コピー処理完了後に解決されるPromise。
   */
  const handleCopyToken = async (): Promise<void> => {
    const currentGeneratedToken = generatedToken()
    if (!currentGeneratedToken) {
      return
    }

    try {
      await navigator.clipboard.writeText(currentGeneratedToken.token)
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

  /**
   * 指定したAPIトークンの名称変更入力を開始する。
   *
   * @param token - 名称変更対象のAPIトークン。
   * @returns なし。
   */
  const startRenaming = (token: ApiToken): void => {
    setEditingTokenId(token.id)
    setEditingName(token.name)
    setEditingNameError('')
    setTokenActionError(null)
    setTokenActionSuccess('')
  }

  /**
   * APIトークンの名称変更入力を終了する。
   *
   * @returns なし。
   */
  const cancelRenaming = (): void => {
    setEditingTokenId(null)
    setEditingName('')
    setEditingNameError('')
  }

  /**
   * 入力されたAPIトークン名を保存する。
   *
   * @param tokenId - 名称変更対象のAPIトークンID。
   * @returns 更新処理完了後に解決されるPromise。
   */
  const handleRenameApiToken = async (tokenId: number): Promise<void> => {
    setEditingNameError('')
    setTokenActionError(null)
    setTokenActionSuccess('')
    if (!isValidApiTokenName(editingName())) {
      setEditingNameError(API_TOKEN_SETTINGS_COPY.nameValidationError)
      return
    }

    setMutatingTokenId(tokenId)
    try {
      const renamed = await renameApiToken(tokenId, {
        name: normalizeApiTokenName(editingName()),
      })
      mutateApiTokens((current) =>
        current
          ? {
              tokens: current.tokens.map((token) => (token.id === renamed.id ? renamed : token)),
            }
          : current
      )
      cancelRenaming()
      setTokenActionSuccess(API_TOKEN_SETTINGS_COPY.renameSuccess)
    } catch (error) {
      const message = toUserFriendlyErrorMessage(error, API_TOKEN_SETTINGS_COPY.renameFailure)
      if (isApiTokenNameError(error)) {
        setEditingNameError(message)
      } else {
        setTokenActionError({ tokenId, message })
      }
    } finally {
      setMutatingTokenId(null)
    }
  }

  /**
   * 確認後に指定APIトークンを削除する。
   *
   * @param token - 削除対象のAPIトークン。
   * @returns 削除処理完了後に解決されるPromise。
   */
  const handleDeleteApiToken = async (token: ApiToken): Promise<void> => {
    setTokenActionError(null)
    setTokenActionSuccess('')
    if (!window.confirm(`「${token.name}」${API_TOKEN_SETTINGS_COPY.deleteConfirmationSuffix}`)) {
      return
    }

    setMutatingTokenId(token.id)
    try {
      await deleteApiToken(token.id)
      mutateApiTokens((current) =>
        current ? { tokens: current.tokens.filter((item) => item.id !== token.id) } : current
      )
      if (generatedToken()?.id === token.id) {
        setGeneratedToken(undefined)
      }
      if (editingTokenId() === token.id) {
        cancelRenaming()
      }
      setTokenActionSuccess(API_TOKEN_SETTINGS_COPY.deleteSuccess)
    } catch (error) {
      setTokenActionError({
        tokenId: token.id,
        message: toUserFriendlyErrorMessage(error, API_TOKEN_SETTINGS_COPY.deleteFailure),
      })
    } finally {
      setMutatingTokenId(null)
    }
  }

  return (
    <section id="api-token" class="py-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-text">{API_TOKEN_SETTINGS_COPY.title}</h2>
          <p class="mt-1 text-sm text-text-muted">{API_TOKEN_SETTINGS_COPY.description}</p>
        </div>
        <span class="inline-flex w-fit rounded-full bg-surface-hover px-3 py-1 text-sm font-semibold text-text-muted">
          {apiTokens()?.tokens.length ?? 0} / {API_TOKEN_MAX_COUNT}
          {API_TOKEN_SETTINGS_COPY.countUnit}
        </span>
      </div>

      <div class="mt-4 rounded-lg border border-border bg-surface-muted p-4">
        <form
          class="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            void handleIssueApiToken()
          }}
        >
          <ApiTokenNameField
            label={API_TOKEN_SETTINGS_COPY.issueLabel}
            value={issueName()}
            placeholder={API_TOKEN_SETTINGS_COPY.issuePlaceholder}
            disabled={isIssueDisabled()}
            error={issueNameError()}
            onChange={handleIssueNameChange}
          />
          <AppButton
            variant="primary"
            type="submit"
            class="shrink-0 rounded-md"
            disabled={isIssueDisabled()}
            aria-busy={isIssuing()}
          >
            {API_TOKEN_SETTINGS_COPY.issueButton}
          </AppButton>
        </form>
        <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
          {issueActionError()}
        </p>
        <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
          {issueSuccess()}
        </p>
      </div>

      <Show when={generatedToken()}>
        {(issued) => (
          <div class="mt-4 rounded-lg border border-success-border bg-success-bg p-4">
            <p class="text-sm font-semibold text-text">{API_TOKEN_SETTINGS_COPY.generatedTitle}</p>
            <p class="mt-1 text-xs text-text-muted">{API_TOKEN_SETTINGS_COPY.generatedNotice}</p>
            <p class="mt-3 break-all rounded border border-border bg-surface p-2 font-mono text-xs text-text">
              {issued().token}
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
        )}
      </Show>

      <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
        {tokenActionSuccess()}
      </p>

      <div class="mt-4">
        <Show when={!apiTokens.error} fallback={<LoadError error={apiTokens.error} />}>
          <Show when={apiTokens()} fallback={<Loading />}>
            {(loaded) => (
              <For
                each={loaded().tokens}
                fallback={
                  <div class="rounded-lg border border-dashed border-border-strong bg-surface-muted p-4 text-sm text-text-muted">
                    {API_TOKEN_SETTINGS_COPY.empty}
                  </div>
                }
              >
                {(token) => (
                  <article class="mb-3 rounded-lg border border-border bg-surface-muted p-4 last:mb-0">
                    <Show
                      when={editingTokenId() === token.id}
                      fallback={
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 class="font-semibold text-text">{token.name}</h3>
                            <dl class="mt-2 grid gap-x-6 gap-y-1 text-sm text-text-muted sm:grid-cols-3">
                              <div>
                                <dt class="inline font-medium">
                                  {API_TOKEN_SETTINGS_COPY.prefixLabel}:{' '}
                                </dt>
                                <dd class="inline font-mono">
                                  {token.token_prefix
                                    ? `${token.token_prefix}…`
                                    : API_TOKEN_SETTINGS_COPY.migratedPrefix}
                                </dd>
                              </div>
                              <div>
                                <dt class="inline font-medium">
                                  {API_TOKEN_SETTINGS_COPY.createdAtLabel}:{' '}
                                </dt>
                                <dd class="inline">{formatSettingsDateTime(token.created_at)}</dd>
                              </div>
                              <div>
                                <dt class="inline font-medium">
                                  {API_TOKEN_SETTINGS_COPY.lastUsedAtLabel}:{' '}
                                </dt>
                                <dd class="inline">
                                  {formatSettingsDateTime(
                                    token.last_used_at,
                                    API_TOKEN_SETTINGS_COPY.unused
                                  )}
                                </dd>
                              </div>
                            </dl>
                          </div>
                          <div class="flex shrink-0 gap-2">
                            <AppButton
                              size="xs"
                              onClick={() => startRenaming(token)}
                              disabled={mutatingTokenId() !== null}
                              aria-label={`「${token.name}」${API_TOKEN_SETTINGS_COPY.renameAriaLabelSuffix}`}
                            >
                              {API_TOKEN_SETTINGS_COPY.rename}
                            </AppButton>
                            <AppButton
                              size="xs"
                              variant="danger"
                              onClick={() => handleDeleteApiToken(token)}
                              disabled={mutatingTokenId() !== null}
                              aria-busy={mutatingTokenId() === token.id}
                              aria-label={`「${token.name}」${API_TOKEN_SETTINGS_COPY.deleteAriaLabelSuffix}`}
                            >
                              {API_TOKEN_SETTINGS_COPY.delete}
                            </AppButton>
                          </div>
                        </div>
                      }
                    >
                      <form
                        class="flex flex-col gap-3 sm:flex-row sm:items-end"
                        onSubmit={(event) => {
                          event.preventDefault()
                          void handleRenameApiToken(token.id)
                        }}
                      >
                        <ApiTokenNameField
                          label={API_TOKEN_SETTINGS_COPY.renameLabel}
                          value={editingName()}
                          disabled={mutatingTokenId() === token.id}
                          error={editingNameError()}
                          onChange={(value) => {
                            setEditingName(value)
                            setEditingNameError('')
                          }}
                        />
                        <div class="flex shrink-0 gap-2">
                          <AppButton
                            size="xs"
                            variant="primary"
                            type="submit"
                            disabled={mutatingTokenId() === token.id}
                            aria-busy={mutatingTokenId() === token.id}
                            aria-label={`「${token.name}」${API_TOKEN_SETTINGS_COPY.saveAriaLabelSuffix}`}
                          >
                            {API_TOKEN_SETTINGS_COPY.save}
                          </AppButton>
                          <AppButton
                            size="xs"
                            onClick={cancelRenaming}
                            disabled={mutatingTokenId() === token.id}
                            aria-label={`「${token.name}」${API_TOKEN_SETTINGS_COPY.cancelAriaLabelSuffix}`}
                          >
                            {API_TOKEN_SETTINGS_COPY.cancel}
                          </AppButton>
                        </div>
                      </form>
                    </Show>
                    <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                      {tokenActionError()?.tokenId === token.id ? tokenActionError()?.message : ''}
                    </p>
                  </article>
                )}
              </For>
            )}
          </Show>
        </Show>
      </div>
    </section>
  )
}
