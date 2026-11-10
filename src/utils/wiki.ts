import { WIKI_PAGE_TITLE_FULLWIDTH_OFFSET } from '../constants/wiki'

/**
 * WikiのページタイトルからページURLを組み立てる。
 *
 * ページタイトルはデコード済みの値として保存されているため、`/` 区切りの階層ごとにエンコードする。
 *
 * @param baseUrl - WikiのベースURL。未設定の場合はURLを組み立てない。
 * @param pageTitle - Wikiのページタイトル。未設定の場合はURLを組み立てない。
 * @returns WikiページURL。ベースURLまたはページタイトルが空の場合はnull。
 */
export const buildWikiPageUrl = (
  baseUrl: string | null | undefined,
  pageTitle: string | null | undefined
): string | null => {
  const normalizedBaseUrl = baseUrl?.trim()
  const normalizedPageTitle = pageTitle?.trim()
  if (!normalizedBaseUrl || !normalizedPageTitle) return null

  const encodedPath = normalizedPageTitle.split('/').map(encodeURIComponent).join('/')
  return `${normalizedBaseUrl.replace(/\/+$/, '')}/${encodedPath}`
}

/**
 * 曲名に含まれるWikiWikiで使用できない記号だけを全角へ置き換える。
 *
 * @param title - 生成元の曲名。
 * @returns 指定記号を全角にしたWikiページタイトル。
 */
export const generateWikiPageTitle = (title: string): string =>
  title.replace(/["#&<>[\]:]/g, (symbol) =>
    String.fromCharCode(symbol.charCodeAt(0) + WIKI_PAGE_TITLE_FULLWIDTH_OFFSET)
  )
