import type { PlayerDataDifficulty } from '../../types/api'

/**
 * ランダム選曲ツールで選択できる通常譜面難易度。
 */
export const RANDOM_SONG_SELECTOR_DIFFICULTIES: PlayerDataDifficulty[] = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

/**
 * ランダム選曲ツールの初期値。
 */
export const RANDOM_SONG_SELECTOR_DEFAULTS = {
  count: '3',
  minConst: '12.0',
  maxConst: '',
  minScore: '',
  maxScore: '',
  defaultWeight: '1',
  showRecordScore: true,
} as const

/**
 * ランダム選曲ツールの初期選択難易度。
 */
export const RANDOM_SONG_SELECTOR_DEFAULT_DIFFICULTIES: PlayerDataDifficulty[] = [
  'MASTER',
  'ULTIMA',
]

/**
 * ランダム選曲ツールの表示文言。
 */
export const RANDOM_SONG_SELECTOR_COPY = {
  title: 'ランダム選曲',
  description: '条件に合う通常譜面から指定曲数をランダムに選びます。',
  countLabel: '曲数',
  difficultyLabel: '難易度',
  genreLabel: 'ジャンル',
  versionLabel: 'バージョン',
  minConstLabel: '定数 下限',
  maxConstLabel: '定数 上限',
  advancedSettingsLabel: '高度な設定',
  drawRateLabel: '出やすさ倍率',
  difficultyWeightLabel: '難易度別',
  constWeightLabel: '定数別',
  recordFilterLabel: '自分のレコード',
  scoreVisibleLabel: 'スコアを表示',
  playStatusLabel: 'プレイ状況',
  lampLabel: 'ランプ',
  minScoreLabel: 'スコア 下限',
  maxScoreLabel: 'スコア 上限',
  bestFrameLabel: 'ベスト枠',
  recordUnavailableMessage: 'ログイン時のみ利用できます。',
  drawButtonLabel: '選曲',
  resetButtonLabel: '条件を初期化',
  resetConfirmTitle: '条件を初期化しますか？',
  resetConfirmDescription: '現在の絞り込みと選曲結果を初期状態に戻します。',
  resetCancelLabel: 'キャンセル',
  resetConfirmLabel: '初期化',
  resultLabel: '選曲結果',
  candidateCountLabel: '候補',
  noCandidatesMessage: '条件に合う譜面はありません。',
  noResultsMessage: '選曲すると結果が表示されます。',
  invalidCountMessage: '曲数は1以上で入力してください。',
  invalidConstRangeMessage: '定数の範囲を確認してください。',
  invalidScoreRangeMessage: 'スコアの範囲を確認してください。',
  invalidWeightMessage: '倍率は0以上の数値で入力してください。',
} as const

/**
 * プレイ状況フィルターの選択肢。
 */
export const RANDOM_SONG_PLAY_STATUS_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'played', label: 'プレイ済み' },
  { value: 'unplayed', label: '未プレイ' },
] as const

/**
 * ベスト枠フィルターの選択肢。
 */
export const RANDOM_SONG_BEST_FRAME_OPTIONS = [
  { value: 'all', label: 'すべて' },
  { value: 'only', label: 'ベスト枠のみ' },
  { value: 'exclude', label: 'ベスト枠除外' },
] as const

/**
 * ランダム選曲ツールのランプフィルター選択肢。
 */
export const RANDOM_SONG_LAMP_OPTIONS = [
  { value: 'AJC', label: 'AJC' },
  { value: 'AJ', label: 'AJ' },
  { value: 'FC', label: 'FC' },
  { value: 'CATASTROPHY', label: 'CATASTROPHY' },
  { value: 'ABSOLUTE', label: 'ABSOLUTE' },
  { value: 'BRAVE', label: 'BRAVE' },
  { value: 'HARD', label: 'HARD' },
  { value: 'CLEAR', label: 'CLEAR' },
  { value: 'FAILED', label: 'FAILED' },
  { value: 'NONE', label: '未プレイ' },
] as const
