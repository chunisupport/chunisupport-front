/** 楽曲詳細の外部リンク文言 */
export const SONG_DETAIL_LINK_COPY = {
  wiki: 'Wiki',
  wikiAriaLabel: 'Wikiで楽曲ページを開く',
  youtube: 'YouTube',
  youtubeAriaLabel: 'YouTubeで楽曲を検索する',
} as const

/** 楽曲詳細・コース詳細および統計グラフで共通利用する自己スコアのラベル */
export const OWN_SCORE_LABEL = '自分のスコア'

/** コース画面の文言 */
export const COURSE_PAGE_COPY = {
  listTitle: 'コース一覧',
  detailTitleSuffix: 'コース詳細',
  detailFallbackTitle: 'コース',
  back: '← 戻る',
  classPrefix: 'CLASS',
  ownRecordHeading: OWN_SCORE_LABEL,
  notPlayed: '未プレイ',
  perTrackAveragePrefix: '1曲平均',
  updatedAtPrefix: '更新',
  overview: {
    sectionAriaLabel: 'コース統計サマリー',
    players: 'プレイ人数',
    playersUnit: '人',
    clearRate: 'クリア率',
    comboRate: 'FC / AJ率',
    ajPrefix: 'AJ',
    averageScore: 'CLEAR平均',
    medianPrefix: '中央値',
  },
  statsHeading: 'プレイヤー統計',
  statsDescription:
    '実力帯(ベスト枠平均)ごとに集計されます。スコアはクリア済み記録を対象とし、データは1日に2回更新されます。',
  statsEmpty: '統計はまだありません。',
  statsLoadingLabel: '統計を読み込み中',
  statsViewSelectLabel: '統計テーブルの表示内容',
  statsRatingBandColumn: '実力帯',
  statsCharts: {
    averageTitle: 'CLEAR平均・中央値',
    averageAriaLabel: 'レーティング帯別のコースCLEAR平均スコアと中央値スコアの折れ線グラフ',
    averageWithOwnScoreAriaLabel:
      'レーティング帯別のコースCLEAR平均スコア、中央値スコア、自分のスコアの折れ線グラフ',
    clearTitle: 'CLEAR',
    clearAriaLabel: 'レーティング帯別のコース未クリア・クリア済み人数グラフ',
    comboTitle: 'COMBO',
    comboAriaLabel: 'レーティング帯別のコースNONE、FC、AJ人数グラフ',
  },
} as const

/** 楽曲一覧で選択できる表示形式 */
export type SongListViewMode = 'card' | 'table'

/** 楽曲一覧の初期表示形式 */
export const DEFAULT_SONG_LIST_VIEW_MODE: SongListViewMode = 'card'

/** 通常曲・WORLD'S END 共通の一覧表示形式を保存するキー */
export const SONG_LIST_VIEW_MODE_STORAGE_KEY = 'chunisupport-song-list-view'

/** 楽曲詳細のお気に入り操作に用いる文言 */
export const SONG_DETAIL_FAVORITE_COPY = {
  label: 'お気に入り楽曲',
  add: 'お気に入りに登録',
  remove: 'お気に入りから解除',
  loginRequired: 'ログインしてお気に入りに登録',
  playerNotLinked: 'プレイヤーデータを連携してお気に入りに登録',
  loadError: 'お気に入り楽曲を取得できませんでした。',
  saveError: 'お気に入り楽曲を更新できませんでした。',
} as const

/** 楽曲詳細の未解禁設定に用いる文言 */
export const SONG_DETAIL_LOCKED_COPY = {
  normalLabel: '楽曲全体の未解禁設定',
  ultimaLabel: 'ULTIMAの未解禁設定',
  lock: '未解禁に設定',
  unlock: '解禁済みに設定',
  ultimaLock: '未解禁に設定 (ULTIMA)',
  ultimaUnlock: '解禁済みに設定 (ULTIMA)',
  loginRequired: 'ログインして解禁状態を設定',
  playerNotLinked: 'プレイヤーデータを連携して解禁状態を設定',
  loadError: '未解禁設定を取得できませんでした。',
  saveError: '未解禁設定を更新できませんでした。',
  ultimaBadge: 'ULT',
} as const
