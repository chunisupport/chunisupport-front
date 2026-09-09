import {
  ADMIN_COURSES_PATH,
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
    icon: 'coverage',
  },
  {
    href: ADMIN_MAINTENANCE_PATH,
    title: 'メンテナンス管理',
    description: 'メンテナンス状態と一般向けコメントを管理します。',
    icon: 'maintenance',
  },
  {
    href: '/admin/users',
    title: 'ユーザー管理',
    description: 'ユーザー一覧、検索、削除、復活を行います。',
    icon: 'users',
  },
  {
    href: '/admin/songs',
    title: '楽曲管理',
    description: '楽曲一覧、編集、削除、復活を行います。',
    icon: 'songs',
  },
  {
    href: ADMIN_COURSES_PATH,
    title: 'コース管理',
    description: 'コース一覧、編集、削除、復活を行います。',
    icon: 'courses',
  },
  {
    href: '/admin/honors',
    title: '称号管理',
    description: '称号一覧、クラス、画像URLを確認します。',
    icon: 'honors',
  },
  {
    href: ADMIN_VERSIONS_PATH,
    title: 'バージョン管理',
    description: 'バージョン名と稼働日を追加、修正、削除します。',
    icon: 'versions',
  },
] as const
