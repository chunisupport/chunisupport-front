import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { localizedCopy } from '../../i18n'
import type { FriendComparisonDifficulty, FriendScoreComparisonResult } from '../../types/api'
import type { FriendVsResultFilter, FriendVsSortKey } from '../../utils/friendVs'
import {
  EQUAL_SCORE_DIFFERENCE_CLASS,
  NEGATIVE_SCORE_DIFFERENCE_CLASS,
  POSITIVE_SCORE_DIFFERENCE_CLASS,
} from '../../utils/scoreDifference'
import type { SortDirection } from '../../utils/sortingQuery'

/** フレンドVSの表示文言 */
const FRIEND_VS_TEXT = localizedCopy('tools.friendVs')

/** フレンドVS画面の表示文言。 */
export const FRIEND_VS_COPY = localizedCopy('tools.friendVs.friendVsCopy')

/** 初期表示する難易度。 */
export const FRIEND_VS_DEFAULT_DIFFICULTY: FriendComparisonDifficulty = 'MASTER'

/** 難易度プルダウンに表示する通常譜面とWORLD'S END。 */
export const FRIEND_VS_DIFFICULTY_OPTIONS: readonly FriendComparisonDifficulty[] = [
  ...PLAYER_DATA_DIFFICULTIES,
  "WORLD'S END",
]

/** 勝敗フィルターの選択肢。 */
export const FRIEND_VS_RESULT_OPTIONS: readonly { value: FriendVsResultFilter; label: string }[] = [
  { value: 'ALL', label: FRIEND_VS_TEXT.allLabel },
  { value: 'SELF_WIN', label: 'WIN' },
  { value: 'DRAW', label: 'DRAW' },
  { value: 'FRIEND_WIN', label: 'LOSE' },
]

/** 自分視点の勝敗ラベル。 */
export const FRIEND_VS_RESULT_LABELS: Record<FriendScoreComparisonResult, string> = {
  SELF_WIN: FRIEND_VS_COPY.win,
  DRAW: FRIEND_VS_COPY.draw,
  FRIEND_WIN: FRIEND_VS_COPY.lose,
}

/**
 * 自分視点の勝敗の色。スコア差の正負と同じ色にそろえ、
 * テーマのアクセントカラーに左右されずWINとLOSEを見分けられるようにする。
 */
export const FRIEND_VS_RESULT_TONES: Record<
  FriendScoreComparisonResult,
  { text: string; bar: string }
> = {
  SELF_WIN: { text: POSITIVE_SCORE_DIFFERENCE_CLASS, bar: 'bg-success' },
  DRAW: { text: EQUAL_SCORE_DIFFERENCE_CLASS, bar: 'bg-border-strong' },
  FRIEND_WIN: { text: NEGATIVE_SCORE_DIFFERENCE_CLASS, bar: 'bg-score-difference-negative' },
}

/** カード一覧の並び替え項目。 */
export const FRIEND_VS_SORT_OPTIONS: readonly {
  value: FriendVsSortKey | 'default'
  label: string
}[] = [
  { value: 'default', label: FRIEND_VS_TEXT.defaultLabel },
  { value: 'title', label: FRIEND_VS_TEXT.titleLabel },
  { value: 'const', label: FRIEND_VS_COPY.constant },
  { value: 'selfScore', label: FRIEND_VS_TEXT.selfScoreLabel },
  { value: 'friendScore', label: FRIEND_VS_TEXT.friendScoreLabel },
  { value: 'difference', label: FRIEND_VS_COPY.difference },
]

/** カード一覧の並び順。 */
export const FRIEND_VS_SORT_DIRECTIONS: readonly { value: SortDirection; label: string }[] = [
  { value: 'asc', label: FRIEND_VS_TEXT.ascLabel },
  { value: 'desc', label: FRIEND_VS_TEXT.descLabel },
]

/** カードと次のカードの間隔を含む仮想リストの行高。 */
export const FRIEND_VS_CARD_ROW_HEIGHT = 132

/** カードを複数列で並べる画面幅（Tailwindのsmブレークポイント）。 */
export const FRIEND_VS_CARD_WIDE_MEDIA_QUERY = '(min-width: 640px)'

/** 複数列表示時の1行あたりのカード枚数。 */
export const FRIEND_VS_CARD_WIDE_COLUMN_COUNT = 2

/** カード同士の横方向の間隔（px）。 */
export const FRIEND_VS_CARD_COLUMN_GAP_PX = 12

/** 表の列幅。 */
export const FRIEND_VS_GRID_COLUMNS = 'minmax(14rem,1fr) 5rem 8rem 8rem 7rem'

/** WORLD'S ENDの星数と属性を収める表の列幅。 */
export const FRIEND_VS_WORLDSEND_GRID_COLUMNS = 'minmax(14rem,1fr) 8rem 8rem 8rem 7rem'
