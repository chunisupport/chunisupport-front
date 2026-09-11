/** サービス名。 */
export const SITE_NAME = 'ChuniSupport'

/**
 * ページ名とサービス名からドキュメントタイトルを生成する。
 *
 * @param pageTitle - サービス名の前へ表示するページ固有タイトル。
 * @returns ページ固有タイトルとサービス名を結合したタイトル。
 */
export const buildDocumentTitle = (pageTitle?: string): string =>
  pageTitle ? `${pageTitle} - ${SITE_NAME}` : SITE_NAME
