import { createEffect, onCleanup } from 'solid-js'

const SITE_NAME = 'ChuniSupport'

/**
 * ページのドキュメントタイトルを設定するカスタムフック
 * @param title ページ固有のタイトル。空の場合はサイト名のみ表示
 */
export function useDocumentTitle(title?: string | (() => string)) {
  const defaultTitle = SITE_NAME

  createEffect(() => {
    const pageTitle = typeof title === 'function' ? title() : title
    document.title = pageTitle ? `${pageTitle} - ${SITE_NAME}` : defaultTitle
  })

  onCleanup(() => {
    document.title = defaultTitle
  })
}

export default useDocumentTitle
