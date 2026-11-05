import { SITE_NAME } from '../constants/site'

/** 画面ごとに設定しているドキュメントタイトル */
export type DocumentTitleEntry = {
  /** サイト名まで含めたタイトル */
  title: string
}

/** 表示中の画面が設定しているタイトルの登録先 */
export type DocumentTitleRegistry = {
  /**
   * 画面のタイトル設定を登録する。
   * @param title - サイト名まで含めた初期タイトル。
   * @returns 更新・解除に使う登録内容。
   */
  add: (title: string) => DocumentTitleEntry
  /**
   * 画面のタイトル設定を解除する。
   * @param entry - add が返した登録内容。
   * @returns なし。
   */
  remove: (entry: DocumentTitleEntry) => void
  /**
   * ブラウザに表示するタイトルを返す。
   * @returns 最後に登録した画面のタイトル。登録がなければサイト名。
   */
  current: () => string
}

/**
 * 表示中の画面が設定しているタイトルを、登録した順に管理する。
 * 画面遷移では新しい画面の設定と前の画面の後片付けの順序が一定しないため、
 * 後片付けで単純にサイト名へ戻さず、まだ表示中で最後に登録した画面のタイトルを使う。
 *
 * @returns タイトル設定の登録先。
 */
export const createDocumentTitleRegistry = (): DocumentTitleRegistry => {
  // Set は追加順を保つため、最後の要素が最後に登録した画面になる。
  const entries = new Set<DocumentTitleEntry>()
  return {
    add: (title) => {
      const entry = { title }
      entries.add(entry)
      return entry
    },
    remove: (entry) => {
      entries.delete(entry)
    },
    current: () => [...entries].pop()?.title ?? SITE_NAME,
  }
}
