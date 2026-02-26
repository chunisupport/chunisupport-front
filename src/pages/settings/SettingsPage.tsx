import { A } from '@solidjs/router'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const links = [
  {
    href: '/settings/privacy',
    title: '非公開設定',
    description: 'プロフィール公開/非公開を切り替えます。',
  },
  {
    href: '/settings/password',
    title: 'パスワード変更',
    description: '現在のパスワードを使って新しいパスワードへ変更します。',
  },
  {
    href: '/settings/recovery-codes',
    title: 'リカバリーコード発行',
    description: 'アカウント用のリカバリーコードを再発行します。',
  },
  {
    href: '/settings/api-token',
    title: 'APIトークン管理',
    description: 'APIトークンの発行・削除を行います。',
  },
  {
    href: '/settings/sessions',
    title: 'セッション管理',
    description: '現在のセッション数確認と、他端末ログアウトを行います。',
  },
]

const SettingsPage = () => {
  useDocumentTitle('設定')

  return (
    <div class="mx-auto w-full max-w-4xl p-6">
      <h1 class="text-2xl font-semibold">設定</h1>
      <p class="mt-2 text-sm text-gray-600">アカウント・セキュリティ関連の設定を変更できます。</p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        {links.map((link) => (
          <A
            href={link.href}
            class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:bg-green-50"
          >
            <h2 class="text-lg font-semibold text-gray-900">{link.title}</h2>
            <p class="mt-1 text-sm text-gray-600">{link.description}</p>
          </A>
        ))}
      </div>
    </div>
  )
}

export default SettingsPage
