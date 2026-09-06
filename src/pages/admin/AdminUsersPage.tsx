import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import {
  ADMIN_USER_LIST_PAGE_SIZE,
  deleteUserByUsername,
  fetchAdminUserPermissions,
  fetchAdminUserStatistics,
  fetchAdminUsers,
  updateUserPermission,
} from '../../api/users'
import { Loading } from '../../components'
import { AppButton } from '../../components/common/AppButton'
import { AppSelect } from '../../components/common/AppSelect'
import { showErrorToast, showSuccessToast } from '../../components/common/AppToast'
import { PaginationNav } from '../../components/common/PaginationNav'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import type { AccountType } from '../../types/api'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { formatInteger } from '../../utils/numberFormat'
import { resolvePagedListTotalPages } from '../../utils/pagination'
import {
  ADMIN_USER_LIST_COPY,
  ADMIN_USER_STATISTICS_COPY,
  formatAdminUserDeleteConfirmation,
} from './AdminUsersPage.constants'
import {
  formatAccountType,
  formatAdminUserDateTime,
  formatBooleanFlag,
  formatNullableText,
} from './adminUserDisplay'

/**
 * 管理者向けユーザー管理ページ。
 * ユーザー集計と、ユーザー一覧の検索・ページング・権限変更・物理削除を提供する。
 * テーブルヘッダおよび全データ行のセルでテキストの自動改行（折り返し）を禁止し、
 * 内容が長い場合は親要素の overflow-x-auto により横スクロールで表示する。
 *
 * @returns ユーザー集計とユーザー管理操作を表示するページ。
 */
