import { ADMIN_DATA_COVERAGE_PATH, EDITOR_SONGS_PATH } from '../../constants/routes'

/** 編集メニュー画面に表示する文言 */
export const EDITOR_PAGE_COPY = {
  pageTitle: '編集',
  heading: '編集メニュー',
  description: '編集者向けのメニューです。',
} as const

/** 編集メニューに表示する各画面へのリンク */
export const EDITOR_PAGE_LINKS = [
  {
    href: ADMIN_DATA_COVERAGE_PATH,
    title: 'データ充足状況',
    description: '譜面定数の判明状況を難易度・レベル別に確認します。',
  },
  {
    href: EDITOR_SONGS_PATH,
    title: '楽曲管理',
    description: '楽曲一覧と楽曲情報を確認・編集します。',
  },
] as const
