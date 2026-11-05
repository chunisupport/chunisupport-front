import { createEffect, onCleanup, untrack } from 'solid-js'
import { buildDocumentTitle } from '../constants/site'
import { createDocumentTitleRegistry } from '../utils/documentTitle'

/** 表示中の画面が設定しているタイトル */
const documentTitles = createDocumentTitleRegistry()

/**
 * ページのドキュメントタイトルを設定するカスタムフック。
 * 画面を離れたら設定を外し、まだ表示中の画面のタイトル（なければサイト名）へ戻す。
 * 遷移先の画面の設定が前の画面の後片付けより先に行われても、前の画面のタイトルやサイト名で上書きしない。
 * 入れ子の画面では内側のタイトルを優先するため、子要素を作る前のコンポーネント本体で呼ぶこと。
 *
 * @param title - ページ固有のタイトル。空の場合はサイト名のみ表示
 * @returns なし。
 */
export function useDocumentTitle(title?: string | (() => string)) {
  /**
   * 現在のページ固有タイトルからサイト名まで含めたタイトルを作る。
   *
   * @returns ドキュメントタイトル。
   */
  const resolveTitle = () => buildDocumentTitle(typeof title === 'function' ? title() : title)
  // 後から表示された画面を優先するため、エフェクトの実行を待たずに登録の順番を確保する。
  const entry = documentTitles.add(untrack(resolveTitle))

  createEffect(() => {
    entry.title = resolveTitle()
    document.title = documentTitles.current()
  })

  onCleanup(() => {
    documentTitles.remove(entry)
    document.title = documentTitles.current()
  })
}

export default useDocumentTitle
