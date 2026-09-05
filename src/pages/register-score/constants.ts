/**
 * スコア登録画面と更新差分レポートで表示する固定文言。
 *
 * 将来的なi18n対応のため、画面内の日本語・英語ラベルはこのファイルへ集約し、
 * コンポーネントやソートロジック内への直書きを避ける。
 */
export const REGISTER_SCORE_COPY = {
  ratingLabel: 'RATING',
  overPowerLabel: 'OVER POWER',
  overPowerPercentLabel: 'OP%',
  overPowerPercentAccessibleLabel: 'OVER POWER達成率',
  percentagePointUnit: 'pt',
  percentagePointAccessibleUnit: 'パーセントポイント',
  invalidToken: 'tokenが不正です。登録用URLを確認してください。',
  fallbackError: '登録に失敗しました。',
  reportTitle: '更新差分',
  title: 'スコア登録',
  processing: 'スコアデータを登録しています。',
  changedSongsTitle: 'NEW RECORDS',
  changedSongsEmpty: '今回更新された楽曲はありません。',
  filteredChangedSongsEmpty: '表示対象の楽曲はありません。',
  changedCoursesTitle: 'COURSE RECORDS',
  totalHighScoreTitle: 'TOTAL HIGH SCORE',
  recordStatsTitle: 'RECORD STATISTICS',
  displaySettingsTitle: '表示設定',
  hideLampOnlyChanges: 'ランプのみの更新を非表示',
  songSortTitle: '楽曲カードの並び順',
  songSortDirectionLabel: '楽曲カードの並び順の方向',
  shareImage: '共有',
  prepareShareImage: '共有画像を準備',
  preparingShareImage: '共有画像を準備中',
  sharingImage: '共有中',
  shareImageError: '画像の共有に失敗しました。',
  downloadImage: 'ダウンロード',
  downloadingImage: '作成中',
  downloadImageError: '画像のダウンロードに失敗しました。',
  copySongTitleSuccess: '曲名をコピーしました。',
  copySongTitleError: '曲名のコピーに失敗しました。',
  excludeChangeFromImage: '画像から除外',
  includeChangeInImage: '画像に含める',
} as const

/**
 * 楽曲カードの主ソート選択肢に表示するラベル。
 *
 * 将来的なi18n対応のため、ソートロジック内の直書きを避けてここで一元管理する。
 */
export const REGISTER_SCORE_PRIMARY_SORT_LABELS = {
  none: 'デフォルト',
  level: 'レベル',
  singleRating: '単曲レーティング',
} as const

/**
 * 楽曲カードのソート方向選択肢に表示するラベル。
 *
 * 将来的なi18n対応のため、ソートロジック内の直書きを避けてここで一元管理する。
 */
export const REGISTER_SCORE_SORT_DIRECTION_LABELS = {
  asc: '昇順',
  desc: '降順',
} as const
