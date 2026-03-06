import { A } from '@solidjs/router'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const EditorPage = () => {
  useDocumentTitle('エディター')

  return (
    <div class="mx-auto w-full max-w-4xl p-6">
      <h1 class="text-2xl font-semibold">エディターページ</h1>
      <p class="mt-2 text-sm text-gray-600">エディター向けのメニューです。</p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <A
          href="/editor/songs"
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
        >
          <h2 class="text-lg font-semibold text-gray-900">楽曲管理</h2>
          <p class="mt-1 text-sm text-gray-600">楽曲一覧、編集、削除、復活を行います。</p>
        </A>
      </div>
    </div>
  )
}

export default EditorPage
