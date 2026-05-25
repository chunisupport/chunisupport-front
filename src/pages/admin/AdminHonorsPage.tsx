import { createMemo, createResource, For, Show } from 'solid-js'
import { fetchAdminHonors } from '../../api/honors'
import { Loading } from '../../components'
import { getHonorTypeClassName } from '../../constants/honors'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

/**
 * 管理者向けの称号一覧画面を描画する。
 *
 * @returns 称号管理UI。
 */
const AdminHonorsPage = () => {
  useDocumentTitle('称号管理')

  const [honorsResponse] = createResource(fetchAdminHonors)
  const honors = createMemo(() => honorsResponse()?.honors ?? [])
  const hasRows = createMemo(() => honors().length > 0)

  return (
    <div class="mx-auto w-full max-w-6xl space-y-4 p-4">
      <div>
        <h1 class="text-2xl font-semibold">称号管理</h1>
        <p class="mt-1 text-sm text-text-muted">称号、クラス、image_url を一覧で確認します。</p>
      </div>

      <Show when={!honorsResponse.loading} fallback={<Loading />}>
        <div class="overflow-x-auto rounded-lg border border-border bg-surface">
          <table class="min-w-full text-sm">
            <thead class="bg-surface-muted">
              <tr>
                <th class="px-3 py-2 text-left">称号</th>
                <th class="px-3 py-2 text-left">クラス</th>
                <th class="px-3 py-2 text-left">image_url</th>
              </tr>
            </thead>
            <tbody>
              <For each={honors()}>
                {(honor) => (
                  <tr class="border-t border-border">
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
    </div>
  )
}

export default AdminHonorsPage
