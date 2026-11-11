import { TextField } from '@kobalte/core/text-field'
import { A, useNavigate, useParams } from '@solidjs/router'
import { useQueryClient } from '@tanstack/solid-query'
import { createResource, For, Show } from 'solid-js'
import { deleteAccount, deletePlayerData, fetchPrivacy, updatePrivacy } from '../../api/settings'
import { fetchMe, fetchUserProfileSummary } from '../../api/users'
import { LoadError, Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { AppConfirmDialog } from '../../components/common/AppConfirmDialog'
import AppearanceSettings from '../../components/common/AppearanceSettings'
import { APPEARANCE_SETTINGS_COPY } from '../../components/common/AppearanceSettings.constants'
import { AppSwitch } from '../../components/common/AppSwitch'
import { FILTER_DIALOG_FIELD_FOCUS_CLASS } from '../../components/common/filterStyles'
import NavPlacementSettings from '../../components/common/NavPlacementSettings'
import { LOGIN_PATH } from '../../constants/routes'
import { createLinkedAuthAccounts } from '../../hooks/createLinkedAuthAccounts'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { invalidateFriendRankings } from '../../queries/friendRankings'
import { authSession, setAuthenticatedUser } from '../../stores/authSession'
import { findLinkedAuthAccount } from '../../usecases/auth/authProviders'
import { canChangeGoogleAccount } from '../../usecases/auth/changeGoogleAccount'
import { discardLocalSession } from '../../usecases/auth/discardLocalSession'
import { clearUsernameChangeCache } from '../../usecases/cache/clearUsernameChangeCache'
import { ACCOUNT_DELETE_COPY } from './AccountSettings.constants'
import { ApiTokenSettingsSection } from './ApiTokenSettingsSection'
import { createAccountDeletion } from './createAccountDeletion'
import { createPlayerDataDeletion } from './createPlayerDataDeletion'
import { createPrivacySetting } from './createPrivacySetting'
import { DataTransferSettingsSection } from './DataTransferSettingsSection'
import { GoogleAccountChangeForm } from './GoogleAccountChangeForm'
import { LoginMethodSettingsSection } from './LoginMethodSettingsSection'
import { PLAYER_DATA_DELETE_COPY } from './PlayerDataSettings.constants'
import { PRIVACY_SETTINGS_COPY } from './ProfileSettings.constants'
import { formatSettingsDateTime } from './settingsDateTime'
import { normalizeSettingsSection, SETTINGS_SECTIONS } from './settingsSections'
import { SETTINGS_ROW_LIST_CLASS, SETTINGS_SUBSECTION_CLASS } from './settingsStyles'
import { UsernameChangeForm } from './UsernameChangeForm'

type SettingsSummary = {
  me: Awaited<ReturnType<typeof fetchMe>>
  profile: Awaited<ReturnType<typeof fetchUserProfileSummary>>
}

/**
 * ユーザー設定画面を表示する。
 *
 * @returns 設定画面のJSX要素。
 */
const Settings = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const params = useParams<{ section?: string }>()
  const linkedAuthAccounts = createLinkedAuthAccounts()

  useDocumentTitle('設定')

  /**
   * ログイン中ユーザーのフレンドランキングキャッシュを無効化する。
   *
   * @returns 表示中ランキングの再取得完了時に解決されるPromise。
   */
  const invalidateCurrentUserFriendRankings = (): Promise<void> => {
    const username = authSession.user?.username
    return username ? invalidateFriendRankings(queryClient, username) : Promise.resolve()
  }
  const [summary, { refetch: refetchSummary, mutate: mutateSummary }] = createResource(
    () => authSession.user?.username,
    async (username): Promise<SettingsSummary> => {
      const [me, profile] = await Promise.all([
        fetchMe({ redirectOnUnauthorized: false }),
        fetchUserProfileSummary(username),
      ])
      return { me, profile }
    }
  )
  /**
   * 取得済みの設定画面データを返す。取得に失敗したResourceを読むと例外になるため、失敗時は未取得として扱う。
   *
   * @returns 取得済みのデータ。取得中または取得失敗時は undefined。
   */
  const currentSummary = (): SettingsSummary | undefined => (summary.error ? undefined : summary())
  const privacy = createPrivacySetting({
    source: () => currentSummary()?.me.is_private,
    update: updatePrivacy,
    refresh: fetchPrivacy,
    onSaved: (isPrivate) =>
      mutateSummary((current) =>
        current ? { ...current, me: { ...current.me, is_private: isPrivate } } : current
      ),
  })
  const playerDataDeletion = createPlayerDataDeletion({
    username: () => currentSummary()?.me.username,
    deletePlayerData,
    onDeleted: () => Promise.allSettled([invalidateCurrentUserFriendRankings(), refetchSummary()]),
  })
  const accountDeletion = createAccountDeletion({
    deleteAccount,
    discardSession: discardLocalSession,
    navigateToLogin: () => navigate(LOGIN_PATH, { replace: true }),
  })

  /**
   * 現在のURLに対応する設定カテゴリを返す。
   *
   * @returns 表示対象の設定カテゴリID。
   */
  const activeSection = () => normalizeSettingsSection(params.section)

  /**
   * ユーザーネーム変更後に認証状態と画面表示を更新し、旧ユーザーネームに依存するキャッシュを破棄する。
   *
   * @param username - APIが返した変更後のユーザーネーム。
   * @returns 状態更新とキャッシュ破棄の試行完了後に解決されるPromise。
   */
  const handleUsernameChanged = async (username: string): Promise<void> => {
    const previousUsername = authSession.user?.username ?? currentSummary()?.me.username
    const currentUser = authSession.user
    if (currentUser) {
      setAuthenticatedUser({ ...currentUser, username })
    }
    mutateSummary((current) =>
      current
        ? {
            me: { ...current.me, username },
            profile: { ...current.profile, username },
          }
        : current
    )

    if (previousUsername) {
      await clearUsernameChangeCache(queryClient, previousUsername)
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl p-4">
      <h1 class="mb-6 text-2xl font-semibold text-text">設定</h1>
      <div class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="設定カテゴリ" class="md:sticky md:top-4 md:self-start">
          <ul class="flex gap-2 overflow-x-auto border-b border-border pb-3 md:flex-col md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <For each={SETTINGS_SECTIONS}>
              {(section) => (
                <li class="shrink-0">
                  <A
                    href={`/settings/${section.id}`}
                    aria-current={activeSection() === section.id ? 'page' : undefined}
                    class="block rounded-md px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-surface-hover aria-[current=page]:bg-action-secondary aria-[current=page]:text-text"
                  >
                    {section.label}
                  </A>
                </li>
              )}
            </For>
          </ul>
        </nav>

        <main class="min-w-0">
          <Show when={activeSection() === 'appearance'}>
            <section aria-labelledby="appearance-title">
              <h2 id="appearance-title" class="mb-5 text-xl font-semibold text-text">
                {APPEARANCE_SETTINGS_COPY.sectionTitle}
              </h2>
              <div class="grid gap-6">
                <AppearanceSettings />
                <NavPlacementSettings />
              </div>
            </section>
          </Show>

          <Show when={!summary.error} fallback={<LoadError error={summary.error} />}>
            <Show when={summary()} fallback={<Loading />}>
              {(loadedSummary) => (
                <>
                  <Show when={activeSection() === 'profile'}>
                    <section aria-labelledby="profile-title">
                      <h2 id="profile-title" class="text-xl font-semibold text-text">
                        {PRIVACY_SETTINGS_COPY.sectionTitle}
                      </h2>
                      <div class="mt-2 flex items-center justify-between gap-4 py-4">
                        <div>
                          <h3 class="font-medium text-text">{PRIVACY_SETTINGS_COPY.label}</h3>
                          <p class="mt-1 text-sm text-text-muted">
                            {PRIVACY_SETTINGS_COPY.description}
                          </p>
                        </div>
                        <AppSwitch
                          checked={privacy.value()}
                          onChange={(nextValue) => void privacy.toggle(nextValue)}
                          disabled={privacy.submitting()}
                          label={PRIVACY_SETTINGS_COPY.label}
                        />
                      </div>
                      <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
                        {privacy.error()}
                      </p>
                      <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
                        {privacy.success()}
                      </p>
                    </section>
                  </Show>

                  <Show when={activeSection() === 'api'}>
                    <ApiTokenSettingsSection
                      username={loadedSummary().me.username}
                      accountType={loadedSummary().me.account_type}
                    />
                  </Show>

                  <Show when={activeSection() === 'data'}>
                    <div class="space-y-10">
                      <section aria-labelledby="player-data-title">
                        <h2 id="player-data-title" class="text-xl font-semibold text-text">
                          プレイヤーデータ
                        </h2>
                        <dl class={`mt-2 ${SETTINGS_ROW_LIST_CLASS}`}>
                          <div class="flex justify-between gap-4 py-4">
                            <dt class="text-text-muted">連携状態</dt>
                            <dd class="font-medium text-text">
                              {loadedSummary().profile.player ? '連携済み' : '未連携'}
                            </dd>
                          </div>
                          <div class="flex justify-between gap-4 py-4">
                            <dt class="text-text-muted">最終更新</dt>
                            <dd class="font-medium text-text">
                              {formatSettingsDateTime(loadedSummary().me.last_score_update)}
                            </dd>
                          </div>
                        </dl>
                        <p class="mt-3 text-sm text-action-primary empty:hidden" role="status">
                          {playerDataDeletion.success()}
                        </p>
                        <AppButton
                          variant="dangerOutline"
                          class="mt-4"
                          onClick={playerDataDeletion.openDialog}
                          disabled={!loadedSummary().profile.player}
                        >
                          プレイヤーデータを削除
                        </AppButton>
                      </section>
                      <DataTransferSettingsSection
                        hasUserData={Boolean(loadedSummary().profile.player)}
                        onImported={async () => {
                          await Promise.allSettled([
                            invalidateCurrentUserFriendRankings(),
                            refetchSummary(),
                          ])
                        }}
                      />
                    </div>
                  </Show>

                  <Show when={activeSection() === 'account'}>
                    <section aria-labelledby="account-title">
                      <h2 id="account-title" class="text-xl font-semibold text-text">
                        アカウント
                      </h2>
                      <dl class={`mt-2 ${SETTINGS_ROW_LIST_CLASS}`}>
                        <div class="flex justify-between gap-4 py-4">
                          <dt class="text-text-muted">ユーザーネーム</dt>
                          <dd class="font-sans font-medium text-text">
                            {loadedSummary().me.username}
                          </dd>
                        </div>
                        <div class="flex justify-between gap-4 py-4">
                          <dt class="text-text-muted">アカウント種別</dt>
                          <dd class="font-medium text-text">{loadedSummary().me.account_type}</dd>
                        </div>
                      </dl>
                      <UsernameChangeForm
                        currentUsername={loadedSummary().me.username}
                        onChanged={handleUsernameChanged}
                      />
                      <LoginMethodSettingsSection
                        accounts={linkedAuthAccounts.accounts()}
                        onChanged={linkedAuthAccounts.refresh}
                      />
                      <Show when={canChangeGoogleAccount(linkedAuthAccounts.accounts())}>
                        <GoogleAccountChangeForm
                          xLinked={
                            findLinkedAuthAccount(linkedAuthAccounts.accounts(), 'x') !== undefined
                          }
                        />
                      </Show>
                      <div class={SETTINGS_SUBSECTION_CLASS}>
                        <h3 class="text-lg font-semibold text-danger">退会</h3>
                        <p class="mt-1 text-sm text-text-muted">
                          アカウントと関連データを完全に削除します。
                        </p>
                        <AppButton
                          variant="danger"
                          class="mt-4"
                          onClick={() => accountDeletion.setDialogOpen(true)}
                        >
                          退会する
                        </AppButton>
                      </div>
                    </section>
                  </Show>
                </>
              )}
            </Show>
          </Show>
        </main>
      </div>

      <AppConfirmDialog
        open={playerDataDeletion.dialogOpen()}
        onOpenChange={playerDataDeletion.setDialogOpen}
        title={PLAYER_DATA_DELETE_COPY.title}
        description={PLAYER_DATA_DELETE_COPY.description}
        cancelLabel={PLAYER_DATA_DELETE_COPY.cancel}
        confirmLabel={
          playerDataDeletion.deleting()
            ? PLAYER_DATA_DELETE_COPY.deleting
            : PLAYER_DATA_DELETE_COPY.confirm
        }
        confirmVariant="danger"
        pending={playerDataDeletion.deleting()}
        confirmDisabled={!playerDataDeletion.isConfirmed()}
        onConfirm={() => void playerDataDeletion.submit()}
      >
        <TextField
          class="mt-4"
          value={playerDataDeletion.confirmInput()}
          onChange={playerDataDeletion.setConfirmInput}
          disabled={playerDataDeletion.deleting()}
        >
          <TextField.Label class="block text-sm font-medium text-text">
            {PLAYER_DATA_DELETE_COPY.confirmInputLabel}
          </TextField.Label>
          <TextField.Input
            class={`mt-2 w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans text-text placeholder:text-text-muted ${FILTER_DIALOG_FIELD_FOCUS_CLASS}`}
            placeholder={currentSummary()?.me.username}
            autocomplete="off"
            autocapitalize="off"
            spellcheck={false}
          />
        </TextField>
        <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
          {playerDataDeletion.error()}
        </p>
      </AppConfirmDialog>

      <AppConfirmDialog
        open={accountDeletion.dialogOpen()}
        onOpenChange={accountDeletion.setDialogOpen}
        title={ACCOUNT_DELETE_COPY.title}
        description={ACCOUNT_DELETE_COPY.description}
        cancelLabel={ACCOUNT_DELETE_COPY.cancel}
        confirmLabel={
          accountDeletion.deleting() ? ACCOUNT_DELETE_COPY.deleting : ACCOUNT_DELETE_COPY.confirm
        }
        confirmVariant="danger"
        pending={accountDeletion.deleting()}
        onConfirm={() => void accountDeletion.submit()}
      >
        <p class="mt-3 text-sm text-danger empty:hidden" role="alert">
          {accountDeletion.error()}
        </p>
      </AppConfirmDialog>
    </div>
  )
}

export default Settings
