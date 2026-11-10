/** サービス名。 */
export const SITE_NAME = 'ChuniSupport'

/** ドキュメントタイトル内の区切り文字。 */
export const DOCUMENT_TITLE_SEPARATOR = ' | '

/**
 * 複数のタイトル要素を共通の区切り文字で結合する。
 *
 * @param parts - 表示順に並べたタイトル要素。
 * @returns 共通の区切り文字で結合したタイトル。
 */
export const joinDocumentTitleParts = (...parts: readonly string[]): string =>
  parts.join(DOCUMENT_TITLE_SEPARATOR)

/**
 * ページ名とサービス名からドキュメントタイトルを生成する。
 *
 * @param pageTitle - サービス名の前へ表示するページ固有タイトル。
 * @returns ページ固有タイトルとサービス名を結合したタイトル。
 */
export const buildDocumentTitle = (pageTitle?: string): string =>
  pageTitle ? joinDocumentTitleParts(pageTitle, SITE_NAME) : SITE_NAME
