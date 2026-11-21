import { WORLDSEND_SCORE_LABEL } from '../../constants/chart'
import type { CourseTrackSelectionType } from '../../types/api'

/** 検索結果として一度に表示する楽曲数。 */
export const COURSE_TRACK_SEARCH_LIMIT = 15

/** 譜面検索の対象カタログ。 */
export const COURSE_TRACK_SEARCH_CATALOGS = [
  { value: 'standard', label: '通常譜面' },
  { value: 'worldsend', label: WORLDSEND_SCORE_LABEL },
] as const

/** トラック編集のセグメントボタンで使う短い選曲方式名。 */
export const COURSE_TRACK_SELECTION_SHORT_LABELS: Record<CourseTrackSelectionType, string> = {
  FIXED: '固定',
  RANDOM_FILTER: '条件ランダム',
  RANDOM_POOL: '指定プール',
}

/** コース構成編集の画面文言。 */
export const COURSE_TRACK_EDITOR_COPY = {
  action: 'トラック構成を編集',
  trackPrefix: 'TRACK',
  trackTabsLabel: '編集するトラックを選択',
  selectionType: '選曲方式',
  minLevel: 'レベル下限',
  maxLevel: 'レベル上限',
  levelRangeSeparator: '〜',
  noLevel: '指定なし',
  filterPreviewLabel: '設定中の条件',
  filterPreviewEmpty: '条件未設定',
  selectedChartHeading: '選択中の譜面',
  selectedPoolHeading: '候補譜面',
  changeChart: '別の譜面へ変更',
  closeSearch: '検索を閉じる',
  searchLabel: '楽曲検索',
  searchCatalogLabel: '検索する譜面の種類',
  searchPlaceholder: '曲名・読み・アーティストで検索',
  noSearchResults: '該当する楽曲がありません。',
  chartUnavailable: '公開楽曲一覧にない譜面',
  emptyFixedChart: '譜面が選択されていません',
  emptyPoolCharts: '候補譜面がありません',
  unconfiguredTabSummary: '未設定',
  chartCountSuffix: '譜面',
  configuredProgressSuffix: '枠設定済み',
  emptyFilterError: 'レベルかジャンルを指定してください。',
  levelRangeError: '下限は上限以下にしてください。',
  fixedChartError: '譜面を1件選んでください。',
  poolChartError: '譜面を1件以上追加してください。',
  save: '構成を保存',
  saving: '保存中…',
  saved: 'コースのトラック構成を保存しました。',
  saveError: 'コースのトラック構成を保存できませんでした。',
  cancel: 'キャンセル',
  clear: '構成をクリア',
  clearDescription: '登録済みの3枠を未登録に戻します。',
  clearSuccess: 'コースのトラック構成をクリアしました。',
  loadingSongPlaceholder: '…',
} as const

/**
 * 譜面解除ボタンのアクセシブルなラベルを生成する。
 *
 * @param songLabel - 楽曲名、または未解決時のID。
 * @param difficulty - 対象の難易度。
 * @returns スクリーンリーダー向けの解除ラベル。
 */
export const formatRemoveChartLabel = (songLabel: string, difficulty: string): string =>
  `${songLabel} ${difficulty} を外す`
