import { DEFAULT_POSSESSION_NAME, POSSESSION_NAMES } from '../../constants/possession'
import type { PossessionName } from '../../types/api'

/** レーティング画像DOM確認で切り替えるポゼッション選択肢 */
export type RatingImagePossessionOption = {
  /** ポゼッション名 */
  value: PossessionName
  /** セレクトへ表示するラベル */
  label: PossessionName
}

/** レーティング画像DOM確認で切り替えるポゼッション一覧 */
export const RATING_IMAGE_POSSESSION_OPTIONS: RatingImagePossessionOption[] = POSSESSION_NAMES.map(
  (name) => ({ value: name, label: name })
)

/** レーティング画像DOM確認で初期選択するポゼッション */
export const RATING_IMAGE_DEFAULT_POSSESSION_OPTION: RatingImagePossessionOption =
  RATING_IMAGE_POSSESSION_OPTIONS.find((option) => option.value === DEFAULT_POSSESSION_NAME) ?? {
    value: DEFAULT_POSSESSION_NAME,
    label: DEFAULT_POSSESSION_NAME,
  }

/** レーティング画像DOM確認画面で使用する文言 */
export const ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY = {
  pageTitle: 'レーティング画像DOM',
  heading: 'レーティング画像DOM',
  usernameLabel: 'ユーザー/プレイヤー名',
  usernamePlaceholder: '空欄でサンプル',
  usernameAriaLabel: '確認するユーザー名またはプレイヤー名',
  loadButton: '表示',
  versionLabel: 'デザイン',
  possessionLabel: 'ポゼッション',
  showJacketsLabel: 'ジャケット',
  scaleLabel: '表示サイズ',
  captureButton: '画像化',
  capturingLabel: '画像化中',
  captureError: '画像化に失敗しました。',
  userNotFound: 'ユーザーが見つかりません。',
  noPlayerData: 'プレイヤーデータがありません。',
  privatePlayer: '非公開プレイヤーです。',
  multipleMatches: '複数のユーザーが該当します。',
  loadingLabel: '読み込み中',
  previewLabel: '画像化前のベスト枠・新曲枠',
} as const
