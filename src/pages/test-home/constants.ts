import {
  BORDER_CALCULATOR_PATH,
  DASHBOARD_PATH,
  FRIEND_VS_PATH,
  FRIENDS_PATH,
  LATEST_SCORE_UPDATE_PATH,
  RANDOM_SONG_SELECTOR_PATH,
  SONGS_PATH,
  UNI_FILL_MATRIX_PATH,
  WEAK_CHART_INSPECTOR_PATH,
} from '../../constants/routes'
import { getToolLink, type ToolLink } from '../../constants/tools'
import type { PlayerDTO, UserRatingDTO } from '../../types/api'
import type { ProfilePageQuery } from '../../utils/userProfileRoute'

/** 試作ホーム画面のページ文言と見出し */
export const TEST_HOME_COPY = {
  documentTitle: 'ホーム（試作）',
  previewBadge: '試作ホーム',
  dummyDataNote: 'ダミー表示',
  modalPreviewButton: 'ポップアップ確認',
  modalCloseLabel: '閉じる',
  modalConfirmLabel: '確認しました',
  modalDetailLinkLabel: '詳しく見る',
  appBannersHeading: '新着・アップデート',
  profileHeading: 'プレイヤー情報',
  quickAccessHeading: 'クイックアクセス',
  toolsHeading: 'ツール',
  allToolsLink: 'すべて見る',
} as const

/** Issue #417 想定のアプリ内お知らせ種別（本文型 / リンク型） */
export type DummyAppAnnouncementKind = 'message' | 'link'

/** Issue #417 想定のアプリ内お知らせダミー項目 */
export type DummyAppAnnouncement = {
  /** 安定した固有ID */
  id: string
  /** 本文型・リンク型の種別 */
  kind: DummyAppAnnouncementKind
  /** バッジ表示ラベル */
  badgeLabel: string
  /** タイトル */
  title: string
  /** 補足本文 */
  body: string
  /** リンク型の場合の遷移先パス */
  targetPath?: string
  /** リンク型の場合のアクションラベル */
  actionLabel?: string
}

/** ホーム上部に表示するアプリ内お知らせバナーのダミーデータ */
export const DUMMY_APP_BANNER_ANNOUNCEMENTS: readonly DummyAppAnnouncement[] = [
  {
    id: '2026-11-sort-top-percent',
    kind: 'message',
    badgeLabel: 'UPDATE',
    title: 'ソートに「上位%」を追加しました',
    body: 'レコード一覧で全プレイヤー中の上位%順に並べ替えられます。',
  },
  {
    id: '2026-11-friend-vs-banner',
    kind: 'link',
    badgeLabel: 'PICKUP',
    title: 'フレンドVSでスコアを比較しよう',
    body: 'フレンドとのスコア差を譜面ごとにまとめて確認できます。',
    targetPath: FRIEND_VS_PATH,
    actionLabel: '開く',
  },
]

/** 全画面共通ポップアップ（global_modal）のプレビュー用ダミーデータ */
export const DUMMY_APP_MODAL_ANNOUNCEMENT: DummyAppAnnouncement = {
  id: '2026-11-modal-preview',
  kind: 'link',
  badgeLabel: 'UPDATE',
  title: 'レコードフィルターに「上位%」の範囲指定を追加しました',
  body: 'ソートだけでなく、上位%の範囲で譜面を絞り込めるようになりました。レコード画面のフィルターからすぐにお試しいただけます。',
  targetPath: SONGS_PATH,
  actionLabel: '楽曲DBを見る',
}

/** 名札下部に並べるマイページ各タブへのショートカット定義 */
export type ProfileTabShortcut = {
  /** 表示ラベル */
  label: string
  /** 遷移先のプロフィールタブ種別 */
  page: ProfilePageQuery
}

/** 名札下部からマイページ各タブへ直接移動するショートカット一覧 */
export const PROFILE_TAB_SHORTCUTS: readonly ProfileTabShortcut[] = [
  { label: 'レーティング', page: 'rating_best' },
  { label: 'レコード', page: 'record_normal' },
  { label: 'OVER POWER', page: 'overpower' },
]

/** クイックアクセスカードの種別 */
export type QuickAccessIcon = 'history' | 'goals' | 'friends' | 'songs'

/** クイックアクセスに表示する導線カード情報 */
export type QuickAccessItem = {
  /** 識別子 */
  id: 'latestUpdate' | 'goals' | 'friends' | 'songs'
  /** カード見出し */
  label: string
  /** 遷移先パス */
  href: string
  /** アイコン種別 */
  icon: QuickAccessIcon
  /** 数値や件数などのダミー補助バッジ（数値強調用） */
  dummyMetric: string
  /** 補助ラベル */
  dummySubLabel: string
}

/** ホーム画面のクイックアクセス導線一覧 */
export const QUICK_ACCESS_ITEMS: readonly QuickAccessItem[] = [
  {
    id: 'latestUpdate',
    label: '前回のスコア更新',
    href: LATEST_SCORE_UPDATE_PATH,
    icon: 'history',
    dummyMetric: '+0.0185',
    dummySubLabel: '8曲更新',
  },
  {
    id: 'goals',
    label: '目標',
    href: '/goals',
    icon: 'goals',
    dummyMetric: '3',
    dummySubLabel: '進行中 / 達成 1',
  },
  {
    id: 'friends',
    label: 'フレンド',
    href: FRIENDS_PATH,
    icon: 'friends',
    dummyMetric: '1',
    dummySubLabel: 'フレンド申請',
  },
  {
    id: 'songs',
    label: '楽曲DB',
    href: SONGS_PATH,
    icon: 'songs',
    dummyMetric: '',
    dummySubLabel: '通常・WE・コース',
  },
]

/** ホーム画面にピックアップ表示するツール一覧 */
export const FEATURED_TOOLS: readonly ToolLink[] = [
  getToolLink(DASHBOARD_PATH),
  getToolLink(WEAK_CHART_INSPECTOR_PATH),
  getToolLink(BORDER_CALCULATOR_PATH),
  getToolLink(RANDOM_SONG_SELECTOR_PATH),
  getToolLink(FRIEND_VS_PATH),
  getToolLink(UNI_FILL_MATRIX_PATH),
]

/** 未ログイン・未登録時のプレビュー表示に使うダミーユーザー名 */
export const DUMMY_HOME_USERNAME = 'sample_player'

/** 未ログイン・未登録時のプレビュー表示に使うダミープレイヤー情報 */
export const DUMMY_HOME_PLAYER: PlayerDTO = {
  name: 'ＳＡＭＰＬＥ',
  level: 264,
  rating: 17.349,
  class_emblem: 'rainbow',
  class_emblem_base: 'rainbow',
  possession: 'normal',
  last_played_at: '2026-11-26T15:00:00Z',
  overpower_value: 109781.085,
  overpower_percent: 77.84457,
  official_overpower: 109781.085,
  official_overpower_percent: 77.84457,
  team_name: null,
  team_color: null,
  honors: [
    {
      slot: 1,
      name: 'CHUNITHM',
      type_name: 'gold',
      image_url: null,
    },
  ],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-11-26T15:00:00Z',
}

/** 未ログイン・未登録時のプレビュー表示に使うダミーレーティング情報 */
export const DUMMY_HOME_RATING: UserRatingDTO = {
  rating: 17.349,
  best_average: 17.6053,
  new_average: 16.9645,
  best: [],
  best_candidate: [],
  new: [],
  new_candidate: [],
  meta: {
    updated_at: '2026-11-26T15:00:00Z',
  },
}
