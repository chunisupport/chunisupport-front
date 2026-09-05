import {
  ADMIN_DATA_COVERAGE_PATH,
  ADMIN_MAINTENANCE_PATH,
  ADMIN_VERSIONS_PATH,
} from '../../constants/routes'

/** 管理メニュー画面に表示する文言 */
export const ADMIN_PAGE_COPY = {
  pageTitle: '管理',
  heading: '管理ページ',
  description: '管理者向けのメニューです。',
} as const

/** 管理メニューに表示する各管理画面へのリンク */
export const ADMIN_PAGE_LINKS = [
  {
    href: ADMIN_DATA_COVERAGE_PATH,
    title: 'データ充足状況',
    description: '譜面定数の判明状況を難易度・レベル別に確認します。',
  },
  {
    href: ADMIN_MAINTENANCE_PATH,
    title: 'メンテナンス管理',
    description: 'メンテナンス状態と一般向けコメントを管理します。',
  },
  {
    href: '/admin/users',
    title: 'ユーザー管理',
    description: 'ユーザー一覧、検索、削除、復活を行います。',
  },
  {
    href: '/admin/songs',
    title: '楽曲管理',
    description: '楽曲一覧、編集、削除、復活を行います。',
  },
  {
    href: '/admin/honors',
    title: '称号管理',
    description: '称号一覧、クラス、画像URLを確認します。',
  },
  {
    href: ADMIN_VERSIONS_PATH,
    title: 'バージョン管理',
    description: 'バージョン名と稼働日を追加、修正、削除します。',
  },
] as const
