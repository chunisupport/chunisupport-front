import { A } from '@solidjs/router'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const ForbiddenPage = () => {
    useDocumentTitle('403 Forbidden')

    return (
        <div class="mx-auto w-full max-w-3xl p-6 space-y-3">
            <h1 class="text-2xl font-semibold">403 Forbidden</h1>
            <p class="text-sm text-gray-600">このページにアクセスする権限がありません。</p>
            <A href="/" class="text-blue-600 hover:underline">
                ルートページへ戻る
            </A>
        </div>
    )
}

export default ForbiddenPage
