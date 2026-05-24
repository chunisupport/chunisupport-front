import { A } from '@solidjs/router'
import { For } from 'solid-js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const links = [
  {
    href: '/admin/users',
    title: 'ユーザー管理',
    description: 'ユーザー一覧、検索、削除、復活を行います。',
  },
  {
    href: '/admin/songs',
    title: '楽曲管理',
    description: '楽曲一覧、編集、削除、復活を行います。',
  },
]

const AdminPage = () => {
  useDocumentTitle('管理')

  return (
    <div class="mx-auto w-full max-w-4xl p-6">
      <h1 class="text-2xl font-semibold">管理ページ</h1>
      <p class="mt-2 text-sm text-text-muted">管理者向けのメニューです。</p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <For each={links}>
          {(link) => (
            <A
              href={link.href}
              class="rounded-lg border border-border bg-surface p-4 shadow-sm transition hover:border-info-border hover:bg-info-bg"
            >
              <h2 class="text-lg font-semibold text-text">{link.title}</h2>
              <p class="mt-1 text-sm text-text-muted">{link.description}</p>
            </A>
          )}
        </For>
      </div>
    </div>
  )
}

export default AdminPage
