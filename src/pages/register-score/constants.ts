/**
 * スコア登録画面と更新差分レポートで表示する固定文言。
 */
export const REGISTER_SCORE_COPY = {
  ratingLabel: 'RATING',
  songRatingLabel: '単曲レーティング',
  songOverPowerLabel: 'OP',
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
  openImagePreview: '画像化・共有',
  imagePreviewDialogTitle: 'プレビュー',
  imagePreviewDialogDescription: '現在の表示設定で画像を作成します。',
  preparingImagePreview: 'プレビューを準備中',
  imagePreviewAlt: '更新差分の画像プレビュー',
  imagePreviewError: 'プレビューの作成に失敗しました。',
  retryImagePreview: '再試行',
  closeImagePreview: '閉じる',
  shareImage: '共有',
  downloadImage: '保存',
  shareAllImages: 'まとめて共有',
  imageLayout: '画像の分割方法',
  splitImagesPending: '分割',
  splitImagesSuffix: '枚に分割',
  combineImage: '1枚にまとめる',
  shareImageError: '共有に失敗しました。',
  copySongTitleSuccess: '曲名をコピーしました。',
  copySongTitleError: '曲名のコピーに失敗しました。',
  excludeChangeFromImage: '画像から除外',
  includeChangeInImage: '画像に含める',
  showClassEmblem: 'クラスエンブレムを表示',
  hidePlayerLevel: 'レベルを非表示',
  showPlayerLevel: 'レベルを表示',
} as const

/** 更新差分画像のファイル名へ付与する接頭辞 */
export const REGISTER_SCORE_IMAGE_FILENAME_PREFIX = 'chunisupport-score-update'
/** 更新差分画像の余白とページ番号を含む論理高さ上限 */
export const REGISTER_SCORE_IMAGE_MAX_HEIGHT = 1_800
/** 更新差分画像を原寸で出力するピクセル比 */
export const REGISTER_SCORE_IMAGE_PIXEL_RATIO = 1
/** 更新差分JPEG画像の圧縮品質 */
export const REGISTER_SCORE_IMAGE_JPEG_QUALITY = 0.9
/** 更新差分画像下部のページ番号の共通スタイル */
export const REGISTER_SCORE_IMAGE_PAGE_NUMBER_CLASS =
  'px-4 pt-3 text-center font-jost text-sm leading-5 text-text-muted whitespace-nowrap'

/** 画像化する更新差分レポートの論理幅を固定するクラス */
export const REGISTER_SCORE_REPORT_WIDTH_CLASS = 'w-[31rem]'
/** 更新差分レポートの表示領域を論理幅以下に制限するクラス */
export const REGISTER_SCORE_STACK_MAX_WIDTH_CLASS = 'max-w-[31rem]'
/** コンポーネント幅が59rem以上なら27remの設定欄と論理幅のレポートを横並びにするクラス */
export const REGISTER_SCORE_RESULT_LAYOUT_CLASS =
  'mx-auto grid w-full min-w-0 max-w-[31rem] gap-4 @min-[59rem]:max-w-none @min-[59rem]:grid-cols-[27rem_31rem] @min-[59rem]:items-start @min-[59rem]:justify-center'

/**
 * 楽曲カードの主ソート選択肢に表示するラベル。
 */
export const REGISTER_SCORE_PRIMARY_SORT_LABELS = {
  none: 'デフォルト',
  level: 'レベル',
  singleRating: '単曲レーティング',
} as const

/**
 * 楽曲カードのソート方向選択肢に表示するラベル。
 */
export const REGISTER_SCORE_SORT_DIRECTION_LABELS = {
  asc: '昇順',
  desc: '降順',
} as const

/** 表示コードを保持したまま、更新差分の楽曲カードのRATING・OP・OP%表示を制御する。 */
export const REGISTER_SCORE_SHOW_SONG_METRICS = false

/** 表示コードを保持したまま、更新差分の楽曲カードのOP%表示を制御する。 */
export const REGISTER_SCORE_SHOW_SONG_OP_PERCENT = false
