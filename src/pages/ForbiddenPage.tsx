import { A } from '@solidjs/router'
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts'

const ForbiddenPage = () => {
  useDocumentTitle('403 Forbidden')

  return (
    <div class="mx-auto w-full max-w-3xl p-6 space-y-3">
      <h1 class="text-2xl font-semibold">403 Forbidden</h1>
      <p class="text-sm text-text-muted">このページにアクセスする権限がありません。</p>
      <A href="/" class="text-link hover:underline">
        トップページへ戻る
      </A>
    </div>
  )
}

export default ForbiddenPage
