import type { PlayerDataDifficulty } from '../../types/api'
import type { FriendVsResultFilter } from '../../utils/friendVs'

/** フレンドVS画面の表示文言。 */
export const FRIEND_VS_COPY = {
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
  reload: '再読み込み',
} as const

/** 初期表示する難易度。 */
export const FRIEND_VS_DEFAULT_DIFFICULTY: PlayerDataDifficulty = 'MASTER'

/** 勝敗フィルターの選択肢。 */
export const FRIEND_VS_RESULT_OPTIONS: readonly { value: FriendVsResultFilter; label: string }[] = [
  { value: 'ALL', label: 'すべて' },
  { value: 'SELF_WIN', label: 'WIN' },
  { value: 'DRAW', label: 'DRAW' },
  { value: 'FRIEND_WIN', label: 'LOSE' },
  { value: 'BOTH_PLAYED', label: 'ふたりとも挑戦' },
]

/** テーブルの列幅。 */
export const FRIEND_VS_GRID_COLUMNS = 'minmax(14rem,1fr) 5rem 8rem 8rem 7rem'
