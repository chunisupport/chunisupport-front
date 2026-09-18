import { createEffect, onCleanup } from 'solid-js'
import { buildDocumentTitle, SITE_NAME } from '../constants/site'

/**
 * ページのドキュメントタイトルを設定するカスタムフック
 * @param title ページ固有のタイトル。空の場合はサイト名のみ表示
 */
export function useDocumentTitle(title?: string | (() => string)) {
  const defaultTitle = SITE_NAME

  createEffect(() => {
    const pageTitle = typeof title === 'function' ? title() : title
    document.title = buildDocumentTitle(pageTitle)
  })

  onCleanup(() => {
    document.title = defaultTitle
  })
}

export default useDocumentTitle
