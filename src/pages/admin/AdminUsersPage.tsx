import { createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { deleteUserByUsername, fetchAdminUsers, restoreUserByUsername } from '../../api/users'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  formatAccountType,
  formatAdminUserDateTime,
  formatBooleanFlag,
  formatNullableText,
} from './adminUserDisplay'

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

  const handleDelete = async (username: string) => {
    if (!window.confirm(`ユーザー ${username} を削除しますか？`)) return
    setMessage('')
    setErrorMessage('')
    try {
      await deleteUserByUsername(username)
      setMessage(`ユーザー ${username} を削除しました。`)
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '削除に失敗しました。')
    }
  }

  const handleRestore = async (username: string) => {
    setMessage('')
    setErrorMessage('')
    try {
      await restoreUserByUsername(username)
      setMessage(`ユーザー ${username} を復活しました。`)
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '復活に失敗しました。')
    }
  }

  return (
    <div class="mx-auto w-full max-w-6xl p-4 space-y-4">
      <div>
        <h1 class="text-2xl font-semibold">ユーザー管理</h1>
        <p class="mt-1 text-sm text-gray-600">
          API仕様準拠: 一覧・検索・削除・復活に対応。ユーザー情報の管理者編集APIは未提供です。
        </p>
      </div>

      <Show when={message()}>
        <p class="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message()}
        </p>
      </Show>
      <Show when={errorMessage()}>
        <p class="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage()}
        </p>
      </Show>

      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <div class="flex flex-wrap items-end gap-2">
          <label class="text-sm">
            <span class="mb-1 block text-gray-700">ユーザー/プレイヤー名（前方一致）</span>
            <input
              value={searchInput()}
              onInput={(event) => setSearchInput(event.currentTarget.value)}
              class="w-72 rounded border border-gray-300 px-3 py-2"
              placeholder="例: user"
            />
          </label>
          <button
            type="button"
            class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={handleSearch}
          >
            検索
          </button>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left">username</th>
              <th class="px-3 py-2 text-left">account_type</th>
              <th class="px-3 py-2 text-left">created_at</th>
              <th class="px-3 py-2 text-left">updated_at</th>
              <th class="px-3 py-2 text-left">player_name</th>
              <th class="px-3 py-2 text-left">rating</th>
              <th class="px-3 py-2 text-left">overpower_value</th>
              <th class="px-3 py-2 text-left">is_suspicious</th>
              <th class="px-3 py-2 text-left">is_private</th>
              <th class="px-3 py-2 text-left">is_deleted</th>
              <th class="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            <For each={users()}>
              {(user) => (
                <tr class="border-t border-gray-100">
                  <td class="px-3 py-2 font-mono text-xs">{user.username}</td>
                  <td class="px-3 py-2">{formatAccountType(user.account_type)}</td>
                  <td class="px-3 py-2">{formatAdminUserDateTime(user.created_at)}</td>
                  <td class="px-3 py-2">{formatAdminUserDateTime(user.updated_at)}</td>
                  <td class="px-3 py-2">{formatNullableText(user.player_name)}</td>
                  <td class="px-3 py-2">{user.rating ?? '-'}</td>
                  <td class="px-3 py-2">{user.overpower_value ?? '-'}</td>
                  <td class="px-3 py-2">{formatBooleanFlag(user.is_suspicious)}</td>
                  <td class="px-3 py-2">{formatBooleanFlag(user.is_private)}</td>
                  <td class="px-3 py-2">{formatBooleanFlag(user.is_deleted)}</td>
                  <td class="px-3 py-2">
                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                        onClick={() => handleDelete(user.username)}
                      >
                        削除
                      </button>
                      <button
                        type="button"
                        class="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                        onClick={() => handleRestore(user.username)}
                      >
                        復活
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>

      <Show when={!usersResponse.loading && !hasRows()}>
        <p class="text-sm text-gray-500">一致するユーザーが見つかりません。</p>
      </Show>
    </div>
  )
}

export default AdminUsersPage
