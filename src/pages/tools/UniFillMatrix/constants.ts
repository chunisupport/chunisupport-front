import {
  MASTER_ULTIMA_FILTER,
  THEORETICAL_OVER_POWER_TARGET_FILTER,
} from '../../../constants/chart'
import { PLAYER_STATS_ACHIEVEMENT_LABEL } from '../../../constants/playerStats'
import type {
  PlayerStatsAchievement,
  PlayerStatsDifficulty,
} from '../../../utils/playerStatsDashboard'

/** ウニ埋めマトリクス画面の表示文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const UNI_FILL_MATRIX_COPY = {
  difficultyLabel: '難易度',
  achievementLabel: '埋め条件',
  axisLabel: '横軸',
  percentToggle: '%表示',
  genreHeader: 'ジャンル',
  totalHeader: '合計',
  levelCaption: 'ジャンル×譜面定数から換算したレベルごとの達成状況',
  chartConstantCaption: 'ジャンル×譜面定数ごとの達成状況',
} as const

/** 難易度選択肢1件分の値と表示名 */
export type UniFillMatrixDifficultyOption = {
  value: Exclude<PlayerStatsDifficulty, 'ALL'>
  label: string
}

/** 初期選択する難易度 */
export const UNI_FILL_MATRIX_DEFAULT_DIFFICULTY: UniFillMatrixDifficultyOption = {
  value: MASTER_ULTIMA_FILTER,
  label: 'MASTER+ULTIMA',
}

/** 難易度の選択肢 */
export const UNI_FILL_MATRIX_DIFFICULTY_OPTIONS: UniFillMatrixDifficultyOption[] = [
  { value: 'BASIC', label: 'BASIC' },
  { value: 'ADVANCED', label: 'ADVANCED' },
  { value: 'EXPERT', label: 'EXPERT' },
  { value: 'MASTER', label: 'MASTER' },
  { value: 'ULTIMA', label: 'ULTIMA' },
  UNI_FILL_MATRIX_DEFAULT_DIFFICULTY,
  { value: THEORETICAL_OVER_POWER_TARGET_FILTER, label: 'OP理論値対象' },
]

/** 埋め条件選択肢1件分の値と表示名 */
export type UniFillMatrixAchievementOption = {
  value: PlayerStatsAchievement
  label: string
}

/** 埋め条件の選択肢（表示順） */
export const UNI_FILL_MATRIX_ACHIEVEMENT_OPTIONS: UniFillMatrixAchievementOption[] = (
  [
    'played',
    's',
    'sPlus',
    'ss',
    'ssPlus',
    'sss',
    'sssPlus',
    'fc',
    'aj',
    'ajc',
    'clear',
    'hard',
    'brave',
    'absolute',
    'catastrophe',
  ] as const
).map((value) => ({ value, label: PLAYER_STATS_ACHIEVEMENT_LABEL[value] }))

/** 初期選択する埋め条件（SSS） */
export const UNI_FILL_MATRIX_DEFAULT_ACHIEVEMENT: UniFillMatrixAchievementOption = {
  value: 'sss',
  label: PLAYER_STATS_ACHIEVEMENT_LABEL.sss,
}
