import { A } from '@solidjs/router'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const NotFoundPage = () => {
  useDocumentTitle('404 Not Found')

  return (
    <div class="mx-auto w-full max-w-3xl p-6 space-y-3">
      <h1 class="text-2xl font-semibold">404 Not Found</h1>
      <p class="text-sm text-gray-600">お探しのページは見つかりませんでした。</p>
      <A href="/" class="text-blue-600 hover:underline">
        ルートページへ戻る
      </A>
    </div>
  )
}

export default NotFoundPage
