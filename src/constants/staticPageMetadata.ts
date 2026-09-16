import { CHART_STATS_PATH, SONGS_PATH, TOOLS_PATH, WORLDSEND_SONGS_PATH } from './routes'
import { joinDocumentTitleParts, SITE_NAME } from './site'
import { isPublicToolLink, TOOL_LINKS } from './tools'

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
  title: joinDocumentTitleParts(SITE_NAME, 'CHUNITHMスコアツール'),
  description: 'CHUNITHMプレイヤーのためのスコア管理ツール',
}

/** ツール一覧ページの固定メタ情報。 */
export const TOOLS_PAGE_METADATA: StaticPageMetadata = {
  path: TOOLS_PATH,
  title: 'ツール',
  description: 'CHUNITHM のプレイや目標設定に役立つ計算・分析ツールを利用できます。',
}

/** 通常楽曲一覧ページの固定メタ情報。 */
export const SONGS_PAGE_METADATA: StaticPageMetadata = {
  path: SONGS_PATH,
  title: '楽曲一覧',
  description: 'CHUNITHM の楽曲と通常譜面の情報を検索、確認できます。',
}

/** WORLD'S END楽曲一覧ページの固定メタ情報。 */
export const WORLDSEND_SONGS_PAGE_METADATA: StaticPageMetadata = {
  path: WORLDSEND_SONGS_PATH,
  title: "WORLD'S END 楽曲一覧",
  description: "CHUNITHM の WORLD'S END 楽曲と譜面情報を検索、確認できます。",
}

/** トップページと楽曲一覧と公開中の全ツールページに対応する固定メタ情報。 */
export const STATIC_PAGE_METADATA: readonly StaticPageMetadata[] = [
  ROOT_PAGE_METADATA,
  SONGS_PAGE_METADATA,
  WORLDSEND_SONGS_PAGE_METADATA,
  TOOLS_PAGE_METADATA,
  {
    path: CHART_STATS_PATH,
    title: 'レコード統計',
    description: '譜面ごとのランク・コンボ・クリア状況を確認できます。',
  },
  ...TOOL_LINKS.filter(isPublicToolLink).map(({ href, title, description }) => ({
    path: href,
    title,
    description,
  })),
]
