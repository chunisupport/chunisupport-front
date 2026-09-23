import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import type { FriendComparisonDifficulty, FriendScoreComparisonResult } from '../../types/api'
import type { FriendVsResultFilter, FriendVsSortKey } from '../../utils/friendVs'
import type { SortDirection } from '../../utils/sortingQuery'

/** フレンドVS画面の表示文言。 */
export const FRIEND_VS_COPY = {
  worldsend: "WORLD'S END",
  worldsendLevel: '星・属性',
  selectFriend: 'フレンド',
  openFriends: 'フレンド画面へ',
  selectDifficulty: '難易度',
  selectResult: '勝敗',
  noFriends: '比較できるフレンドがいません。',
  selectPrompt: '比較するフレンドを選択してください。',
  loadingFriends: 'フレンド一覧を読み込んでいます',
  loadingComparison: 'スコアを比較しています',
  emptyCharts: '対象の譜面はありません。',
  resultTitle: '対戦結果',
  you: '自分',
  matchedCharts: '対戦数',
  win: 'WIN',
  draw: 'DRAW',
  lose: 'LOSE',
  challengeTitle: '挑戦状況',
  bothChallenged: 'ふたりとも挑戦',
  selfOnlyChallenged: '自分のみ挑戦',
  friendOnlyChallenged: 'フレンドのみ挑戦',
  neitherChallenged: 'どちらも未挑戦',
  song: '楽曲',
  constant: '定数',
  selfScore: '自分',
  friendScore: 'フレンド',
  difference: 'スコア差',
  unplayed: '未プレイ',
  unplayedSymbol: '—',
  scoreTable: 'スコア比較',
  scoreTableCaption: '譜面別の自分とフレンドのスコア、スコア差',
  sortBy: '並び替え',
  sortDirection: '順序',
  reload: '再読み込み',
} as const

/** 初期表示する難易度。 */
export const FRIEND_VS_DEFAULT_DIFFICULTY: FriendComparisonDifficulty = 'MASTER'

/** 難易度プルダウンに表示する通常譜面とWORLD'S END。 */
export const FRIEND_VS_DIFFICULTY_OPTIONS: readonly FriendComparisonDifficulty[] = [
  ...PLAYER_DATA_DIFFICULTIES,
  FRIEND_VS_COPY.worldsend,
]

/** 勝敗フィルターの選択肢。 */
export const FRIEND_VS_RESULT_OPTIONS: readonly { value: FriendVsResultFilter; label: string }[] = [
  { value: 'ALL', label: 'すべて' },
  { value: 'SELF_WIN', label: 'WIN' },
  { value: 'DRAW', label: 'DRAW' },
  { value: 'FRIEND_WIN', label: 'LOSE' },
  { value: 'BOTH_PLAYED', label: 'ふたりとも挑戦' },
]

/** 自分視点の勝敗ラベル。 */
export const FRIEND_VS_RESULT_LABELS: Record<FriendScoreComparisonResult, string> = {
  SELF_WIN: FRIEND_VS_COPY.win,
  DRAW: FRIEND_VS_COPY.draw,
  FRIEND_WIN: FRIEND_VS_COPY.lose,
}

/** カード一覧の並び替え項目。 */
export const FRIEND_VS_SORT_OPTIONS: readonly {
  value: FriendVsSortKey | 'default'
  label: string
}[] = [
  { value: 'default', label: '標準順' },
  { value: 'title', label: '楽曲名' },
  { value: 'const', label: FRIEND_VS_COPY.constant },
  { value: 'selfScore', label: '自分のスコア' },
  { value: 'friendScore', label: 'フレンドのスコア' },
  { value: 'difference', label: FRIEND_VS_COPY.difference },
]

/** カード一覧の並び順。 */
export const FRIEND_VS_SORT_DIRECTIONS: readonly { value: SortDirection; label: string }[] = [
  { value: 'asc', label: '昇順' },
  { value: 'desc', label: '降順' },
]

/** カードと次のカードの間隔を含む仮想リストの行高。 */
export const FRIEND_VS_CARD_ROW_HEIGHT = 160

/** 表の列幅。 */
export const FRIEND_VS_GRID_COLUMNS = 'minmax(14rem,1fr) 5rem 8rem 8rem 7rem'

/** WORLD'S ENDの星数と属性を収める表の列幅。 */
export const FRIEND_VS_WORLDSEND_GRID_COLUMNS = 'minmax(14rem,1fr) 8rem 8rem 8rem 7rem'
