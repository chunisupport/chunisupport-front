import { useDocumentTitle } from '../../hooks/useDocumentTitle'

/** フレンド画面に表示するタイトル。 */
export const FRIENDS_PAGE_TITLE = 'フレンド'

/**
 * フレンド機能の画面を表示する。
 *
 * @returns フレンド画面。
 */
const FriendsPage = () => {
  useDocumentTitle(FRIENDS_PAGE_TITLE)

  return (
    <div class="mx-auto w-full max-w-3xl p-4">
      <h1 class="text-2xl font-semibold">{FRIENDS_PAGE_TITLE}</h1>
    </div>
  )
}

export default FriendsPage
