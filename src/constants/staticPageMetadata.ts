import { TOOLS_PATH } from './routes'
import { TOOL_LINKS } from './tools'

/**
 * 固定ページの初期 HTML に埋め込むメタ情報。
 *
 * @property path - 先頭スラッシュを含み末尾スラッシュを含まないページパス。
 * @property title - ページを表すタイトル。
 * @property description - ページの用途を表す説明文。
 */
export type StaticPageMetadata = {
  path: string
  title: string
  description: string
}

/** トップページの共有時に使用する固定メタ情報。 */
export const ROOT_PAGE_METADATA: StaticPageMetadata = {
  path: '/',
  title: 'ChuniSupport | CHUNITHMスコアツール',
  description: 'CHUNITHMプレイヤーのためのスコア管理ツール',
}

/** ツール一覧ページの固定メタ情報。 */
export const TOOLS_PAGE_METADATA: StaticPageMetadata = {
  path: TOOLS_PATH,
  title: 'ツール',
  description: 'CHUNITHM のプレイや目標設定に役立つ計算・分析ツールを利用できます。',
}

/** トップページと公開中の全ツールページに対応する固定メタ情報。 */
export const STATIC_PAGE_METADATA: readonly StaticPageMetadata[] = [
  ROOT_PAGE_METADATA,
  TOOLS_PAGE_METADATA,
  ...TOOL_LINKS.filter((tool) => tool.disabled !== true).map(({ href, title, description }) => ({
    path: href,
    title,
    description,
  })),
]
