import { Button } from '@kobalte/core/button'
import { createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { deleteUserByUsername, fetchAdminUsers } from '../../api/users'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import {
  formatAccountType,
  formatAdminUserDateTime,
  formatBooleanFlag,
  formatNullableText,
} from './adminUserDisplay'

/**
 * 管理者向けユーザー管理ページ。
 * ユーザー一覧の検索・表示・物理削除を提供する。
 * テーブルヘッダおよび全データ行のセルでテキストの自動改行（折り返し）を禁止し、
 * 内容が長い場合は親要素の overflow-x-auto により横スクロールで表示する。
 */
const AdminUsersPage = () => {
  useDocumentTitle('ユーザー管理')

  const [searchInput, setSearchInput] = createSignal('')
  const [searchName, setSearchName] = createSignal('')
  const [refreshKey, setRefreshKey] = createSignal(0)
  const [message, setMessage] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal('')

  const [usersResponse] = createResource(
    () => ({ name: searchName(), refresh: refreshKey() }),
    ({ name }) => fetchAdminUsers({ name })
  )

  const users = createMemo(() => usersResponse() ?? [])
  const hasRows = createMemo(() => users().length > 0)

  const refresh = () => setRefreshKey((prev) => prev + 1)

  const handleSearch = () => {
    setSearchName(searchInput().trim())
  }

  /**
   * 指定されたユーザーを確認後に物理削除する。
   *
   * @param username - 削除対象のユーザー名。
   * @returns 処理完了後に解決されるPromise。
   */
  const handleDelete = async (username: string) => {
    if (!window.confirm(`ユーザー ${username} を物理削除しますか？この操作は取り消せません。`))
      return
    setMessage('')
    setErrorMessage('')
    try {
      await deleteUserByUsername(username)
      setMessage(`ユーザー ${username} を削除しました。`)
      refresh()
    } catch (error) {
      setErrorMessage(toUserFriendlyErrorMessage(error, '削除に失敗しました。'))
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl p-4 space-y-4">
      <div>
        <h1 class="text-2xl font-semibold">ユーザー管理</h1>
        <p class="mt-1 text-sm text-text-muted">
          API仕様準拠: 一覧・検索・物理削除に対応。ユーザー情報の管理者編集APIは未提供です。
        </p>
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

      <div class="rounded-lg border border-border bg-surface p-4">
        <div class="flex flex-wrap items-end gap-2">
          <label class="text-sm">
            <span class="mb-1 block text-text-muted">ユーザー/プレイヤー名（前方一致）</span>
            <input
              value={searchInput()}
              onInput={(event) => setSearchInput(event.currentTarget.value)}
              class="w-72 rounded border border-border-strong px-3 py-2 font-sans"
              placeholder="例: user"
            />
          </label>
          <Button
            type="button"
            class="rounded bg-info px-4 py-2 text-sm font-medium text-text-inverse hover:bg-info"
            onClick={handleSearch}
          >
            検索
          </Button>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-border bg-surface">
        <table class="min-w-full text-sm">
          <thead class="bg-surface-muted">
            <tr>
              <th class="whitespace-nowrap px-3 py-2 text-left">username</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">uid</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">account_type</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">created_at</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">updated_at</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">player_name</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">rating</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">overpower_value</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">is_suspicious</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">is_private</th>
              <th class="whitespace-nowrap px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            <For each={users()}>
              {(user) => (
                <tr class="border-t border-border">
                  <td class="whitespace-nowrap px-3 py-2 font-mono text-xs">{user.username}</td>
                  <td class="whitespace-nowrap px-3 py-2 font-mono text-xs">
                    {formatNullableText(user.firebase_uid)}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2">
                    {formatAccountType(user.account_type)}
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
                  <td class="whitespace-nowrap px-3 py-2">{formatBooleanFlag(user.is_private)}</td>
                  <td class="whitespace-nowrap px-3 py-2">
                    <Button
                      type="button"
                      class="rounded bg-danger px-3 py-1 text-xs font-medium text-text-inverse hover:bg-danger-hover"
                      onClick={() => handleDelete(user.username)}
                    >
                      削除
                    </Button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>

      <Show when={!usersResponse.loading && !hasRows()}>
        <p class="text-sm text-text-subtle">一致するユーザーが見つかりません。</p>
      </Show>
    </div>
  )
}

export default AdminUsersPage
