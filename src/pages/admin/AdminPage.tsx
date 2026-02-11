import { A } from '@solidjs/router'
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
      <p class="mt-2 text-sm text-gray-600">管理者向けのメニューです。</p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <A
            href={link.href}
            class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <h2 class="text-lg font-semibold text-gray-900">{link.title}</h2>
            <p class="mt-1 text-sm text-gray-600">{link.description}</p>
          </A>
        ))}
      </div>
    </div>
  )
}

export default AdminPage
