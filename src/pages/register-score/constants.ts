import { localizedCopy } from '../../i18n'
/**
 * スコア登録画面と更新差分レポートで表示する固定文言。
 *
 * 将来的なi18n対応のため、画面内の日本語・英語ラベルはこのファイルへ集約し、
 * コンポーネントやソートロジック内への直書きを避ける。
 */
export const REGISTER_SCORE_COPY = localizedCopy('registerScore.registerScoreCopy')

/**
 * 楽曲カードの主ソート選択肢に表示するラベル。
 *
 * 将来的なi18n対応のため、ソートロジック内の直書きを避けてここで一元管理する。
 */
export const REGISTER_SCORE_PRIMARY_SORT_LABELS = localizedCopy(
  'registerScore.registerScorePrimarySortLabels'
)

/**
 * 楽曲カードのソート方向選択肢に表示するラベル。
 *
 * 将来的なi18n対応のため、ソートロジック内の直書きを避けてここで一元管理する。
 */
export const REGISTER_SCORE_SORT_DIRECTION_LABELS = localizedCopy(
  'registerScore.registerScoreSortDirectionLabels'
)