const AdminUsersPage = () => {
  useDocumentTitle(ADMIN_USER_LIST_COPY.pageTitle)

  const [searchInput, setSearchInput] = createSignal('')
  const [searchName, setSearchName] = createSignal('')
  const [page, setPage] = createSignal(1)
  const [refreshKey, setRefreshKey] = createSignal(0)
  const [updatingPermissionUsernames, setUpdatingPermissionUsernames] = createSignal<
    ReadonlySet<string>
  >(new Set())
  const [permissionErrorMessages, setPermissionErrorMessages] = createSignal<
    Record<string, string>
  >({})

  const [usersResponse] = createResource(
    () => ({ name: searchName(), page: page(), refresh: refreshKey() }),
    ({ name, page: currentPage }) => fetchAdminUsers({ name, page: currentPage })
  )
  const [statisticsResponse] = createResource(
    () => ({ refresh: refreshKey() }),
    fetchAdminUserStatistics
  )
  const [permissionsResponse] = createResource(fetchAdminUserPermissions)

  const users = createMemo(() => usersResponse() ?? [])
  const permissions = createMemo(() => permissionsResponse()?.permissions ?? [])
  const hasRows = createMemo(() => users().length > 0)
  const totalPages = createMemo(() =>
    resolvePagedListTotalPages({
      currentPage: page(),
      pageSize: ADMIN_USER_LIST_PAGE_SIZE,
      itemCount: users().length,
      totalCount: searchName() ? undefined : statisticsResponse()?.total_users,
    })
  )

  const refresh = () => setRefreshKey((prev) => prev + 1)

  /**
   * 入力中の検索語で1ページ目から再検索する。
   *
   * @param event - 検索フォームの submit イベント。
   */
  const handleSearch = (event: SubmitEvent) => {
    event.preventDefault()
    setPage(1)
    setSearchName(searchInput().trim())
  }

  /**
   * 最終ページが空になった場合は前のページへ戻す。
   */
  createEffect(() => {
    if (usersResponse.loading || usersResponse.error) return
    if (users().length === 0 && page() > 1) {
      setPage(page() - 1)
    }
  })

  /**
   * 指定されたユーザーを確認後に物理削除する。
   *
   * @param username - 削除対象のユーザー名。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleDelete = async (username: string) => {
    if (!window.confirm(formatAdminUserDeleteConfirmation(username))) return
    try {
      await deleteUserByUsername(username)
      showSuccessToast(ADMIN_USER_LIST_COPY.deleteSuccess)
      refresh()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, ADMIN_USER_LIST_COPY.deleteError))
    }
  }

  /**
   * プルダウンで選択されたユーザー権限を保存する。
   *
   * @param username - 権限を変更するユーザー名。
   * @param permission - プルダウンで選択された権限。
   * @returns 保存完了時に解決されるPromise。
   */
  const handlePermissionChange = async (
    username: string,
    permission: AccountType | null
  ): Promise<void> => {
    if (permission === null) return

    setPermissionErrorMessages((current) => ({ ...current, [username]: '' }))
    setUpdatingPermissionUsernames((current) => new Set(current).add(username))
    try {
      await updateUserPermission(username, permission)
      showSuccessToast(ADMIN_USER_LIST_COPY.permissionUpdateSuccess)
      refresh()
    } catch (error) {
      setPermissionErrorMessages((current) => ({
        ...current,
        [username]: toUserFriendlyErrorMessage(error, ADMIN_USER_LIST_COPY.permissionUpdateError),
      }))
    } finally {
      setUpdatingPermissionUsernames((current) => {
        const next = new Set(current)
        next.delete(username)
        return next
      })
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl p-4 space-y-4">
      <div>
        <h1 class="text-2xl font-semibold">{ADMIN_USER_LIST_COPY.pageTitle}</h1>
        <p class="mt-1 text-sm text-text-muted">{ADMIN_USER_LIST_COPY.pageDescription}</p>
      </div>

      <section aria-labelledby="admin-user-statistics-heading">
        <h2 id="admin-user-statistics-heading" class="sr-only">
          {ADMIN_USER_STATISTICS_COPY.heading}
        </h2>
        <Show
          when={!statisticsResponse.loading}
          fallback={
            <div class="h-28 rounded-lg border border-border bg-surface p-4">
              <Loading ariaLabel={ADMIN_USER_STATISTICS_COPY.loadingLabel} />
            </div>
          }
        >
          <Show
            when={!statisticsResponse.error}
            fallback={
              <p
                class="rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-danger"
                role="alert"
              >
                {ADMIN_USER_STATISTICS_COPY.loadError}
              </p>
            }
          >
            <Show when={statisticsResponse()} keyed>
              {(statistics) => (
                <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
                    <dt class="text-sm text-text-muted">{ADMIN_USER_STATISTICS_COPY.totalUsers}</dt>
                    <dd class="mt-1 font-jost text-3xl font-semibold text-text tabular-nums">
                      {formatInteger(statistics.total_users)}
                    </dd>
                  </div>
                  <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
                    <dt class="text-sm text-text-muted">
                      {ADMIN_USER_STATISTICS_COPY.usersWithPlayerData}
                    </dt>
                    <dd class="mt-1 font-jost text-3xl font-semibold text-text tabular-nums">
                      {formatInteger(statistics.users_with_player_data)}
                    </dd>
                  </div>
                  <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
                    <dt class="text-sm text-text-muted">
                      {ADMIN_USER_STATISTICS_COPY.activePlayerDataLast30Days}
                    </dt>
                    <dd class="mt-1 font-jost text-3xl font-semibold text-text tabular-nums">
                      {formatInteger(statistics.active_player_data_last_30_days)}
                    </dd>
                  </div>
                </dl>
              )}
            </Show>
          </Show>
        </Show>
      </section>

      <div class="rounded-lg border border-border bg-surface p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <search class="min-w-0">
            <form class="flex flex-wrap items-end gap-2" onSubmit={handleSearch}>
              <label class="text-sm">
                <span class="mb-1 block text-text-muted">{ADMIN_USER_LIST_COPY.searchLabel}</span>
                <input
                  type="search"
                  value={searchInput()}
                  onInput={(event) => setSearchInput(event.currentTarget.value)}
                  class="w-full max-w-72 rounded border border-border-strong px-3 py-2 font-sans"
                  placeholder={ADMIN_USER_LIST_COPY.searchPlaceholder}
                />
              </label>
              <AppButton type="submit" variant="primary">
                {ADMIN_USER_LIST_COPY.searchButton}
              </AppButton>
            </form>
          </search>
          <PaginationNav
            currentPage={page()}
            totalPages={totalPages()}
            disabled={usersResponse.loading}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Show
        when={!usersResponse.loading || hasRows()}
        fallback={
          <div class="h-40 rounded-lg border border-border bg-surface p-4">
            <Loading ariaLabel={ADMIN_USER_LIST_COPY.loadingLabel} />
          </div>
        }
      >
        <div class="overflow-x-auto rounded-lg border border-border bg-surface">
          <table class="min-w-full text-sm">
            <thead class="bg-surface-muted">
              <tr>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.username}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.accountType}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.createdAt}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.updatedAt}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.playerName}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.rating}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.overpowerValue}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.suspicious}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.private}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-left">
                  {ADMIN_USER_LIST_COPY.tableHeaders.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={users()}>
                {(user) => (
                  <tr class="border-t border-border">
                    <td class="whitespace-nowrap px-3 py-2 font-mono text-xs">{user.username}</td>
                    <td class="whitespace-nowrap px-3 py-2">
                      <Show
                        when={!permissionsResponse.loading}
                        fallback={
                          <div class="h-8 w-28">
                            <Loading
                              size="inline"
                              ariaLabel={ADMIN_USER_LIST_COPY.permissionLoadingLabel}
                            />
                          </div>
                        }
                      >
                        <Show
                          when={!permissionsResponse.error}
                          fallback={
                            <p class="text-xs text-danger" role="alert">
                              {ADMIN_USER_LIST_COPY.permissionLoadError}
                            </p>
                          }
                        >
                          <div class="w-32 space-y-1">
                            <AppSelect<AccountType>
                              options={permissions()}
                              optionValue={(permission) => permission}
                              optionTextValue={formatAccountType}
                              value={user.account_type}
                              onChange={(permission) =>
                                void handlePermissionChange(user.username, permission)
                              }
                              label={`${user.username}の${ADMIN_USER_LIST_COPY.permissionLabel}`}
                              labelVariant="srOnly"
                              formatLabel={formatAccountType}
                              disabled={
                                updatingPermissionUsernames().has(user.username) ||
                                authSession.user?.username === user.username
                              }
                              triggerClass="min-w-28 py-1"
                            />
                            <Show when={permissionErrorMessages()[user.username]}>
                              {(errorMessage) => (
                                <p class="text-xs text-danger" role="alert">
                                  {errorMessage()}
                                </p>
                              )}
                            </Show>
                          </div>
                        </Show>
                      </Show>
                    </td>
                    <td class="whitespace-nowrap px-3 py-2">
                      {formatAdminUserDateTime(user.created_at)}
                    </td>
                    <td class="whitespace-nowrap px-3 py-2">
                      {formatAdminUserDateTime(user.updated_at)}
                    </td>
                    <td class="whitespace-nowrap px-3 py-2">
                      {formatNullableText(user.player_name)}
                    </td>
                    <td class="whitespace-nowrap px-3 py-2">{user.rating ?? '-'}</td>
                    <td class="whitespace-nowrap px-3 py-2">{user.overpower_value ?? '-'}</td>
                    <td class="whitespace-nowrap px-3 py-2">
                      {formatBooleanFlag(user.is_suspicious)}
                    </td>
                    <td class="whitespace-nowrap px-3 py-2">
                      {formatBooleanFlag(user.is_private)}
                    </td>
                    <td class="whitespace-nowrap px-3 py-2">
                      <AppButton
                        variant="danger"
                        size="xs"
                        onClick={() => handleDelete(user.username)}
                      >
                        {ADMIN_USER_LIST_COPY.deleteButton}
                      </AppButton>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>

      <Show when={!usersResponse.loading && !hasRows() && page() === 1}>
        <p class="text-sm text-text-subtle">{ADMIN_USER_LIST_COPY.empty}</p>
      </Show>
    </div>
  )
}

export default AdminUsersPage
