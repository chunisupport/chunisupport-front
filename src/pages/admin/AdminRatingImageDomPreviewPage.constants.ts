import { DEFAULT_POSSESSION_NAME, POSSESSION_NAMES } from '../../constants/possession'
import { localizedCopy } from '../../i18n'
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
export const ADMIN_RATING_IMAGE_DOM_PREVIEW_COPY = localizedCopy(
  'admin.ratingImagePreview.adminRatingImageDomPreviewCopy'
)
